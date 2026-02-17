import { Router } from 'express';

import validate from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { loginSchema, signupSchema, updateProfileSchema, xpSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from './auth.schema';
import { addXp, getProfile, login, logout, signup, updateProfile, forgotPassword, resetPassword, changePassword } from './auth.controller';

const router = Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.get('/me', authenticate, getProfile);
router.post('/logout', authenticate, logout);
router.patch('/me', authenticate, validate(updateProfileSchema), updateProfile);
router.post('/xp', authenticate, validate(xpSchema), addXp);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordSchema), resetPassword);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);

export default router;

