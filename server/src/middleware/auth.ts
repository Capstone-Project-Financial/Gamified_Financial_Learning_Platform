import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';

import { env } from '../config/env';
import ApiError from '../utils/ApiError';
import { UserModel } from '../models/User';

interface TokenPayload {
  sub: string;
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication required'));
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET as Secret) as TokenPayload;
    const user = await UserModel.findById(decoded.sub);

    if (!user) {
      return next(new ApiError(401, 'User not found'));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
};

