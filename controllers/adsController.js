import Ad from "../models/adsModel.js";
import cloudinary from "../config/cloudinary.js";
import userModel from "../models/userModel.js";
import { validateDimensions } from "../middleware/uploadValidator.js";
import nodemailer from "nodemailer";

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
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: "Owner ID is required" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "Image is required" });
        }

        await validateDimensions(req.file.buffer);
        const uploadResult = await uploadToCloudinary(req.file.buffer);

        const { sponsorName, country, startDate, endDate, link, impressionDays, cost } = req.body;

        if (!sponsorName || !country || !startDate || !endDate || !link || !cost) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // 1️⃣ Create the ad
        const ad = new Ad({
            owner: id,
            sponsorName,
            country,
            startDate,
            endDate,
            link,
            impressionDays: impressionDays || 0,
            cost,
            status: "pending",
            imageUrl: uploadResult.secure_url,
            imagePublicId: uploadResult.public_id,
        });

        await ad.save();

        // 2️⃣ Find the user
        const user = await userModel.findById(id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // 3️⃣ Push notification inside user's notifications array
        user.notifications.push({
            message: `Your ad "${sponsorName}" has been successfully posted.`,
            type: "ad",
        });

        await user.save();

        // 4️⃣ Response
        res.status(201).json({
            success: true,
            message: "Ad created successfully and notification added.",
            ad,
        });

    } catch (err) {
        console.error("Create Ad Error:", err);
        res.status(500).json({ error: err.message });
    }
};

