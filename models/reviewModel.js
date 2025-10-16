import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        country: {
            type: String,
            required: true,
            trim: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        reviewText: {
            type: String,
            required: true,
            maxlength: 500,
            trim: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        likes: {
            type: Number,
            required: true,
            default: 0,
        },
        published: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Review", reviewSchema);
