import { Schema, model, Document, Types } from 'mongoose';

/* ═══════════════════════════════════════════════════════════
   Enums & Shared Types
   ═══════════════════════════════════════════════════════════ */

export enum CycleStep {
  NOT_STARTED = 0,
  INCOME_CREDITED = 1,
  EXPENSES_PROCESSED = 2,
  EVENTS_GENERATED = 3,
  AWAITING_DECISIONS = 4,
  DECISIONS_APPLIED = 5,
  INVESTMENTS_PROCESSED = 6,
  HEALTH_CALCULATED = 7,
  REPORT_GENERATED = 8,
  MONTH_ADVANCED = 9,
  GAMIFICATION_DONE = 10
}

/* ═══════════════════════════════════════════════════════════
   1. Financial Profile
   ═══════════════════════════════════════════════════════════ */

export interface IFinancialProfile {
  user: Types.ObjectId;
  incomeType: 'student' | 'intern' | 'job' | 'freelancer';
  monthlyIncome: number;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  lifestyleLevel: 'minimal' | 'moderate' | 'premium';
}

export interface IFinancialProfileDocument extends IFinancialProfile, Document {}

const financialProfileSchema = new Schema<IFinancialProfileDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    incomeType: {
      type: String,
      enum: ['student', 'intern', 'job', 'freelancer'],
      required: true
    },
    monthlyIncome: { type: Number, required: true, min: 5000, max: 200000 },
    riskLevel: {
      type: String,
      enum: ['conservative', 'moderate', 'aggressive'],
      required: true
    },
    lifestyleLevel: {
      type: String,
      enum: ['minimal', 'moderate', 'premium'],
      required: true
    }
  },
  { timestamps: true }
);

export const FinancialProfileModel = model<IFinancialProfileDocument>(
  'FinancialProfile',
  financialProfileSchema
);

/* ═══════════════════════════════════════════════════════════
   2. Budget Allocation (embedded sub-schema)
   ═══════════════════════════════════════════════════════════ */

export interface IBudgetAllocation {
  rent: number;
  food: number;
  transport: number;
  entertainment: number;
  subscriptions: number;
  savings: number;
  investment: number;
  emergencyFund: number;
  miscellaneous: number;
}

