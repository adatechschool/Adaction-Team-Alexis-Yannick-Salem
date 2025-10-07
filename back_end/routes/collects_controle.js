import {Router} from "express";
import {db} from "../db/db.js"

const router = Router();

// Récupérer toutes les collectes
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`SELECT c.id, c.date, c.id_ville, c.benevole_responsable,
        c.status, b.first_name, b.last_name, v.name AS ville
        FROM collectes c
        JOIN benevoles b ON c.benevole_responsable = b.id
        JOIN ville v ON c.id_ville = v.id
        ORDER BY c.date`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Erreur lors de la recuperation de l'historique des collectes", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Créer une nouvelle collecte
router.post("/", async (req, res) => {
  try {
    const {date, id_ville, benevole_responsable } = req.body;

    // Vérifier que tous les champs requis sont présents
    if (!date || !id_ville || !benevole_responsable) {
      return res.status(400).json({ error: "Tous les champs requis doivent être remplis" });
    }

    const result = await db.query(
      `INSERT INTO collectes (date, id_ville, benevole_responsable, status)
       VALUES ($1, $2, $3, 'À venir')
       RETURNING *`,
      [date, id_ville, benevole_responsable]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erreur lors de la création de la collecte:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Mettre à jour une collecte existante
router.patch("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {date, id_ville, benevole_responsable, status } = req.body;

    // Vérifier si la collecte existe
    const checkCollecte = await db.query("SELECT * FROM collectes WHERE id = $1", [id]);
    if (checkCollecte.rows.length === 0) {
      return res.status(404).json({ error: "Collecte non trouvée" });
    }

    // Construire la requête de mise à jour dynamiquement
    let updateFields = [];
    let values = [];
    let valueIndex = 1;

    if (date) {
      updateFields.push(`date = $${valueIndex}`);
      values.push(date);
      valueIndex++;
    }
    if (id_ville) {
      updateFields.push(`id_ville = $${valueIndex}`);
      values.push(id_ville);
      valueIndex++;
    }
    if (benevole_responsable) {
      updateFields.push(`benevole_responsable = $${valueIndex}`);
      values.push(benevole_responsable);
      valueIndex++;
    }
    if (status) {
      updateFields.push(`status = $${valueIndex}`);
      values.push(status);
      valueIndex++;
    }

    // Check if at least one field is being updated
    if (updateFields.length === 0) {
      return res.status(400).json({ error: "Aucun champ à mettre à jour" });
    }

    values.push(id); // Ajouter l'ID à la fin pour la clause WHERE

    const result = await db.query(
      `UPDATE collectes 
       SET ${updateFields.join(", ")}, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $${valueIndex}
       RETURNING *`,
      values
    );

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la collecte:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Supprimer une collecte
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Vérifier si la collecte existe
    const checkCollecte = await db.query("SELECT * FROM collectes WHERE id = $1", [id]);
    if (checkCollecte.rows.length === 0) {
      return res.status(404).json({ error: "Collecte non trouvée" });
    }

    await db.query("DELETE FROM collectes WHERE id = $1", [id]);
    res.status(200).json({ message: "Collecte supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la collecte:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router