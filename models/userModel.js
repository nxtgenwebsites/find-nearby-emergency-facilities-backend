import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    gender: {
        type: String,
        enum: ["male", "female"],
        required: true,
    },      
    country: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    dpImageUrl: {
        type: String,
        default: "",
    },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