const budgetAllocationSchema = new Schema<IBudgetAllocation>(
  {
    rent: { type: Number, default: 0, min: 0 },
    food: { type: Number, default: 0, min: 0 },
    transport: { type: Number, default: 0, min: 0 },
    entertainment: { type: Number, default: 0, min: 0 },
    subscriptions: { type: Number, default: 0, min: 0 },
    savings: { type: Number, default: 0, min: 0 },
    investment: { type: Number, default: 0, min: 0 },
    emergencyFund: { type: Number, default: 0, min: 0 },
    miscellaneous: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

/* ═══════════════════════════════════════════════════════════
   3. Goal (embedded sub-schema on Simulation)
   ═══════════════════════════════════════════════════════════ */

export interface IGoal {
  goalId: string;
  name: string;
  type: 'savings_target' | 'purchase' | 'emergency_fund' | 'investment_milestone' | 'debt_payoff';
  targetAmount: number;
  currentAmount: number;
  deadline?: number;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'abandoned';
  completedAtMonth?: number;
}

const goalSchema = new Schema<IGoal>(
  {
    goalId: { type: String, required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['savings_target', 'purchase', 'emergency_fund', 'investment_milestone', 'debt_payoff'],
      required: true
    },
    targetAmount: { type: Number, required: true, min: 1 },
    currentAmount: { type: Number, default: 0 },
    deadline: Number,
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
    completedAtMonth: Number
  },
  { _id: false }
);

/* ═══════════════════════════════════════════════════════════
   4. Behavior Metrics (embedded sub-schema on Simulation)
   ═══════════════════════════════════════════════════════════ */

export interface IBehaviorMetrics {
  overspendCount: number;
  missedEmiCount: number;
  riskyDecisionCount: number;
  smartDecisionCount: number;
  avoidantDecisionCount: number;
  neutralDecisionCount: number;
  consecutiveSavingMonths: number;
  maxConsecutiveSaving: number;
  maxDebtReached: number;
  budgetAdherenceHistory: number[];
}

const behaviorMetricsSchema = new Schema<IBehaviorMetrics>(
  {
    overspendCount: { type: Number, default: 0 },
    missedEmiCount: { type: Number, default: 0 },
    riskyDecisionCount: { type: Number, default: 0 },
    smartDecisionCount: { type: Number, default: 0 },
    avoidantDecisionCount: { type: Number, default: 0 },
    neutralDecisionCount: { type: Number, default: 0 },
    consecutiveSavingMonths: { type: Number, default: 0 },
    maxConsecutiveSaving: { type: Number, default: 0 },
    maxDebtReached: { type: Number, default: 0 },
    budgetAdherenceHistory: { type: [Number], default: [] }
  },
  { _id: false }
);

/* ═══════════════════════════════════════════════════════════
   5. Behavioral Report (generated at simulation end)
   ═══════════════════════════════════════════════════════════ */

export interface IBehavioralReport {
  archetype: string;
  archetypeDescription: string;
  topThreeDecisions: Array<{
    month: number;
    eventTitle: string;
    choiceLabel: string;
    financialImpact: string;
    rootCause?: string;
    counterfactualImpact: string;
  }>;
  conceptsLearned: string[];
  conceptsNotEncountered: string[];
  realLifeActions: string[];
  streaks: {
    longestSavingsStreak: number;
    smartDecisionStreak: number;
  };
}

/* ═══════════════════════════════════════════════════════════
   6. Final Summary (embedded sub-schema on Simulation)
   ═══════════════════════════════════════════════════════════ */

export interface IFinalSummary {
  totalMonths: number;
  totalIncomeEarned: number;
  totalExpenses: number;
  totalSavings: number;
  totalDebtAccumulated: number;
  totalDebtPaid: number;
  finalDebt: number;
  investmentPerformance: {
    totalInvested: number;
    finalValue: number;
    returnPercent: number;
  };
  finalHealthScore: number;
  averageHealthScore: number;
  healthScoreTrend: number[];
  goalsCompleted: number;
  goalsTotal: number;
  totalXpEarned: number;
  eventsHandled: number;
  goodDecisions: number;
  badDecisions: number;
  behavioralProfile: string;
  insights: string[];
  /** Enhanced behavioral report with archetype, top decisions, etc. */
  behavioralReport?: IBehavioralReport;
  /** AI-generated personalized coaching report (requires GEMINI_API_KEY) */
  aiCoachingReport?: {
    personalizedLetter: string;
    biggestStrength: string;
    criticalImprovement: string;
    motivationalClosing: string;
    generatedAt: Date;
  };
}

const behavioralReportSchema = new Schema(
  {
    archetype: String,
    archetypeDescription: String,
    topThreeDecisions: [{
      month: Number,
      eventTitle: String,
      choiceLabel: String,
      financialImpact: String,
      rootCause: String,
      counterfactualImpact: String
    }],
    conceptsLearned: [String],
    conceptsNotEncountered: [String],
    realLifeActions: [String],
    streaks: {
      longestSavingsStreak: Number,
      smartDecisionStreak: Number
    }
  },
  { _id: false }
);

const finalSummarySchema = new Schema<IFinalSummary>(
  {
    totalMonths: Number,
    totalIncomeEarned: Number,
    totalExpenses: Number,
    totalSavings: Number,
    totalDebtAccumulated: Number,
    totalDebtPaid: Number,
    finalDebt: Number,
    investmentPerformance: {
      totalInvested: Number,
      finalValue: Number,
      returnPercent: Number
    },
    finalHealthScore: Number,
    averageHealthScore: Number,
    healthScoreTrend: [Number],
    goalsCompleted: Number,
    goalsTotal: Number,
    totalXpEarned: Number,
    eventsHandled: Number,
    goodDecisions: Number,
    badDecisions: Number,
    behavioralProfile: String,
    insights: [String],
    behavioralReport: behavioralReportSchema,
    aiCoachingReport: {
      type: {
        personalizedLetter: String,
        biggestStrength: String,
        criticalImprovement: String,
        motivationalClosing: String,
        generatedAt: Date
      },
      _id: false
    }
  },
  { _id: false }
);

/* ═══════════════════════════════════════════════════════════
   6. Simulation (top-level session)
   ═══════════════════════════════════════════════════════════ */

export interface ISimulation {
  user: Types.ObjectId;
  profile: Types.ObjectId;
  status: 'setup' | 'active' | 'paused' | 'completed';
  cycleStatus: 'idle' | 'processing';
  currentMonth: number;
  maxMonths: number;
  currentBalance: number;
  totalSavings: number;
  emergencyFund: number;
  totalDebt: number;
  totalInvestmentValue: number;
  healthScore: number;
  currentBudget: IBudgetAllocation;
  goals: IGoal[];
  xpEarnedTotal: number;
  behaviorMetrics: IBehaviorMetrics;
  startedAt: Date;
  completedAt?: Date;
  finalSummary?: IFinalSummary;
}

export interface ISimulationDocument extends ISimulation, Document {}

const simulationSchema = new Schema<ISimulationDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    profile: { type: Schema.Types.ObjectId, ref: 'FinancialProfile', required: true },
    status: {
      type: String,
      enum: ['setup', 'active', 'paused', 'completed'],
      default: 'setup'
    },
    cycleStatus: {
      type: String,
      enum: ['idle', 'processing'],
      default: 'idle'
    },
    currentMonth: { type: Number, default: 1 },
    maxMonths: { type: Number, default: 12 },
    currentBalance: { type: Number, default: 0 },
    totalSavings: { type: Number, default: 0 },
    emergencyFund: { type: Number, default: 0 },
    totalDebt: { type: Number, default: 0 },
    totalInvestmentValue: { type: Number, default: 0 },
    healthScore: { type: Number, default: 50 },
    currentBudget: { type: budgetAllocationSchema, default: () => ({}) },
    goals: { type: [goalSchema], default: [] },
    xpEarnedTotal: { type: Number, default: 0 },
    behaviorMetrics: { type: behaviorMetricsSchema, default: () => ({}) },
    startedAt: { type: Date, default: () => new Date() },
    completedAt: Date,
    finalSummary: finalSummarySchema
  },
  { timestamps: true }
);

