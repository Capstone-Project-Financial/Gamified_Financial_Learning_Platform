import mongoose from 'mongoose';
import { ModuleModel } from '../models/Module';
import { env } from '../config/env';

const modules = [
  {
    moduleId: 1,
    title: 'Money Basics',
    icon: '🪙',
    description: 'Learn the fundamentals of money and how it works',
    order: 1,
    lessons: [
      { lessonId: '1', title: 'What is Money?', duration: '5 min', order: 1 },
      { lessonId: '2', title: 'Earning Money', duration: '5 min', order: 2 },
      { lessonId: '3', title: 'Saving vs Spending', duration: '6 min', order: 3 }
    ]
  },
  {
    moduleId: 2,
    title: 'Smart Spending',
    icon: '🛒',
    description: 'Make wise choices with your money',
    order: 2,
    lessons: [
      { lessonId: '1', title: 'Needs vs Wants', duration: '5 min', order: 1 },
      { lessonId: '2', title: 'Making Choices', duration: '6 min', order: 2 },
      { lessonId: '3', title: 'Avoiding Waste', duration: '5 min', order: 3 }
    ]
  },
  {
    moduleId: 3,
    title: 'The Saving Adventure',
    icon: '💰',
    description: 'Discover the power of saving money',
    order: 3,
    lessons: [
      { lessonId: '1', title: 'Why Save Money?', duration: '5 min', order: 1 },
      { lessonId: '2', title: 'Setting Goals', duration: '6 min', order: 2 },
      { lessonId: '3', title: 'Piggy Banks & Bank Accounts', duration: '7 min', order: 3 }
    ]
  },
  {
    moduleId: 4,
    title: 'Understanding Banks',
    icon: '🏦',
    description: 'Learn how banks help you manage money',
    order: 4,
    lessons: [
      { lessonId: '1', title: 'What Banks Do', duration: '5 min', order: 1 },
      { lessonId: '2', title: 'Interest - Money That Grows!', duration: '6 min', order: 2 },
      { lessonId: '3', title: 'Keeping Money Safe', duration: '5 min', order: 3 }
    ]
  },
  {
    moduleId: 5,
    title: 'Introduction to Earning',
    icon: '💼',
    description: 'Explore different ways to earn money',
    order: 5,
    lessons: [
      { lessonId: '1', title: 'Jobs and Work', duration: '5 min', order: 1 },
      { lessonId: '2', title: 'Allowance and Chores', duration: '6 min', order: 2 },
      { lessonId: '3', title: 'Starting Small Businesses', duration: '7 min', order: 3 }
    ]
  }
];

export const seedModules = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Clear existing modules
    await ModuleModel.deleteMany({});
    console.log('🗑️  Cleared existing modules');

    // Insert new modules
    await ModuleModel.insertMany(modules);
    console.log(`✅ Seeded ${modules.length} modules`);

    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding modules:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedModules();
}
