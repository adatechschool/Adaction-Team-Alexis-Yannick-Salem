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

router.get("/villes", async (req, res) => {
  try {
    const reslt = await db.query(`SELECT benevoles.*, ville.name AS ville_name FROM benevoles JOIN ville ON benevoles.id_ville = ville.id`);
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
    if (check.rows.length > 0) {
      return res.status(400).json({ error: "Nom deja existant" });
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const reslt = await db.query(
      `INSERT INTO benevoles (username, password, first_name, last_name, points_collectes, id_ville, date_creation)
      VALUES ($1, $2, $3, $4, 0, $5, current_timestamp)
      RETURNING id, username, first_name, last_name, points_collectes, id_ville`,
      [username, hashedPassword, first_name, last_name || '', id_ville]
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

    res.status(201).json(reslt.rows[0]);
  } catch (Erreur) {
    console.error("impossible de mettre a jour les points", Erreur);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
// Mettre a jour les informations d'un benevole

router.patch("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }
    
    const {
      username,
      first_name,
      last_name,
      password,
      id_ville,
      association_id,
    } = req.body;
    
    // Check if there's anything to update
    if (!username && !first_name && !last_name && !password && !id_ville && !association_id) {
      return res.status(400).json({ error: "Aucune donnée à mettre à jour" });
    }
    
    // Only check username if it's being changed
    if (username) {
      const check = await db.query(
        `
        SELECT 1 FROM (
          SELECT username FROM benevoles WHERE id != $2
          UNION
          SELECT username FROM associations
        ) AS users
        WHERE username = $1
        `,
        [username, id]
      );
      
      if (check.rows.length > 0) {
        return res.status(400).json({ error: "Nom d'utilisateur déjà existant" });
      }
    }
    
    // Only hash password if provided
    let hashedPassword = null;
    if (password) {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    }

    const result = await db.query(
      `
      UPDATE benevoles
      SET 
        username       = COALESCE($1, username),
        password       = COALESCE($2, password),
        first_name     = COALESCE($3, first_name),
        last_name      = COALESCE($4, last_name),
        association_id = COALESCE($5, association_id),
        id_ville       = COALESCE($6, id_ville),
        date_modification = current_timestamp
      WHERE id = $7
      RETURNING *;
      `,
      [
        username || null,
        hashedPassword,
        first_name || null,
        last_name || null,
        association_id || null,
        id_ville || null,
        id,
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bénévole non trouvé" });
    }
    
    console.log("Bénévole mis à jour:", result.rows[0]);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(
      "Impossible de mettre à jour les informations du bénévole:",
      error
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Supprimer un bénévole
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }
    
    const result = await db.query(
      "DELETE FROM benevoles WHERE id = $1 RETURNING *",
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bénévole non trouvé" });
    }
    
    console.log("Bénévole supprimé:", result.rows[0]);
    res.status(200).json({ message: "Bénévole supprimé avec succès", benevole: result.rows[0] });
  } catch (error) {
    console.error("Erreur lors de la suppression du bénévole:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Déconnexion d'un bénévole

router.post('/logout', async(req,res)=>{
  try {
    res.status(200).json({message: "Déconnexion réussie"})
  } catch (error) {
    console.error("Erreur lors de la déconnexion :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
  
})

router.get("/total", async (req, res) => {
  try {
    const reslt = await db.query(`SELECT COUNT(*) FROM benevoles`);
    res.status(200).json(reslt.rows);
  } catch (error) {
    console.error(
      "Erreur lors de la recuperation des donnees benevoles",
      error
    );
    res.status(500).json("Erreur serveur");
  }
});

export default router;
