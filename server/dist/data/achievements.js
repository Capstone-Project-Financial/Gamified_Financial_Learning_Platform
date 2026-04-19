"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAchievementState = exports.allAchievementTemplates = exports.achievementTemplates = void 0;
exports.achievementTemplates = [
    { id: 'first-steps', name: 'First Steps', description: 'Complete your first lesson', icon: '🎖️', xpReward: 50 },
    { id: 'quiz-master', name: 'Quiz Master', description: 'Pass 5 quizzes with 80%+', icon: '🧠', xpReward: 100, total: 5 },
    { id: 'early-investor', name: 'Early Investor', description: 'Buy your first stock', icon: '📈', xpReward: 75 },
    { id: 'streak-warrior', name: 'Streak Warrior', description: '7-day login streak', icon: '🔥', xpReward: 150, total: 7 },
    { id: 'money-master', name: 'Money Master', description: 'Complete all beginner modules', icon: '💰', xpReward: 200, total: 5 },
    { id: 'diversification-pro', name: 'Diversification Pro', description: 'Own shares in all 5 companies', icon: '📊', xpReward: 250, total: 5 },
    { id: 'quiz-champion', name: 'Quiz Champion', description: 'Score 100% on 10 quizzes', icon: '🏆', xpReward: 300, total: 10 },
    { id: 'trading-tycoon', name: 'Trading Tycoon', description: 'Make ₹1000 profit from stocks', icon: '💼', xpReward: 500, total: 1000 },
    { id: 'battle-victor', name: 'Battle Victor', description: 'Win 10 quiz battles', icon: '⚔️', xpReward: 200, total: 10 }
];
const budget_simulator_achievements_1 = require("./budget-simulator-achievements");
// Merge budget-simulator achievements into the main template array
exports.allAchievementTemplates = [
    ...exports.achievementTemplates,
    ...budget_simulator_achievements_1.budgetSimulatorAchievements
];
const buildAchievementState = () => exports.allAchievementTemplates.map((achievement) => ({
    ...achievement,
    unlocked: false,
    progress: 0
}));
exports.buildAchievementState = buildAchievementState;
