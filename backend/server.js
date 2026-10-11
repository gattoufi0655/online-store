require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const pool = require("./db");
const authRoutes = require("./routes/Auth");
const userDataRoutes = require("./routes/UserData");

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET doit être défini dans .env");
}

if (!process.env.FRONTEND_URL) {
  throw new Error("FRONTEND_URL doit être défini dans .env");
}

const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME,
  createDatabaseTable: true,
});

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

app.use(
  session({
    name: "connect.sid",
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.json({ message: "Serveur et MySQL opérationnels." });
  } catch (error) {
    console.error("Erreur de vérification MySQL :", error.message);
    return res.status(500).json({ message: "Connexion MySQL indisponible." });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/user-data", userDataRoutes);

async function startServer() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      nom VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_collections (
      user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
      cart_items LONGTEXT NOT NULL,
      favorite_items LONGTEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [columnRows] = await pool.query("SHOW COLUMNS FROM users");
  const columns = new Map(
    columnRows.map((column) => [column.Field.toLowerCase(), column.Field])
  );
  const quoteIdentifier = (identifier) =>
    `\`${identifier.replace(/`/g, "``")}\``;
  const idColumn = columnRows.find(
    (column) => column.Field.toLowerCase() === "id"
  );

  if (!idColumn) {
    throw new Error("La table users doit contenir une colonne id.");
  }

  if (
    !/^(tinyint|smallint|mediumint|int|integer|bigint)(\(\d+\))?( unsigned)?$/i.test(
      idColumn.Type
    )
  ) {
    throw new Error("La colonne users.id doit être un entier.");
  }

  if (!idColumn.Extra.toLowerCase().includes("auto_increment")) {
    await pool.execute(
      `ALTER TABLE users MODIFY COLUMN id ${idColumn.Type} NOT NULL AUTO_INCREMENT`
    );
  }

  const firstNameColumn = columns.get("prénom");
  const oldNameColumn = columns.get("nom");
  if (firstNameColumn && oldNameColumn && oldNameColumn !== "nom") {
    await pool.execute(
      `ALTER TABLE users CHANGE COLUMN ${quoteIdentifier(oldNameColumn)} nom VARCHAR(255) NOT NULL`
    );
    await pool.execute(
      `UPDATE users SET nom = TRIM(CONCAT(COALESCE(${quoteIdentifier(firstNameColumn)}, ''), ' ', COALESCE(nom, '')))`
    );
  } else if (oldNameColumn && oldNameColumn !== "nom") {
    await pool.execute(
      `ALTER TABLE users CHANGE COLUMN ${quoteIdentifier(oldNameColumn)} nom VARCHAR(255) NOT NULL`
    );
  } else if (!columns.has("nom")) {
    throw new Error(
      "La table users doit contenir une colonne de nom pour être migrée."
    );
  }

  const oldEmailColumn = columns.get("email");
  if (oldEmailColumn && oldEmailColumn !== "email") {
    await pool.execute(
      `ALTER TABLE users CHANGE COLUMN ${quoteIdentifier(oldEmailColumn)} email VARCHAR(255) NOT NULL`
    );
  } else if (!oldEmailColumn) {
    throw new Error(
      "La table users doit contenir une colonne email pour être migrée."
    );
  }

  if (!columns.has("password_hash")) {
    const oldPasswordColumn = columns.get("password");
    if (!oldPasswordColumn) {
      throw new Error(
        "La table users doit contenir password_hash ou l’ancienne colonne password."
      );
    }

    await pool.execute(
      `ALTER TABLE users CHANGE COLUMN ${quoteIdentifier(oldPasswordColumn)} password_hash VARCHAR(255) NULL`
    );
  } else {
    await pool.execute(
      "ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL"
    );
  }

  if (!columns.has("created_at")) {
    await pool.execute(
      "ALTER TABLE users ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
    );
  }

  const [indexes] = await pool.query("SHOW INDEX FROM users");
  const hasUniqueEmail = indexes.some(
    (index) => index.Column_name === "email" && index.Non_unique === 0
  );

  if (!hasUniqueEmail) {
    const [duplicates] = await pool.query(
      "SELECT email FROM users GROUP BY email HAVING COUNT(*) > 1 LIMIT 1"
    );

    if (duplicates.length === 0) {
      await pool.execute(
        "ALTER TABLE users ADD UNIQUE KEY users_email_unique (email)"
      );
    } else {
      console.warn(
        "La table users contient des emails en double ; l’index unique n’a pas été ajouté."
      );
    }
  }

  app.listen(PORT, () => {
    console.log(`Serveur démarré : http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Impossible de démarrer le serveur :", error.message);
  process.exitCode = 1;
});
