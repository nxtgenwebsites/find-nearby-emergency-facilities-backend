import userModel from '../models/userModel.js';
import bcrypt from "bcrypt";

export const getAllUsers = async (req, res) => {
    try {
        const { id } = req.params; // ID from URL

        // 🔹 Find the user making the request
        const user = await userModel.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // 🔒 Check admin role
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only admin can access.'
            });
        }

        // ✅ Fetch all users
        const users = await userModel.find().select('-password'); // password hide
        res.status(200).json({
            success: true,
            message: 'All users fetched successfully',
            total: users.length,
            data: users
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
  };

export const deleteUser = async (req, res) => {
    try {
        const { adminId } = req.params; // Admin ID from URL
        const { id } = req.body; // User ID to delete

        // Find admin
        const admin = await userModel.findById(adminId);
        if (!admin || admin.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only admin can delete users.",
            });
        }

        // Prevent deleting another admin or self
        const userToDelete = await userModel.findById(id);
        if (!userToDelete) {
            return res
                .status(404)
                .json({ success: false, message: "User not found." });
        }

        if (userToDelete.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin accounts cannot be deleted.",
            });
        }

        if (userToDelete._id.toString() === admin._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You cannot delete your own admin account.",
            });
        }

        // Delete user
        await userModel.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "User deleted successfully.",
        });
    } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

export const blockUser = async (req, res) => {
    try {
        const { adminId } = req.params; // admin id from URL
        const { id } = req.body; // user id to block from body

        // ✅ Check admin role
        const admin = await userModel.findById(adminId);
        if (!admin || admin.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only admin can block users.",
            });
        }

        // ✅ Find user to block
        const user = await userModel.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        // ✅ Prevent blocking an admin
        if (user.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin accounts cannot be blocked.",
            });
        }

        // ✅ Prevent admin blocking themselves (optional safety)
        if (user._id.toString() === admin._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You cannot block your own admin account.",
            });
        }

        // ✅ Block user
        user.isBlocked = true;
        await user.save();

        res.status(200).json({
            success: true,
            message: `${user.first_name} has been blocked successfully.`,
        });
    } catch (error) {
        console.error("Block user error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

export const unblockUser = async (req, res) => {
    try {
        const { adminId } = req.params; // admin id from URL
        const { id } = req.body; // user id to unblock from body

        // ✅ Check admin role
        const admin = await userModel.findById(adminId);
        if (!admin || admin.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only admin can unblock users.",
            });
        }

        // ✅ Find user to unblock
        const user = await userModel.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        // ✅ Prevent unblocking admin (not needed logically, but safe)
        if (user.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin accounts cannot be unblocked.",
            });
        }

        // ✅ Unblock user
        user.isBlocked = false;
        await user.save();

        res.status(200).json({
            success: true,
            message: `${user.first_name} has been unblocked successfully.`,
        });
    } catch (error) {
        console.error("Unblock user error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

export const addUser = async (req, res) => {
    try {
        const { adminId } = req.params; // Admin ID from URL
        const { first_name, last_name, email, password, role, status } = req.body;

        // 🔹 Check if admin exists and has admin role
        const admin = await userModel.findById(adminId);
        if (!admin || admin.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can add new users",
            });
        }

        // 🔹 Validate required fields
        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be provided",
            });
        }

        // 🔹 Check if user already exists
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists",
            });
        }

        // 🔹 Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 🔹 Create new user (Next of Kin removed)
        const newUser = new userModel({
            first_name,
            last_name,
            email,
            password: hashedPassword,
            role: role || "User", // Default role
            status: status || "Active", // Default status
        });

        await newUser.save();

        // ✅ Success response
        res.status(201).json({
            success: true,
            message: "User added successfully",
            user: {
                id: newUser._id,
                first_name: newUser.first_name,
                last_name: newUser.last_name,
                email: newUser.email,
                role: newUser.role,
                status: newUser.status,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const editUser = async (req, res) => {
    try {
        const { adminId, userId } = req.params; // admin id and user id
        const { first_name, last_name, email, password, role, status } = req.body;

        // 🔹 Check admin
        const admin = await userModel.findById(adminId);
        if (!admin || admin.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can edit users",
            });
        }

        // 🔹 Check if user exists
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // 🔹 Prepare update fields
        const updatedData = {};
        if (first_name) updatedData.first_name = first_name;
        if (last_name) updatedData.last_name = last_name;
        if (email) updatedData.email = email;
        if (role) updatedData.role = role;
        if (status) updatedData.status = status;

        // 🔹 If password provided, hash it
        if (password) {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            updatedData.password = hashedPassword;
        }

        // 🔹 Update user
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { $set: updatedData },
            { new: true }
        );

        // ✅ Success
        res.status(200).json({
            success: true,
            message: "User updated successfully",
            user: {
                id: updatedUser._id,
                first_name: updatedUser.first_name,
                last_name: updatedUser.last_name,
                email: updatedUser.email,
                role: updatedUser.role,
                status: updatedUser.status,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params; // User ID from URL

        // 🔹 Find user by ID and exclude password field
        const user = await userModel.findById(id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // ✅ Send user data
        res.status(200).json({
            success: true,
            message: 'User fetched successfully',
            data: user
        });

    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

export const updateNextOfKin = async (req, res) => {
    try {
        const { userId } = req.params;
        const {
            title,
            first_name,
            last_name,
            relationship,
            email,
            country,
            whatsapp_no,
        } = req.body;

        // Validate required fields
        if (!first_name || !last_name || !relationship || !email) {
            return res.status(400).json({ message: "Required fields are missing" });
        }

        // Find user
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update or add Next of Kin (since it's an array)
        if (user.next_of_kin && user.next_of_kin.length > 0) {
            // Replace first existing kin (you can adjust logic if you want multiple)
            user.next_of_kin[0] = {
                title,
                first_name,
                last_name,
                relationship,
                email,
                country,
                whatsapp_no,
            };
        } else {
            // Add new
            user.next_of_kin.push({
                title,
                first_name,
                last_name,
                relationship,
                email,
                country,
                whatsapp_no,
            });
        }

        await user.save();

        return res.status(200).json({
            message: "Next of Kin details updated successfully",
            next_of_kin: user.next_of_kin,
        });
    } catch (error) {
        console.error("Error updating next of kin:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateUserInfo = async (req, res) => {
    try {
        const { userId } = req.params;
        const { first_name, last_name, email } = req.body;

        // Validate required fields
        if (!first_name || !last_name || !email) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Find user
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update fields
        user.first_name = first_name;
        user.last_name = last_name;
        user.email = email;

        await user.save();

        return res.status(200).json({
            message: "User information updated successfully",
            user: {
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Error updating user info:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};