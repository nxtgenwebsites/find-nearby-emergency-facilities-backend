import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://emergencies_db_user:uJrsZeclV3uOiJbk@clusteremergencies.p8jts9b.mongodb.net/nearby-facilities');
        console.log(`MongoDB connected successfully!`);
    } catch (err) {
        console.error("MongoDB connection error:", err)
    }
}

export default connectDB