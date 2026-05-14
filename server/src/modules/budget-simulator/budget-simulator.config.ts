/**
 * Budget Simulator — Centralized Configuration
 *
 * ALL tunable constants for the simulation engine live here.
 * No magic numbers in service/engine code.
 */

export const SIM_CONFIG = {
  // — Profile Presets —
  income: {
    ranges: {
      student: { min: 5000, max: 15000 },
      intern: { min: 10000, max: 25000 },
      job: { min: 25000, max: 80000 },
      freelancer: { min: 15000, max: 60000 }
    },
    absoluteMin: 5000,
    absoluteMax: 200000
  },

  // — Budget Thresholds (% of income, by lifestyle) —
  budgetThresholds: {
    minimal: { rent: 0.10, food: 0.10 },
    moderate: { rent: 0.15, food: 0.12, transport: 0.05 },
    premium: { rent: 0.20, food: 0.15, transport: 0.08, entertainment: 0.05 }
  } as Record<string, Record<string, number>>,

  // — Credit & Debt —
  credit: {
    limitMultiplier: 2,
    monthlyRate: 0.025,
    minPaymentPercent: 0.05,
    minPaymentFloor: 500
  },

  loan: {
    personalRate: 0.015,
    educationRate: 0.01
  },

  // — Investment Returns (annualized) —
  investment: {
    returnRates: {
      conservative: { min: 0.06, max: 0.08 },
      moderate: { min: 0.10, max: 0.14 },
      aggressive: { min: 0.14, max: 0.22 }
    } as Record<string, { min: number; max: number }>,
    volatility: {
      conservative: 0.01,
      moderate: 0.03,
      aggressive: 0.06
    } as Record<string, number>,
    marketSentiment: {
      bull: { chance: 0.40, bonus: { min: 0.02, max: 0.05 } },
      bear: { chance: 0.20, penalty: { min: 0.03, max: 0.08 } },
      stable: { chance: 0.40, variance: 0.01 }
    }
  },

  // — Health Score —
  healthScore: {
    weights: {
      savings: 0.25,
      debtToIncome: 0.25,
      emergencyFund: 0.20,
      spending: 0.15,
      investment: 0.15
    },
    thresholds: {
      savingsExcellent: 0.30,
      savingsGood: 0.20,
      savingsFair: 0.10,
      savingsPoor: 0.05,
      debtExcellent: 0,
      debtGood: 0.20,
      debtFair: 0.35,
      debtPoor: 0.50,
      emergencyExcellent: 3,
      emergencyGood: 2,
      emergencyFair: 1,
      spendingExcellent: 0.80,
      spendingGood: 0.95,
      spendingFair: 1.0,
      spendingPoor: 1.20,
      investmentExcellent: 0.15,
      investmentGood: 0.10,
      investmentFair: 0.05,
      investmentPoor: 0.01
    }
  },

  // — Event Engine —
  events: {
    minPerMonth: 1,
    maxPerMonth: 3,
    maxCatastrophicPer3Months: 1,
    guaranteedPositiveEvery4Months: true,
    riskMultipliers: {
      conservative: { positive: 1.3, negative: 0.7 },
      moderate: { positive: 1.0, negative: 1.0 },
      aggressive: { positive: 0.7, negative: 1.3 }
    } as Record<string, { positive: number; negative: number }>
  },

  // — Difficulty Progression —
  difficulty: {
    tiers: {
      1: { monthRange: [1, 4] as [number, number], negativeBias: 0.7, impactMultiplier: 0.8 },
      2: { monthRange: [5, 10] as [number, number], negativeBias: 1.0, impactMultiplier: 1.0 },
      3: { monthRange: [11, 24] as [number, number], negativeBias: 1.15, impactMultiplier: 1.3 }
    } as Record<number, { monthRange: [number, number]; negativeBias: number; impactMultiplier: number }>,
    getTier: (month: number): 1 | 2 | 3 => {
      if (month <= 4) return 1;
      if (month <= 10) return 2;
      return 3;
    }
  },

  // — Simulation Lifecycle —
  simulation: {
    minMonths: 3,
    maxMonths: 24,
    defaultMaxMonths: 12,
    fastForwardMaxBatch: 12
  },

  // — Gamification —
  xp: {
    monthComplete: 30,
    savingsBonus: 20,
    debtFullPayment: 25,
    goodDecision: { min: 10, max: 20 },
    goalComplete: { savings: 50, purchase: 100 },
    healthScoreHigh: 15,
    simulationComplete: 100,
    penalties: {
      overspend: -10,
      missedEmi: -15,
      ignoredDecision: -20,
      healthScoreLow: -10
    }
  },

  // — Behavioral Profile Classification —
  behaviorProfiles: {
    prudentPlanner: { minSavingsRate: 0.25, maxDebt: 0, minSmartPct: 0.70 },
    balancedBudgeter: { savingsRange: [0.15, 0.25] as [number, number] },
    riskTaker: { minRiskyPct: 0.40 },
    spendthrift: { minOverspend: 3, maxSavingsRate: 0.10 },
    debtWarrior: { hadDebt: true, paidOff: true, maxMissedEmi: 2 }
  }
} as const;

export type SimConfig = typeof SIM_CONFIG;
