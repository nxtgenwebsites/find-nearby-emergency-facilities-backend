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

// Create Ad (already correct)
export const createAd = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: "Owner ID is required" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "Image is required" });
        }

        await validateDimensions(req.file.buffer);
        const uploadResult = await uploadToCloudinary(req.file.buffer);

        const { sponsorName, country, startDate, endDate, link, impressionDays, status } = req.body;

        if (!sponsorName || !country || !startDate || !endDate || !link) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const ad = new Ad({
            owner: id,
            sponsorName,
            country,
            startDate,
            endDate,
            link,
            impressionDays: impressionDays || 0,
            status: status || "pending",
            imageUrl: uploadResult.secure_url,
            imagePublicId: uploadResult.public_id,
        });

        await ad.save();
        res.status(201).json(ad);
    } catch (err) {
        console.error("Create Ad Error:", err);
        res.status(500).json({ error: err.message });
    }
};

// Get All Ads
export const getAds = async (req, res) => {
    try {
        const ads = await Ad.find().sort({ createdAt: -1 });
        res.status(200).json(ads);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get Ads by Owner
export const getAdsByOwner = async (req, res) => {
    try {
        const { ownerId } = req.params;

        if (!ownerId) {
            return res.status(400).json({ error: "Owner ID is required" });
        }

        const ads = await Ad.find({ owner: ownerId }).sort({ createdAt: -1 });
        res.status(200).json(ads);
    } catch (err) {
        console.error("Get Ads by Owner Error:", err);
        res.status(500).json({ error: err.message });
    }
};

// Update Ad (NEW - tumhare frontend mein chahiye)
export const updateAd = async (req, res) => {
    try {
        const { id } = req.params;
        const { sponsorName, country, startDate, endDate, link, impressionDays, status } = req.body;

        const ad = await Ad.findById(id);
        if (!ad) return res.status(404).json({ error: "Ad not found" });

        // Update fields
        ad.sponsorName = sponsorName || ad.sponsorName;
        ad.country = country || ad.country;
        ad.startDate = startDate || ad.startDate;
        ad.endDate = endDate || ad.endDate;
        ad.link = link || ad.link;
        ad.impressionDays = impressionDays || ad.impressionDays;
        ad.status = status || ad.status;

        // Handle new image upload
        if (req.file) {
            // Delete old image from cloudinary
            if (ad.imagePublicId) {
                await cloudinary.uploader.destroy(ad.imagePublicId);
            }

            await validateDimensions(req.file.buffer);
            const uploadResult = await uploadToCloudinary(req.file.buffer);
            ad.imageUrl = uploadResult.secure_url;
            ad.imagePublicId = uploadResult.public_id;
        }

        await ad.save();
        res.status(200).json(ad);
    } catch (err) {
        console.error("Update Ad Error:", err);
        res.status(500).json({ error: err.message });
    }
};

// Delete Ad (NEW - tumhare frontend mein chahiye)
export const deleteAd = async (req, res) => {
    try {
        const { id } = req.params;

        const ad = await Ad.findById(id);
        if (!ad) return res.status(404).json({ error: "Ad not found" });

        // Delete image from cloudinary
        if (ad.imagePublicId) {
            await cloudinary.uploader.destroy(ad.imagePublicId);
        }

        await Ad.findByIdAndDelete(id);
        res.status(200).json({ message: "Ad deleted successfully" });
    } catch (err) {
        console.error("Delete Ad Error:", err);
        res.status(500).json({ error: err.message });
    }
};

// Update Status (already present but improved)
export const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["pending", "active", "inactive"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const ad = await Ad.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!ad) return res.status(404).json({ error: "Ad not found" });
        res.status(200).json(ad);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get only active ads
export const getActiveAds = async (req, res) => {
    try {
        // Find ads where status = "active"
        const activeAds = await Ad.find({ status: "active" })
            .select("sponsorName country link imageUrl startDate endDate owner");

        // If none found
        if (!activeAds.length) {
            return res.status(404).json({ message: "No active ads found" });
        }

        // Send response
        res.status(200).json(activeAds);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