simulationSchema.index({ user: 1, status: 1 });

export const SimulationModel = model<ISimulationDocument>('Simulation', simulationSchema);

/* ═══════════════════════════════════════════════════════════
   7. Triggered Event & Made Decision (embedded on Month)
   ═══════════════════════════════════════════════════════════ */

export interface ITriggeredEvent {
  eventId: string;
  title: string;
  description: string;
  category: 'positive' | 'negative' | 'neutral';
  financialImpact: number;
  requiresDecision: boolean;
  resolved: boolean;
  decisionMade?: IMadeDecision;
  /** Stores AI-generated options so the backend can look up mathematical impacts later */
  dynamicOptions?: {
    optionId: string;
    label: string;
    description: string;
    immediateEffect: { balance?: number; savings?: number; debt?: number };
    futureEffect?: {
      monthsAffected: number;
      monthlyImpact: number;
      type: 'expense' | 'income' | 'debt_payment';
    };
    xpModifier: number;
    healthScoreImpact: number;
    behaviorTag: 'smart' | 'risky' | 'avoidant' | 'neutral';
    requiresSavings?: boolean;
    requiresCredit?: boolean;
    explanation: string;
    counterfactual?: string;
  }[];
}

export interface IMadeDecision {
  eventId: string;
  optionId: string;
  label: string;
  immediateEffect: { balance?: number; savings?: number; debt?: number };
  futureEffect?: {
    monthsAffected: number;
    monthlyImpact: number;
    type: 'expense' | 'income' | 'debt_payment';
    remainingMonths?: number;
  };
  xpModifier: number;
  healthScoreImpact: number;
  behaviorTag: 'smart' | 'risky' | 'avoidant' | 'neutral';
  /** Explanation shown AFTER the user picks this option */
  explanation?: string;
  /** What would have happened with the best option instead */
  counterfactual?: string;
}

const madeDecisionSchema = new Schema<IMadeDecision>(
  {
    eventId: { type: String, required: true },
    optionId: { type: String, required: true },
    label: String,
    immediateEffect: {
      balance: Number,
      savings: Number,
      debt: Number
    },
    futureEffect: {
      monthsAffected: Number,
      monthlyImpact: Number,
      type: { type: String, enum: ['expense', 'income', 'debt_payment'] },
      remainingMonths: Number
    },
    xpModifier: { type: Number, default: 0 },
    healthScoreImpact: { type: Number, default: 0 },
    behaviorTag: { type: String, enum: ['smart', 'risky', 'avoidant', 'neutral'], default: 'neutral' },
    explanation: String,
    counterfactual: String
  },
  { _id: false }
);

