import { Router } from "express";
import { db } from "../db/db.js";

const router = Router();

// Get all waste types (for form inputs)
router.get("/types", async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, icon, score FROM dechets ORDER BY id');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Erreur lors de la recuperation des types de dechets", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Récupérer les déchets collectés dans une ville entre deux dates
router.get("/", async (req, res) => {
  try {
    const reslt = await db.query(`
SELECT c.id AS collecte_id, c.date, v.name AS ville_name, d.name AS dechet_name, d.icon, SUM(dc.dechet_quantite) AS total_dechet
FROM dechets_collectes dc
JOIN dechets d ON d.id = dc.dechet_id
JOIN collectes c ON c.id = dc.id_collecte
JOIN ville v ON v.id = c.id_ville
GROUP BY c.id, c.date, v.name, d.name, d.icon
ORDER BY c.date, v.name, d.name`);
    res.status(200).json(reslt.rows);
  } catch (error) {
    console.error("Erreur lors de la recuperation des dechets", error);
    res.status(500).json("Erreur serveur");
  }
});

router.get("/total", async (req, res) => {
  try {
    const reslt = await db.query('SELECT SUM(dechet_quantite) AS total_dechets FROM dechets_collectes');
    res.status(200).json(reslt.rows);
  } catch (error) {
    console.error("Erreur lors de la recuperation des dechets", error);
    res.status(500).json("Erreur serveur");
  }
});

export default router;