"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionModel = exports.WalletModel = void 0;
const mongoose_1 = require("mongoose");
const walletSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    lucreBalance: { type: Number, default: 0 },
    activeBalance: { type: Number, default: 500 },
    discretionaryBalance: { type: Number, default: 500 },
    totalEarned: { type: Number, default: 500 },
    lastPayout: { type: Date, default: () => new Date() },
    expenses: {
        tax: { type: Number, default: 0 },
        rent: { type: Number, default: 0 },
        food: { type: Number, default: 0 },
        utilities: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
    }
}, { timestamps: true });
exports.WalletModel = (0, mongoose_1.model)('Wallet', walletSchema);
const transactionSchema = new mongoose_1.Schema({
    wallet: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Wallet', required: true },
    type: { type: String, enum: ['earning', 'expense', 'income'], required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true }
}, { timestamps: true });
exports.TransactionModel = (0, mongoose_1.model)('Transaction', transactionSchema);
