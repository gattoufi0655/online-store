const express = require("express");
const pool = require("../db");

const router = express.Router();
const MAX_ITEMS = 100;
const MAX_COLLECTION_BYTES = 450_000;

function requireUser(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Tu dois te connecter." });
  }

  return next();
}

function isValidCollection(items, isCart) {
  if (!Array.isArray(items) || items.length > MAX_ITEMS) {
    return false;
  }

  return items.every((item) => {
    if (
      !item ||
      typeof item !== "object" ||
      Array.isArray(item) ||
      !["string", "number"].includes(typeof item.id)
    ) {
      return false;
    }

    return (
      !isCart ||
      (Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 99)
    );
  });
}

router.get("/", requireUser, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT cart_items, favorite_items FROM user_collections WHERE user_id = ?",
      [req.session.userId]
    );
    const row = rows[0];

    return res.json({
      cartItems: row ? JSON.parse(row.cart_items) : [],
      favorites: row ? JSON.parse(row.favorite_items) : [],
    });
  } catch (error) {
    console.error("Erreur chargement panier et favoris :", error.message);
    return res.status(500).json({
      message: "Impossible de charger le panier et les favoris.",
    });
  }
});

router.put("/", requireUser, async (req, res) => {
  try {
    const { cartItems, favorites } = req.body || {};

    if (
      !isValidCollection(cartItems, true) ||
      !isValidCollection(favorites, false)
    ) {
      return res.status(400).json({
        message: "Le panier ou les favoris contiennent des données invalides.",
      });
    }

    const cartJson = JSON.stringify(cartItems);
    const favoritesJson = JSON.stringify(favorites);

    if (
      Buffer.byteLength(cartJson, "utf8") > MAX_COLLECTION_BYTES ||
      Buffer.byteLength(favoritesJson, "utf8") > MAX_COLLECTION_BYTES
    ) {
      return res.status(413).json({
        message: "Le panier ou les favoris sont trop volumineux.",
      });
    }

    await pool.execute(
      `INSERT INTO user_collections (user_id, cart_items, favorite_items)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         cart_items = VALUES(cart_items),
         favorite_items = VALUES(favorite_items)`,
      [req.session.userId, cartJson, favoritesJson]
    );

    return res.json({ message: "Panier et favoris enregistrés." });
  } catch (error) {
    console.error("Erreur sauvegarde panier et favoris :", error.message);
    return res.status(500).json({
      message: "Impossible d’enregistrer le panier et les favoris.",
    });
  }
});

module.exports = router;
