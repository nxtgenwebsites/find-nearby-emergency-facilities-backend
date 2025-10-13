import express from 'express';
import { deleteUser, blockUser, unblockUser, getAllUsers, addUser, editUser, getUserById, updateUserInfo, updateNextOfKin } from '../controllers/userController.js';

const router = express.Router();
//  get users
router.get('/get-users/:id', getAllUsers);

//  Delete user
router.delete('/delete/:adminId', deleteUser);

//  Block user
router.put('/block/:adminId', blockUser);

//  Unblock user
router.put('/unblock/:adminId', unblockUser);

// Admin add user
router.post("/add/:adminId", addUser);

// Admin edit user
router.put("/edit/:adminId/:userId", editUser);

// Get user by ID
router.get("/single-user/:id", getUserById);

router.put("/update-kin/:userId", updateNextOfKin);

router.put("/update-info/:userId", updateUserInfo);

export default router;
