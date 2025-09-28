import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://shahbazansari8998_db_user:kbnTqRJ56D3Tfril@cluster0.jr1bxib.mongodb.net/nearby-facilities');
        console.log(`MongoDB connected successfully!`);
    } catch (err) {
        console.error("MongoDB connection error:", err)
    }
}

export default connectDB