import express from "express";
import { upload } from "../middleware/uploadValidator.js";
import { createAd, getAds, updateStatus } from "../controllers/adsController.js";

const router = express.Router();

router.post("/upload", upload, createAd);
router.get("/get-all", getAds);
router.patch("/:id/status", express.json(), updateStatus);

export default router;
