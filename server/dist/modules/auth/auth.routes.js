"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const validate_1 = __importDefault(require("../../middleware/validate"));
const auth_1 = require("../../middleware/auth");
const env_1 = require("../../config/env");
const auth_service_1 = require("./auth.service");
const auth_schema_1 = require("./auth.schema");
const auth_controller_1 = require("./auth.controller");
const router = (0, express_1.Router)();
router.post('/signup', (0, validate_1.default)(auth_schema_1.signupSchema), auth_controller_1.signup);
router.post('/login', (0, validate_1.default)(auth_schema_1.loginSchema), auth_controller_1.login);
router.post('/verify-otp', (0, validate_1.default)(auth_schema_1.verifyOtpSchema), auth_controller_1.verifyOtp);
router.post('/resend-otp', (0, validate_1.default)(auth_schema_1.resendOtpSchema), auth_controller_1.resendOtp);
router.get('/me', auth_1.authenticate, auth_controller_1.getProfile);
router.post('/logout', auth_1.authenticate, auth_controller_1.logout);
router.patch('/me', auth_1.authenticate, (0, validate_1.default)(auth_schema_1.updateProfileSchema), auth_controller_1.updateProfile);
router.post('/xp', auth_1.authenticate, (0, validate_1.default)(auth_schema_1.xpSchema), auth_controller_1.addXp);
router.post('/forgot-password', (0, validate_1.default)(auth_schema_1.forgotPasswordSchema), auth_controller_1.forgotPassword);
router.post('/reset-password/:token', (0, validate_1.default)(auth_schema_1.resetPasswordSchema), auth_controller_1.resetPassword);
router.post('/change-password', auth_1.authenticate, (0, validate_1.default)(auth_schema_1.changePasswordSchema), auth_controller_1.changePassword);
/* ── Google OAuth ── */
router.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport_1.default.authenticate('google', { session: false, failureRedirect: '/login' }), (req, res) => {
    const user = req.user;
    if (!user) {
        const clientUrl = env_1.env.CLIENT_URL || 'http://localhost:5173';
        return res.redirect(`${clientUrl}/login?error=oauth_failed`);
    }
    const token = (0, auth_service_1.signToken)(user.id);
    const clientUrl = env_1.env.CLIENT_URL || 'http://localhost:5173';
    return res.redirect(`${clientUrl}/oauth/callback?token=${token}`);
});
exports.default = router;
