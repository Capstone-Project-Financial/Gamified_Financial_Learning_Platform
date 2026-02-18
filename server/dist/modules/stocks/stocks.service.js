"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sellStock = exports.buyStock = exports.getPortfolio = exports.refreshStockPrices = exports.listStocks = void 0;
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const wallet_service_1 = require("../wallet/wallet.service");
const Stock_1 = require("../../models/Stock");
const listStocks = async () => {
    return Stock_1.StockModel.find({}).sort({ symbol: 1 });
};
exports.listStocks = listStocks;
const refreshStockPrices = async () => {
    const stocks = await Stock_1.StockModel.find({});
    await Promise.all(stocks.map(async (stock) => {
        const changePercent = Math.random() * 0.08 - 0.03; // -3% to +5%
        const newPrice = parseFloat((stock.price * (1 + changePercent)).toFixed(2));
        const change = parseFloat((newPrice - stock.price).toFixed(2));
        stock.history = [...stock.history.slice(-49), newPrice];
        stock.change = change;
        stock.changePercent = parseFloat((changePercent * 100).toFixed(2));
        stock.price = newPrice;
        await stock.save();
    }));
    return stocks;
};
exports.refreshStockPrices = refreshStockPrices;
const getPortfolio = async (userId) => {
    const holdings = await Stock_1.HoldingModel.find({ user: userId });
    const trades = await Stock_1.TradeModel.find({ user: userId }).sort({ createdAt: -1 }).limit(50);
    const stocks = await Stock_1.StockModel.find({ symbol: { $in: holdings.map((h) => h.symbol) } });
    let portfolioValue = 0;
    let totalProfit = 0;
    const enrichedHoldings = holdings.map((holding) => {
        const stock = stocks.find((s) => s.symbol === holding.symbol);
        const currentValue = stock ? stock.price * holding.shares : 0;
        const profit = stock ? (stock.price - holding.avgCost) * holding.shares : 0;
        portfolioValue += currentValue;
        totalProfit += profit;
        return {
            ...holding.toObject(),
            currentPrice: stock?.price ?? 0,
            currentValue,
            profit
        };
    });
    return {
        holdings: enrichedHoldings,
        trades,
        portfolioValue,
        totalProfit
    };
};
exports.getPortfolio = getPortfolio;
const buyStock = async (userId, symbol, shares) => {
    const stock = await Stock_1.StockModel.findOne({ symbol });
    if (!stock)
        throw new ApiError_1.default(404, 'Stock not found');
    const cost = stock.price * shares;
    const wallet = await (0, wallet_service_1.deductDiscretionary)(userId, cost, `Bought ${shares} ${symbol} shares`);
    const holding = (await Stock_1.HoldingModel.findOne({ user: userId, stock: stock.id })) ||
        (await Stock_1.HoldingModel.create({ user: userId, stock: stock.id, symbol, shares: 0, avgCost: 0 }));
    const totalShares = holding.shares + shares;
    const newAvgCost = (holding.avgCost * holding.shares + cost) / totalShares;
    holding.shares = totalShares;
    holding.avgCost = parseFloat(newAvgCost.toFixed(2));
    await holding.save();
    const trade = await Stock_1.TradeModel.create({
        user: userId,
        stock: stock.id,
        symbol,
        type: 'buy',
        shares,
        price: stock.price
    });
    return { holding, wallet, trade, stock };
};
exports.buyStock = buyStock;
const sellStock = async (userId, symbol, shares) => {
    const stock = await Stock_1.StockModel.findOne({ symbol });
    if (!stock)
        throw new ApiError_1.default(404, 'Stock not found');
    const holding = await Stock_1.HoldingModel.findOne({ user: userId, stock: stock.id });
    if (!holding || holding.shares < shares) {
        throw new ApiError_1.default(400, 'Not enough shares to sell');
    }
    const proceeds = stock.price * shares;
    const wallet = await (0, wallet_service_1.addDiscretionary)(userId, proceeds, `Sold ${shares} ${symbol} shares`);
    holding.shares -= shares;
    if (holding.shares === 0) {
        await holding.deleteOne();
    }
    else {
        await holding.save();
    }
    const trade = await Stock_1.TradeModel.create({
        user: userId,
        stock: stock.id,
        symbol,
        type: 'sell',
        shares,
        price: stock.price
    });
    return { wallet, trade, stock };
};
exports.sellStock = sellStock;
