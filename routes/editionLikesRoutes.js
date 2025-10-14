import express from "express";
import { getAllEditionLikes, increaseEditionLike } from "../controllers/editionLikesController.js";

const router = express.Router();

router.get("/likes", getAllEditionLikes);
router.put("/likes/:cardNumber", increaseEditionLike);

export default router;
