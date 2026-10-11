const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db");

const router = express.Router();

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

// Inscription
router.post("/register", async (req, res) => {
  try {
    const { nom, email, password } = req.body;

    if (
      typeof nom !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !nom.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        message: "Vérifie ton nom, ton email et ton mot de passe (8 caractères minimum).",
      });
    }

    const nomPropre = nom.trim();
    const emailPropre = email.trim().toLowerCase();

    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [emailPropre]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: "Cette adresse email est déjà utilisée.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      "INSERT INTO users (nom, email, password_hash) VALUES (?, ?, ?)",
      [nomPropre, emailPropre, passwordHash]
    );

    req.session.userId = result.insertId;
    await saveSession(req);

    return res.status(201).json({
      message: "Compte créé avec succès !",
      user: {
        id: result.insertId,
        nom: nomPropre,
        email: emailPropre,
      },
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Cette adresse email est déjà utilisée.",
      });
    }

    console.error("Erreur inscription :", error.message);
    return res.status(500).json({
      message: "Erreur du serveur.",
    });
  }
});

// Connexion
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        message: "Email ou mot de passe invalide.",
      });
    }

    const [rows] = await pool.execute(
      "SELECT id, nom, email, password_hash FROM users WHERE email = ?",
      [email.trim().toLowerCase()]
    );

    const user = rows[0];
    const passwordMatches =
      user &&
      (user.password_hash?.startsWith("$2")
        ? await bcrypt.compare(password, user.password_hash)
        : user.password_hash === password);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect.",
      });
    }

    if (!user.password_hash.startsWith("$2")) {
      user.password_hash = await bcrypt.hash(password, 12);
      await pool.execute("UPDATE users SET password_hash = ? WHERE id = ?", [
        user.password_hash,
        user.id,
      ]);
    }

    // Renouveler la session après authentification
    await new Promise((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    req.session.userId = user.id;
    await saveSession(req);

    return res.json({
      message: "Connexion réussie !",
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Erreur connexion :", error.message);
    return res.status(500).json({
      message: "Erreur du serveur.",
    });
  }
});

// Profil de l'utilisateur connecté
router.get("/me", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        message: "Tu dois te connecter.",
      });
    }

    const [rows] = await pool.execute(
      "SELECT id, nom, email, created_at FROM users WHERE id = ?",
      [req.session.userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: "Utilisateur introuvable.",
      });
    }

    return res.json({ user: rows[0] });
  } catch (error) {
    console.error("Erreur profil :", error.message);
    return res.status(500).json({
      message: "Erreur du serveur.",
    });
  }
});

// Déconnexion
router.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        message: "Impossible de terminer la session.",
      });
    }

    res.clearCookie("connect.sid", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
    });

    return res.json({
      message: "Déconnexion réussie.",
    });
  });
});

module.exports = router;