import mongoose from "mongoose";

let isConnected = false; // 🔹 Global connection state

const connectDB = async () => {
    if (isConnected) {
        console.log("⚡ Using existing MongoDB connection");
        return;
    }

    try {
        const db = await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
        });

        isConnected = db.connections[0].readyState === 1;
        console.log("✅ MongoDB connected successfully!");
    } catch (err) {
        console.error("❌ MongoDB connection error:", err.message);
        throw new Error("MongoDB connection failed");
    }
};

export default connectDB;
