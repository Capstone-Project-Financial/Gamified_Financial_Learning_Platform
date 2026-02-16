import { Request, Response } from 'express';

import ApiError from '../../utils/ApiError';
import asyncHandler from '../../utils/asyncHandler';
import sendSuccess from '../../utils/response';
import { getLeaderboard, getUserStanding } from './leaderboard.service';

export const getLeaderboardController = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt((req.query.limit as string) ?? '20', 10);
  const data = await getLeaderboard(Math.min(Math.max(limit, 5), 50));
  return sendSuccess(res, data);
});

export const getMyStandingController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  const standing = await getUserStanding(req.user.id);
  return sendSuccess(res, standing);
});

