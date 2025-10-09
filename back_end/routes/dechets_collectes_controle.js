import { Router } from "express";
import { db } from "../db/db.js";

const router = Router();

// Register a benevole to a collecte
router.post("/register", async (req, res) => {
  try {
    const { id_collecte, id_benevole } = req.body;

    if (!id_collecte || !id_benevole) {
      return res.status(400).json({ error: "id_collecte et id_benevole sont requis" });
    }

    // Check if benevole is already registered for this collecte
    const checkRegistration = await db.query(
      "SELECT * FROM dechets_collectes WHERE id_collecte = $1 AND id_benevole = $2",
      [id_collecte, id_benevole]
    );

    if (checkRegistration.rows.length > 0) {
      return res.status(400).json({ error: "Bénévole déjà inscrit à cette collecte" });
    }

    // Register the benevole (create a placeholder entry with null dechet_id)
    const result = await db.query(
      `INSERT INTO dechets_collectes (id_collecte, id_benevole, dechet_id, dechet_quantite)
       VALUES ($1, $2, NULL, NULL)
       RETURNING *`,
      [id_collecte, id_benevole]
    );

    res.status(201).json({ message: "Bénévole inscrit avec succès", data: result.rows[0] });
  } catch (error) {
    console.error("Erreur lors de l'inscription du bénévole:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Save waste collection results
router.post("/results", async (req, res) => {
  try {
    const { id_collecte, id_benevole, results } = req.body;

    console.log('Received results request:', { id_collecte, id_benevole, results });

    if (!id_collecte || !id_benevole || !results) {
      return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    // Ensure IDs are numbers
    const collecteId = Number(id_collecte);
    const benevoleId = Number(id_benevole);

    if (isNaN(collecteId) || isNaN(benevoleId)) {
      return res.status(400).json({ error: "IDs invalides" });
    }

    // Parse results if it's a string
    const wasteData = typeof results === 'string' ? JSON.parse(results) : results;

    // Get all waste types from database to map names to IDs
    const dechetsResult = await db.query("SELECT id, name FROM dechets");
    const dechetsMap = {};
    dechetsResult.rows.forEach(dechet => {
      dechetsMap[dechet.name] = dechet.id;
    });

    console.log('Available waste types:', dechetsMap);
    console.log('Received waste data:', wasteData);

    const insertedResults = [];

    // For each waste type in results
    for (const [wasteType, wasteInfo] of Object.entries(wasteData)) {
      console.log(`Processing waste type: ${wasteType}`, wasteInfo);
      console.log(`Current dechetsMap:`, dechetsMap);
      const dechetId = dechetsMap[wasteType];
      
      if (!dechetId) {
        console.warn(`Type de déchet non trouvé: ${wasteType}`);
        continue;
      }

      const quantity = wasteInfo.value || 0;

      if (quantity > 0) {
        // Check if this benevole already has a result for this waste type in this collecte
      const existingResult = await db.query(
        `SELECT * FROM dechets_collectes 
         WHERE id_collecte = $1 AND id_benevole = $2 AND dechet_id = $3`,
        [collecteId, benevoleId, dechetId]
      );

      if (existingResult.rows.length > 0) {
        // Update existing result
        const updated = await db.query(
          `UPDATE dechets_collectes 
           SET dechet_quantite = $1
           WHERE id_collecte = $2 AND id_benevole = $3 AND dechet_id = $4
           RETURNING *`,
          [quantity, collecteId, benevoleId, dechetId]
        );
        insertedResults.push(updated.rows[0]);
      } else {
        // Insert new result
        const inserted = await db.query(
          `INSERT INTO dechets_collectes (id_collecte, id_benevole, dechet_id, dechet_quantite)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [collecteId, benevoleId, dechetId, quantity]
        );
        insertedResults.push(inserted.rows[0]);
      }}
    }

    res.status(201).json({ 
      message: "Résultats enregistrés avec succès", 
      data: insertedResults 
    });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement des résultats:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ error: "Erreur serveur: " + error.message });
  }
});

// Get results for a specific collecte
router.get("/results/:id_collecte", async (req, res) => {
  try {
    const id_collecte = Number(req.params.id_collecte);

    const results = await db.query(
      `SELECT dc.*, d.name AS dechet_name, d.icon, b.first_name, b.last_name
       FROM dechets_collectes dc
       JOIN dechets d ON dc.dechet_id = d.id
       JOIN benevoles b ON dc.id_benevole = b.id
       WHERE dc.id_collecte = $1 AND dc.dechet_id IS NOT NULL`,
      [id_collecte]
    );

    res.status(200).json(results.rows);
  } catch (error) {
    console.error("Erreur lors de la récupération des résultats:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Check if benevole is registered for a collecte
router.get("/check-registration/:id_collecte/:id_benevole", async (req, res) => {
  try {
    const { id_collecte, id_benevole } = req.params;

    const result = await db.query(
      "SELECT * FROM dechets_collectes WHERE id_collecte = $1 AND id_benevole = $2",
      [id_collecte, id_benevole]
    );

    res.status(200).json({ 
      isRegistered: result.rows.length > 0,
      data: result.rows 
    });
  } catch (error) {
    console.error("Erreur lors de la vérification de l'inscription:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Unregister a benevole from a collecte
router.delete("/unregister/:id_collecte/:id_benevole", async (req, res) => {
  try {
    const { id_collecte, id_benevole } = req.params;

    if (!id_collecte || !id_benevole) {
      return res.status(400).json({ error: "id_collecte et id_benevole sont requis" });
    }

    // Delete registration (only rows with null dechet_id, which are placeholder registrations)
    const result = await db.query(
      `DELETE FROM dechets_collectes 
       WHERE id_collecte = $1 AND id_benevole = $2 AND dechet_id IS NULL
       RETURNING *`,
      [id_collecte, id_benevole]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Inscription non trouvée ou collecte déjà complétée" });
    }

    res.status(200).json({ message: "Désinscription réussie", data: result.rows[0] });
  } catch (error) {
    console.error("Erreur lors de la désinscription:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
