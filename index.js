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

            await db.collection("participants").insertOne({name: participantName.name, lastStatus: Date.now()})
            await db.collection("messages").insertOne(
            {from: participantName.name,
             to: 'Todos', 
             text: 'entra na sala...', 
             type: 'status', 
             time: dayjs().format('HH:MM:SS')}),

            res.send(201);

        } catch (error){
            res.status(500).send(error.message);
        }

    })

app.get("/participants", async (req, res) => {
    try {
        const allParticipants = await db.collection("participants").find().toArray();
        if (!allParticipants) {
            res.status(404).send("No participants found");
            return;
        }

        res.send(allParticipants);
    } catch (error) {
        res.status(500).send(error.message)
    }
});

app.post("/messages", async (req, res) => {
    const {to, text, type} = req.body; 
    const {user} = req.headers;

try {
    const message = {
    from: user,
    to: to,
    text: text,
    type: type,
    time: dayjs().format("HH:mm:ss")
    };

    const validating = schemaMessage.validate(message, {abortEarly: false});
    if (validating.error) {
        const errors = validating.error.details.map((detail) => detail.message);
        res.status(422).send(errors);
        return;
    } 

    const participantIsReal = await db.collection("participants").findOne({name: user})
            if(!participantIsReal){
                res.send(409);
                return
            }
            
    await db.collection("messages").insertOne(message);
    res.send(201);


} catch (error) {
    res.status(500).send(error.message)
}

});

app.get("/messages", async(req, res) => {

    const limit = Number(req.query.limit);
    const {user} = req.headers;

    try{
    const allMessages = await db.collection("messages").find({}).toArray();
    const messagesFilter = allMessages.filter(message => {
        const publicMessage = message.type === "message";
        const privateMessage = message.to === "Todos" || message.to === user || message.from === user
;
        return publicMessage || privateMessage
    } )

    res.send(messagesFilter.slice(-limit))
    } catch (error) {
    res.status(500).send(error.message);
    }
})


app.post("/status", async(req, res) => {
    const {user} = req.headers;

    try {
        const participantIsReal = await db .collection("participants").findOne({name: user});

        if (!participantIsReal) {
            res.sendStatus(404);
            return;
        }

        await db.collection("participants").updateOne({name: user},{$set: {lastStatus: Data.now()}});

        res.send(200);


    } catch (error) {
        res.status(500).send(error.message)
    }
})

setInterval( async () => {
    const countSeconds = Date.now() - 10 * 1000;


    try {
        const deactivateParticipants = await db.collection("participants").find({lastStatus: {$lte: countSeconds}}).toArray();

        if(deactivateParticipants.length > 0 ){
            const automaticResponse = deactivateParticipants.map(deactivateParticipants =>
                {
                    return{
                        from: deactivateParticipants.name,
                        to: 'Todos', 
                        text: 'sai da sala...',
                        type: 'status',
                        time: dayjs().format('HH:MM:SS'),

                    };
                });

                await db.collection("messages").insertMany(automaticResponse)

                await db.collection("participants").deleteMany( {lastStatus: {$lte: countSeconds}})
        }


    } catch (error) {
        res.status(500).send(error.message)
    }

}, 15000)



app.listen(5000, ()=> console.log("The App is running in port 5000"));

