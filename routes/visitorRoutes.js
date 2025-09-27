import express from "express";
import { increaseVisitor, getVisitors } from "../controllers/visitorController.js";

const router = express.Router();

// Increase counter
router.get("/visit", increaseVisitor);

// Get total
router.get("/total", getVisitors);

export default router;
