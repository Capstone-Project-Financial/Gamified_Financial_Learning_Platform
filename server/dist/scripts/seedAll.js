"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const seedModules_1 = require("./seedModules");
const seedLessons_1 = require("./seedLessons");
const seedQuizzes_1 = require("./seedQuizzes");
const seedAchievements_1 = require("./seedAchievements");
const seedTestimonials_1 = __importDefault(require("./seedTestimonials"));
const seedAll = async () => {
    console.log('🌱 Starting database seeding...\n');
    try {
        await (0, seedModules_1.seedModules)();
        console.log('');
        await (0, seedLessons_1.seedLessons)();
        console.log('');
        await (0, seedQuizzes_1.seedQuizzes)();
        console.log('');
        await (0, seedAchievements_1.seedAchievements)();
        console.log('');
        await (0, seedTestimonials_1.default)();
        console.log('');
        console.log('✨ All data seeded successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('💥 Seeding failed:', error);
        process.exit(1);
    }
};
seedAll();