const dynamicOptionSchema = new Schema(
  {
    optionId: { type: String, required: true },
    label: { type: String, required: true },
    description: { type: String, required: true },
    immediateEffect: {
      balance: Number,
      savings: Number,
      debt: Number
    },
    futureEffect: {
      monthsAffected: Number,
      monthlyImpact: Number,
      type: { type: String, enum: ['expense', 'income', 'debt_payment'] }
    },
    xpModifier: { type: Number, default: 0 },
    healthScoreImpact: { type: Number, default: 0 },
    behaviorTag: { type: String, enum: ['smart', 'risky', 'avoidant', 'neutral'], default: 'neutral' },
    requiresSavings: Boolean,
    requiresCredit: Boolean,
    explanation: String,
    counterfactual: String
  },
  { _id: false }
);

const triggeredEventSchema = new Schema<ITriggeredEvent>(
  {
    eventId: { type: String, required: true },
    title: String,
    description: String,
    category: { type: String, enum: ['positive', 'negative', 'neutral'] },
    financialImpact: { type: Number, default: 0 },
    requiresDecision: { type: Boolean, default: false },
    resolved: { type: Boolean, default: false },
    decisionMade: madeDecisionSchema,
    dynamicOptions: [dynamicOptionSchema]
  },
  { _id: false }
);

/* ═══════════════════════════════════════════════════════════
   8. Health Breakdown (embedded on Month)
   ═══════════════════════════════════════════════════════════ */

export interface IHealthBreakdown {
  savingsScore: number;
  debtScore: number;
  emergencyFundScore: number;
  spendingScore: number;
  investmentScore: number;
  insights: string[];
  actionableTips?: {
    savingsTip?: string;
    debtTip?: string;
    emergencyFundTip?: string;
    spendingTip?: string;
    investmentTip?: string;
  };
}

const healthBreakdownSchema = new Schema<IHealthBreakdown>(
  {
    savingsScore: { type: Number, default: 0 },
    debtScore: { type: Number, default: 0 },
    emergencyFundScore: { type: Number, default: 0 },
    spendingScore: { type: Number, default: 0 },
    investmentScore: { type: Number, default: 0 },
    insights: { type: [String], default: [] },
    actionableTips: {
      savingsTip: String,
      debtTip: String,
      emergencyFundTip: String,
      spendingTip: String,
      investmentTip: String
    }
  },
  { _id: false }
);

/* ═══════════════════════════════════════════════════════════
   9. Simulation Month (per-cycle snapshot)
   ═══════════════════════════════════════════════════════════ */

export interface ISimulationMonth {
  simulation: Types.ObjectId;
  monthNumber: number;
  cycleStep: CycleStep;
  eventSeed: string;
  status: 'pending' | 'income_credited' | 'expenses_processed' | 'events_generated' | 'awaiting_decisions' | 'completed';
  incomeReceived: number;
  budgetUsed: IBudgetAllocation;
  fixedExpenses: { category: string; amount: number }[];
  events: ITriggeredEvent[];
  decisions: IMadeDecision[];
  balanceStart: number;
  balanceEnd: number;
  savingsBalance: number;
  debtBalance: number;
  investmentValue: number;
  healthScore: number;
  healthBreakdown: IHealthBreakdown;
  xpEarned: number;
  isFastForwarded: boolean;
  /** Concept card titles encountered this month (from canonical 10) */
  conceptsEncountered: string[];
}

export interface ISimulationMonthDocument extends ISimulationMonth, Document {}

const simulationMonthSchema = new Schema<ISimulationMonthDocument>(
  {
    simulation: { type: Schema.Types.ObjectId, ref: 'Simulation', required: true },
    monthNumber: { type: Number, required: true },
    cycleStep: { type: Number, default: CycleStep.NOT_STARTED },
    eventSeed: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'income_credited', 'expenses_processed', 'events_generated', 'awaiting_decisions', 'completed'],
      default: 'pending'
    },
    incomeReceived: { type: Number, default: 0 },
    budgetUsed: { type: budgetAllocationSchema, default: () => ({}) },
    fixedExpenses: {
      type: [{ category: String, amount: Number }],
      default: []
    },
    events: { type: [triggeredEventSchema], default: [] },
    decisions: { type: [madeDecisionSchema], default: [] },
    balanceStart: { type: Number, default: 0 },
    balanceEnd: { type: Number, default: 0 },
    savingsBalance: { type: Number, default: 0 },
    debtBalance: { type: Number, default: 0 },
    investmentValue: { type: Number, default: 0 },
    healthScore: { type: Number, default: 0 },
    healthBreakdown: { type: healthBreakdownSchema, default: () => ({}) },
    xpEarned: { type: Number, default: 0 },
    isFastForwarded: { type: Boolean, default: false },
    conceptsEncountered: { type: [String], default: [] }
  },
  { timestamps: true }
);

