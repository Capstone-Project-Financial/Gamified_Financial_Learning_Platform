import { Request, Response } from 'express';

import ApiError from '../../utils/ApiError';
import asyncHandler from '../../utils/asyncHandler';
import sendSuccess from '../../utils/response';
import { evaluateAchievements, getAchievements } from './achievements.service';

export const listAchievements = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  const achievements = await getAchievements(req.user.id);
  return sendSuccess(res, achievements);
});

export const recalcAchievements = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  const achievements = await evaluateAchievements(req.user.id);
  return sendSuccess(res, achievements, 'Achievements refreshed');
});

