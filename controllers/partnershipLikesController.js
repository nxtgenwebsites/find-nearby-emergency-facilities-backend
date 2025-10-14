import { PartnershipLikes } from "../models/partnershipLikesModel.js";

// ✅ Create doc if not exists, and always return the same one
async function getOrCreateDoc() {
    let doc = await PartnershipLikes.findOne();
    if (!doc) {
        doc = await PartnershipLikes.create({});
    }
    return doc;
}

// ✅ Get all likes
export const getAllLikes = async (req, res) => {
    try {
        const doc = await getOrCreateDoc();
        res.status(200).json(doc.likes);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ✅ Increase like (Persistent in DB)
export const increaseLike = async (req, res) => {
    try {
        const cardNumber = parseInt(req.params.cardNumber);
        if (isNaN(cardNumber) || cardNumber < 1 || cardNumber > 9) {
            return res.status(400).json({ message: "Invalid card number (1–9 only)" });
        }

        const key = `likes.card${cardNumber}`;

        // Ensure one document always exists and update it
        let doc = await PartnershipLikes.findOneAndUpdate(
            {},
            { $inc: { [key]: 1 } },
            { new: true, upsert: true } // upsert => create if not exist
        );

        res.status(200).json({
            message: `Like added to card${cardNumber}`,
            likes: doc.likes,
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
