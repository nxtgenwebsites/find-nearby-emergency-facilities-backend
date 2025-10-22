import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js'
import nodemailer from 'nodemailer'
import otpModel from "../models/otpModel.js";

export const signupUser = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            password,
            next_of_kin
        } = req.body;

        // Required fields validation
        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({ message: "All required fields must be provided" });
        }

        // Check if user exists
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const newUser = new userModel({
            first_name,
            last_name,
            email,
            password: hashedPassword,
            next_of_kin: Array.isArray(next_of_kin) ? next_of_kin : (next_of_kin ? [next_of_kin] : [])
        });

        await newUser.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser._id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );

        res.status(201).json({
            message: "User signed up successfully",
            user: {
                id: newUser._id,
                first_name: newUser.first_name,
                last_name: newUser.last_name,
                email: newUser.email,
                next_of_kin: newUser.next_of_kin
            },
            token
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const user = await userModel.findOne({
            $or: [{ email: email }, { username: email }]
        });

        if (!user) {
            return res.status(400).json({ message: "User not found." });
        }

        if (user.isBlocked) {
            return res.status(403).json({ message: "Your account is banned by the admin." });
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Wrong password." });
        }


        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '30d' } // Token valid for 30 days
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isActive: user.isActive,
                role: user.role,
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export const userVerifyByEmail = async (req, res) => {
    try {
        const { email, username } = req.body;

        if (!email || !username) {
            return res.status(400).json({ message: "Email and username are required" });
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

        // Delete old OTPs for this email
        await otpModel.deleteMany({ email });

        // Hash OTP before saving
        const saltRounds = 10;
        const hashedOTP = await bcrypt.hash(otp, saltRounds);

        // Save hashed OTP in DB
        await otpModel.create({
            email,
            otp: hashedOTP,
            expiresAt,
        });

        // Email setup
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.email,
                pass: process.env.emailPass, 
            },
        });

        // Send email
        await transporter.sendMail({
            from: "Health Monitor <healthcentreapp@gmail.com>",
            to: email,
            subject: "OTP Verification - Health Monitor",
            html: `
                <p>Dear <b>${username}</b>,</p>
                <p>Your OTP for verifying your account is:</p>
                <h2 style="color:#0b6fc0;">${otp}</h2>
                <p>This OTP will expire in <b>1 hour</b>.</p>
                <p>If you did not request this, please ignore this email.</p>
                <br/>
                <p>Best regards,<br><b>Health Monitor Team</b></p>
            `
        });

        res.status(200).json({ message: "OTP sent successfully!" });

    } catch (error) {
        console.error("OTP sending error:", error);
        res.status(500).json({ error: "Failed to send OTP" });
    }
};

export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        // Find OTP record for this email
        const otpRecord = await otpModel.findOne({ email });
        if (!otpRecord) {
            return res.status(400).json({ message: "OTP not found or expired" });
        }

        // Check expiry
        if (otpRecord.expiresAt < new Date()) {
            await otpModel.deleteMany({ email });
            return res.status(400).json({ message: "OTP expired" });
        }

        // Compare OTP
        const isMatch = await bcrypt.compare(otp, otpRecord.otp);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // ✅ OTP verified → activate user account
        await userModel.updateOne({ email }, { $set: { isActive: true } });

        // Delete OTP records for this email
        await otpModel.deleteMany({ email });

        res.status(200).json({ message: "OTP verified successfully! Account activated." });

    } catch (error) {
        console.error("OTP verification error:", error);
        res.status(500).json({ error: "Failed to verify OTP" });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { id, password } = req.body;

        // Validate input
        if (!id || !password) {
            return res.status(400).json({ message: "User ID and new password are required." });
        }

        // Find user
        const user = await userModel.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user's password
        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({ message: "Password reset successfully." });
    } catch (error) {
        console.error("Error resetting password:", error);
        return res.status(500).json({ message: "Server error. Please try again later." });
    }
};

export const changePassEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Find user by email
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const username = user.first_name || "User";

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

        // Delete old OTPs for this email
        await otpModel.deleteMany({ email });

        // Hash OTP before saving
        const saltRounds = 10;
        const hashedOTP = await bcrypt.hash(otp, saltRounds);

        // Save hashed OTP in DB
        await otpModel.create({
            email,
            otp: hashedOTP,
            expiresAt,
        });

        // Email setup
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.email,
                pass: process.env.emailPass,
            },
        });

        // Send email
        await transporter.sendMail({
            from: "Health Monitor <healthcentreapp@gmail.com>",
            to: email,
            subject: "OTP Verification - Health Monitor",
            html: `
                <p>Dear <b>${username}</b>,</p>
                <p>Your OTP for verifying your account is:</p>
                <h2 style="color:#0b6fc0;">${otp}</h2>
                <p>This OTP will expire in <b>1 hour</b>.</p>
                <p>If you did not request this, please ignore this email.</p>
                <br/>
                <p>Best regards,<br><b>Health Monitor Team</b></p>
            `
        });

        res.status(200).json({
            message: "OTP sent successfully!",
            user: {
                id: user._id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
            }
        });

    } catch (error) {
        console.error("OTP sending error:", error);
        res.status(500).json({ error: "Failed to send OTP" });
    }
};
