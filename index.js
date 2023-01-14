import cors from 'cors';
import joi from 'joi';
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
});


const participant = joi.object({
    name: joi.string().min(1).required(),
    lastStatus: joi.number
})

const message = joi.object({
    from: joi.string().required(),
    to: joi.string().min(1).required(),
    text: joi.string().min(1).required(),
    type: joi.string().valid("message", "private_message").required(),
    time: joi.string(),
})

app.listen(5000, ()=> console.log("The App is running in port 5000"));