export const getAds = async (req, res) => {
    try {
        const id = req.params.id; // ✅ Get user ID from params

        // ✅ Find user from DB
        const user = await userModel.findById(id);

        // ❌ If user not found
        if (!id) {
            return res.status(404).json({ error: "User not found" });
        }

        // ✅ Check if admin
        if (user.role !== "admin") {
            return res.status(403).json({ error: "Access denied. Admins only." });
        }

        // ✅ Fetch all ads if admin
        const ads = await Ad.find().sort({ createdAt: -1 });
        res.status(200).json(ads);

    } catch (err) {
        console.error("Error in getAds:", err);
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

// Update Ad (status ignore kare
export const updateAd = async (req, res) => {
    try {
        const { id } = req.params;
        const { sponsorName, country, startDate, endDate, link, impressionDays, cost } = req.body;

        // 1️⃣ Find ad by ID
        const ad = await Ad.findById(id);
        if (!ad) return res.status(404).json({ error: "Ad not found" });

        // 2️⃣ Update allowed fields (status ignore)
        ad.sponsorName = sponsorName || ad.sponsorName;
        ad.country = country || ad.country;
        ad.startDate = startDate || ad.startDate;
        ad.endDate = endDate || ad.endDate;
        ad.link = link || ad.link;
        ad.impressionDays = impressionDays || ad.impressionDays;
        if (cost !== undefined) ad.cost = cost; // cost string hi rakho

        // 3️⃣ Handle new image upload (if provided)
        if (req.file) {
            if (ad.imagePublicId) {
                await cloudinary.uploader.destroy(ad.imagePublicId);
            }

            await validateDimensions(req.file.buffer);
            const uploadResult = await uploadToCloudinary(req.file.buffer);
            ad.imageUrl = uploadResult.secure_url;
            ad.imagePublicId = uploadResult.public_id;
        }

        // 4️⃣ Save ad updates
        await ad.save();

        // 5️⃣ Find ad owner and push notification
        const user = await userModel.findById(ad.owner);
        if (user) {
            user.notifications.push({
                message: `Your ad "${ad.sponsorName}" has been updated successfully. ✅`,
                type: "ad-update",
                date: new Date(),
            });
            await user.save();
        }

        // 6️⃣ Response
        res.status(200).json({ message: "Ad updated & notification sent", ad });
    } catch (err) {
        console.error("Update Ad Error:", err);
        res.status(500).json({ error: err.message });
    }
};

// Delete Ad (Updated: also send notification to owner)
export const deleteAd = async (req, res) => {
    try {
        const { id } = req.params;

        // 1️⃣ Find the ad first
        const ad = await Ad.findById(id);
        if (!ad) return res.status(404).json({ error: "Ad not found" });

        // 2️⃣ Find the owner user using ad.owner (assuming Ad has owner field)
        const user = await userModel.findById(ad.owner);
        if (!user) return res.status(404).json({ error: "Owner not found" });

        // 3️⃣ Push notification to owner
        user.notifications.push({
            message: `Your ad "${ad.sponsorName}" has been deleted.`,
            type: "ad-delete",
            date: new Date(),
        });

        await user.save();

        // 4️⃣ Delete image from Cloudinary (if exists)
        if (ad.imagePublicId) {
            await cloudinary.uploader.destroy(ad.imagePublicId);
        }

        // 5️⃣ Delete ad from DB
        await Ad.findByIdAndDelete(id);

        res.status(200).json({ message: "Ad deleted and notification sent to owner" });
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
        const today = new Date();

        // Find ads that are active and within date range
        const activeAds = await Ad.find({
            status: "active",
            startDate: { $lte: today },
            endDate: { $gte: today }
        }).select("sponsorName country link imageUrl startDate endDate owner");

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

const sendEmail = async (to, subject, html) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail", // or use custom SMTP settings
            auth: {
                user: process.env.email, // e.g. info@healthcentreapp.com
                pass: process.env.emailPass,
            },
        });

        await transporter.sendMail({
            from: `"HealthCentreApp" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });

        console.log("✅ Email sent to:", to);
    } catch (error) {
        console.error("❌ Email send failed:", error.message);
    }
};

// Activate an Ad by ID — Send Email + Push Notification
export const activateAdById = async (req, res) => {
    try {
        const { id } = req.params;

        // 1️⃣ Find the ad by ID
        const ad = await Ad.findById(id);
        if (!ad) return res.status(404).json({ message: "Ad not found" });

        // 2️⃣ Update ad status to active
        ad.status = "active";
        await ad.save();

        // 3️⃣ Find the owner user
        const user = await userModel.findOne({ _id: ad.owner });
        if (!user || !user.email)
            return res.status(404).json({ message: "Owner or email not found" });

        // 4️⃣ Create email content
        const formattedDate = new Date(ad.createdAt).toLocaleDateString();
        const html = `
        <p>Hi ${user.first_name || "there"},</p>
        <p>Good news — your ad submitted for approval on <b>${formattedDate}</b> has been successfully approved and is now live on our website! 🎊</p>
        <p>You can view your published ad here: 
        <a href="https://find-nearby-emergency-facilities.vercel.app/" target="_blank">
        https://find-nearby-emergency-facilities.vercel.app/
        </a></p>
        <p>Thank you for choosing <b>HealthCentreApp</b> to promote your listing. 
        We’re excited to help you reach more potential buyers and get the visibility your ad deserves.</p>
        <br/>
        <p>Best regards,<br/>
        <b>HealthCentreApp Team</b><br/>
        <a href="https://healthcentreapp.com">healthcentreapp.com</a><br/>
        info@healthcentreapp.com</p>
        `;

        // 5️⃣ Send email notification
        await sendEmail(
            user.email,
            "🎉 Your Ad Has Been Approved and Is Now Live!",
            html
        );

        // 6️⃣ Push in-app notification
        user.notifications.push({
            message: `Your ad has been approved and is now live! 🎉`,
            type: "ad-activate",
            date: new Date(),
        });
        await user.save();

        res.status(200).json({
            message: "Ad activated, email + in-app notification sent successfully.",
            ad,
        });
    } catch (error) {
        console.error("Activate Ad Error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const sendCustomEmail = async (req, res) => {
    try {
        const { to, subject, body, cost, adId } = req.body;

        if (!to || !subject || !body || !cost || !adId) {
            return res.status(400).json({ message: "All fields are required (to, subject, body, cost, adId)." });
        }

        // 🔹 Send email
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.email,
                pass: process.env.emailPass,
            },
        });

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <p>${body}</p>
                <p><b>Ad Cost:</b> ${cost}</p>
                <hr/>
                <p style="font-size: 13px; color: #666;">
                    Sent by <b>HealthCentreApp Team</b><br/>
                    <a href="https://healthcentreapp.com">healthcentreapp.com</a>
                </p>
            </div>
        `;

        await transporter.sendMail({
            from: `"HealthCentreApp" <${process.env.email}>`,
            to,
            subject,
            html: htmlContent,
        });

        // 🔹 Update cost in Ads collection
        const updatedAd = await Ad.findByIdAndUpdate(
            adId,
            { cost },
            { new: true }
        );

        if (!updatedAd) {
            return res.status(404).json({ message: "Ad not found, email sent but cost not saved." });
        }

        res.status(200).json({
            message: "Email sent successfully and cost updated in database.",
            ad: updatedAd
        });
    } catch (error) {
        console.error("❌ Email send failed:", error);
        res.status(500).json({ message: "Failed to send email.", error: error.message });
    }
};