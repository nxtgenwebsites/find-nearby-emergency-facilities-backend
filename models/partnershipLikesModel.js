import mongoose from "mongoose";

const partnershipLikesSchema = new mongoose.Schema({
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
            card8: 0,
            card9: 0,
        },
    },
});

export const PartnershipLikes = mongoose.model("PartnershipLikes", partnershipLikesSchema);
