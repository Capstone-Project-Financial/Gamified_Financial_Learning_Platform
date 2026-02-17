import { Request, Response } from 'express';
import crypto from 'crypto';

import ApiError from '../../utils/ApiError';
import asyncHandler from '../../utils/asyncHandler';
import sendSuccess from '../../utils/response';
import { UserModel } from '../../models/User';
import { addXpToUser, ensureUserCompanions, sanitizeUser, signToken, updateLoginStreak } from './auth.service';
import { sendPasswordResetEmail } from '../../utils/email.service';

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

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserModel.findOne({ email: req.body.email.toLowerCase() });
  
  // Always return success to prevent email enumeration
  if (!user) {
    return sendSuccess(res, { ok: true }, 'If that email exists, a reset link has been sent');
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(user.email, resetToken, user.name);
    return sendSuccess(res, { ok: true }, 'Password reset email sent');
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, 'Error sending email. Please try again later.');
  }
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  
  const user = await UserModel.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() }
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return sendSuccess(res, { ok: true }, 'Password reset successful');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  const user = await UserModel.findById(req.user.id).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isValid = await user.comparePassword(req.body.currentPassword);
  if (!isValid) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  user.password = req.body.newPassword;
  await user.save();

  return sendSuccess(res, { ok: true }, 'Password changed successfully');
});

