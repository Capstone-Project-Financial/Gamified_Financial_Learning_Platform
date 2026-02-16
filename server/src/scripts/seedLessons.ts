import mongoose from 'mongoose';
import { LessonModel } from '../models/Lesson';
import { env } from '../config/env';

const lessons = [
  // Module 1, Lesson 1 - Fully defined
  {
    moduleId: 1,
    lessonId: '1',
    title: 'What is Money?',
    xpReward: 50,
    lucreReward: 30,
    slides: [
      {
        type: 'intro',
        content: { image: '🪙', text: "Hi! I'm Coinsworth 🪙. Let me tell you about MONEY!" },
        order: 1
      },
      {
        type: 'content',
        content: {
          image: '💱',
          text: 'Money is something we use to buy things we need and want. People trade money for toys, food, clothes, and more!'
        },
        order: 2
      },
      {
        type: 'question',
        content: {
          question: 'What can you buy with money?',
          options: [
            { id: 'a', text: '🍎 Apple', correct: true },
            { id: 'b', text: '☁️ Cloud', correct: false },
            { id: 'c', text: '🎮 Video Game', correct: true }
          ],
          multiSelect: true
        },
        order: 3
      },
      {
        type: 'story',
        content: {
          image: '🚲',
          story: 'Raj wanted a bicycle. It cost ₹2000. He saved ₹200 every month from his pocket money. After 10 months, he had enough!',
          lesson: 'Saving regularly helps you buy what you want!'
        },
        order: 4
      },
      {
        type: 'completion',
        content: { message: '🎉 Lesson Complete!', xp: 50, badge: null },
        order: 5
      }
    ]
  }
];

// Generate template lessons for all other lessons
const generateTemplateLessons = () => {
  const templates = [];
  for (let moduleId = 1; moduleId <= 5; moduleId++) {
    for (let lessonId = 1; lessonId <= 3; lessonId++) {
      const key = `${moduleId}.${lessonId}`;
      // Skip 1.1 as it's already defined
      if (key === '1.1') continue;

      templates.push({
        moduleId,
        lessonId: lessonId.toString(),
        title: `Lesson ${key}`,
        xpReward: 50,
        lucreReward: 30,
        slides: [
          {
            type: 'intro',
            content: {
              image: '📚',
              text: `Welcome to Lesson ${key}! Let's learn something new!`
            },
            order: 1
          },
          {
            type: 'content',
            content: {
              image: '💡',
              text: 'This is a sample lesson. In a full version, each lesson would have rich, educational content!'
            },
            order: 2
          },
          {
            type: 'question',
            content: {
              question: 'Sample question: What did we learn?',
              options: [
                { id: 'a', text: 'Important financial concepts', correct: true },
                { id: 'b', text: 'Nothing', correct: false }
              ]
            },
            order: 3
          },
          {
            type: 'completion',
            content: { message: '🎉 Lesson Complete!', xp: 50 },
            order: 4
          }
        ]
      });
    }
  }
  return templates;
};

export const seedLessons = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Clear existing lessons
    await LessonModel.deleteMany({});
    console.log('🗑️  Cleared existing lessons');

    // Insert defined lesson + templates
    const allLessons = [...lessons, ...generateTemplateLessons()];
    await LessonModel.insertMany(allLessons);
    console.log(`✅ Seeded ${allLessons.length} lessons`);

    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding lessons:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedLessons();
}
