
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Register
router.post('/register', authController.register);

// Login
router.post('/login', authController.login);

// Password reset by email OTP
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPasswordWithOtp);

// Get logged-in user
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