simulationMonthSchema.index({ simulation: 1, monthNumber: 1 }, { unique: true });

export const SimulationMonthModel = model<ISimulationMonthDocument>(
  'SimulationMonth',
  simulationMonthSchema
);

/* ═══════════════════════════════════════════════════════════
   10. Debt
   ═══════════════════════════════════════════════════════════ */

export interface IDebt {
  simulation: Types.ObjectId;
  type: 'credit_card' | 'personal_loan' | 'education_loan';
  principal: number;
  outstandingBalance: number;
  interestRate: number;
  emiAmount: number;
  tenure: number;
  remainingTenure: number;
  monthsDelinquent: number;
  status: 'active' | 'paid_off' | 'defaulted';
  createdAtMonth: number;
}

export interface IDebtDocument extends IDebt, Document {}

const debtSchema = new Schema<IDebtDocument>(
  {
    simulation: { type: Schema.Types.ObjectId, ref: 'Simulation', required: true },
    type: {
      type: String,
      enum: ['credit_card', 'personal_loan', 'education_loan'],
      required: true
    },
    principal: { type: Number, required: true },
    outstandingBalance: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    emiAmount: { type: Number, required: true },
    tenure: { type: Number, required: true },
    remainingTenure: { type: Number, required: true },
    monthsDelinquent: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'paid_off', 'defaulted'],
      default: 'active'
    },
    createdAtMonth: { type: Number, required: true }
  },
  { timestamps: true }
);

debtSchema.index({ simulation: 1, status: 1 });

export const DebtModel = model<IDebtDocument>('SimDebt', debtSchema);

/* ═══════════════════════════════════════════════════════════
   11. Investment
   ═══════════════════════════════════════════════════════════ */

export interface IInvestment {
  simulation: Types.ObjectId;
  type: 'sip';
  monthlyAmount: number;
  totalInvested: number;
  currentValue: number;
  returnRate: number;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  monthlyHistory: { month: number; invested: number; value: number }[];
  status: 'active' | 'withdrawn';
}

export interface IInvestmentDocument extends IInvestment, Document {}

const investmentSchema = new Schema<IInvestmentDocument>(
  {
    simulation: { type: Schema.Types.ObjectId, ref: 'Simulation', required: true },
    type: { type: String, enum: ['sip'], default: 'sip' },
    monthlyAmount: { type: Number, default: 0 },
    totalInvested: { type: Number, default: 0 },
    currentValue: { type: Number, default: 0 },
    returnRate: { type: Number, default: 0 },
    riskProfile: {
      type: String,
      enum: ['conservative', 'moderate', 'aggressive'],
      default: 'moderate'
    },
    monthlyHistory: {
      type: [{ month: Number, invested: Number, value: Number }],
      default: []
    },
    status: { type: String, enum: ['active', 'withdrawn'], default: 'active' }
  },
  { timestamps: true }
);

investmentSchema.index({ simulation: 1 });

export const InvestmentModel = model<IInvestmentDocument>('SimInvestment', investmentSchema);

/* ═══════════════════════════════════════════════════════════
   12. Simulation Log
   ═══════════════════════════════════════════════════════════ */

export interface ISimulationLog {
  simulation: Types.ObjectId;
  monthNumber: number;
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  step: CycleStep;
  action: string;
  detail: Record<string, unknown>;
}

export interface ISimulationLogDocument extends ISimulationLog, Document {}

const simulationLogSchema = new Schema<ISimulationLogDocument>(
  {
    simulation: { type: Schema.Types.ObjectId, ref: 'Simulation', required: true },
    monthNumber: { type: Number, required: true },
    timestamp: { type: Date, default: () => new Date() },
    level: { type: String, enum: ['info', 'warn', 'error'], default: 'info' },
    step: { type: Number, required: true },
    action: { type: String, required: true },
    detail: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: false }
);

simulationLogSchema.index({ simulation: 1, monthNumber: 1, timestamp: 1 });

export const SimulationLogModel = model<ISimulationLogDocument>(
  'SimulationLog',
  simulationLogSchema
);
