import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Pool } from "pg";
import bcrypt from "bcrypt";


dotenv.config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json("hello world cc");
});

// route get associations

app.get("/Associations", async (req, res) => {
  try {
    const reslt = await db.query(`SELECT name, sigle FROM associations`);
    res.status(200).json(reslt.rows);
  } catch (error) {
    console.error("Erreur lors de la recuperation des associations", error);
    res.status(500).json("Erreur serveur");
  }
});

// route get Benvole
app.get("/Benevole", async (req, res) => {
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

// route get ville
app.get("/Ville", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM ville");
    res.json(result.rows);
  } catch (error) {
    console.error("Erreur lors de la recupération des villes:", error);
    res.status(500).json("Erreur serveur");
  }
});

// route get dechets

app.get("/Dechets", async (req, res) => {
  try {
    const reslt = await db.query("SELECT name ,score, icon FROM dechets");
    res.json(reslt.rows);
  } catch (error) {
    console.error("Erreur lors de la recuperation des dechets", error);
    res.status(500).json("Erreur serveur");
  }
});

// route singup associations
app.post("/Signup/associations", async (req, res) => {
  try {
    const { username, name, password, sigle } = req.body;
    if (!username || !password || !name) {
      return res
        .status(400)
        .json({ error: "tous les champs doit etre remplis" });
    }
    const check = await db.query(
      `SELECT (
         EXISTS(SELECT 1 FROM benevoles WHERE username = $1)
         OR EXISTS(SELECT 1 FROM associations WHERE username = $1)
       ) AS taken`,
      [username]
    );
    console.log(typeof(check.rows))
    console.log(check.rows)
    if (check.rows[0].taken)
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

// route singup benevole

app.post("/Signup/benevole", async (req, res) => {
  try {
    const { username, first_name, last_name, password, id_ville } = req.body;
    if (!username || !password || !first_name) {
      return res
        .status(400)
        .json({ error: "tous les champs doit etre remplis" });
    }
    const check = await db.query(
      `SELECT (
         EXISTS(SELECT 1 FROM benevoles WHERE username = $1)
         OR EXISTS(SELECT 1 FROM associations WHERE username = $1)
       ) AS taken`,
      [username]
    );
    if (check.rows[0].taken)
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
// route login
app.post("/Login", async (req, res) => {
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
        return res
          .status(200)
          .json({
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
        return res
          .status(200)
          .json({
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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
