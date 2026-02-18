"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshStocksController = exports.sellStockController = exports.buyStockController = exports.portfolioController = exports.listStocksController = void 0;
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const response_1 = __importDefault(require("../../utils/response"));
const achievements_service_1 = require("../achievements/achievements.service");
const stocks_service_1 = require("./stocks.service");
exports.listStocksController = (0, asyncHandler_1.default)(async (req, res) => {
    const stocks = await (0, stocks_service_1.listStocks)();
    return (0, response_1.default)(res, stocks);
});
exports.portfolioController = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_1.default(401, 'Authentication required');
    const portfolio = await (0, stocks_service_1.getPortfolio)(req.user.id);
    return (0, response_1.default)(res, portfolio);
});
exports.buyStockController = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_1.default(401, 'Authentication required');
    const { symbol } = req.params;
    const { shares } = req.body;
    const result = await (0, stocks_service_1.buyStock)(req.user.id, symbol, shares);
    await (0, achievements_service_1.evaluateAchievements)(req.user.id);
    return (0, response_1.default)(res, result, 'Stock purchased', 201);
});
exports.sellStockController = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_1.default(401, 'Authentication required');
    const { symbol } = req.params;
    const { shares } = req.body;
    const result = await (0, stocks_service_1.sellStock)(req.user.id, symbol, shares);
    await (0, achievements_service_1.evaluateAchievements)(req.user.id);
    return (0, response_1.default)(res, result, 'Stock sold');
});
exports.refreshStocksController = (0, asyncHandler_1.default)(async (_req, res) => {
    const stocks = await (0, stocks_service_1.refreshStockPrices)();
    return (0, response_1.default)(res, stocks, 'Stock prices refreshed');
});
