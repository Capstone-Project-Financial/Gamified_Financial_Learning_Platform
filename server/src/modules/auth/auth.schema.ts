import { z } from 'zod';

/* ── Password must have: 8+ chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char ── */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one digit')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const signupSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must not exceed 50 characters')
    .trim(),
  email: z
    .string()
    .email('Invalid email address')
    .max(100, 'Email must not exceed 100 characters')
    .trim()
    .toLowerCase(),
  password: passwordSchema,
  age: z.coerce.number().min(5, 'Age must be at least 5').max(25, 'Age must be at most 25').optional(),
  grade: z.string().max(20).optional(),
  school: z.string().max(100).optional()
});

export const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .trim()
    .toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(50).trim().optional(),
  age: z.coerce.number().min(5).max(25).optional(),
  grade: z.string().max(20).optional(),
  school: z.string().max(100).optional(),
  knowledgeLevel: z.string().optional()
});

export const xpSchema = z.object({
  amount: z.coerce.number().min(1).max(1000)
});
