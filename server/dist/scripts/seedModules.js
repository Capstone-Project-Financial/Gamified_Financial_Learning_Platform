"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedModules = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Module_1 = require("../models/Module");
const env_1 = require("../config/env");
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
const seedModules = async () => {
    try {
        await mongoose_1.default.connect(env_1.env.MONGODB_URI);
        console.log('📦 Connected to MongoDB');
        // Clear existing modules
        await Module_1.ModuleModel.deleteMany({});
        console.log('🗑️  Cleared existing modules');
        // Insert new modules
        await Module_1.ModuleModel.insertMany(modules);
        console.log(`✅ Seeded ${modules.length} modules`);
        await mongoose_1.default.connection.close();
        console.log('👋 Database connection closed');
    }
    catch (error) {
        console.error('❌ Error seeding modules:', error);
        process.exit(1);
    }
};
exports.seedModules = seedModules;
// Run if called directly
if (require.main === module) {
    (0, exports.seedModules)();
}
