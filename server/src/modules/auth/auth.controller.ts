import { Request, Response } from 'express';
import crypto from 'crypto';

import ApiError from '../../utils/ApiError';
import asyncHandler from '../../utils/asyncHandler';
import sendSuccess from '../../utils/response';
import { UserModel } from '../../models/User';
import { addXpToUser, ensureUserCompanions, sanitizeUser, signToken, updateLoginStreak } from './auth.service';
import { sendPasswordResetEmail, sendOtpEmail } from '../../utils/email.service';

/* ── Pending signup store (in-memory, TTL 10 min) ── */
interface PendingSignup {
  userData: {
    name: string;
    email: string;
    password: string;
    age?: number;
    grade?: string;
    school?: string;
  };
  hashedOtp: string;
  expires: Date;
}
const pendingSignups = new Map<string, PendingSignup>();

// Clean up expired entries periodically
setInterval(() => {
  const now = new Date();
  for (const [email, entry] of pendingSignups.entries()) {
    if (entry.expires < now) pendingSignups.delete(email);
  }
}, 5 * 60 * 1000); // every 5 minutes

/* ── Helpers ── */
const generateOtp = (): { otp: string; hashedOtp: string } => {
  const otp = String(Math.floor(1000000 + Math.random() * 9000000)); // 7-digit
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
  return { otp, hashedOtp };
};

/* ── Controllers ── */

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, age, grade, school } = req.body;

  const existing = await UserModel.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, 'Email already in use');
  }

  // If a valid pending signup already exists for this email, don't overwrite it.
  // This prevents double-click race conditions from generating two different OTPs.
  const existingPending = pendingSignups.get(email.toLowerCase());
  if (existingPending && existingPending.expires > new Date()) {
    return sendSuccess(res, { requiresOtp: true, flow: 'signup' }, 'Verification code already sent. Please check your email.', 200);
  }

  const { otp, hashedOtp } = generateOtp();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  pendingSignups.set(email.toLowerCase(), {
    userData: { name, email: email.toLowerCase(), password, age, grade, school },
    hashedOtp,
    expires
  });

  await sendOtpEmail(email, otp, name, 'signup');

  return sendSuccess(res, { requiresOtp: true, flow: 'signup' }, 'Verification code sent to your email', 200);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserModel.findOne({ email: req.body.email.toLowerCase() }).select('+password +loginOtp +loginOtpExpires');
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const isValid = await user.comparePassword(req.body.password);
  if (!isValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // If a valid OTP already exists (not expired), don't generate a new one.
  // This prevents race conditions from double-clicks overwriting the OTP in DB.
  if (user.loginOtp && user.loginOtpExpires && user.loginOtpExpires > new Date()) {
    console.log(`[OTP-DEBUG] Login: Reusing existing OTP for ${req.body.email}. Stored hash: ${user.loginOtp}`);
    return sendSuccess(res, { requiresOtp: true, flow: 'login' }, 'Verification code already sent. Please check your email.', 200);
  }

  const otp = user.createLoginOtp();
  await user.save({ validateBeforeSave: false });
  console.log(`[OTP-DEBUG] Login: Generated NEW OTP for ${req.body.email}. New stored hash: ${user.loginOtp}`);

  await sendOtpEmail(user.email, otp, user.name, 'login');

  return sendSuccess(res, { requiresOtp: true, flow: 'login' }, 'Verification code sent to your email', 200);
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, flow } = req.body;
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

  console.log(`[OTP-DEBUG] Verifying OTP for: ${email} (${flow})`);
  console.log(`[OTP-DEBUG] Raw OTP received: "${otp}" (length: ${otp.length})`);
  console.log(`[OTP-DEBUG] Input OTP Hash: ${hashedOtp}`);

  if (flow === 'signup') {
    const pending = pendingSignups.get(email.toLowerCase());
    if (!pending) {
      console.log(`[OTP-DEBUG] No pending signup found for ${email}`);
      throw new ApiError(400, 'No pending signup found. Please sign up again.');
    }
    
    console.log(`[OTP-DEBUG] Pending Signup Found. Stored OTP Hash: ${pending.hashedOtp}`);
    
    if (pending.expires < new Date()) {
      pendingSignups.delete(email.toLowerCase());
      throw new ApiError(400, 'Verification code has expired. Please sign up again.');
    }
    if (pending.hashedOtp !== hashedOtp) {
      console.log(`[OTP-DEBUG] Hash Mismatch! Input: ${hashedOtp} vs Stored: ${pending.hashedOtp}`);
      throw new ApiError(400, 'Invalid verification code');
    }

    // Create the user account
    const user = await UserModel.create(pending.userData);
    pendingSignups.delete(email.toLowerCase());
    await ensureUserCompanions(user.id);

    const token = signToken(user.id);
    return sendSuccess(res, { token, user: sanitizeUser(user) }, 'Account created successfully', 201);
  }

  // flow === 'login'
  const user = await UserModel.findOne({ email: email.toLowerCase() }).select('+loginOtp +loginOtpExpires');
  if (!user) {
    throw new ApiError(400, 'Invalid or expired verification code');
  }
  
  console.log(`[OTP-DEBUG] Login User Found. Stored OTP Hash: ${user.loginOtp}`);

  if (!user.loginOtp || !user.loginOtpExpires || user.loginOtpExpires < new Date()) {
    throw new ApiError(400, 'Verification code has expired. Please log in again.');
  }
  if (user.loginOtp !== hashedOtp) {
    console.log(`[OTP-DEBUG] Hash Mismatch! Input: ${hashedOtp} vs Stored: ${user.loginOtp}`);
    throw new ApiError(400, 'Invalid verification code');
  }

  // Clear OTP and complete login
  user.loginOtp = undefined;
  user.loginOtpExpires = undefined;
  updateLoginStreak(user);
  await user.save({ validateBeforeSave: false });
  await ensureUserCompanions(user.id);

  const token = signToken(user.id);
  return sendSuccess(res, { token, user: sanitizeUser(user) }, 'Login successful');
});

