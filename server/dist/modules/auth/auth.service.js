"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addXpToUser = exports.updateLoginStreak = exports.ensureUserCompanions = exports.sanitizeUser = exports.signToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dayjs_1 = __importDefault(require("dayjs"));
const env_1 = require("../../config/env");
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const gamification_1 = require("../../utils/gamification");
const User_1 = require("../../models/User");
const Wallet_1 = require("../../models/Wallet");
const Progress_1 = require("../../models/Progress");
const achievements_1 = require("../../data/achievements");
const signToken = (userId) => {
    const payload = { sub: userId };
    const secret = env_1.env.JWT_SECRET;
    const options = { expiresIn: env_1.env.JWT_EXPIRES_IN };
    return jsonwebtoken_1.default.sign(payload, secret, options);
};
exports.signToken = signToken;
const sanitizeUser = (user) => {
    const { password, ...rest } = user.toObject();
    return rest;
};
exports.sanitizeUser = sanitizeUser;
const ensureUserCompanions = async (userId) => {
    await Promise.all([
        Wallet_1.WalletModel.findOneAndUpdate({ user: userId }, {}, {
            upsert: true,
            setDefaultsOnInsert: true,
            new: true
        }),
        Progress_1.ProgressModel.findOneAndUpdate({ user: userId }, {
            $setOnInsert: {
                achievements: (0, achievements_1.buildAchievementState)()
            }
        }, {
            upsert: true,
            setDefaultsOnInsert: true,
            new: true
        })
    ]);
};
exports.ensureUserCompanions = ensureUserCompanions;
const updateLoginStreak = (user) => {
    const lastLogin = (0, dayjs_1.default)(user.lastLogin);
    const today = (0, dayjs_1.default)();
    const diff = today.startOf('day').diff(lastLogin.startOf('day'), 'day');
    if (diff === 1) {
        user.currentStreak += 1;
        user.longestStreak = Math.max(user.longestStreak, user.currentStreak);
    }
    else if (diff > 1) {
        user.currentStreak = 1;
    }
    user.lastLogin = new Date();
};
exports.updateLoginStreak = updateLoginStreak;
const addXpToUser = async (userId, amount) => {
    const user = await User_1.UserModel.findById(userId);
    if (!user) {
        throw new ApiError_1.default(404, 'User not found');
    }
    const newXp = user.xp + amount;
    user.xp = newXp;
    user.level = (0, gamification_1.calculateLevel)(newXp);
    await user.save();
    return (0, exports.sanitizeUser)(user);
};
exports.addXpToUser = addXpToUser;
