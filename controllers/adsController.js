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

// 🔹 Activate an Ad by ID and notify the owner
export const activateAdById = async (req, res) => {
    try {
        const { id } = req.params;

        // 1️⃣ Find the ad by ID
        const ad = await Ad.findById(id);
        if (!ad) return res.status(404).json({ message: "Ad not found" });

        // 2️⃣ Update status to active
        ad.status = "active";
        await ad.save();

        // 3️⃣ Find the user by owner field
        const user = await userModel.findOne({ _id: ad.owner });
        if (!user || !user.email)
            return res.status(404).json({ message: "Owner or email not found" });

        // 4️⃣ Create email content
        const formattedDate = new Date(ad.createdAt).toLocaleDateString();
        const html = `
      <p>Hi ${user.first_name || "there"},</p>
      <p>Good news — your ad submitted for approval on <b>${formattedDate}</b> has been successfully approved and is now live on our website! 🎊</p>
      <p>You can view your published ad here: <a href="https://find-nearby-emergency-facilities.vercel.app/" target="_blank">https://find-nearby-emergency-facilities.vercel.app/</a></p>
      <p>Thank you for choosing <b>HealthCentreApp</b> to promote your listing. We’re excited to help you reach more potential buyers and get the visibility your ad deserves.</p>
      <br/>
      <p>Best regards,<br/>
      <b>HealthCentreApp Team</b><br/>
      <a href="https://healthcentreapp.com">healthcentreapp.com</a><br/>
      info@healthcentreapp.com</p>
    `;

        // 5️⃣ Send the email
        await sendEmail(
            user.email,
            "🎉 Your Ad Has Been Approved and Is Now Live!",
            html
        );

        res.status(200).json({
            message: "Ad activated and email sent successfully.",
            ad,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


export const sendCustomEmail = async (req, res) => {
    try {
        const { to, subject, body, cost } = req.body;

        if (!to || !subject || !body || !cost) {
            return res.status(400).json({ message: "All fields are required." });
        }

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

        console.log("✅ Custom email sent to:", to);
        res.status(200).json({ message: "Email sent successfully." });
    } catch (error) {
        console.error("❌ Email send failed:", error);
        res.status(500).json({ message: "Failed to send email.", error: error.message });
    }
  };