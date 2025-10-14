import express from 'express';
import {  loginUser,  resetPassword,  signupUser, userVerifyByEmail, verifyOTP } from '../controllers/authController.js'

const router = express.Router();

router.post('/sign_up', signupUser);
router.post('/login', loginUser);
router.post('/email_verification', userVerifyByEmail);
router.post('/reset_password', resetPassword);
router.post("/verify", verifyOTP);

export default router