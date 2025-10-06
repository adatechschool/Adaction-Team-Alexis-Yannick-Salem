import express from "express";
import cors from "cors";

import authRouter from "./routes/auth_controle.js"
import associationsRouter from "./routes/associations_controle.js"
import benevoleRouter from "./routes/benevoles_controle.js"
import collectsRouter from "./routes/collects_controle.js"
import dechetsRouter from "./routes/dechets_controle.js"
import villeRouter from "./routes/ville_controle.js"

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

// Route racine de test
app.get("/", (req, res) => {
  res.json("hello world cc");
});

// Route get associations
app.use('/auth', authRouter)
app.use('/associations', associationsRouter);
app.use('/benevole', benevoleRouter);
app.use('/collectes', collectsRouter);
app.use('/dechets', dechetsRouter);
app.use('/ville', villeRouter);

app.use((req,res)=> res.status(404).json({error:"Route introuvable"}))

// Ecoute du serveur
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
