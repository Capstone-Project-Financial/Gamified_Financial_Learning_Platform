"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const userSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    age: Number,
    grade: String,
    school: String,
    knowledgeLevel: { type: String, default: 'Beginner' },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 1 },
    longestStreak: { type: Number, default: 1 },
    lastLogin: { type: Date, default: () => new Date() },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    loginOtp: { type: String, select: false },
    loginOtpExpires: { type: Date, select: false }
}, {
    timestamps: true,
    toJSON: {
        transform: (_doc, ret) => {
            const { password, ...rest } = ret;
            return rest;
        }
    }
});
userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    const salt = await bcryptjs_1.default.genSalt(10);
    this.password = await bcryptjs_1.default.hash(this.password, salt);
    next();
});
userSchema.methods.comparePassword = function (candidate) {
    return bcryptjs_1.default.compare(candidate, this.password);
};
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto_1.default.randomBytes(32).toString('hex');
    this.resetPasswordToken = crypto_1.default.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    return resetToken;
};
userSchema.methods.isResetTokenValid = function () {
    return this.resetPasswordExpires && this.resetPasswordExpires > new Date();
};
userSchema.methods.createLoginOtp = function () {
    const otp = String(Math.floor(1000000 + Math.random() * 9000000)); // 7-digit
    this.loginOtp = crypto_1.default.createHash('sha256').update(otp).digest('hex');
    this.loginOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    return otp;
};
exports.UserModel = (0, mongoose_1.model)('User', userSchema);
