"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recalcAchievements = exports.listAchievements = void 0;
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const response_1 = __importDefault(require("../../utils/response"));
const achievements_service_1 = require("./achievements.service");
exports.listAchievements = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_1.default(401, 'Authentication required');
    const achievements = await (0, achievements_service_1.getAchievements)(req.user.id);
    return (0, response_1.default)(res, achievements);
});
exports.recalcAchievements = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_1.default(401, 'Authentication required');
    const achievements = await (0, achievements_service_1.evaluateAchievements)(req.user.id);
    return (0, response_1.default)(res, achievements, 'Achievements refreshed');
});
