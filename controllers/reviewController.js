import Review from "../models/reviewModel.js";
import User from "../models/userModel.js";

// ✅ Create a new review
export const createReview = async (req, res) => {
    try {
        const { name, email, country, title, reviewText, rating } = req.body;

        if (!name || !email || !country || !title || !reviewText || rating === undefined) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const review = new Review({
            name,
            email,
            country,
            title,
            reviewText,
            rating,
            likes: 0,
            published: false,
        });

        const saved = await review.save();
        return res.status(201).json(saved);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};

// ✅ Get all reviews (optional query: ?published=true)
export const getReviews = async (req, res) => {
    try {
        const filter = {};
        if (req.query.published === "true") filter.published = true;

        const reviews = await Review.find(filter).sort({ createdAt: -1 });
        return res.json(reviews);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};

// ✅ Like a review
export const likeReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: "Review not found" });

        review.likes += 1;
        await review.save();

        return res.json({ likes: review.likes });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};

// ✅ Publish a review (admin only)
export const togglePublish = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) return res.status(400).json({ message: "User ID is required" });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Only admins can publish reviews." });
        }

        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: "Review not found" });

        review.published = true;
        await review.save();

        return res.json({ message: "Review published successfully", published: review.published });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};

// ✅ Delete a review (admin only)
export const deleteReview = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) return res.status(400).json({ message: "User ID is required" });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Only admins can delete reviews." });
        }

        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) return res.status(404).json({ message: "Review not found" });

        return res.json({ message: "Review deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};
