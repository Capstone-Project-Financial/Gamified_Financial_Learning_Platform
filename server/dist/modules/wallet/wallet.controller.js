"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setExpenses = exports.payout = exports.deductDiscretionaryFunds = exports.addDiscretionaryFunds = exports.earnLucre = exports.getWalletSummary = void 0;
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const response_1 = __importDefault(require("../../utils/response"));
const wallet_service_1 = require("./wallet.service");
exports.getWalletSummary = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_1.default(401, 'Authentication required');
    const wallet = await (0, wallet_service_1.getWallet)(req.user.id);
    const transactions = await (0, wallet_service_1.getTransactions)(wallet.id.toString());
    return (0, response_1.default)(res, { wallet, transactions });
});
exports.earnLucre = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_1.default(401, 'Authentication required');
    const wallet = await (0, wallet_service_1.addLucre)(req.user.id, req.body.amount, req.body.description);
    return (0, response_1.default)(res, wallet, 'Lucre updated', 201);
});
exports.addDiscretionaryFunds = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_1.default(401, 'Authentication required');
    const wallet = await (0, wallet_service_1.addDiscretionary)(req.user.id, req.body.amount, req.body.description);
    return (0, response_1.default)(res, wallet, 'Balance updated');
});
exports.deductDiscretionaryFunds = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_1.default(401, 'Authentication required');
    const wallet = await (0, wallet_service_1.deductDiscretionary)(req.user.id, req.body.amount, req.body.description);
    return (0, response_1.default)(res, wallet, 'Expense recorded');
});
exports.payout = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_1.default(401, 'Authentication required');
    const wallet = await (0, wallet_service_1.processPayout)(req.user.id);
    return (0, response_1.default)(res, wallet, 'Payout processed');
});
exports.setExpenses = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_1.default(401, 'Authentication required');
    const wallet = await (0, wallet_service_1.updateExpenses)(req.user.id, req.body);
    return (0, response_1.default)(res, wallet, 'Expenses updated');
});