export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, flow, password } = req.body;

  if (flow === 'signup') {
    const pending = pendingSignups.get(email.toLowerCase());
    if (!pending) {
      throw new ApiError(400, 'No pending signup found. Please sign up again.');
    }
    // Cooldown: only allow resend if the OTP was sent more than 60 seconds ago
    const sentAgo = (pending.expires.getTime() - 10 * 60 * 1000); // when it was created
    const secondsSinceSent = (Date.now() - sentAgo) / 1000;
    if (secondsSinceSent < 60) {
      const waitSeconds = Math.ceil(60 - secondsSinceSent);
      throw new ApiError(429, `Please wait ${waitSeconds} seconds before requesting a new code.`);
    }
    const { otp, hashedOtp } = generateOtp();
    pending.hashedOtp = hashedOtp;
    pending.expires = new Date(Date.now() + 10 * 60 * 1000);
    await sendOtpEmail(email, otp, pending.userData.name, 'signup');
    return sendSuccess(res, { ok: true }, 'New verification code sent');
  }

  // flow === 'login' — re-validate password before resending
  if (!password) {
    throw new ApiError(400, 'Password is required to resend login OTP');
  }
  const user = await UserModel.findOne({ email: email.toLowerCase() }).select('+password +loginOtp +loginOtpExpires');
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }
  const isValid = await user.comparePassword(password);
  if (!isValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // Cooldown: only allow resend if the OTP was sent more than 60 seconds ago
  if (user.loginOtp && user.loginOtpExpires) {
    const sentAgo = user.loginOtpExpires.getTime() - 10 * 60 * 1000; // when it was created
    const secondsSinceSent = (Date.now() - sentAgo) / 1000;
    if (secondsSinceSent < 60) {
      const waitSeconds = Math.ceil(60 - secondsSinceSent);
      throw new ApiError(429, `Please wait ${waitSeconds} seconds before requesting a new code.`);
    }
  }

  const otp = user.createLoginOtp();
  await user.save({ validateBeforeSave: false });
  await sendOtpEmail(user.email, otp, user.name, 'login');
  return sendSuccess(res, { ok: true }, 'New verification code sent');
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
