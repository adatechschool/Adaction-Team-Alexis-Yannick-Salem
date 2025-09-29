import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {Pool} from "pg"


dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const app = express();
app.use(cors());
app.use(express.json());


const port = process.env.Port || 3000;


app.use('/',(req,res)=>{
    res.send("hello world ")
})




app.listen(port, ()=>{
    console.log(`Example app listening on port ${port}`)
})
