import { EditionLikes } from "../models/editionLikesModel.js";

// ✅ Ensure one document exists
async function getOrCreateDoc() {
    let doc = await EditionLikes.findOne();
    if (!doc) doc = await EditionLikes.create({});
    return doc;
}

// ✅ Get all likes
export const getAllEditionLikes = async (req, res) => {
    try {
        const doc = await getOrCreateDoc();
        res.status(200).json(doc.likes);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ✅ Increase like by card number
export const increaseEditionLike = async (req, res) => {
    try {
        const cardNumber = parseInt(req.params.cardNumber);
        if (isNaN(cardNumber) || cardNumber < 1 || cardNumber > 7) {
            return res.status(400).json({ message: "Invalid card number (1–7 only)" });
        }

        const key = `likes.card${cardNumber}`;

        const doc = await EditionLikes.findOneAndUpdate(
            {},
            { $inc: { [key]: 1 } },
            { new: true, upsert: true }
        );

        res.status(200).json({
            message: `Like added to edition card${cardNumber}`,
            likes: doc.likes,
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
