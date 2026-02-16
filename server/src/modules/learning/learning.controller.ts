import { Request, Response } from 'express';

import ApiError from '../../utils/ApiError';
import asyncHandler from '../../utils/asyncHandler';
import sendSuccess from '../../utils/response';
import { evaluateAchievements } from '../achievements/achievements.service';
import {
  completeLesson,
  fetchLessonContent,
  getProgressForUser,
  getQuiz,
  listModulesWithProgress,
  submitQuiz
} from './learning.service';

export const getModules = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  const data = await listModulesWithProgress(req.user.id);
  return sendSuccess(res, data);
});

export const getLesson = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  const { moduleId, lessonId } = req.params;
  const content = await fetchLessonContent(moduleId, lessonId);
  return sendSuccess(res, content);
});

export const completeLessonController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  const moduleId = parseInt(req.params.moduleId, 10);
  const lessonId = req.params.lessonId;
  const result = await completeLesson(req.user.id, moduleId, lessonId);
  await evaluateAchievements(req.user.id);
  return sendSuccess(res, result, 'Lesson complete');
});

export const getQuizController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  const moduleId = parseInt(req.params.moduleId, 10);
  const questions = await getQuiz(moduleId);
  return sendSuccess(res, { questions });
});

export const submitQuizController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  const moduleId = parseInt(req.params.moduleId, 10);
  const { answers, timeSpent } = req.body;
  const result = await submitQuiz(req.user.id, moduleId, answers, timeSpent);
  await evaluateAchievements(req.user.id);
  return sendSuccess(res, result, 'Quiz submitted');
});

export const getProgressController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  const progress = await getProgressForUser(req.user.id);
  return sendSuccess(res, progress);
});

