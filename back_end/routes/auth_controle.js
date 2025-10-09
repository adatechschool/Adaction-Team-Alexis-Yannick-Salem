import { Router } from "express";
import { db } from "../db/db.js";
import bcrypt from "bcrypt";

const router = Router();

// Route de connexion pour les bénévoles et les associations
router.post("/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password)
        return res
          .status(400)
          .json({ error: "username et password sont requis" });
  
      const userBen = await db.query(
        "SELECT id, username, first_name, last_name, password FROM benevoles WHERE username = $1",
        [username]
      );
  
      if (userBen.rows.length > 0) {
        const user = userBen.rows[0];
        const check = await bcrypt.compare(password, user.password);
        if (!check) {
          return res.status(400).json({ error: "mot de passe invalide" });
        } else {
          return res.status(200).json({
            id: user.id,
            first_name: user.first_name,
            username: user.username,
            last_name: user.last_name,
          });
        }
      }
  
      const userAss = await db.query(
        "SELECT id, username, name, sigle, password FROM associations WHERE username = $1",
        [username]
      );
  
      if (userAss.rows.length > 0) {
        const user = userAss.rows[0];
        const check = await bcrypt.compare(password, user.password);
        if (!check) {
          return res.status(400).json({ error: "mot de passe invalide" });
        } else {
          return res.status(200).json({
            id: user.id,
            name: user.name,
            username: user.username,
            sigle: user.sigle,
          });
        }
      }
      res.status(400).json({ error: "identifiants invalide" });
    } catch (error) {
      console.error("POST /login", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

export default router