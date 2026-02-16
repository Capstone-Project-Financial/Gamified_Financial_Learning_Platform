import mongoose from 'mongoose';
import { QuizModel } from '../models/Quiz';
import { env } from '../config/env';

const quizzes = [
  {
    moduleId: 1,
    title: 'Money Basics Quiz',
    passingScore: 70,
    xpPerQuestion: 10,
    questions: [
      {
        question: "What does 'saving money' mean?",
        options: ['Keeping money safe for later', 'Spending all your money', 'Giving money away'],
        correctAnswer: 0,
        order: 1
      },
      {
        question: 'If you have ₹100 and spend ₹30, how much is left?',
        options: ['₹130', '₹70', '₹30'],
        correctAnswer: 1,
        order: 2
      }
    ]
  },
  {
    moduleId: 2,
    title: 'Smart Spending Quiz',
    passingScore: 70,
    xpPerQuestion: 10,
    questions: [
      {
        question: 'Which is more important?',
        options: ['Needs', 'Wants', 'Both are equal'],
        correctAnswer: 0,
        order: 1
      },
      {
        question: 'What should you do with your pocket money?',
        options: ['Spend it all immediately', 'Save some for later', 'Give it all away'],
        correctAnswer: 1,
        order: 2
      }
    ]
  },
  {
    moduleId: 3,
    title: 'Saving Adventure Quiz',
    passingScore: 70,
    xpPerQuestion: 10,
    questions: [
      {
        question: 'If you save ₹10 every day for 10 days, how much will you have?',
        options: ['₹50', '₹100', '₹200'],
        correctAnswer: 1,
        order: 1
      },
      {
        question: "What is a 'budget'?",
        options: ['A type of coin', 'A plan for spending money', 'A bank account'],
        correctAnswer: 1,
        order: 2
      }
    ]
  },
  {
    moduleId: 4,
    title: 'Understanding Banks Quiz',
    passingScore: 70,
    xpPerQuestion: 10,
    questions: [
      {
        question: 'Banks keep your money safe. True or False?',
        options: ['True', 'False'],
        correctAnswer: 0,
        order: 1
      },
      {
        question: 'Interest means...',
        options: ['Money you lose', 'Money that grows in a bank', 'Money you give to others'],
        correctAnswer: 1,
        order: 2
      }
    ]
  },
  {
    moduleId: 5,
    title: 'Introduction to Earning Quiz',
    passingScore: 70,
    xpPerQuestion: 10,
    questions: [
      {
        question: "What does 'investing' mean?",
        options: ['Buying toys', 'Putting money somewhere to grow it', 'Hiding money'],
        correctAnswer: 1,
        order: 1
      },
      {
        question: "What is a 'stock'?",
        options: ['A piece of ownership in a company', 'A type of food', 'A savings account'],
        correctAnswer: 0,
        order: 2
      }
    ]
  }
];

export const seedQuizzes = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Clear existing quizzes
    await QuizModel.deleteMany({});
    console.log('🗑️  Cleared existing quizzes');

    // Insert new quizzes
    await QuizModel.insertMany(quizzes);
    console.log(`✅ Seeded ${quizzes.length} quizzes`);

    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding quizzes:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedQuizzes();
}
