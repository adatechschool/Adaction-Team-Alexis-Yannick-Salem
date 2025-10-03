import {Router} from "express";
import bcrypt from "bcrypt";
import {db} from "../db/db.js"

const router = Router();

// Récupérer toutes les associations
router.get("/", async (req, res) => {
  try {
    const reslt = await db.query(`SELECT name, sigle FROM associations`);
    res.status(200).json(reslt.rows);
  } catch (error) {
    console.error("Erreur lors de la recuperation des associations", error);
    res.status(500).json("Erreur serveur");
  }
});

// Inscription d'une nouvelle association
router.post("/signup", async (req, res) => {
    try {
      const { username, name, password, sigle } = req.body;
      if (!username || !password || !name) {
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
      `INSERT INTO associations (username, password, name,sigle, date_creation)
      VALUES ('${username}', '${hashedPassword}','${sigle}' ,'${name}', current_timestamp)`
    );
    res.status(201).json(reslt.rows[0]);
  } catch (error) {
    console.error("Erreur signup:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;