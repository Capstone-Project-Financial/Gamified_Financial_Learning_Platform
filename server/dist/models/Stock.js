"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeModel = exports.HoldingModel = exports.StockModel = void 0;
const mongoose_1 = require("mongoose");
const stockSchema = new mongoose_1.Schema({
    symbol: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    change: { type: Number, required: true },
    changePercent: { type: Number, required: true },
    history: { type: [Number], default: [] },
    icon: String,
    description: String,
    sector: String
}, { timestamps: true });
exports.StockModel = (0, mongoose_1.model)('Stock', stockSchema);
const holdingSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    stock: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Stock', required: true },
    symbol: { type: String, required: true },
    shares: { type: Number, required: true },
    avgCost: { type: Number, required: true }
}, { timestamps: true });
holdingSchema.index({ user: 1, stock: 1 }, { unique: true });
exports.HoldingModel = (0, mongoose_1.model)('Holding', holdingSchema);
const tradeSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    stock: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Stock', required: true },
    symbol: { type: String, required: true },
    type: { type: String, enum: ['buy', 'sell'], required: true },
    shares: { type: Number, required: true },
    price: { type: Number, required: true }
}, { timestamps: true });
exports.TradeModel = (0, mongoose_1.model)('Trade', tradeSchema);
