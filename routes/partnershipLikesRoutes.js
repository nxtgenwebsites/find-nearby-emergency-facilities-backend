import express from "express";
import { getAllLikes, increaseLike } from "../controllers/partnershipLikesController.js";

const router = express.Router();

router.get("/likes", getAllLikes);
router.put("/likes/:cardNumber", increaseLike);

export default router;
