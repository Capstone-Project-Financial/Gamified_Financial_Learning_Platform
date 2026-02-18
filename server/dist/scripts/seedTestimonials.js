"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Testimonial_1 = __importDefault(require("../models/Testimonial"));
const env_1 = require("../config/env");
const testimonials = [
    {
        name: 'Priya',
        age: 12,
        text: 'I learned how to save for my bicycle! This app makes money fun! 🚲',
        avatar: '👧',
        isActive: true,
        order: 1,
    },
    {
        name: 'Arjun',
        age: 14,
        text: "I'm beating my friends in stock trading competitions! So cool! 📈",
        avatar: '👦',
        isActive: true,
        order: 2,
    },
    {
        name: 'Sneha',
        age: 11,
        text: 'Now I understand why my parents budget. The tools are amazing! 💡',
        avatar: '👧',
        isActive: true,
        order: 3,
    },
];
async function seedTestimonials() {
    try {
        await mongoose_1.default.connect(env_1.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        // Clear existing testimonials
        await Testimonial_1.default.deleteMany({});
        console.log('🗑️  Cleared existing testimonials');
        // Insert new testimonials
        await Testimonial_1.default.insertMany(testimonials);
        console.log(`✅ Seeded ${testimonials.length} testimonials`);
        await mongoose_1.default.connection.close();
        console.log('👋 Disconnected from MongoDB');
    }
    catch (error) {
        console.error('❌ Error seeding testimonials:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    seedTestimonials();
}
exports.default = seedTestimonials;
