import express from 'express';
import {  changePassEmail, loginUser,  resetPassword,  signupUser, userVerifyByEmail, verifyOTP } from '../controllers/authController.js'
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/signup", upload.single("dpImage"), signupUser);
router.post('/login', loginUser);
router.post('/email_verification', userVerifyByEmail);
router.post('/reset_password_verification', changePassEmail);
router.post('/reset_password', resetPassword);
router.post("/verify", verifyOTP);

export default router