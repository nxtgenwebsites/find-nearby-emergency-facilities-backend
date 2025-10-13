import express from 'express';
import {  loginUser,  signupUser, userVerifyByEmail, verifyOTP } from '../controllers/authController.js'

const router = express.Router();

router.post('/sign_up', signupUser);
router.post('/login', loginUser);
router.post('/email_verification', userVerifyByEmail);
// router.post('/forgot_password', forgotPassword);
// router.post('/reset_password', resetPassword);
router.post("/verify", verifyOTP);

export default router