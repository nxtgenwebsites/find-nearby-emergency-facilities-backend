import { AboutLikes } from "../models/aboutLikesModel.js";

// ✅ Ensure single document always exists
async function getOrCreateDoc() {
    let doc = await AboutLikes.findOne();
    if (!doc) doc = await AboutLikes.create({});
    return doc;
}

// ✅ Get like count
export const getAboutLikes = async (req, res) => {
    try {
        const doc = await getOrCreateDoc();
        res.status(200).json({ likes: doc.likes });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ✅ Increase like count by 1
export const increaseAboutLike = async (req, res) => {
    try {
        const doc = await AboutLikes.findOneAndUpdate(
            {},
            { $inc: { likes: 1 } },
            { new: true, upsert: true }
        );

        res.status(200).json({
            message: "Like added to About section",
            likes: doc.likes,
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
