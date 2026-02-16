import mongoose from 'mongoose';
import Testimonial from '../models/Testimonial';
import { env } from '../config/env';

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
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing testimonials
    await Testimonial.deleteMany({});
    console.log('🗑️  Cleared existing testimonials');

    // Insert new testimonials
    await Testimonial.insertMany(testimonials);
    console.log(`✅ Seeded ${testimonials.length} testimonials`);

    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error seeding testimonials:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedTestimonials();
}

export default seedTestimonials;
