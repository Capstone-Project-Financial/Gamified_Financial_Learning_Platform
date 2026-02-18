"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLessonContent = void 0;
const specificLessons = {
    '1.1': {
        title: 'What is Money?',
        slides: [
            { type: 'intro', content: { image: '🪙', text: "Hi! I'm Coinsworth 🪙. Let me tell you about MONEY!" } },
            {
                type: 'content',
                content: {
                    image: '💱',
                    text: 'Money is something we use to buy things we need and want. People trade money for toys, food, clothes, and more!'
                }
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
                }
            },
            {
                type: 'story',
                content: {
                    image: '🚲',
                    story: 'Raj wanted a bicycle. It cost ₹2000. He saved ₹200 every month from his pocket money. After 10 months, he had enough!',
                    lesson: 'Saving regularly helps you buy what you want!'
                }
            },
            { type: 'completion', content: { message: '🎉 Lesson Complete!', xp: 50, badge: null } }
        ]
    }
};
const getLessonContent = (moduleId, lessonId) => {
    const key = `${moduleId}.${lessonId}`;
    if (specificLessons[key]) {
        return specificLessons[key];
    }
    return {
        title: `Lesson ${key}`,
        slides: [
            {
                type: 'intro',
                content: {
                    image: '📚',
                    text: `Welcome to Lesson ${key}! Let's learn something new!`
                }
            },
            {
                type: 'content',
                content: {
                    image: '💡',
                    text: 'This is a sample lesson. In a full version, each lesson would have rich, educational content!'
                }
            },
            {
                type: 'question',
                content: {
                    question: 'Sample question: What did we learn?',
                    options: [
                        { id: 'a', text: 'Important financial concepts', correct: true },
                        { id: 'b', text: 'Nothing', correct: false }
                    ]
                }
            },
            { type: 'completion', content: { message: '🎉 Lesson Complete!', xp: 50 } }
        ]
    };
};
exports.getLessonContent = getLessonContent;
