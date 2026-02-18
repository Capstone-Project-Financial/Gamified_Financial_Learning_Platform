"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyStandingController = exports.getLeaderboardController = void 0;
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const response_1 = __importDefault(require("../../utils/response"));
const leaderboard_service_1 = require("./leaderboard.service");
exports.getLeaderboardController = (0, asyncHandler_1.default)(async (req, res) => {
    const limit = parseInt(req.query.limit ?? '20', 10);
    const data = await (0, leaderboard_service_1.getLeaderboard)(Math.min(Math.max(limit, 5), 50));
    return (0, response_1.default)(res, data);
});
exports.getMyStandingController = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_1.default(401, 'Authentication required');
    const standing = await (0, leaderboard_service_1.getUserStanding)(req.user.id);
    return (0, response_1.default)(res, standing);
});
