import Ad from "../models/adsModel.js";
import cloudinary from "../config/cloudinary.js";
import { validateDimensions } from "../middleware/uploadValidator.js";

const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "ads" },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        stream.end(buffer);
    });
};

export const createAd = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "Image is required" });

        // check dimensions (1100x620)
        await validateDimensions(req.file.buffer);

        // upload to cloudinary
        const uploadResult = await uploadToCloudinary(req.file.buffer);

        const { sponsorName, country, startDate, endDate, link, status } = req.body;

        if (!sponsorName || !country || !startDate || !endDate || !link) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const ad = new Ad({
            sponsorName,
            country,
            startDate,
            endDate,
            link,
            imageUrl: uploadResult.secure_url,
            imagePublicId: uploadResult.public_id,
            status: ["pending", "active", "inactive"].includes(status)
                ? status
                : "pending",
        });

        await ad.save();
        res.status(201).json({ message: "Ad created", ad });
    } catch (err) {
        console.error("Create Ad Error:", err);
        res.status(500).json({ error: err.message });
    }
};

export const getAds = async (req, res) => {
    const ads = await Ad.find().sort({ createdAt: -1 });
    res.json({ ads });
};

export const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["pending", "active", "inactive"].includes(status))
            return res.status(400).json({ error: "Invalid status" });

        const ad = await Ad.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!ad) return res.status(404).json({ error: "Ad not found" });
        res.json({ message: "Status updated", ad });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
