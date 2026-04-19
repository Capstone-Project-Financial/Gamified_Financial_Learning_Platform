import { z } from 'zod';

/* ── Profile ── */
export const createProfileSchema = z.object({
  incomeType: z.enum(['student', 'intern', 'job', 'freelancer']),
  monthlyIncome: z.number().min(5000).max(200000),
  riskLevel: z.enum(['conservative', 'moderate', 'aggressive']),
  lifestyleLevel: z.enum(['minimal', 'moderate', 'premium'])
});

export const updateProfileSchema = z.object({
  incomeType: z.enum(['student', 'intern', 'job', 'freelancer']).optional(),
  monthlyIncome: z.number().min(5000).max(200000).optional(),
  riskLevel: z.enum(['conservative', 'moderate', 'aggressive']).optional(),
  lifestyleLevel: z.enum(['minimal', 'moderate', 'premium']).optional()
});

/* ── Simulation ── */
export const createSimulationSchema = z.object({
  maxMonths: z.number().min(3).max(24).default(12)
});

/* ── Budget Allocation ── */
export const budgetAllocationSchema = z.object({
  rent: z.number().min(0),
  food: z.number().min(0),
  transport: z.number().min(0),
  entertainment: z.number().min(0),
  subscriptions: z.number().min(0),
  savings: z.number().min(0),
  investment: z.number().min(0),
  emergencyFund: z.number().min(0),
  miscellaneous: z.number().min(0)
});

/* ── Goals ── */
export const createGoalSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['savings_target', 'purchase', 'emergency_fund', 'investment_milestone', 'debt_payoff']),
  targetAmount: z.number().positive(),
  deadline: z.number().min(1).max(24).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium')
});

export const updateGoalSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  targetAmount: z.number().positive().optional(),
  deadline: z.number().min(1).max(24).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['active', 'abandoned']).optional()
});

/* ── Advance Month ── */
export const advanceMonthSchema = z.object({
  fastForward: z.boolean().default(false),
  monthsToSimulate: z.number().min(1).max(12).default(1),
  autoDecide: z.boolean().default(false)
});

/* ── Decision ── */
export const submitDecisionSchema = z.object({
  eventId: z.string().min(1),
  optionId: z.string().min(1)
});

/* ── Debt Payment ── */
export const debtPaymentSchema = z.object({
  amount: z.number().positive()
});
