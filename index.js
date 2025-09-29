import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {Pool} from "pg"


dotenv.config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const app = express();
app.use(cors());
app.use(express.json());


const port = process.env.PORT || 3000;


app.get('/',(req,res)=>{
    res.json("hello world cc")
})

app.get('/ville',async (req,res)=>{
  
  try {
    const result = await db.query('SELECT * FROM ville')
    res.json(result.rows)
  } catch (error) {
    console.error("Erreur lors de la recupération des villes:", error)
    res.status(500).json("Erreur serveur")
  }
})


app.listen(port, ()=>{
    console.log(`Example app listening on port ${port}`)
})
