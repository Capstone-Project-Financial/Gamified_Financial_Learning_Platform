"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuizQuestions = void 0;
const defaultQuestions = [
    {
        question: "What does 'saving money' mean?",
        options: ['Keeping money safe for later', 'Spending all your money', 'Giving money away'],
        correct: 0
    },
    {
        question: 'If you have ₹100 and spend ₹30, how much is left?',
        options: ['₹130', '₹70', '₹30'],
        correct: 1
    },
    {
        question: "What is a 'budget'?",
        options: ['A type of coin', 'A plan for spending money', 'A bank account'],
        correct: 1
    },
    {
        question: "What does 'investing' mean?",
        options: ['Buying toys', 'Putting money somewhere to grow it', 'Hiding money'],
        correct: 1
    },
    {
        question: "What is a 'stock'?",
        options: ['A piece of ownership in a company', 'A type of food', 'A savings account'],
        correct: 0
    },
    {
        question: 'Banks keep your money safe. True or False?',
        options: ['True', 'False'],
        correct: 0
    },
    {
        question: 'If you save ₹10 every day for 10 days, how much will you have?',
        options: ['₹50', '₹100', '₹200'],
        correct: 1
    },
    {
        question: 'What should you do with your pocket money?',
        options: ['Spend it all immediately', 'Save some for later', 'Give it all away'],
        correct: 1
    },
    {
        question: 'Which is more important?',
        options: ['Needs', 'Wants', 'Both are equal'],
        correct: 0
    },
    {
        question: 'Interest means...',
        options: ['Money you lose', 'Money that grows in a bank', 'Money you give to others'],
        correct: 1
    }
];
const getQuizQuestions = (_moduleId) => {
    return defaultQuestions;
};
exports.getQuizQuestions = getQuizQuestions;
