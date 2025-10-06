import { Router } from "express";
import { db } from "../db/db.js";

const router = Router();

// Récupérer les déchets collectés dans une ville entre deux dates
router.get("/", async (req, res) => {
  try {
    const reslt = await db.query(`
      SELECT DISTINCT d.icon, d.name AS dechet_name, c.date, v.name AS ville_name, b.id AS benevoles_id, 
      SUM(dc.dechet_quantite) OVER (PARTITION BY d.id) AS total_dechet
      FROM dechets_collectes dc
      JOIN dechets   d ON d.id = dc.dechet_id
      JOIN benevoles b ON dc.id_benevole = b.id
      JOIN collectes c ON c.id = dc.id_collecte
      JOIN ville     v ON v.id = c.id_ville
      ORDER BY c.date, v.name, d.name`);
    res.status(200).json(reslt.rows);
  } catch (error) {
    console.error("Erreur lors de la recuperation des dechets", error);
    res.status(500).json("Erreur serveur");
  }
});



export default router;