import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import connectDB from './config/db.js';
import hospitalRoutes from './routes/hospitalRoutes.js'
import visitorRoutes from './routes/visitorRoutes.js'

dotenv.config();
connectDB()

const app = express()
const port = process.env.PORT || 9000

app.use(bodyParser.json());
app.use(cors())


app.use("/api/hospitals", hospitalRoutes);
app.use("/api/visitor", visitorRoutes);

app.listen(port ,() => {
    console.log(`Server is up and running at http://localhost:${port}`);
})
