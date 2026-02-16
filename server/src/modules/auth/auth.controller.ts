import { Request, Response } from 'express';

import ApiError from '../../utils/ApiError';
import asyncHandler from '../../utils/asyncHandler';
import sendSuccess from '../../utils/response';
import { UserModel } from '../../models/User';
import { addXpToUser, ensureUserCompanions, sanitizeUser, signToken, updateLoginStreak } from './auth.service';

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const existing = await UserModel.findOne({ email: req.body.email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, 'Email already in use');
  }

  const user = await UserModel.create({ ...req.body, email: req.body.email.toLowerCase() });
  await ensureUserCompanions(user.id);

  const token = signToken(user.id);
  return sendSuccess(
    res,
    {
      token,
      user: sanitizeUser(user)
    },
    'Account created',
    201
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserModel.findOne({ email: req.body.email.toLowerCase() }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const isValid = await user.comparePassword(req.body.password);
  if (!isValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  updateLoginStreak(user);
  await user.save();
  await ensureUserCompanions(user.id);

  const token = signToken(user.id);
  return sendSuccess(res, { token, user: sanitizeUser(user) }, 'Login successful');
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }
  const freshUser = await UserModel.findById(req.user.id);
  if (!freshUser) {
    throw new ApiError(404, 'User not found');
  }
  return sendSuccess(res, sanitizeUser(freshUser));
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  return sendSuccess(res, { ok: true }, 'Logged out');
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  const updated = await UserModel.findByIdAndUpdate(req.user.id, req.body, { new: true });
  if (!updated) {
    throw new ApiError(404, 'User not found');
  }
  return sendSuccess(res, sanitizeUser(updated), 'Profile updated');
});

export const addXp = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }
  const user = await addXpToUser(req.user.id, req.body.amount);
  return sendSuccess(res, user, 'XP updated');
});

