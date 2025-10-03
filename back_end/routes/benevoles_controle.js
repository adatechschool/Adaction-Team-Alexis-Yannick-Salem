import { Router } from "express";
import bcrypt from "bcrypt";
import { db } from "../db/db.js";

const router = Router();

// Récupérer tous les bénévoles
router.get("/", async (req, res) => {
  try {
    const reslt = await db.query(`SELECT * FROM benevoles `);
    res.status(200).json(reslt.rows);
  } catch (error) {
    console.error(
      "Erreur lors de la recuperation des donnees benevoles",
      error
    );
    res.status(500).json("Erreur serveur");
  }
});

// Récupérer l'historique des collectes d'un bénévole
router.get("/historique", async (req, res) => {
  try {
    const { idBenevole } = req.body;
    console.log(idBenevole);
    const reslt =
      await db.query(`SELECT DISTINCT c.id AS collecte_id, c.date, b.id, v.name AS ville_name
      FROM collectes c
      JOIN benevoles b ON c.benevole_responsable = b.id
      JOIN ville v ON c.id_ville = v.id
      JOIN dechets_collectes dc ON c.id = dc.id_collecte
      WHERE b.id = ${idBenevole}`);
    res.status(200).json(reslt.rows);
  } catch (error) {
    console.error("Erreur lors de la recuperation de l'historique", error);
    res.status(500).json("Erreur serveur");
  }
});

// Inscription d'un nouveau bénévole
router.post("/signup", async (req, res) => {
  try {
    const { username, first_name, last_name, password, id_ville } = req.body;
    if (!username || !password || !first_name) {
      return res
        .status(400)
        .json({ error: "tous les champs doit etre remplis" });
    }
    const check = await db.query(
      `
      SELECT 1 FROM (
        SELECT username FROM benevoles
        UNION
        SELECT username FROM associations
      ) AS users
      WHERE username = $1
      `,
      [username]
    );

    if (check.rows.length > 0)

      return res.status(400).json({ error: "Nom deja existant" });

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const reslt = await db.query(
      `INSERT INTO benevoles (username, password, first_name,last_name,  points_collectes,  id_ville, date_creation)
      VALUES ('${username}', '${hashedPassword}', '${first_name}','${last_name}',  0,  ${id_ville}, current_timestamp)`
    );
    res.status(201).json(reslt.rows[0]);
  } catch (error) {
    console.error("Erreur signup:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Mettre à jour les points collectés d'un bénévole
router.patch("/points", async (req, res) => {
  try {
    const { id, points } = req.body;

    const reslt = await db.query(
      `UPDATE benevoles
       SET points_collectes = COALESCE(points_collectes,0) + ${points}
       WHERE id = ${id}`
    );

    res.json(reslt.rows[0]);
  } catch (Erreur) {
    console.error("impossible de mettre a jour les points", Erreur);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
