import express from "express";
import { findHospitalsBySearch, getNearbyHospitals, upload, uploadCSV } from "../controllers/hospitalController.js";

const router = express.Router();

// Route for CSV upload
router.post("/upload-csv", upload.single("file"), uploadCSV);
// Nearby hospitals
router.get("/nearby", getNearbyHospitals);

router.post("/find", findHospitalsBySearch);
export default router;
