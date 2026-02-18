"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendOtpSchema = exports.verifyOtpSchema = exports.changePasswordSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.xpSchema = exports.updateProfileSchema = exports.loginSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
/* ── Password must have: 8+ chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char ── */
const passwordSchema = zod_1.z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');
exports.signupSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, 'Name is required')
        .max(50, 'Name must not exceed 50 characters')
        .trim(),
    email: zod_1.z
        .string()
        .email('Invalid email address')
        .max(100, 'Email must not exceed 100 characters')
        .trim()
        .toLowerCase(),
    password: passwordSchema,
    age: zod_1.z.coerce.number().min(5, 'Age must be at least 5').max(25, 'Age must be at most 25').optional(),
    grade: zod_1.z.string().max(20).optional(),
    school: zod_1.z.string().max(100).optional()
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .email('Invalid email address')
        .trim()
        .toLowerCase(),
    password: zod_1.z.string().min(1, 'Password is required')
});
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(50).trim().optional(),
    age: zod_1.z.coerce.number().min(5).max(25).optional(),
    grade: zod_1.z.string().max(20).optional(),
    school: zod_1.z.string().max(100).optional(),
    knowledgeLevel: zod_1.z.string().optional()
});
exports.xpSchema = zod_1.z.object({
    amount: zod_1.z.coerce.number().min(1).max(1000)
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address')
});
exports.resetPasswordSchema = zod_1.z.object({
    password: passwordSchema
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema
});
exports.verifyOtpSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address').trim().toLowerCase(),
    otp: zod_1.z.string().length(7, 'OTP must be exactly 7 digits').regex(/^\d{7}$/, 'OTP must contain only digits'),
    flow: zod_1.z.enum(['login', 'signup'])
});
exports.resendOtpSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address').trim().toLowerCase(),
    flow: zod_1.z.enum(['login', 'signup']),
    password: zod_1.z.string().optional()
});
