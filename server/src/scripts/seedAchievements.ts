import mongoose from 'mongoose';
import { AchievementModel } from '../models/Achievement';
import { env } from '../config/env';

const achievements = [
  {
    achievementId: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first lesson',
    icon: '🎖️',
    xpReward: 50,
    category: 'learning'
  },
  {
    achievementId: 'quiz-master',
    name: 'Quiz Master',
    description: 'Pass 5 quizzes with 80%+',
    icon: '🧠',
    xpReward: 100,
    total: 5,
    category: 'quiz'
  },
  {
    achievementId: 'early-investor',
    name: 'Early Investor',
    description: 'Buy your first stock',
    icon: '📈',
    xpReward: 75,
    category: 'trading'
  },
  {
    achievementId: 'streak-warrior',
    name: 'Streak Warrior',
    description: '7-day login streak',
    icon: '🔥',
    xpReward: 150,
    total: 7,
    category: 'streak'
  },
  {
    achievementId: 'money-master',
    name: 'Money Master',
    description: 'Complete all beginner modules',
    icon: '💰',
    xpReward: 200,
    total: 5,
    category: 'learning'
  },
  {
    achievementId: 'diversification-pro',
    name: 'Diversification Pro',
    description: 'Own shares in all 5 companies',
    icon: '📊',
    xpReward: 250,
    total: 5,
    category: 'trading'
  },
  {
    achievementId: 'quiz-champion',
    name: 'Quiz Champion',
    description: 'Score 100% on 10 quizzes',
    icon: '🏆',
    xpReward: 300,
    total: 10,
    category: 'quiz'
  },
  {
    achievementId: 'trading-tycoon',
    name: 'Trading Tycoon',
    description: 'Make ₹1000 profit from stocks',
    icon: '💼',
    xpReward: 500,
    total: 1000,
    category: 'trading'
  },
  {
    achievementId: 'battle-victor',
    name: 'Battle Victor',
    description: 'Win 10 quiz battles',
    icon: '⚔️',
    xpReward: 200,
    total: 10,
    category: 'quiz'
  }
];

export const seedAchievements = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Clear existing achievements
    await AchievementModel.deleteMany({});
    console.log('🗑️  Cleared existing achievements');

    // Insert new achievements
    await AchievementModel.insertMany(achievements);
    console.log(`✅ Seeded ${achievements.length} achievements`);

    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding achievements:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedAchievements();
}
