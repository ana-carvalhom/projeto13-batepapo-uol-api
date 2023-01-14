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


const schemaParticipant = joi.object({
    name: joi.string().min(1).required(),
    lastStatus: joi.number
})

const schemaMessage = joi.object({
    from: joi.string().required(),
    to: joi.string().min(1).required(),
    text: joi.string().min(1).required(),
    type: joi.string().valid("message", "private_message").required(),
    time: joi.string(),
})


app.post("/participants", async (req, res) => {
    const participantName = req.body;

    const validation = schemaParticipant.validate(participantName, {
        abortEarly: false,
    });
    if (validation, error){
        const errors = validation.error.details.map((detail) => detail.message);
        res.status(422).send(errors);
        return;
    }
    
        try {
            const participantIsReal = await db.collection("participants").findOne({name: participantName.name})
            if(participantIsReal){
                res.send(409);
                return
            }

            await db.collection("participants").insertOne({name: 'xxx', lastStatus: Date.now()})
        } catch (error){
            res.status(500).send(error.message);
        }

    })

  




app.listen(5000, ()=> console.log("The App is running in port 5000"));

