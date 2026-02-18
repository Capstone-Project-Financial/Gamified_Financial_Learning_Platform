import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import dayjs from 'dayjs';

import { env } from '../../config/env';
import ApiError from '../../utils/ApiError';
import { calculateLevel } from '../../utils/gamification';
import { UserModel, IUserDocument } from '../../models/User';
import { WalletModel } from '../../models/Wallet';
import { ProgressModel } from '../../models/Progress';
import { buildAchievementStateFromDB } from '../learning/learning.service';

export const signToken = (userId: string) => {
  const payload = { sub: userId };
  const secret = env.JWT_SECRET as Secret;
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, secret, options);
};

export const sanitizeUser = (user: IUserDocument) => {
  const { password, ...rest } = user.toObject();
  return rest;
};

export const ensureUserCompanions = async (userId: string) => {
  const achievementState = await buildAchievementStateFromDB();
  await Promise.all([
    WalletModel.findOneAndUpdate(
      { user: userId },
      {},
      {
        upsert: true,
        setDefaultsOnInsert: true,
        new: true
      }
    ),
    ProgressModel.findOneAndUpdate(
      { user: userId },
      {
        $setOnInsert: {
          achievements: achievementState
        }
      },
      {
        upsert: true,
        setDefaultsOnInsert: true,
        new: true
      }
    )
  ]);
};

export const updateLoginStreak = (user: IUserDocument) => {
  const lastLogin = dayjs(user.lastLogin);
  const today = dayjs();
  const diff = today.startOf('day').diff(lastLogin.startOf('day'), 'day');

  if (diff === 1) {
    user.currentStreak += 1;
    user.longestStreak = Math.max(user.longestStreak, user.currentStreak);
  } else if (diff > 1) {
    user.currentStreak = 1;
  }

  user.lastLogin = new Date();
};

export const addXpToUser = async (userId: string, amount: number) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const newXp = user.xp + amount;
  user.xp = newXp;
  user.level = calculateLevel(newXp);
  await user.save();
  return sanitizeUser(user);
};

