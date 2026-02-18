"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAchievements = exports.evaluateAchievements = void 0;
const Progress_1 = require("../../models/Progress");
const Wallet_1 = require("../../models/Wallet");
const Stock_1 = require("../../models/Stock");
const User_1 = require("../../models/User");
const achievements_1 = require("../../data/achievements");
const ensureAchievementSlots = (progress) => {
    if (!progress)
        return;
    achievements_1.achievementTemplates.forEach((template) => {
        const exists = progress.achievements.find((a) => a.id === template.id);
        if (!exists) {
            progress.achievements.push({
                ...template,
                unlocked: false,
                progress: 0
            });
        }
    });
};
const evaluateAchievements = async (userId) => {
    const [progress, wallet, holdings, user, stocks] = await Promise.all([
        Progress_1.ProgressModel.findOne({ user: userId }),
        Wallet_1.WalletModel.findOne({ user: userId }),
        Stock_1.HoldingModel.find({ user: userId }),
        User_1.UserModel.findById(userId),
        Stock_1.StockModel.find({})
    ]);
    if (!progress || !user) {
        return [];
    }
    ensureAchievementSlots(progress);
    const updateAchievement = (id, unlocked, progressValue = 0) => {
        const target = progress.achievements.find((a) => a.id === id);
        if (!target)
            return;
        target.progress = progressValue;
        if (unlocked && !target.unlocked) {
            target.unlocked = true;
            target.unlockedAt = new Date();
        }
    };
    // First Steps
    updateAchievement('first-steps', progress.completedLessons.length >= 1);
    // Quiz master: 5 quizzes >=80%
    const highScores = progress.quizScores.filter((qs) => qs.score / qs.total >= 0.8).length;
    updateAchievement('quiz-master', highScores >= 5, Math.min(highScores, 5));
    // Early investor
    updateAchievement('early-investor', holdings.length >= 1);
    // Streak warrior
    updateAchievement('streak-warrior', user.currentStreak >= 7, Math.min(user.currentStreak, 7));
    // Money master
    updateAchievement('money-master', progress.completedModules.length >= 5, progress.completedModules.length);
    // Diversification
    const uniqueSymbols = new Set(holdings.map((h) => h.symbol)).size;
    updateAchievement('diversification-pro', uniqueSymbols >= 5, uniqueSymbols);
    // Quiz champion: perfect quizzes
    const perfectQuizzes = progress.quizScores.filter((qs) => qs.score === qs.total).length;
    updateAchievement('quiz-champion', perfectQuizzes >= 10, Math.min(perfectQuizzes, 10));
    // Trading tycoon: profit >=1000
    let totalProfit = 0;
    holdings.forEach((holding) => {
        const stock = stocks.find((s) => s.symbol === holding.symbol);
        if (stock) {
            totalProfit += (stock.price - holding.avgCost) * holding.shares;
        }
    });
    updateAchievement('trading-tycoon', totalProfit >= 1000, Math.min(totalProfit, 1000));
    // Battle victor - placeholder progress
    updateAchievement('battle-victor', false, 0);
    await progress.save();
    return progress.achievements;
};
exports.evaluateAchievements = evaluateAchievements;
const getAchievements = async (userId) => {
    const progress = await Progress_1.ProgressModel.findOne({ user: userId });
    if (!progress)
        return [];
    ensureAchievementSlots(progress);
    await progress.save();
    return progress.achievements;
};
exports.getAchievements = getAchievements;
