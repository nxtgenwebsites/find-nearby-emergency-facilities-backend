import express from "express";
import { getAboutLikes, increaseAboutLike } from "../controllers/aboutLikesController.js";

const router = express.Router();

router.get("/likes", getAboutLikes);
router.put("/like", increaseAboutLike);

export default router;
