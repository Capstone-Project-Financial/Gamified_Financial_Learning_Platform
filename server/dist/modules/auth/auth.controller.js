"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.addXp = exports.updateProfile = exports.logout = exports.getProfile = exports.resendOtp = exports.verifyOtp = exports.login = exports.signup = void 0;
const crypto_1 = __importDefault(require("crypto"));
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const response_1 = __importDefault(require("../../utils/response"));
const User_1 = require("../../models/User");
const auth_service_1 = require("./auth.service");
const email_service_1 = require("../../utils/email.service");
const pendingSignups = new Map();
// Clean up expired entries periodically
setInterval(() => {
    const now = new Date();
    for (const [email, entry] of pendingSignups.entries()) {
        if (entry.expires < now)
            pendingSignups.delete(email);
    }
}, 5 * 60 * 1000); // every 5 minutes
/* ── Helpers ── */
const generateOtp = () => {
    const otp = String(Math.floor(1000000 + Math.random() * 9000000)); // 7-digit
    const hashedOtp = crypto_1.default.createHash('sha256').update(otp).digest('hex');
    return { otp, hashedOtp };
};
/* ── Controllers ── */
exports.signup = (0, asyncHandler_1.default)(async (req, res) => {
    const { name, email, password, age, grade, school } = req.body;
    const existing = await User_1.UserModel.findOne({ email: email.toLowerCase() });
    if (existing) {
        throw new ApiError_1.default(409, 'Email already in use');
    }
    const { otp, hashedOtp } = generateOtp();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    pendingSignups.set(email.toLowerCase(), {
        userData: { name, email: email.toLowerCase(), password, age, grade, school },
        hashedOtp,
        expires
    });
    await (0, email_service_1.sendOtpEmail)(email, otp, name, 'signup');
    return (0, response_1.default)(res, { requiresOtp: true, flow: 'signup' }, 'Verification code sent to your email', 200);
});
exports.login = (0, asyncHandler_1.default)(async (req, res) => {
    const user = await User_1.UserModel.findOne({ email: req.body.email.toLowerCase() }).select('+password +loginOtp +loginOtpExpires');
    if (!user) {
        throw new ApiError_1.default(401, 'Invalid credentials');
    }
    const isValid = await user.comparePassword(req.body.password);
    if (!isValid) {
        throw new ApiError_1.default(401, 'Invalid credentials');
    }
    const otp = user.createLoginOtp();
    await user.save({ validateBeforeSave: false });
    await (0, email_service_1.sendOtpEmail)(user.email, otp, user.name, 'login');
    return (0, response_1.default)(res, { requiresOtp: true, flow: 'login' }, 'Verification code sent to your email', 200);
});
exports.verifyOtp = (0, asyncHandler_1.default)(async (req, res) => {
    const { email, otp, flow } = req.body;
    const hashedOtp = crypto_1.default.createHash('sha256').update(otp).digest('hex');
    if (flow === 'signup') {
        const pending = pendingSignups.get(email.toLowerCase());
        if (!pending) {
            throw new ApiError_1.default(400, 'No pending signup found. Please sign up again.');
        }
        if (pending.expires < new Date()) {
            pendingSignups.delete(email.toLowerCase());
            throw new ApiError_1.default(400, 'Verification code has expired. Please sign up again.');
        }
        if (pending.hashedOtp !== hashedOtp) {
            throw new ApiError_1.default(400, 'Invalid verification code');
        }
        // Create the user account
        const user = await User_1.UserModel.create(pending.userData);
        pendingSignups.delete(email.toLowerCase());
        await (0, auth_service_1.ensureUserCompanions)(user.id);
        const token = (0, auth_service_1.signToken)(user.id);
        return (0, response_1.default)(res, { token, user: (0, auth_service_1.sanitizeUser)(user) }, 'Account created successfully', 201);
    }
    // flow === 'login'
    const user = await User_1.UserModel.findOne({ email: email.toLowerCase() }).select('+loginOtp +loginOtpExpires');
    if (!user) {
        throw new ApiError_1.default(400, 'Invalid or expired verification code');
    }
    if (!user.loginOtp || !user.loginOtpExpires || user.loginOtpExpires < new Date()) {
        throw new ApiError_1.default(400, 'Verification code has expired. Please log in again.');
    }
    if (user.loginOtp !== hashedOtp) {
        throw new ApiError_1.default(400, 'Invalid verification code');
    }
    // Clear OTP and complete login
    user.loginOtp = undefined;
    user.loginOtpExpires = undefined;
    (0, auth_service_1.updateLoginStreak)(user);
    await user.save({ validateBeforeSave: false });
    await (0, auth_service_1.ensureUserCompanions)(user.id);
    const token = (0, auth_service_1.signToken)(user.id);
    return (0, response_1.default)(res, { token, user: (0, auth_service_1.sanitizeUser)(user) }, 'Login successful');
});
exports.resendOtp = (0, asyncHandler_1.default)(async (req, res) => {
    const { email, flow, password } = req.body;
    if (flow === 'signup') {
        const pending = pendingSignups.get(email.toLowerCase());
        if (!pending) {
            throw new ApiError_1.default(400, 'No pending signup found. Please sign up again.');
        }
        const { otp, hashedOtp } = generateOtp();
        pending.hashedOtp = hashedOtp;
        pending.expires = new Date(Date.now() + 10 * 60 * 1000);
        await (0, email_service_1.sendOtpEmail)(email, otp, pending.userData.name, 'signup');
        return (0, response_1.default)(res, { ok: true }, 'New verification code sent');
    }
    // flow === 'login' — re-validate password before resending
    if (!password) {
        throw new ApiError_1.default(400, 'Password is required to resend login OTP');
    }
    const user = await User_1.UserModel.findOne({ email: email.toLowerCase() }).select('+password +loginOtp +loginOtpExpires');
    if (!user) {
        throw new ApiError_1.default(401, 'Invalid credentials');
    }
    const isValid = await user.comparePassword(password);
    if (!isValid) {
        throw new ApiError_1.default(401, 'Invalid credentials');
    }
    const otp = user.createLoginOtp();
    await user.save({ validateBeforeSave: false });
    await (0, email_service_1.sendOtpEmail)(user.email, otp, user.name, 'login');
    return (0, response_1.default)(res, { ok: true }, 'New verification code sent');
});
exports.getProfile = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user) {
        throw new ApiError_1.default(401, 'Authentication required');
    }
    const freshUser = await User_1.UserModel.findById(req.user.id);
    if (!freshUser) {
        throw new ApiError_1.default(404, 'User not found');
    }
    return (0, response_1.default)(res, (0, auth_service_1.sanitizeUser)(freshUser));
});
exports.logout = (0, asyncHandler_1.default)(async (_req, res) => {
    return (0, response_1.default)(res, { ok: true }, 'Logged out');
});
exports.updateProfile = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user) {
        throw new ApiError_1.default(401, 'Authentication required');
    }
    const updated = await User_1.UserModel.findByIdAndUpdate(req.user.id, req.body, { new: true });
    if (!updated) {
        throw new ApiError_1.default(404, 'User not found');
    }
    return (0, response_1.default)(res, (0, auth_service_1.sanitizeUser)(updated), 'Profile updated');
});
exports.addXp = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user) {
        throw new ApiError_1.default(401, 'Authentication required');
    }
    const user = await (0, auth_service_1.addXpToUser)(req.user.id, req.body.amount);
    return (0, response_1.default)(res, user, 'XP updated');
});
exports.forgotPassword = (0, asyncHandler_1.default)(async (req, res) => {
    const user = await User_1.UserModel.findOne({ email: req.body.email.toLowerCase() });
    // Always return success to prevent email enumeration
    if (!user) {
        return (0, response_1.default)(res, { ok: true }, 'If that email exists, a reset link has been sent');
    }
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    try {
        await (0, email_service_1.sendPasswordResetEmail)(user.email, resetToken, user.name);
        return (0, response_1.default)(res, { ok: true }, 'Password reset email sent');
    }
    catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save({ validateBeforeSave: false });
        throw new ApiError_1.default(500, 'Error sending email. Please try again later.');
    }
});
exports.resetPassword = (0, asyncHandler_1.default)(async (req, res) => {
    const hashedToken = crypto_1.default.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User_1.UserModel.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: new Date() }
    }).select('+resetPasswordToken +resetPasswordExpires');
    if (!user) {
        throw new ApiError_1.default(400, 'Invalid or expired reset token');
    }
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    return (0, response_1.default)(res, { ok: true }, 'Password reset successful');
});
exports.changePassword = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user) {
        throw new ApiError_1.default(401, 'Authentication required');
    }
    const user = await User_1.UserModel.findById(req.user.id).select('+password');
    if (!user) {
        throw new ApiError_1.default(404, 'User not found');
    }
    const isValid = await user.comparePassword(req.body.currentPassword);
    if (!isValid) {
        throw new ApiError_1.default(401, 'Current password is incorrect');
    }
    user.password = req.body.newPassword;
    await user.save();
    return (0, response_1.default)(res, { ok: true }, 'Password changed successfully');
});
