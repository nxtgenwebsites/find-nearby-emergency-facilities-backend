import express from "express";
import multer from "multer";
import {
    createAd,
    getAds,
    getAdsByOwner,
    updateAd,
    deleteAd,
    updateStatus,
    getActiveAds
} from "../controllers/adsController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Create ad with owner ID in params
router.post("/upload/:id", upload.single("image"), createAd);

// Get all ads
router.get("/", getAds);

// Get ads by owner
router.get("/owner/:ownerId", getAdsByOwner);

// Update ad
router.put("/:id", upload.single("image"), updateAd);

// Delete ad
router.delete("/:id", deleteAd);

// Update status
router.patch("/:id/status", updateStatus);
router.get("/active", getActiveAds);

export default router;