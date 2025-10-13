import mongoose from "mongoose";

const nextOfKinSchema = new mongoose.Schema({
    title: { type: String },
    first_name: { type: String },
    last_name: { type: String },
    relationship: { type: String },
    email: { type: String },
    country: { type: String },
    whatsapp_no: { type: String },
}, { _id: false });

const userSchema = new mongoose.Schema({
    first_name: {
        type: String,
    },
    last_name: {
        type: String,
    },
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
    },
    
    next_of_kin: [nextOfKinSchema],

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
    }
}, { timestamps: true });

const userModel = mongoose.model('users', userSchema);
export default userModel;
