"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitQuiz = exports.getQuiz = exports.completeLesson = exports.fetchLessonContent = exports.listModulesWithProgress = exports.buildAchievementStateFromDB = exports.getProgressForUser = void 0;
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const wallet_service_1 = require("../wallet/wallet.service");
const auth_service_1 = require("../auth/auth.service");
const Progress_1 = require("../../models/Progress");
const Module_1 = require("../../models/Module");
const Lesson_1 = require("../../models/Lesson");
const Quiz_1 = require("../../models/Quiz");
const Achievement_1 = require("../../models/Achievement");
// Cache for modules (since they don't change often)
let modulesCache = null;
const getProgressForUser = async (userId) => {
    const progress = (await Progress_1.ProgressModel.findOne({ user: userId })) ||
        (await Progress_1.ProgressModel.create({
            user: userId,
            achievements: await (0, exports.buildAchievementStateFromDB)()
        }));
    return progress;
};
exports.getProgressForUser = getProgressForUser;
const buildAchievementStateFromDB = async () => {
    const achievements = await Achievement_1.AchievementModel.find({ isActive: true }).lean();
    return achievements.map((achievement) => ({
        ...achievement,
        unlocked: false,
        progress: 0
    }));
};
exports.buildAchievementStateFromDB = buildAchievementStateFromDB;
const listModulesWithProgress = async (userId) => {
    const progress = await (0, exports.getProgressForUser)(userId);
    // Use cache if available, otherwise fetch from DB
    if (!modulesCache) {
        modulesCache = await Module_1.ModuleModel.find({ isActive: true })
            .sort({ order: 1 })
            .lean();
    }
    return { modules: modulesCache, progress };
};
exports.listModulesWithProgress = listModulesWithProgress;
const fetchLessonContent = async (moduleId, lessonId) => {
    const lesson = await Lesson_1.LessonModel.findOne({
        moduleId: parseInt(moduleId),
        lessonId,
        isActive: true
    }).lean();
    if (!lesson) {
        throw new ApiError_1.default(404, `Lesson ${moduleId}.${lessonId} not found`);
    }
    return {
        title: lesson.title,
        slides: lesson.slides
    };
};
exports.fetchLessonContent = fetchLessonContent;
const completeLesson = async (userId, moduleId, lessonId) => {
    const progress = await (0, exports.getProgressForUser)(userId);
    const lessonKey = `${moduleId}.${lessonId}`;
    // Verify lesson exists
    const lesson = await Lesson_1.LessonModel.findOne({
        moduleId,
        lessonId,
        isActive: true
    });
    if (!lesson) {
        throw new ApiError_1.default(404, `Lesson ${lessonKey} not found`);
    }
    if (!progress.completedLessons.includes(lessonKey)) {
        progress.completedLessons.push(lessonKey);
    }
    if (!progress.completedModules.includes(moduleId - 1) && moduleId > 1) {
        // ensure sequential unlocking
        progress.completedModules = Array.from(new Set(progress.completedModules));
    }
    progress.currentModule = Math.max(progress.currentModule, moduleId);
    await progress.save();
    const [user, wallet] = await Promise.all([
        (0, auth_service_1.addXpToUser)(userId, lesson.xpReward),
        (0, wallet_service_1.addLucre)(userId, lesson.lucreReward, `Completed Lesson ${lessonKey}`)
    ]);
    return { progress, user, wallet, lessonKey };
};
exports.completeLesson = completeLesson;
const getQuiz = async (moduleId) => {
    const quiz = await Quiz_1.QuizModel.findOne({ moduleId, isActive: true }).lean();
    if (!quiz) {
        throw new ApiError_1.default(404, 'Quiz not found for this module');
    }
    // Return questions in the format expected by the client
    return quiz.questions.map((q) => ({
        question: q.question,
        options: q.options,
        correct: q.correctAnswer
    }));
};
exports.getQuiz = getQuiz;
const submitQuiz = async (userId, moduleId, answers, timeSpent) => {
    const questions = await (0, exports.getQuiz)(moduleId);
    if (answers.length !== questions.length) {
        throw new ApiError_1.default(400, 'Answer count mismatch');
    }
    let score = 0;
    answers.forEach((answer, index) => {
        if (questions[index].correct === answer) {
            score += 1;
        }
    });
    const total = questions.length;
    const percentage = (score / total) * 100;
    const progress = await (0, exports.getProgressForUser)(userId);
    const quizId = `quiz-${moduleId}`;
    const existingIdx = progress.quizScores.findIndex((qs) => qs.quizId === quizId);
    const quizEntry = {
        quizId,
        score,
        total,
        timeSpent,
        date: new Date()
    };
    if (existingIdx >= 0) {
        progress.quizScores[existingIdx] = quizEntry;
    }
    else {
        progress.quizScores.push(quizEntry);
    }
    // Get total module count from database
    const moduleCount = await Module_1.ModuleModel.countDocuments({ isActive: true });
    if (percentage >= 70 && !progress.completedModules.includes(moduleId)) {
        progress.completedModules.push(moduleId);
        progress.currentModule = Math.min(moduleId + 1, moduleCount);
    }
    await progress.save();
    const xpEarned = score * 10;
    const moneyEarned = Math.floor(percentage);
    const [user, wallet] = await Promise.all([
        (0, auth_service_1.addXpToUser)(userId, xpEarned),
        (0, wallet_service_1.addLucre)(userId, moneyEarned, `Quiz ${quizId}: ${score}/${total}`)
    ]);
    return { progress, user, wallet, quiz: quizEntry, percentage };
};
exports.submitQuiz = submitQuiz;
