import cors from 'cors';
import Joi from 'joi';
import dayjs from 'dayjs';
import express from 'express';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.DATABASE_URL)
let db
mongoClient.connect().then( () => {
    db = mongoClient.db()
})


app.listen(5000, ()=> console.log("The App is running in port 5000"));

