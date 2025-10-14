import mongoose from "mongoose";

const editionLikesSchema = new mongoose.Schema({
    likes: {
        type: Object,
        default: {
            card1: 0,
            card2: 0,
            card3: 0,
            card4: 0,
            card5: 0,
            card6: 0,
            card7: 0,
        },
    },
});

export const EditionLikes = mongoose.model("EditionLikes", editionLikesSchema);
