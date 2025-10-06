import {Router} from "express";

import {db} from "../db/db.js"

const router = Router();

// Récupérer toutes les villes
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM ville");
    res.json(result.rows);
  } catch (error) {
    console.error("Erreur lors de la recupération des villes:", error);
    res.status(500).json("Erreur serveur");
  }
});

export default router