"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserStanding = exports.getLeaderboard = void 0;
const User_1 = require("../../models/User");
const Stock_1 = require("../../models/Stock");
const computeProfitMap = async (userIds) => {
    if (!userIds.length)
        return new Map();
    const holdings = await Stock_1.HoldingModel.find({ user: { $in: userIds } });
    const stocks = await Stock_1.StockModel.find({});
    const priceMap = new Map(stocks.map((stock) => [stock.symbol, stock.price]));
    const profitMap = new Map();
    holdings.forEach((holding) => {
        const currentPrice = priceMap.get(holding.symbol) ?? holding.avgCost;
        const profit = (currentPrice - holding.avgCost) * holding.shares;
        profitMap.set(holding.user.toString(), (profitMap.get(holding.user.toString()) ?? 0) + profit);
    });
    return profitMap;
};
const getLeaderboard = async (limit) => {
    const users = await User_1.UserModel.find().sort({ xp: -1 }).limit(limit);
    const profitMap = await computeProfitMap(users.map((user) => user.id));
    return users.map((user, index) => ({
        rank: index + 1,
        name: user.name,
        level: user.level,
        xp: user.xp,
        school: user.school,
        streak: user.currentStreak,
        profit: Math.round(profitMap.get(user.id) ?? 0)
    }));
};
exports.getLeaderboard = getLeaderboard;
const getUserStanding = async (userId) => {
    const user = await User_1.UserModel.findById(userId);
    if (!user)
        return null;
    const higherRankedCount = await User_1.UserModel.countDocuments({ xp: { $gt: user.xp } });
    const profitMap = await computeProfitMap([userId]);
    return {
        rank: higherRankedCount + 1,
        name: user.name,
        level: user.level,
        xp: user.xp,
        school: user.school,
        streak: user.currentStreak,
        profit: Math.round(profitMap.get(userId) ?? 0)
    };
};
exports.getUserStanding = getUserStanding;
