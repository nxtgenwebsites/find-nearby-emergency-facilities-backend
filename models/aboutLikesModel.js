import mongoose from "mongoose";

const aboutLikesSchema = new mongoose.Schema({
    likes: {
        type: Number,
        default: 0,
    },
});

export const AboutLikes = mongoose.model("AboutLikes", aboutLikesSchema);
