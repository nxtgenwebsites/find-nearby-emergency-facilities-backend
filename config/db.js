import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect('momongodb+srv://nxtgenwebsites:jX1a6PfAmdogrHCt@healthmonitorsys.mdurq.mongodb.net/nearby-facilities');
        console.log(`MongoDB connected successfully!`);
    } catch (err) {
        console.error("MongoDB connection error:", err)
    }
}

export default connectDB