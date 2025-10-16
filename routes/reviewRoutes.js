import express from "express";
import {
    createReview,
    getReviews,
    likeReview,
    togglePublish,
    deleteReview
} from "../controllers/reviewController.js";

const router = express.Router();

// ✅ Create a new review
router.post("/add-review", createReview);

// ✅ Get all reviews (optional query ?published=true)
router.get("/get-reviews", getReviews);

// ✅ Like a review
router.put("/like-review/:id", likeReview);

// ✅ Publish a review (admin only)
router.put("/publish-review/:id", togglePublish);

// ✅ Delete a review (admin only)
router.delete("/delete-review/:id", deleteReview);

export default router;
