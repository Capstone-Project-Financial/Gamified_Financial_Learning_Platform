import { Router } from 'express';
import passport from 'passport';

import validate from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { env } from '../../config/env';
import { signToken } from './auth.service';
import {
  loginSchema,
  signupSchema,
  updateProfileSchema,
  xpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyOtpSchema,
  resendOtpSchema
} from './auth.schema';
import {
  addXp,
  getProfile,
  login,
  logout,
  signup,
  updateProfile,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyOtp,
  resendOtp
} from './auth.controller';

const router = Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);
router.post('/resend-otp', validate(resendOtpSchema), resendOtp);
router.get('/me', authenticate, getProfile);
router.post('/logout', authenticate, logout);
router.patch('/me', authenticate, validate(updateProfileSchema), updateProfile);
router.post('/xp', authenticate, validate(xpSchema), addXp);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordSchema), resetPassword);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);

/* ── Google OAuth ── */
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      const clientUrl = env.CLIENT_URL || 'http://localhost:5173';
      return res.redirect(`${clientUrl}/login?error=oauth_failed`);
    }

    const token = signToken(user.id);
    const clientUrl = env.CLIENT_URL || 'http://localhost:5173';
    return res.redirect(`${clientUrl}/oauth/callback?token=${token}`);
  }
);

export default router;
