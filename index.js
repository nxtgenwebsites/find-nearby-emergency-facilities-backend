import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import connectDB from './config/db.js';
import visitorRoutes from './routes/visitorRoutes.js'
import authRoutes from './routes/authRoutes.js'
import userRouter from './routes/userRoutes.js'
import partnershipLikesRoutes from "./routes/partnershipLikesRoutes.js";
import editionLikesRoutes from "./routes/editionLikesRoutes.js";
import aboutLikesRoutes from "./routes/aboutLikesRoutes.js";

dotenv.config();
connectDB()

const app = express()
const port = process.env.PORT || 9000

app.use(bodyParser.json());
app.use(cors())

app.use('/api/auth', authRoutes);
app.use("/api/visitor", visitorRoutes);
app.use("/api/users" , userRouter );
app.use("/api/partnership", partnershipLikesRoutes);
app.use("/api/edition", editionLikesRoutes);
app.use("/api/about", aboutLikesRoutes);

app.listen(port ,() => {
    console.log(`Server is up and running at http://localhost:${port}`);
})
