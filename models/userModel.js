import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

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
    role: {
        type: String,
        default: 'user'
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: false
    },
    // 👇 ye naya field add kar do
    notifications: [notificationSchema],
}, { timestamps: true });

export default mongoose.model("User", userSchema);
