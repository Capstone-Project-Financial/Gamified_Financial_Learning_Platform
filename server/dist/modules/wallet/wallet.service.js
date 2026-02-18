"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateExpenses = exports.processPayout = exports.deductDiscretionary = exports.addDiscretionary = exports.addLucre = exports.getTransactions = exports.getWallet = void 0;
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const Wallet_1 = require("../../models/Wallet");
const getWallet = async (userId) => {
    const wallet = (await Wallet_1.WalletModel.findOne({ user: userId })) ||
        (await Wallet_1.WalletModel.create({
            user: userId
        }));
    return wallet;
};
exports.getWallet = getWallet;
const getTransactions = async (walletId, limit = 50) => {
    return Wallet_1.TransactionModel.find({ wallet: walletId }).sort({ createdAt: -1 }).limit(limit);
};
exports.getTransactions = getTransactions;
const recordTransaction = async (walletId, type, description, amount, balanceAfter) => {
    await Wallet_1.TransactionModel.create({
        wallet: walletId,
        type,
        description,
        amount,
        balanceAfter
    });
};
const addLucre = async (userId, amount, description) => {
    const wallet = await (0, exports.getWallet)(userId);
    wallet.lucreBalance += amount;
    wallet.totalEarned += amount;
    await wallet.save();
    await recordTransaction(wallet.id, 'earning', description, amount, wallet.discretionaryBalance);
    return wallet;
};
exports.addLucre = addLucre;
const addDiscretionary = async (userId, amount, description) => {
    const wallet = await (0, exports.getWallet)(userId);
    wallet.discretionaryBalance += amount;
    await wallet.save();
    await recordTransaction(wallet.id, 'income', description, amount, wallet.discretionaryBalance);
    return wallet;
};
exports.addDiscretionary = addDiscretionary;
const deductDiscretionary = async (userId, amount, description) => {
    const wallet = await (0, exports.getWallet)(userId);
    if (wallet.discretionaryBalance < amount) {
        throw new ApiError_1.default(400, 'Insufficient balance');
    }
    wallet.discretionaryBalance -= amount;
    await wallet.save();
    await recordTransaction(wallet.id, 'expense', description, -amount, wallet.discretionaryBalance);
    return wallet;
};
exports.deductDiscretionary = deductDiscretionary;
const processPayout = async (userId) => {
    const wallet = await (0, exports.getWallet)(userId);
    if (wallet.lucreBalance <= 0) {
        return wallet;
    }
    const payoutAmount = wallet.lucreBalance;
    wallet.lucreBalance = 0;
    wallet.activeBalance += payoutAmount;
    wallet.discretionaryBalance += payoutAmount;
    wallet.lastPayout = new Date();
    await wallet.save();
    await recordTransaction(wallet.id, 'income', 'Weekly payout', payoutAmount, wallet.discretionaryBalance);
    return wallet;
};
exports.processPayout = processPayout;
const updateExpenses = async (userId, expenses) => {
    const wallet = await (0, exports.getWallet)(userId);
    wallet.expenses = expenses;
    const totalExpenses = Object.values(expenses).reduce((sum, value) => sum + value, 0);
    wallet.discretionaryBalance = Math.max(wallet.activeBalance - totalExpenses, 0);
    await wallet.save();
    return wallet;
};
exports.updateExpenses = updateExpenses;
