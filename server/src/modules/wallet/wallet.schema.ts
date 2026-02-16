import { z } from 'zod';

export const amountSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(3)
});

export const deductSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(3)
});

export const expensesSchema = z.object({
  tax: z.number().min(0),
  rent: z.number().min(0),
  food: z.number().min(0),
  utilities: z.number().min(0),
  other: z.number().min(0)
});

