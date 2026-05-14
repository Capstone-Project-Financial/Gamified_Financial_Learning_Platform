import crypto from 'crypto';
import ApiError from '../../utils/ApiError';
import { SIM_CONFIG } from './budget-simulator.config';
import { SimulationLogger } from './budget-simulator.logger';
import { generateMonthEvents, generateEventSeed, getEventTemplate, scaleDecisionOptions, computeImpactAmount } from './budget-simulator.events';
import { generateMonthEventsViaAI, generateMonthlyInsight, generateGoalSuggestions, generatePortfolioAdvice, generateBudgetNarrative } from './budget-simulator.ai';
import { evaluateMonthGamification, awardXp } from './budget-simulator.gamification';
import {
  FinancialProfileModel,
  SimulationModel,
  SimulationMonthModel,
  DebtModel,
  InvestmentModel,
  CycleStep,
  IBudgetAllocation,
  ISimulationDocument,
  ISimulationMonthDocument,
  IFinancialProfileDocument,
  ITriggeredEvent,
  IHealthBreakdown,
  IBehavioralReport,
  IInvestmentPL,
  IDebtDetail,
  IGoalSnapshot
} from '../../models/BudgetSimulator';
import { CANONICAL_CONCEPTS } from '../../data/budget-simulator-events';
import { generateAICoachingReport, SimulationDataForAI } from './budget-simulator.ai';

/* ═══════════════════════════════════════════════════════════
   PROFILE CRUD
   ═══════════════════════════════════════════════════════════ */

export const getProfile = async (userId: string) => {
  return FinancialProfileModel.findOne({ user: userId });
};

export const createProfile = async (
  userId: string,
  data: { incomeType: string; monthlyIncome: number; riskLevel: string; lifestyleLevel: string }
) => {
  const existing = await FinancialProfileModel.findOne({ user: userId });
  if (existing) throw new ApiError(409, 'Financial profile already exists. Use PATCH to update.');
  return FinancialProfileModel.create({ user: userId, ...data });
};

export const updateProfile = async (userId: string, data: Record<string, unknown>) => {
  const profile = await FinancialProfileModel.findOneAndUpdate({ user: userId }, data, {
    new: true,
    runValidators: true
  });
  if (!profile) throw new ApiError(404, 'Financial profile not found');
  return profile;
};

/* ═══════════════════════════════════════════════════════════
   SIMULATION LIFECYCLE
   ═══════════════════════════════════════════════════════════ */

export const createSimulation = async (userId: string, maxMonths: number) => {
  // Ensure profile exists
  const profile = await FinancialProfileModel.findOne({ user: userId });
  if (!profile) throw new ApiError(400, 'Create a financial profile first');

  // Only one active sim at a time
  const active = await SimulationModel.findOne({ user: userId, status: { $in: ['setup', 'active', 'paused'] } });
  if (active) throw new ApiError(409, 'You already have an active simulation. End it before starting a new one.');

  return SimulationModel.create({
    user: userId,
    profile: profile._id,
    status: 'setup',
    maxMonths: maxMonths || SIM_CONFIG.simulation.defaultMaxMonths,
    currentBalance: 0,
    totalSavings: 0,
    emergencyFund: 0,
    totalDebt: 0,
    totalInvestmentValue: 0,
    currentBudget: {},
    goals: [],
    behaviorMetrics: {}
  });
};

export const getActiveSimulation = async (userId: string) => {
  return SimulationModel.findOne({ user: userId, status: { $in: ['setup', 'active', 'paused'] } });
};

export const getSimulation = async (simulationId: string, userId: string) => {
  const sim = await SimulationModel.findOne({ _id: simulationId, user: userId });
  if (!sim) throw new ApiError(404, 'Simulation not found');
  return sim;
};

export const getSimulationHistory = async (userId: string) => {
  return SimulationModel.find({ user: userId, status: 'completed' })
    .sort({ completedAt: -1 })
    .select('currentMonth maxMonths healthScore xpEarnedTotal completedAt startedAt finalSummary.behavioralProfile');
};

export const endSimulation = async (simulationId: string, userId: string) => {
  const sim = await SimulationModel.findOne({ _id: simulationId, user: userId });
  if (!sim) throw new ApiError(404, 'Simulation not found');
  if (sim.status === 'completed') throw new ApiError(409, 'Simulation already completed');
  if (sim.currentMonth < SIM_CONFIG.simulation.minMonths + 1) {
    throw new ApiError(400, `Complete at least ${SIM_CONFIG.simulation.minMonths} months before ending`);
  }

  // Generate final summary
  const months = await SimulationMonthModel.find({ simulation: simulationId }).sort({ monthNumber: 1 });
  const debts = await DebtModel.find({ simulation: simulationId });
  const investments = await InvestmentModel.find({ simulation: simulationId });
  const profile = await FinancialProfileModel.findById(sim.profile);

  const totalIncomeEarned = months.reduce((s, m) => s + m.incomeReceived, 0);
  const totalExpenses = months.reduce((s, m) => s + m.fixedExpenses.reduce((a, e) => a + e.amount, 0), 0);
  const healthScores = months.filter(m => m.status === 'completed').map(m => m.healthScore);
  const avgHealth = healthScores.length > 0 ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length) : 0;

  const totalDebtAccumulated = debts.reduce((s, d) => s + d.principal, 0);
  const totalDebtPaid = debts.reduce((s, d) => s + (d.principal - d.outstandingBalance), 0);
  const finalDebt = debts.filter(d => d.status === 'active').reduce((s, d) => s + d.outstandingBalance, 0);

  const investmentPerf = investments.reduce(
    (acc, inv) => ({
      totalInvested: acc.totalInvested + inv.totalInvested,
      finalValue: acc.finalValue + inv.currentValue,
      returnPercent: 0
    }),
    { totalInvested: 0, finalValue: 0, returnPercent: 0 }
  );
  if (investmentPerf.totalInvested > 0) {
    investmentPerf.returnPercent = Math.round(
      ((investmentPerf.finalValue - investmentPerf.totalInvested) / investmentPerf.totalInvested) * 100
    );
  }

  const allDecisions = months.flatMap(m => m.decisions);
  const goodDecisions = allDecisions.filter(d => d.behaviorTag === 'smart').length;
  const badDecisions = allDecisions.filter(d => d.behaviorTag === 'avoidant' || d.behaviorTag === 'risky').length;

  // Determine behavioral profile (legacy)
  const behavioralProfile = determineBehavioralProfile(sim, allDecisions.length, goodDecisions, badDecisions);

  // Generate insights
  const insights = generateInsights(sim, avgHealth, goodDecisions, badDecisions, finalDebt);

  const completedGoals = sim.goals.filter(g => g.status === 'completed').length;

  // ── Build enhanced behavioral report ──
  const behavioralReport = buildBehavioralReport(sim, months, profile);

  // ── Generate AI Coaching Report (graceful fallback if API key not set) ──
  let aiCoachingReport = null;
  try {
    const aiData: SimulationDataForAI = {
      monthlyIncome: profile?.monthlyIncome || 25000,
      totalMonths: sim.currentMonth - 1,
      totalSavings: sim.totalSavings,
      totalDebt: sim.totalDebt,
      emergencyFund: sim.emergencyFund,
      investmentValue: sim.totalInvestmentValue,
      healthScore: sim.healthScore,
      avgHealthScore: avgHealth,
      smartDecisions: sim.behaviorMetrics.smartDecisionCount,
      riskyDecisions: sim.behaviorMetrics.riskyDecisionCount,
      avoidantDecisions: sim.behaviorMetrics.avoidantDecisionCount,
      missedEmis: sim.behaviorMetrics.missedEmiCount,
      overspendCount: sim.behaviorMetrics.overspendCount,
      longestSavingStreak: sim.behaviorMetrics.maxConsecutiveSaving,
      goalsCompleted: completedGoals,
      goalsTotal: sim.goals.length,
      archetype: behavioralReport.archetype,
      topDecisions: behavioralReport.topThreeDecisions.map(d => ({
        month: d.month,
        event: d.eventTitle,
        choice: d.choiceLabel,
        impact: d.financialImpact
      })),
      conceptsLearned: behavioralReport.conceptsLearned
    };
    aiCoachingReport = await generateAICoachingReport(aiData);
  } catch (error) {
    console.error('[AI Coach] Error during AI report generation:', error);
  }

  sim.finalSummary = {
    totalMonths: sim.currentMonth - 1,
    totalIncomeEarned,
    totalExpenses,
    totalSavings: sim.totalSavings,
    totalDebtAccumulated,
    totalDebtPaid,
    finalDebt,
    investmentPerformance: investmentPerf,
    finalHealthScore: sim.healthScore,
    averageHealthScore: avgHealth,
    healthScoreTrend: healthScores,
    goalsCompleted: completedGoals,
    goalsTotal: sim.goals.length,
    totalXpEarned: sim.xpEarnedTotal,
    eventsHandled: months.reduce((s, m) => s + m.events.length, 0),
    goodDecisions,
    badDecisions,
    behavioralProfile,
    insights,
    behavioralReport,
    ...(aiCoachingReport ? { aiCoachingReport } : {})
  };
  sim.status = 'completed';
  sim.completedAt = new Date();
  await sim.save();

  // Final XP award
  await awardXp(userId, simulationId, SIM_CONFIG.xp.simulationComplete, 'Simulation completed', sim.currentMonth - 1);

  return sim;
};

/* ═══════════════════════════════════════════════════════════
   BUDGET ALLOCATION
   ═══════════════════════════════════════════════════════════ */

export const setBudget = async (simulationId: string, userId: string, allocations: IBudgetAllocation) => {
  const sim = await SimulationModel.findOne({ _id: simulationId, user: userId });
  if (!sim) throw new ApiError(404, 'Simulation not found');

  const profile = await FinancialProfileModel.findById(sim.profile);
  if (!profile) throw new ApiError(400, 'Financial profile not found');

  // Validate total <= income
  const total = Object.values(allocations).reduce((sum, val) => sum + val, 0);
  if (total > profile.monthlyIncome) {
    throw new ApiError(400, `Total allocation (${total}) exceeds monthly income (${profile.monthlyIncome})`);
  }

  // Validate minimum thresholds
  const thresholds = SIM_CONFIG.budgetThresholds[profile.lifestyleLevel] || {};
  for (const [category, minPct] of Object.entries(thresholds)) {
    const key = category as keyof IBudgetAllocation;
    const minAmount = Math.round(profile.monthlyIncome * minPct);
    if ((allocations[key] || 0) < minAmount) {
      throw new ApiError(400, `${category} must be at least ₹${minAmount} (${(minPct * 100).toFixed(0)}% of income) for ${profile.lifestyleLevel} lifestyle`);
    }
  }

  sim.currentBudget = allocations;
  if (sim.status === 'setup') {
    sim.status = 'active';
  }
  await sim.save();
  return sim;
};

export const getBudget = async (simulationId: string, userId: string) => {
  const sim = await SimulationModel.findOne({ _id: simulationId, user: userId });
  if (!sim) throw new ApiError(404, 'Simulation not found');
  return sim.currentBudget;
};

/* ═══════════════════════════════════════════════════════════
   GOALS
   ═══════════════════════════════════════════════════════════ */

export const addGoal = async (
  simulationId: string,
  userId: string,
  goalData: { name: string; type: string; targetAmount: number; deadline?: number; priority: string }
) => {
  const sim = await SimulationModel.findOne({ _id: simulationId, user: userId });
  if (!sim) throw new ApiError(404, 'Simulation not found');
  if (sim.goals.length >= 5) throw new ApiError(400, 'Maximum 5 goals allowed');

  sim.goals.push({
    goalId: crypto.randomBytes(8).toString('hex'),
    name: goalData.name,
    type: goalData.type as any,
    targetAmount: goalData.targetAmount,
    currentAmount: 0,
    deadline: goalData.deadline,
    priority: goalData.priority as any,
    status: 'active'
  });
  await sim.save();
  return sim.goals;
};

export const updateGoal = async (
  simulationId: string,
  userId: string,
  goalId: string,
  data: Record<string, unknown>
) => {
  const sim = await SimulationModel.findOne({ _id: simulationId, user: userId });
  if (!sim) throw new ApiError(404, 'Simulation not found');

  const goal = sim.goals.find((g) => g.goalId === goalId);
  if (!goal) throw new ApiError(404, 'Goal not found');

  Object.assign(goal, data);
  await sim.save();
  return sim.goals;
};

export const deleteGoal = async (simulationId: string, userId: string, goalId: string) => {
  const sim = await SimulationModel.findOne({ _id: simulationId, user: userId });
  if (!sim) throw new ApiError(404, 'Simulation not found');

  const goalIndex = sim.goals.findIndex((g) => g.goalId === goalId);
  if (goalIndex === -1) throw new ApiError(404, 'Goal not found');

  sim.goals[goalIndex].status = 'abandoned';
  await sim.save();
  return sim.goals;
};

/* ═══════════════════════════════════════════════════════════
   MONTH ADVANCEMENT — CORE ENGINE
   ═══════════════════════════════════════════════════════════ */

export const advanceMonth = async (
  simulationId: string,
  userId: string,
  options?: { fastForward?: boolean; monthsToSimulate?: number; autoDecide?: boolean }
) => {
  const sim = await SimulationModel.findOne({ _id: simulationId, user: userId });
  if (!sim) throw new ApiError(404, 'Simulation not found');
  if (sim.status !== 'active') throw new ApiError(400, 'Simulation is not active');

  // ── Idempotency Guard 1: Concurrency lock ──
  if (sim.cycleStatus === 'processing') {
    throw new ApiError(409, 'Month cycle already in progress');
  }

  // ── Idempotency Guard 2: Month already completed ──
  const existingCompleted = await SimulationMonthModel.findOne({
    simulation: simulationId,
    monthNumber: sim.currentMonth,
    cycleStep: CycleStep.GAMIFICATION_DONE
  });
  if (existingCompleted) {
    throw new ApiError(409, `Month ${sim.currentMonth} already completed`);
  }

  // Check max months
  if (sim.currentMonth > sim.maxMonths) {
    throw new ApiError(400, 'Maximum months reached. End the simulation.');
  }

  const profile = await FinancialProfileModel.findById(sim.profile);
  if (!profile) throw new ApiError(400, 'Financial profile not found');

  const monthsToRun = options?.fastForward ? Math.min(options.monthsToSimulate || 1, SIM_CONFIG.simulation.fastForwardMaxBatch) : 1;
  const results: ISimulationMonthDocument[] = [];

  // Set processing lock
  sim.cycleStatus = 'processing';
  await sim.save();

  try {
    for (let i = 0; i < monthsToRun; i++) {
      if (sim.currentMonth > sim.maxMonths) break;

      const month = await runMonthCycle(sim, profile, !!options?.fastForward, !!options?.autoDecide);
      results.push(month);

      // If events need decisions and not auto-deciding, pause
      if (!options?.autoDecide && month.events.some((e) => e.requiresDecision && !e.resolved)) {
        break;
      }
    }
  } finally {
    // Release lock
    sim.cycleStatus = 'idle';
    await sim.save();
  }

  return results;
};

/** Execute a single month cycle with step-based recovery */
async function runMonthCycle(
  sim: ISimulationDocument,
  profile: IFinancialProfileDocument,
  isFastForward: boolean,
  autoDecide: boolean
): Promise<ISimulationMonthDocument> {
  // Get or create month document
  let month = await SimulationMonthModel.findOne({
    simulation: sim._id,
    monthNumber: sim.currentMonth
  });

  if (!month) {
    month = await SimulationMonthModel.create({
      simulation: sim._id,
      monthNumber: sim.currentMonth,
      cycleStep: CycleStep.NOT_STARTED,
      eventSeed: generateEventSeed(),
      balanceStart: sim.currentBalance,
      budgetUsed: sim.currentBudget,
      isFastForwarded: isFastForward
    });
  }

  // ── Step 1: Credit Income ──
  if (month.cycleStep < CycleStep.INCOME_CREDITED) {
    month.incomeReceived = profile.monthlyIncome;
    month.balanceStart = sim.currentBalance;
    sim.currentBalance += profile.monthlyIncome;

    month.cycleStep = CycleStep.INCOME_CREDITED;
    month.status = 'income_credited';
    await month.save();

    await SimulationLogger.log(sim.id, month.monthNumber, {
      step: CycleStep.INCOME_CREDITED,
      action: 'INCOME_CREDITED',
      detail: { amount: profile.monthlyIncome, balanceAfter: sim.currentBalance }
    });
  }

  // ── Step 2: Process Fixed Expenses ──
  if (month.cycleStep < CycleStep.EXPENSES_PROCESSED) {
    await processFixedExpenses(sim, month, profile);

    month.cycleStep = CycleStep.EXPENSES_PROCESSED;
    month.status = 'expenses_processed';
    await month.save();
  }

  // ── Step 3: Generate Events ──
  if (month.cycleStep < CycleStep.EVENTS_GENERATED) {
    // Get recent events for cooldowns
    const recentMonths = await SimulationMonthModel.find({
      simulation: sim._id,
      monthNumber: { $gte: Math.max(1, month.monthNumber - 3), $lt: month.monthNumber }
    });
    const recentEventIds = recentMonths.flatMap((m) => m.events.map((e) => e.eventId));
    const recentCatastrophic = recentMonths
      .flatMap((m) => m.events)
      .filter((e) => {
        // Look up either in dynamicOptions or EVENT_POOL
        if (e.dynamicOptions && e.dynamicOptions.length > 0) return false; // AI generated events aren't strictly classified catastrophic
        const template = getEventTemplate(e.eventId);
        return template?.isCatastrophic;
      }).length;

    // Calculate sum of active debts
    const activeDebts = await DebtModel.find({ simulation: sim._id, status: 'active' });
    const totalDebtAmount = activeDebts.reduce((sum, d) => sum + d.outstandingBalance, 0);

    const activeGoals = sim.goals.filter(g => g.status === 'active').map(g => ({ name: g.name, targetAmount: g.targetAmount, currentAmount: g.currentAmount }));
    const investments = await InvestmentModel.find({ simulation: sim._id, status: 'active' });
    const activeInvestments = investments.map(i => ({ type: i.type, currentValue: i.currentValue }));
    const formattedDebts = activeDebts.map(d => ({ name: d.type, outstandingBalance: d.outstandingBalance }));

    let events: ITriggeredEvent[] | null = null;
    
    // Attempt AI Generation
    events = await generateMonthEventsViaAI({
        monthNumber: month.monthNumber,
        monthlyIncome: profile.monthlyIncome,
        riskLevel: profile.riskLevel,
        lifestyleLevel: profile.lifestyleLevel,
        totalSavings: sim.currentBalance,
        totalDebt: totalDebtAmount,
        recentEvents: recentEventIds,
        activeGoals: activeGoals,
        activeDebts: formattedDebts,
        activeInvestments: activeInvestments
    });

    if (!events) {
      console.log('[Simulator] AI generation failed or skipped, falling back to deterministic events.');
      events = generateMonthEvents(
        month.eventSeed,
        month.monthNumber,
        profile.riskLevel,
        profile.monthlyIncome,
        recentEventIds,
        recentCatastrophic
      );
    }

    // Apply non-decision events immediately
    for (const event of events) {
      if (!event.requiresDecision) {
        if (event.category === 'positive') {
          sim.currentBalance += event.financialImpact;
        } else if (event.category === 'negative') {
          sim.currentBalance -= event.financialImpact;
        }
        event.resolved = true;
      }
    }

    month.events = events;

    // Sanitize AI categories - force to valid enum values
    const validCategories = new Set(['positive', 'negative', 'neutral']);
    for (const event of month.events) {
      if (!validCategories.has(event.category)) {
        // AI sometimes puts theme names (e.g. 'family_obligation') in category.
        // Default to 'negative' for unknown categories since most events are challenges.
        event.category = 'negative';
      }
    }

    // Extract concept card titles for tracking
    const concepts: string[] = [];
    for (const event of events) {
      const tmpl = getEventTemplate(event.eventId);
      if (tmpl?.conceptCard?.title) {
        concepts.push(tmpl.conceptCard.title);
      }
    }
    month.conceptsEncountered = concepts;

    month.cycleStep = CycleStep.EVENTS_GENERATED;
    month.status = 'events_generated';
    await month.save();

    for (const event of events) {
      await SimulationLogger.log(sim.id, month.monthNumber, {
        step: CycleStep.EVENTS_GENERATED,
        action: 'EVENT_TRIGGERED',
        detail: { eventId: event.eventId, title: event.title, category: event.category, impact: event.financialImpact }
      });
    }
  }

  // ── Step 4: Await Decisions ──
  const pendingDecisions = month.events.filter((e) => e.requiresDecision && !e.resolved);

  if (pendingDecisions.length > 0 && !autoDecide) {
    month.cycleStep = CycleStep.AWAITING_DECISIONS;
    month.status = 'awaiting_decisions';
    await month.save();
    await sim.save();
    return month;
  }

  // Auto-decide if requested
  if (pendingDecisions.length > 0 && autoDecide) {
    for (const event of pendingDecisions) {
      const template = getEventTemplate(event.eventId);
      if (template && template.decisions.length > 0) {
        // Pick highest XP option
        const bestOption = [...template.decisions].sort((a, b) => b.xpModifier - a.xpModifier)[0];
        const impactAmount = event.financialImpact;
        const scaled = scaleDecisionOptions([bestOption], impactAmount)[0];

        event.resolved = true;
        event.decisionMade = {
          eventId: event.eventId,
          optionId: scaled.optionId,
          label: scaled.label,
          immediateEffect: {
            balance: scaled.immediateEffect.balance || undefined,
            savings: scaled.immediateEffect.savings || undefined,
            debt: scaled.immediateEffect.debt || undefined
          },
          futureEffect: scaled.futureEffect ? { ...scaled.futureEffect, remainingMonths: scaled.futureEffect.monthsAffected } : undefined,
          xpModifier: scaled.xpModifier,
          healthScoreImpact: scaled.healthScoreImpact,
          behaviorTag: scaled.behaviorTag
        };

        month.decisions.push(event.decisionMade);
        applyDecisionEffects(sim, event.decisionMade, month);
      }
    }
  }

  // ── Step 5: Decisions Applied ──
  if (month.cycleStep < CycleStep.DECISIONS_APPLIED) {
    month.cycleStep = CycleStep.DECISIONS_APPLIED;
    await month.save();
  }

  // ── Step 6: Process Investments ──
  if (month.cycleStep < CycleStep.INVESTMENTS_PROCESSED) {
    await processInvestments(sim, month, profile);
    month.cycleStep = CycleStep.INVESTMENTS_PROCESSED;
    await month.save();
  }

  // ── Step 7: Calculate Health Score ──
  if (month.cycleStep < CycleStep.HEALTH_CALCULATED) {
    const healthResult = calculateHealthScore(sim, profile);
    month.healthScore = healthResult.score;
    month.healthBreakdown = healthResult.breakdown;
    sim.healthScore = healthResult.score;

    // Update behavior metrics
    const budget = sim.currentBudget;
    const totalAllocated = Object.values(budget).reduce((s: number, v) => s + (v as number), 0);
    const totalSpent = month.fixedExpenses.reduce((s, e) => s + e.amount, 0);
    const adherence = totalAllocated > 0 ? totalSpent / totalAllocated : 0;
    sim.behaviorMetrics.budgetAdherenceHistory.push(Math.round(adherence * 100) / 100);

    if (adherence > 1.0) sim.behaviorMetrics.overspendCount++;

    const savingsRate = profile.monthlyIncome > 0 ? sim.totalSavings / profile.monthlyIncome : 0;
    if (savingsRate >= 0.20) {
      sim.behaviorMetrics.consecutiveSavingMonths++;
      sim.behaviorMetrics.maxConsecutiveSaving = Math.max(
        sim.behaviorMetrics.maxConsecutiveSaving,
        sim.behaviorMetrics.consecutiveSavingMonths
      );
    } else {
      sim.behaviorMetrics.consecutiveSavingMonths = 0;
    }

    month.cycleStep = CycleStep.HEALTH_CALCULATED;
    await month.save();

    await SimulationLogger.log(sim.id, month.monthNumber, {
      step: CycleStep.HEALTH_CALCULATED,
      action: 'HEALTH_SCORED',
      detail: { score: healthResult.score, breakdown: healthResult.breakdown }
    });
  }

  // ── Step 8: Generate Report ──
  if (month.cycleStep < CycleStep.REPORT_GENERATED) {
    month.balanceEnd = sim.currentBalance;
    month.savingsBalance = sim.totalSavings;
    month.debtBalance = sim.totalDebt;
    month.investmentValue = sim.totalInvestmentValue;

    // ── Capture goal snapshots BEFORE updating progress ──
    const goalSnapshotsBefore = sim.goals.map(g => ({
      goalId: g.goalId,
      name: g.name,
      type: g.type,
      targetAmount: g.targetAmount,
      previousAmount: g.currentAmount,
      status: g.status
    }));

    // Update goals
    updateGoalProgress(sim);

    // ── Investment P&L ──
    const activeInvestment = await InvestmentModel.findOne({ simulation: sim._id, status: 'active' });
    const sipAmount = sim.currentBudget.investment || 0;
    if (activeInvestment) {
      const gain = activeInvestment.currentValue - activeInvestment.totalInvested;
      const gainPercent = activeInvestment.totalInvested > 0
        ? Math.round((gain / activeInvestment.totalInvested) * 10000) / 100
        : 0;
      // Calculate market return this month from latest history entry
      const latestHistory = activeInvestment.monthlyHistory.find(h => h.month === month.monthNumber);
      const prevHistory = activeInvestment.monthlyHistory.find(h => h.month === month.monthNumber - 1);
      const prevValue = prevHistory?.value || 0;
      const marketReturn = latestHistory ? latestHistory.value - prevValue - sipAmount : 0;

      month.investmentPL = {
        totalInvested: activeInvestment.totalInvested,
        currentValue: activeInvestment.currentValue,
        gain,
        gainPercent,
        sipDeductedThisMonth: sipAmount,
        marketReturnThisMonth: Math.round(marketReturn)
      };
    } else if (sipAmount > 0) {
      // Portfolio was withdrawn but SIP still allocated
      month.investmentPL = {
        totalInvested: 0, currentValue: 0, gain: 0, gainPercent: 0,
        sipDeductedThisMonth: sipAmount, marketReturnThisMonth: 0
      };
    }

    // ── Debt Details ──
    const allDebtsForReport = await DebtModel.find({ simulation: sim._id });
    const activeDebtsForReport = allDebtsForReport.filter(d => d.status === 'active' || d.status === 'paid_off');
    const debtDetails: IDebtDetail[] = [];
    for (const debt of activeDebtsForReport) {
      const emiExpense = month.fixedExpenses.find(e => e.category === `emi_${debt.type}`);
      const emiPaid = emiExpense?.amount || 0;
      const interestPortion = emiPaid > 0 ? Math.round(debt.outstandingBalance * debt.interestRate) : 0;
      const principalPortion = emiPaid > 0 ? emiPaid - interestPortion : 0;
      const missed = !emiExpense && debt.status === 'active';
      debtDetails.push({
        type: debt.type,
        principal: debt.principal,
        outstanding: debt.outstandingBalance,
        emiPaid,
        interestPortion: Math.max(0, interestPortion),
        principalPortion: Math.max(0, principalPortion),
        missed
      });
    }
    month.debtDetails = debtDetails;

    // ── Goal Snapshots (with change tracking) ──
    const goalTypeDrivers: Record<string, string> = {
      'savings_target': 'Driven by your total savings balance — grows when you allocate to savings in your budget',
      'purchase': 'Tracked by savings — when savings reach the target, the purchase amount is auto-deducted from your balance',
      'emergency_fund': 'Driven by your emergency fund allocation in your monthly budget',
      'investment_milestone': 'Tracked by your SIP portfolio value — grows from monthly SIP + market returns',
      'debt_payoff': 'Progress = original debt minus current outstanding — grows as your EMI payments reduce the debt'
    };
    month.goalSnapshots = sim.goals.map(g => {
      const before = goalSnapshotsBefore.find(b => b.goalId === g.goalId);
      const prev = before?.previousAmount || 0;
      const change = g.currentAmount - prev;
      return {
        goalId: g.goalId,
        name: g.name,
        type: g.type,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        previousAmount: prev,
        changeThisMonth: change,
        progress: g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0,
        status: g.status,
        whatDrivesIt: goalTypeDrivers[g.type] || g.type
      };
    });

    // ── Budget Impact Narrative (deterministic, always available) ──
    const emiExpensesList = month.fixedExpenses.filter(e => e.category.startsWith('emi_'));
    const totalEmi = emiExpensesList.reduce((s, e) => s + e.amount, 0);
    const regularExpenses = month.fixedExpenses.filter(e => !e.category.startsWith('emi_') && e.category !== 'savings' && e.category !== 'emergencyFund' && e.category !== 'investment');
    const totalRegularSpend = regularExpenses.reduce((s, e) => s + e.amount, 0);
    const savingsAlloc = sim.currentBudget.savings || 0;
    const efAlloc = sim.currentBudget.emergencyFund || 0;
    const balanceChange = month.balanceEnd - month.balanceStart;

    let narrative = `Month ${month.monthNumber}: You earned ₹${profile.monthlyIncome.toLocaleString('en-IN')} as salary. `;
    narrative += `Your living expenses (rent, food, transport, etc.) cost ₹${totalRegularSpend.toLocaleString('en-IN')} (${Math.round((totalRegularSpend / profile.monthlyIncome) * 100)}% of income). `;
    if (savingsAlloc > 0) narrative += `You saved ₹${savingsAlloc.toLocaleString('en-IN')} (total savings now: ₹${sim.totalSavings.toLocaleString('en-IN')}). `;
    if (efAlloc > 0) narrative += `₹${efAlloc.toLocaleString('en-IN')} went to your emergency fund (total: ₹${sim.emergencyFund.toLocaleString('en-IN')}). `;
    if (sipAmount > 0 && month.investmentPL) {
      narrative += `Your SIP deducted ₹${sipAmount.toLocaleString('en-IN')} from your balance into your investment portfolio. `;
      if (month.investmentPL.gain !== 0) {
        const plWord = month.investmentPL.gain >= 0 ? 'gain' : 'loss';
        narrative += `Portfolio is now ₹${month.investmentPL.currentValue.toLocaleString('en-IN')} (unrealized ${plWord}: ₹${Math.abs(month.investmentPL.gain).toLocaleString('en-IN')}, ${month.investmentPL.gainPercent}%). This is NOT a cost — it's money moved from cash to investments. `;
      }
    }
    if (totalEmi > 0) {
      narrative += `Your loan EMI of ₹${totalEmi.toLocaleString('en-IN')} was auto-deducted to repay debt. `;
      for (const dd of debtDetails) {
        if (dd.emiPaid > 0) {
          narrative += `(${dd.type.replace(/_/g, ' ')}: ₹${dd.principalPortion.toLocaleString('en-IN')} went to principal, ₹${dd.interestPortion.toLocaleString('en-IN')} was interest — ₹${dd.outstanding.toLocaleString('en-IN')} still outstanding). `;
        }
        if (dd.missed) {
          narrative += `⚠️ You MISSED the ${dd.type.replace(/_/g, ' ')} EMI payment because of insufficient balance — 1.5x penalty interest was applied! `;
        }
      }
    }
    // Events
    for (const event of month.events) {
      if (event.requiresDecision && event.decisionMade) {
        const dec = event.decisionMade;
        narrative += `Then "${event.title}" happened — you chose "${dec.label}". `;
        if (dec.immediateEffect.balance && dec.immediateEffect.balance < 0) {
          narrative += `This cost ₹${Math.abs(dec.immediateEffect.balance).toLocaleString('en-IN')} from your balance. `;
        }
        if (dec.immediateEffect.savings && dec.immediateEffect.savings < 0) {
          narrative += `₹${Math.abs(dec.immediateEffect.savings).toLocaleString('en-IN')} was used from your savings. `;
        }
        if (dec.immediateEffect.debt && dec.immediateEffect.debt > 0) {
          narrative += `This added ₹${dec.immediateEffect.debt.toLocaleString('en-IN')} to your debt (EMI starts next month). `;
        }
        if (dec.immediateEffect.investment) {
          const inv = dec.immediateEffect.investment;
          narrative += inv > 0
            ? `₹${inv.toLocaleString('en-IN')} was added to your investment portfolio. `
            : `₹${Math.abs(inv).toLocaleString('en-IN')} was withdrawn from your portfolio. `;
        }
        narrative += `This was a ${dec.behaviorTag} decision. `;
      } else if (!event.requiresDecision) {
        if (event.category === 'positive') {
          narrative += `A positive event "${event.title}" added ₹${event.financialImpact.toLocaleString('en-IN')} to your balance. `;
        } else if (event.category === 'negative') {
          narrative += `An unexpected expense "${event.title}" cost ₹${event.financialImpact.toLocaleString('en-IN')}. `;
        }
      }
    }
    // Goals impact
    const completedGoals = (month.goalSnapshots || []).filter(g => g.status === 'completed' && g.previousAmount < g.targetAmount);
    for (const cg of completedGoals) {
      if (cg.type === 'purchase') {
        narrative += `🎉 Goal "${cg.name}" completed! ₹${cg.targetAmount.toLocaleString('en-IN')} was deducted from your balance for the purchase. `;
      } else {
        narrative += `🎉 Goal "${cg.name}" completed! `;
      }
    }
    narrative += `Final balance: ₹${sim.currentBalance.toLocaleString('en-IN')}. `;
    if (balanceChange > 0) {
      narrative += `Your balance grew by ₹${balanceChange.toLocaleString('en-IN')} this month.`;
    } else if (balanceChange < 0) {
      narrative += `Your balance decreased by ₹${Math.abs(balanceChange).toLocaleString('en-IN')} this month.`;
    }

    month.budgetImpactNarrative = narrative;

    // Generate AI Monthly Insight (enhances the deterministic narrative)
    try {
      const lastDecision = month.decisions[month.decisions.length - 1];
      const lastEvent = month.events.find(e => e.decisionMade);
      const goalsSummary = sim.goals.filter(g => g.status === 'active').map(g => `${g.name}: ${Math.round((g.currentAmount / g.targetAmount) * 100)}%`).join(', ');

      const insight = await generateMonthlyInsight({
        monthNumber: month.monthNumber,
        monthlyIncome: profile.monthlyIncome,
        balanceStart: month.balanceStart,
        balanceEnd: sim.currentBalance,
        totalSavings: sim.totalSavings,
        totalDebt: sim.totalDebt,
        investmentValue: sim.totalInvestmentValue,
        emergencyFund: sim.emergencyFund,
        healthScore: month.healthScore,
        sipInvested: sipAmount,
        emiPaid: totalEmi,
        eventTitle: lastEvent?.title || 'No event',
        decisionLabel: lastDecision?.label || 'No decision',
        decisionTag: lastDecision?.behaviorTag || 'neutral',
        goalsSummary
      });
      if (insight) {
        month.aiInsight = insight;
      }
    } catch (e) {
      console.error('[AI Insight] Error generating insight:', e);
    }

    // Try AI-enhanced narrative (replaces deterministic if available)
    try {
      const aiNarrative = await generateBudgetNarrative({
        monthNumber: month.monthNumber,
        monthlyIncome: profile.monthlyIncome,
        balanceStart: month.balanceStart,
        balanceEnd: sim.currentBalance,
        totalSavings: sim.totalSavings,
        emergencyFund: sim.emergencyFund,
        totalDebt: sim.totalDebt,
        investmentPL: month.investmentPL || null,
        debtDetails: month.debtDetails || [],
        decisions: month.decisions.map(d => ({
          eventTitle: month.events.find(e => e.eventId === d.eventId)?.title || d.eventId,
          choiceLabel: d.label,
          behaviorTag: d.behaviorTag,
          balanceEffect: d.immediateEffect.balance || 0,
          savingsEffect: d.immediateEffect.savings || 0,
          debtEffect: d.immediateEffect.debt || 0,
          investmentEffect: d.immediateEffect.investment || 0
        })),
        autoEvents: month.events.filter(e => !e.requiresDecision).map(e => ({
          title: e.title,
          category: e.category,
          impact: e.financialImpact
        })),
        livingExpenses: totalRegularSpend,
        savingsAllocated: savingsAlloc,
        efAllocated: efAlloc,
        sipAllocated: sipAmount,
        emiTotal: totalEmi,
        goalSnapshots: month.goalSnapshots || [],
        healthScore: month.healthScore
      });
      if (aiNarrative) {
        month.budgetImpactNarrative = aiNarrative;
      }
    } catch (e) {
      // Keep deterministic narrative — already set above
      console.error('[AI Narrative] Error, keeping deterministic narrative:', e);
    }

    month.cycleStep = CycleStep.REPORT_GENERATED;
    month.status = 'completed';
    await month.save();
  }

  // ── Step 9: Advance Month Counter ──
  if (month.cycleStep < CycleStep.MONTH_ADVANCED) {
    sim.currentMonth++;
    month.cycleStep = CycleStep.MONTH_ADVANCED;
    await month.save();
    await sim.save();
  }

  // ── Step 10: Evaluate Gamification ──
  if (month.cycleStep < CycleStep.GAMIFICATION_DONE) {
    const xpEarned = await evaluateMonthGamification(
      sim.user.toString(),
      sim,
      month.monthNumber
    );
    month.xpEarned = xpEarned;
    month.cycleStep = CycleStep.GAMIFICATION_DONE;
    await month.save();
    await sim.save();
  }

  return month;
}

/* ═══════════════════════════════════════════════════════════
   DECISIONS
   ═══════════════════════════════════════════════════════════ */

export const getPendingDecisions = async (simulationId: string, userId: string) => {
  const sim = await SimulationModel.findOne({ _id: simulationId, user: userId });
  if (!sim) throw new ApiError(404, 'Simulation not found');

  // Look specifically for the month that is waiting for decisions
  const month = await SimulationMonthModel.findOne({
    simulation: simulationId,
    status: 'awaiting_decisions'
  });

  if (!month) return { events: [], month: null };

  const pending = month.events
    .filter((e) => e.requiresDecision && !e.resolved)
    .map((e: any) => {
      const eventObj = typeof e.toObject === 'function' ? e.toObject() : e;
      const template = getEventTemplate(eventObj.eventId);
      const optionsArray = eventObj.dynamicOptions && eventObj.dynamicOptions.length > 0 
        ? eventObj.dynamicOptions 
        : (template?.decisions || []);
      const scaledDecisions = scaleDecisionOptions(optionsArray as any, eventObj.financialImpact);
      
      return {
        ...eventObj,
        conceptCard: template?.conceptCard || null,
        availableOptions: scaledDecisions.map((d: any, idx: number) => ({
          optionId: d.optionId,
          label: d.label,
          description: d.description,
          immediateEffect: d.immediateEffect,
          futureEffect: d.futureEffect,
          xpModifier: d.xpModifier,
          behaviorTag: d.behaviorTag,
          disabled: checkOptionDisabled(d, sim),
          explanation: d.explanation || template?.decisions?.[idx]?.explanation || '',
          counterfactual: d.counterfactual || template?.decisions?.[idx]?.counterfactual || ''
        }))
      };
    });

  return { events: pending, monthNumber: month.monthNumber };
};

export const submitDecision = async (
  simulationId: string,
  userId: string,
  eventId: string,
  optionId: string
) => {
  const sim = await SimulationModel.findOne({ _id: simulationId, user: userId });
  if (!sim) throw new ApiError(404, 'Simulation not found');

  // Find the month with pending decisions
  const month = await SimulationMonthModel.findOne({
    simulation: simulationId,
    status: 'awaiting_decisions'
  });

  if (!month) throw new ApiError(400, 'No pending decisions');

  // Find the event
  const event = month.events.find((e) => e.eventId === eventId);
  if (!event) throw new ApiError(404, 'Event not found');
  if (event.resolved) throw new ApiError(409, 'Decision already made for this event');

  // Find the option
  let option;
  if (event.dynamicOptions && event.dynamicOptions.length > 0) {
    option = event.dynamicOptions.find((d: any) => d.optionId === optionId);
  } else {
    const template = getEventTemplate(eventId);
    if (!template) throw new ApiError(404, 'Event template not found');
    option = template.decisions.find((d: any) => d.optionId === optionId);
  }
  if (!option) throw new ApiError(404, 'Decision option not found');

  // Scale and apply
  const optionToScale = typeof (option as any).toObject === 'function' ? (option as any).toObject() : option;
  const scaled = scaleDecisionOptions([optionToScale], event.financialImpact)[0];

  // Check if option is valid
  if (scaled.requiresSavings && sim.totalSavings < Math.abs(scaled.immediateEffect.savings || 0)) {
    throw new ApiError(400, 'Insufficient savings for this option');
  }
  if (scaled.requiresCredit) {
    const profile = await FinancialProfileModel.findById(sim.profile);
    const creditLimit = (profile?.monthlyIncome || 0) * SIM_CONFIG.credit.limitMultiplier;
    if (sim.totalDebt >= creditLimit) {
      throw new ApiError(400, 'Credit limit exceeded');
    }
  }

  // Find explanation + counterfactual from template or AI options
  const optionsList = event.dynamicOptions && event.dynamicOptions.length > 0 ? event.dynamicOptions : (getEventTemplate(eventId)?.decisions || []);
  const smartOption = [...optionsList].sort((a: any, b: any) => b.xpModifier - a.xpModifier)[0];
  const explanationText = option.explanation || '';
  const counterfactualText = option.counterfactual || smartOption?.counterfactual || '';

  const decision = {
    eventId,
    optionId: scaled.optionId,
    label: scaled.label,
    immediateEffect: {
      balance: scaled.immediateEffect.balance || undefined,
      savings: scaled.immediateEffect.savings || undefined,
      debt: scaled.immediateEffect.debt || undefined,
      investment: scaled.immediateEffect.investment || undefined
    },
    futureEffect: scaled.futureEffect ? { ...scaled.futureEffect, remainingMonths: scaled.futureEffect.monthsAffected } : undefined,
    xpModifier: scaled.xpModifier,
    healthScoreImpact: scaled.healthScoreImpact,
    behaviorTag: scaled.behaviorTag,
    explanation: explanationText,
    counterfactual: counterfactualText
  };

  event.resolved = true;
  event.decisionMade = decision;
  month.decisions.push(decision);

  // Apply effects
  applyDecisionEffects(sim, decision, month);

  // Update behavior counters
  const tag = decision.behaviorTag;
  if (tag === 'smart') sim.behaviorMetrics.smartDecisionCount++;
  else if (tag === 'risky') sim.behaviorMetrics.riskyDecisionCount++;
  else if (tag === 'avoidant') sim.behaviorMetrics.avoidantDecisionCount++;
  else sim.behaviorMetrics.neutralDecisionCount++;

  await month.save();
  await sim.save();

  await SimulationLogger.log(sim.id, month.monthNumber, {
    step: CycleStep.AWAITING_DECISIONS,
    action: 'DECISION_MADE',
    detail: { eventId, optionId, behaviorTag: tag, immediateEffect: decision.immediateEffect }
  });

  // Award XP for decision
  await awardXp(sim.user.toString(), sim.id, decision.xpModifier, `Decision: ${decision.label}`, month.monthNumber);

  // Check if all decisions resolved — continue cycle
  const stillPending = month.events.filter((e) => e.requiresDecision && !e.resolved);
  if (stillPending.length === 0) {
    // Resume cycle from step 5
    const profile = await FinancialProfileModel.findById(sim.profile);
    if (profile) {
      sim.cycleStatus = 'processing';
      await sim.save();
      try {
        await runMonthCycle(sim, profile, month.isFastForwarded, false);
      } finally {
        sim.cycleStatus = 'idle';
        await sim.save();
      }
    }
  }

  return { decision, pendingCount: stillPending.length };
};

/* ═══════════════════════════════════════════════════════════
   MONTH DATA
   ═══════════════════════════════════════════════════════════ */

export const getMonthData = async (simulationId: string, userId: string, monthNum: number) => {
  const sim = await SimulationModel.findOne({ _id: simulationId, user: userId });
  if (!sim) throw new ApiError(404, 'Simulation not found');

  const month = await SimulationMonthModel.findOne({
    simulation: simulationId,
    monthNumber: monthNum
  });
  if (!month) throw new ApiError(404, 'Month data not found');
  return month;
};

export const getAllMonths = async (simulationId: string, userId: string, page = 1, limit = 6) => {
  const sim = await SimulationModel.findOne({ _id: simulationId, user: userId });
  if (!sim) throw new ApiError(404, 'Simulation not found');

  const months = await SimulationMonthModel.find({ simulation: simulationId })
    .sort({ monthNumber: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await SimulationMonthModel.countDocuments({ simulation: simulationId });
  return { months, total, page, totalPages: Math.ceil(total / limit) };
};

/* ═══════════════════════════════════════════════════════════
   DEBT & INVESTMENTS
   ═══════════════════════════════════════════════════════════ */

export const getDebts = async (simulationId: string, userId: string) => {
  const sim = await SimulationModel.findOne({ _id: simulationId, user: userId });
  if (!sim) throw new ApiError(404, 'Simulation not found');
  return DebtModel.find({ simulation: simulationId }).sort({ createdAtMonth: -1 });
};

export const payDebt = async (simulationId: string, userId: string, debtId: string, amount: number) => {
  const sim = await SimulationModel.findOne({ _id: simulationId, user: userId });
  if (!sim) throw new ApiError(404, 'Simulation not found');

  const debt = await DebtModel.findOne({ _id: debtId, simulation: simulationId, status: 'active' });
  if (!debt) throw new ApiError(404, 'Active debt not found');

  if (sim.currentBalance < amount) {
    throw new ApiError(400, 'Insufficient balance');
  }

  const payment = Math.min(amount, debt.outstandingBalance);
  debt.outstandingBalance -= payment;
  sim.currentBalance -= payment;
  sim.totalDebt -= payment;

  if (debt.outstandingBalance <= 0) {
    debt.status = 'paid_off';
    debt.outstandingBalance = 0;
    await awardXp(userId, simulationId, SIM_CONFIG.xp.debtFullPayment, 'Debt paid off', sim.currentMonth);
  }

  await debt.save();
  await sim.save();
  return { debt, newBalance: sim.currentBalance };
};

export const getInvestments = async (simulationId: string, userId: string) => {
  const sim = await SimulationModel.findOne({ _id: simulationId, user: userId });
  if (!sim) throw new ApiError(404, 'Simulation not found');
  return InvestmentModel.find({ simulation: simulationId });
};

export const withdrawInvestment = async (simulationId: string, userId: string) => {
  const sim = await SimulationModel.findOne({ _id: simulationId, user: userId });
  if (!sim) throw new ApiError(404, 'Simulation not found');

  const investments = await InvestmentModel.find({ simulation: simulationId, status: 'active' });
  let totalWithdrawn = 0;

  for (const inv of investments) {
    totalWithdrawn += inv.currentValue;
    inv.status = 'withdrawn';
    await inv.save();
  }

  sim.currentBalance += totalWithdrawn;
  sim.totalInvestmentValue = 0;
  await sim.save();

  return { totalWithdrawn, newBalance: sim.currentBalance };
};

/* ═══════════════════════════════════════════════════════════
   LOGS
   ═══════════════════════════════════════════════════════════ */

export const getSimulationLogs = async (
  simulationId: string,
  userId: string,
  options?: { level?: string; limit?: number }
) => {
  const sim = await SimulationModel.findOne({ _id: simulationId, user: userId });
  if (!sim) throw new ApiError(404, 'Simulation not found');
  return SimulationLogger.getSimulationLogs(simulationId, options);
};

export const getMonthLogs = async (simulationId: string, userId: string, monthNum: number) => {
  const sim = await SimulationModel.findOne({ _id: simulationId, user: userId });
  if (!sim) throw new ApiError(404, 'Simulation not found');
  return SimulationLogger.getMonthLogs(simulationId, monthNum);
};

/* ═══════════════════════════════════════════════════════════
   AI SUGGESTIONS
   ═══════════════════════════════════════════════════════════ */

export const getAIGoalSuggestions = async (simulationId: string, userId: string) => {
  const sim = await SimulationModel.findOne({ _id: simulationId, user: userId });
  if (!sim) throw new ApiError(404, 'Simulation not found');

  const profile = await FinancialProfileModel.findOne({ user: userId });
  if (!profile) throw new ApiError(404, 'Profile not found');

  const investments = await InvestmentModel.find({ simulation: simulationId, status: 'active' });
  const investmentValue = investments.reduce((s, i) => s + i.currentValue, 0);
  const existingGoalNames = sim.goals.map(g => g.name);

  return generateGoalSuggestions(
    profile.monthlyIncome,
    sim.totalSavings,
    sim.totalDebt,
    investmentValue,
    existingGoalNames
  );
};

export const getAIPortfolioAdvice = async (simulationId: string, userId: string) => {
  const sim = await SimulationModel.findOne({ _id: simulationId, user: userId });
  if (!sim) throw new ApiError(404, 'Simulation not found');

  const profile = await FinancialProfileModel.findOne({ user: userId });
  if (!profile) throw new ApiError(404, 'Profile not found');

  const debts = await DebtModel.find({ simulation: simulationId, status: 'active' });
  const totalEmi = debts.reduce((s, d) => s + d.emiAmount, 0);
  const sipAmount = sim.currentBudget.investment || 0;

  return generatePortfolioAdvice(
    profile.monthlyIncome,
    sim.totalSavings,
    sim.totalDebt,
    sim.totalInvestmentValue,
    sipAmount,
    totalEmi,
    sim.healthScore
  );
};

/* ═══════════════════════════════════════════════════════════
   INTERNAL HELPERS
   ═══════════════════════════════════════════════════════════ */

async function processFixedExpenses(
  sim: ISimulationDocument,
  month: ISimulationMonthDocument,
  profile: IFinancialProfileDocument
) {
  const expenses: { category: string; amount: number }[] = [];
  const budget = sim.currentBudget;

  // Deduct rent
  if (budget.rent > 0) {
    sim.currentBalance -= budget.rent;
    expenses.push({ category: 'rent', amount: budget.rent });
  }

  // Deduct food
  if (budget.food > 0) {
    sim.currentBalance -= budget.food;
    expenses.push({ category: 'food', amount: budget.food });
  }

  // Deduct transport
  if (budget.transport > 0) {
    sim.currentBalance -= budget.transport;
    expenses.push({ category: 'transport', amount: budget.transport });
  }

  // Deduct subscriptions
  if (budget.subscriptions > 0) {
    sim.currentBalance -= budget.subscriptions;
    expenses.push({ category: 'subscriptions', amount: budget.subscriptions });
  }

  // Deduct entertainment
  if (budget.entertainment > 0) {
    sim.currentBalance -= budget.entertainment;
    expenses.push({ category: 'entertainment', amount: budget.entertainment });
  }

  // Deduct miscellaneous
  if (budget.miscellaneous > 0) {
    sim.currentBalance -= budget.miscellaneous;
    expenses.push({ category: 'miscellaneous', amount: budget.miscellaneous });
  }

  // Process savings allocation
  if (budget.savings > 0) {
    sim.totalSavings += budget.savings;
    sim.currentBalance -= budget.savings;
    expenses.push({ category: 'savings', amount: budget.savings });
  }

  // Process emergency fund allocation
  if (budget.emergencyFund > 0) {
    sim.emergencyFund += budget.emergencyFund;
    sim.currentBalance -= budget.emergencyFund;
    expenses.push({ category: 'emergencyFund', amount: budget.emergencyFund });
  }

  // Process EMIs from active debts
  const activeDebts = await DebtModel.find({ simulation: sim._id, status: 'active' });
  for (const debt of activeDebts) {
    if (sim.currentBalance >= debt.emiAmount) {
      sim.currentBalance -= debt.emiAmount;
      debt.outstandingBalance -= debt.emiAmount;
      debt.remainingTenure--;
      expenses.push({ category: `emi_${debt.type}`, amount: debt.emiAmount });

      // Apply interest
      debt.outstandingBalance += Math.round(debt.outstandingBalance * debt.interestRate);

      if (debt.outstandingBalance <= 0 || debt.remainingTenure <= 0) {
        debt.status = 'paid_off';
        debt.outstandingBalance = 0;
      }
      await debt.save();

      await SimulationLogger.log(sim.id, month.monthNumber, {
        step: CycleStep.EXPENSES_PROCESSED,
        action: 'EMI_PAID',
        detail: { debtId: debt.id, amount: debt.emiAmount, remaining: debt.outstandingBalance }
      });
    } else {
      // Missed EMI
      debt.monthsDelinquent++;
      // Penalty interest
      debt.outstandingBalance += Math.round(debt.outstandingBalance * debt.interestRate * 1.5);
      await debt.save();

      sim.behaviorMetrics.missedEmiCount++;

      await SimulationLogger.log(sim.id, month.monthNumber, {
        step: CycleStep.EXPENSES_PROCESSED,
        action: 'EMI_MISSED',
        detail: { debtId: debt.id, amount: debt.emiAmount, reason: 'insufficient_funds' },
        level: 'warn'
      });
    }
  }

  // Recalculate total debt
  const allDebts = await DebtModel.find({ simulation: sim._id, status: 'active' });
  sim.totalDebt = allDebts.reduce((s, d) => s + d.outstandingBalance, 0);
  sim.behaviorMetrics.maxDebtReached = Math.max(sim.behaviorMetrics.maxDebtReached, sim.totalDebt);

  month.fixedExpenses = expenses;
  await sim.save();

  for (const exp of expenses) {
    await SimulationLogger.log(sim.id, month.monthNumber, {
      step: CycleStep.EXPENSES_PROCESSED,
      action: 'EXPENSE_DEDUCTED',
      detail: { category: exp.category, amount: exp.amount, balanceAfter: sim.currentBalance }
    });
  }
}

async function processInvestments(
  sim: ISimulationDocument,
  month: ISimulationMonthDocument,
  profile: IFinancialProfileDocument
) {
  const sipAmount = sim.currentBudget.investment || 0;
  if (sipAmount <= 0) return;

  let investment = await InvestmentModel.findOne({ simulation: sim._id, status: 'active' });

  if (!investment) {
    investment = await InvestmentModel.create({
      simulation: sim._id,
      type: 'sip',
      monthlyAmount: sipAmount,
      totalInvested: 0,
      currentValue: 0,
      returnRate: 0,
      riskProfile: profile.riskLevel
    });
  }

  // Deduct SIP amount from balance
  sim.currentBalance -= sipAmount;
  investment.totalInvested += sipAmount;
  investment.monthlyAmount = sipAmount;

  // Calculate returns using seeded RNG from month
  const rng = require('seedrandom')(month.eventSeed + '_invest');
  const rateConfig = SIM_CONFIG.investment.returnRates[profile.riskLevel] || SIM_CONFIG.investment.returnRates.moderate;
  const annualRate = rateConfig.min + rng() * (rateConfig.max - rateConfig.min);
  const monthlyRate = annualRate / 12;
  const volatilityRange = SIM_CONFIG.investment.volatility[profile.riskLevel] || 0.03;
  const volatility = (rng() * 2 - 1) * volatilityRange;

  // Market sentiment
  const sentimentRoll = rng();
  let sentimentBonus = 0;
  if (sentimentRoll < SIM_CONFIG.investment.marketSentiment.bull.chance) {
    sentimentBonus = SIM_CONFIG.investment.marketSentiment.bull.bonus.min +
      rng() * (SIM_CONFIG.investment.marketSentiment.bull.bonus.max - SIM_CONFIG.investment.marketSentiment.bull.bonus.min);
  } else if (sentimentRoll < SIM_CONFIG.investment.marketSentiment.bull.chance + SIM_CONFIG.investment.marketSentiment.bear.chance) {
    sentimentBonus = -(SIM_CONFIG.investment.marketSentiment.bear.penalty.min +
      rng() * (SIM_CONFIG.investment.marketSentiment.bear.penalty.max - SIM_CONFIG.investment.marketSentiment.bear.penalty.min));
  }

  const actualReturn = monthlyRate + volatility + sentimentBonus / 12;
  investment.currentValue = Math.round((investment.currentValue + sipAmount) * (1 + actualReturn));
  investment.returnRate = actualReturn;

  investment.monthlyHistory.push({
    month: month.monthNumber,
    invested: investment.totalInvested,
    value: investment.currentValue
  });

  await investment.save();

  sim.totalInvestmentValue = investment.currentValue;
  await sim.save();

  await SimulationLogger.log(sim.id, month.monthNumber, {
    step: CycleStep.INVESTMENTS_PROCESSED,
    action: 'SIP_INVESTED',
    detail: { amount: sipAmount, totalInvested: investment.totalInvested, currentValue: investment.currentValue }
  });

  await SimulationLogger.log(sim.id, month.monthNumber, {
    step: CycleStep.INVESTMENTS_PROCESSED,
    action: 'MARKET_RETURN',
    detail: { returnPercent: Math.round(actualReturn * 10000) / 100, valueBefore: investment.currentValue - sipAmount, valueAfter: investment.currentValue }
  });
}

function calculateHealthScore(
  sim: ISimulationDocument,
  profile: IFinancialProfileDocument
): { score: number; breakdown: IHealthBreakdown } {
  const weights = SIM_CONFIG.healthScore.weights;
  const thresholds = SIM_CONFIG.healthScore.thresholds;
  const income = profile.monthlyIncome;

  // Savings ratio score
  const savingsRate = income > 0 ? sim.totalSavings / income : 0;
  let savingsScore = 0;
  if (savingsRate >= thresholds.savingsExcellent) savingsScore = 100;
  else if (savingsRate >= thresholds.savingsGood) savingsScore = 75;
  else if (savingsRate >= thresholds.savingsFair) savingsScore = 50;
  else if (savingsRate >= thresholds.savingsPoor) savingsScore = 25;

  // Debt-to-income score
  const dtiRatio = income > 0 ? sim.totalDebt / income : 0;
  let debtScore = 100;
  if (dtiRatio > thresholds.debtPoor) debtScore = 0;
  else if (dtiRatio > thresholds.debtFair) debtScore = 25;
  else if (dtiRatio > thresholds.debtGood) debtScore = 50;
  else if (dtiRatio > thresholds.debtExcellent) debtScore = 75;

  // Emergency fund score
  const monthlyExpenses = Object.values(sim.currentBudget)
    .filter((v): v is number => typeof v === 'number')
    .reduce((s, v) => s + v, 0) - (sim.currentBudget.savings || 0) - (sim.currentBudget.investment || 0) - (sim.currentBudget.emergencyFund || 0);
  const efMonths = monthlyExpenses > 0 ? sim.emergencyFund / monthlyExpenses : 0;
  let emergencyScore = 0;
  if (efMonths >= thresholds.emergencyExcellent) emergencyScore = 100;
  else if (efMonths >= thresholds.emergencyGood) emergencyScore = 75;
  else if (efMonths >= thresholds.emergencyFair) emergencyScore = 50;
  else if (efMonths > 0) emergencyScore = 25;

  // Spending discipline score
  const totalAllocated = Object.values(sim.currentBudget)
    .filter((v): v is number => typeof v === 'number')
    .reduce((s, v) => s + v, 0);
  const spendingRatio = totalAllocated > 0 ? totalAllocated / income : 0;
  let spendingScore = 100;
  if (spendingRatio > thresholds.spendingPoor) spendingScore = 0;
  else if (spendingRatio > thresholds.spendingFair) spendingScore = 25;
  else if (spendingRatio > thresholds.spendingGood) spendingScore = 50;
  else if (spendingRatio > thresholds.spendingExcellent) spendingScore = 75;

  // Investment score
  const investmentRate = income > 0 ? (sim.currentBudget.investment || 0) / income : 0;
  let investmentScore = 0;
  if (investmentRate >= thresholds.investmentExcellent) investmentScore = 100;
  else if (investmentRate >= thresholds.investmentGood) investmentScore = 75;
  else if (investmentRate >= thresholds.investmentFair) investmentScore = 50;
  else if (investmentRate >= thresholds.investmentPoor) investmentScore = 25;

  const score = Math.round(
    savingsScore * weights.savings +
    debtScore * weights.debtToIncome +
    emergencyScore * weights.emergencyFund +
    spendingScore * weights.spending +
    investmentScore * weights.investment
  );

  // Generate insights
  const insights: string[] = [];
  if (savingsScore < 50) insights.push('Your savings rate is low — try allocating at least 20% to savings.');
  if (debtScore < 50) insights.push('Your debt-to-income ratio is concerning — prioritize paying off debts.');
  if (emergencyScore < 50) insights.push('Build your emergency fund — aim for 3 months of expenses.');
  if (investmentScore < 50) insights.push('Consider investing more — even small SIP amounts compound over time.');
  if (spendingScore < 50) insights.push('Your spending is high relative to income — review non-essential expenses.');

  // Generate actionable tips for components below max
  const actionableTips: IHealthBreakdown['actionableTips'] = {};

  if (savingsScore < 100) {
    actionableTips.savingsTip = `Your savings rate is ${Math.round(savingsRate * 100)}%. The recommended minimum is 20% (₹${Math.round(income * 0.2).toLocaleString('en-IN')}/mo). Increase by ₹${Math.max(0, Math.round((0.2 - savingsRate) * income)).toLocaleString('en-IN')}/mo to reach the target.`;
  }
  if (debtScore < 100) {
    actionableTips.debtTip = `Your debt-to-income ratio is ${Math.round(dtiRatio * 100)}%. Indian banks consider >36% a risk signal for loan eligibility. Your EMIs should not exceed ₹${Math.round(income * 0.36).toLocaleString('en-IN')}/mo to maintain a healthy CIBIL score above 750.`;
  }
  if (emergencyScore < 100) {
    const daysOfCoverage = monthlyExpenses > 0 ? Math.round((sim.emergencyFund / monthlyExpenses) * 30) : 0;
    const redirectAmount = 2000;
    const emergencyTarget = monthlyExpenses * 3;
    const emergencyGap = emergencyTarget - sim.emergencyFund;
    const monthsToTarget = redirectAmount > 0 && emergencyGap > 0 ? Math.ceil(emergencyGap / redirectAmount) : 'several';
    actionableTips.emergencyFundTip = `Your emergency fund covers ${daysOfCoverage} days of expenses. Experts recommend 90–180 days (₹${(monthlyExpenses * 3).toLocaleString('en-IN')}–₹${(monthlyExpenses * 6).toLocaleString('en-IN')}). Redirect ₹2,000/mo from miscellaneous to reach 3 months in ${monthsToTarget} months.`;
  }
  if (spendingScore < 100) {
    actionableTips.spendingTip = `Your spending is ${Math.round(spendingRatio * 100)}% of income. The 50/30/20 rule suggests keeping needs + wants ≤80%. Review entertainment and subscriptions — cancelling ₹500/mo in unused subscriptions saves ₹6,000/year.`;
  }
  if (investmentScore < 100) {
    actionableTips.investmentTip = `You're investing ${Math.round(investmentRate * 100)}% of income. Even a ₹500/mo SIP at 12% annual returns grows to ₹1.16 lakh in 10 years via compound interest. Consider starting or increasing your SIP allocation.`;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    breakdown: {
      savingsScore: Math.round(savingsScore * weights.savings),
      debtScore: Math.round(debtScore * weights.debtToIncome),
      emergencyFundScore: Math.round(emergencyScore * weights.emergencyFund),
      spendingScore: Math.round(spendingScore * weights.spending),
      investmentScore: Math.round(investmentScore * weights.investment),
      insights,
      actionableTips
    }
  };
}

function applyDecisionEffects(
  sim: ISimulationDocument,
  decision: { immediateEffect: { balance?: number; savings?: number; debt?: number; investment?: number }; futureEffect?: { monthsAffected: number; monthlyImpact: number; type: string } },
  _month: ISimulationMonthDocument
) {
  if (decision.immediateEffect.balance) {
    sim.currentBalance += decision.immediateEffect.balance;
  }
  if (decision.immediateEffect.savings) {
    sim.totalSavings += decision.immediateEffect.savings;
    if (sim.totalSavings < 0) sim.totalSavings = 0;
  }
  if (decision.immediateEffect.investment) {
    const invAmount = decision.immediateEffect.investment;
    InvestmentModel.findOne({ simulation: sim._id, status: 'active' }).then(inv => {
      if (inv) {
        inv.currentValue += invAmount;
        if (inv.currentValue <= 0) {
          inv.currentValue = 0;
          inv.status = 'withdrawn';
        }
        inv.save().catch(() => {});
      } else if (invAmount > 0) {
        InvestmentModel.create({
          simulation: sim._id,
          type: 'mutual_fund',
          principal: invAmount,
          currentValue: invAmount,
          monthlySip: 0,
          annualReturnRate: 0.12,
          startedAtMonth: sim.currentMonth
        }).catch(() => {});
      }
    }).catch(() => {});
  }
  if (decision.immediateEffect.debt && decision.immediateEffect.debt > 0) {
    // Create a new debt entry
    const debtAmount = decision.immediateEffect.debt;
    const monthsAffected = decision.futureEffect?.monthsAffected || 6;
    const rate = SIM_CONFIG.credit.monthlyRate;
    const emi = calculateEMI(debtAmount, rate, monthsAffected);

    DebtModel.create({
      simulation: sim._id,
      type: 'personal_loan',
      principal: debtAmount,
      outstandingBalance: debtAmount,
      interestRate: rate,
      emiAmount: emi,
      tenure: monthsAffected,
      remainingTenure: monthsAffected,
      createdAtMonth: sim.currentMonth
    }).catch(() => {}); // fire-and-forget, will be caught by next expense cycle

    sim.totalDebt += debtAmount;
  }
}

function calculateEMI(principal: number, monthlyRate: number, months: number): number {
  if (monthlyRate === 0) return Math.round(principal / months);
  const r = monthlyRate;
  const n = months;
  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(emi);
}

function updateGoalProgress(sim: ISimulationDocument) {
  for (const goal of sim.goals) {
    if (goal.status !== 'active') continue;

    switch (goal.type) {
      case 'savings_target':
        goal.currentAmount = sim.totalSavings;
        break;
      case 'emergency_fund':
        goal.currentAmount = sim.emergencyFund;
        break;
      case 'investment_milestone':
        goal.currentAmount = sim.totalInvestmentValue;
        break;
      case 'debt_payoff':
        goal.currentAmount = Math.max(0, goal.targetAmount - sim.totalDebt);
        break;
      case 'purchase':
        goal.currentAmount = sim.totalSavings;
        break;
    }

    if (goal.currentAmount >= goal.targetAmount && goal.status === 'active') {
      goal.status = 'completed';
      goal.completedAtMonth = sim.currentMonth;

      // For purchase goals, deduct the target amount from balance/savings
      // This makes "Buy a Car ₹100,000" actually cost money
      if (goal.type === 'purchase') {
        sim.currentBalance -= goal.targetAmount;
        sim.totalSavings = Math.max(0, sim.totalSavings - goal.targetAmount);
      }
    }
  }
}

function checkOptionDisabled(
  option: { requiresSavings?: boolean; requiresCredit?: boolean; immediateEffect: { savings?: number } },
  sim: ISimulationDocument
): boolean {
  if (option.requiresSavings && sim.totalSavings < Math.abs(option.immediateEffect.savings || 0)) {
    return true;
  }
  return false;
}

function determineBehavioralProfile(
  sim: ISimulationDocument,
  totalDecisions: number,
  goodDecisions: number,
  _badDecisions: number
): string {
  const metrics = sim.behaviorMetrics;
  const smartPct = totalDecisions > 0 ? metrics.smartDecisionCount / totalDecisions : 0;
  const riskyPct = totalDecisions > 0 ? metrics.riskyDecisionCount / totalDecisions : 0;

  if (smartPct >= 0.70 && sim.totalDebt === 0) return 'Prudent Planner';
  if (metrics.overspendCount >= 3) return 'Spendthrift';
  if (riskyPct >= 0.40) return 'Risk Taker';
  if (sim.totalDebt === 0 && metrics.maxDebtReached > 0 && metrics.missedEmiCount <= 2) return 'Debt Warrior';
  return 'Balanced Budgeter';
}

function generateInsights(
  sim: ISimulationDocument,
  avgHealth: number,
  goodDecisions: number,
  badDecisions: number,
  finalDebt: number
): string[] {
  const insights: string[] = [];

  if (avgHealth >= 80) insights.push('Excellent financial discipline! You maintained a strong health score throughout.');
  else if (avgHealth >= 60) insights.push('Good overall financial management with room for improvement.');
  else insights.push('Your financial health needs attention. Focus on savings and debt management.');

  if (goodDecisions > badDecisions) insights.push('You made more smart financial decisions than risky ones. Keep it up!');
  if (finalDebt > 0) insights.push(`You ended with ₹${finalDebt.toLocaleString('en-IN')} in debt. Consider prioritizing debt repayment.`);
  if (sim.totalSavings > 0) insights.push(`You built ₹${sim.totalSavings.toLocaleString('en-IN')} in savings. Great job building a safety net!`);
  if (sim.behaviorMetrics.maxConsecutiveSaving >= 3) insights.push(`Your longest saving streak was ${sim.behaviorMetrics.maxConsecutiveSaving} months — consistency is key!`);
  if (sim.behaviorMetrics.missedEmiCount > 0) insights.push(`You missed ${sim.behaviorMetrics.missedEmiCount} EMI payments. Set aside EMI amounts before discretionary spending.`);

  return insights;
}

/** Build the enhanced behavioral report for the final summary */
function buildBehavioralReport(
  sim: ISimulationDocument,
  months: ISimulationMonthDocument[],
  profile: IFinancialProfileDocument | null
): IBehavioralReport {
  const metrics = sim.behaviorMetrics;

  // ── Archetype ──
  const { archetype, archetypeDescription } = determineArchetype(metrics);

  // ── Top 3 Decisions (by absolute financial impact) ──
  const allDecisionsWithMonth = months.flatMap(m =>
    m.decisions.map(d => ({
      month: m.monthNumber,
      eventTitle: m.events.find(e => e.eventId === d.eventId)?.title || d.eventId,
      choiceLabel: d.label,
      financialImpact: formatImpact(d),
      rootCause: d.behaviorTag === 'risky' || d.behaviorTag === 'avoidant'
        ? `Root cause: ${d.behaviorTag === 'risky' ? 'took debt instead of using savings' : 'avoided the decision entirely'}`
        : undefined,
      counterfactualImpact: d.counterfactual || 'No counterfactual available',
      absImpact: Math.abs((d.immediateEffect.balance || 0) + (d.immediateEffect.savings || 0) + (d.immediateEffect.debt || 0))
    }))
  );

  const topThreeDecisions = allDecisionsWithMonth
    .sort((a, b) => b.absImpact - a.absImpact)
    .slice(0, 3)
    .map(({ absImpact, ...rest }) => rest);

  // ── Concepts ──
  const conceptsLearned = [...new Set(months.flatMap(m => m.conceptsEncountered || []))];
  const conceptsNotEncountered = CANONICAL_CONCEPTS.filter(c => !conceptsLearned.includes(c));

  // ── Real Life Actions ──
  const realLifeActions = generateRealLifeActions(metrics, sim, profile);

  // ── Streaks ──
  let smartStreak = 0;
  let maxSmartStreak = 0;
  for (const d of months.flatMap(m => m.decisions)) {
    if (d.behaviorTag === 'smart') {
      smartStreak++;
      maxSmartStreak = Math.max(maxSmartStreak, smartStreak);
    } else {
      smartStreak = 0;
    }
  }

  return {
    archetype,
    archetypeDescription,
    topThreeDecisions,
    conceptsLearned,
    conceptsNotEncountered,
    realLifeActions,
    streaks: {
      longestSavingsStreak: metrics.maxConsecutiveSaving,
      smartDecisionStreak: maxSmartStreak
    }
  };
}

function determineArchetype(metrics: {
  smartDecisionCount: number;
  riskyDecisionCount: number;
  avoidantDecisionCount: number;
  overspendCount: number;
  missedEmiCount: number;
  maxConsecutiveSaving: number;
}): { archetype: string; archetypeDescription: string } {
  const { smartDecisionCount, riskyDecisionCount, avoidantDecisionCount, overspendCount, missedEmiCount, maxConsecutiveSaving } = metrics;

  if (maxConsecutiveSaving >= 8 && smartDecisionCount >= 10)
    return { archetype: 'Financial Champion', archetypeDescription: 'Consistent, disciplined, and growth-oriented. You demonstrated the habits of long-term financial security — saving consistently, making smart decisions, and avoiding unnecessary debt.' };
  if (avoidantDecisionCount >= 5 && smartDecisionCount >= 6)
    return { archetype: 'Cautious Builder', archetypeDescription: 'You saved well but avoided financial risks — including good ones. Your caution protected you but limited your growth. Try taking calculated risks like SIP investing.' };
  if (riskyDecisionCount >= 4 && overspendCount >= 3)
    return { archetype: 'Risky Spender', archetypeDescription: 'You prioritized present enjoyment over future security. Your lifestyle is engaging but financially fragile. Focus on the 50/30/20 rule to balance spending.' };
  if (missedEmiCount >= 2)
    return { archetype: 'Debt Trapped', archetypeDescription: 'Missed EMIs compounded into a debt spiral. This is recoverable in real life with debt restructuring — you now know the warning signs. Build an emergency fund first.' };
  if (avoidantDecisionCount >= 7)
    return { archetype: 'Financial Avoider', archetypeDescription: 'You avoided most decisions, which felt safe but led to missed opportunities and social costs. Financial health requires active, intentional choices — not avoidance.' };
  return { archetype: 'Balanced Learner', archetypeDescription: 'A mixed performance showing growing financial awareness. You made mistakes early but improved over time. Keep building on your financial knowledge through practice.' };
}

function formatImpact(d: { immediateEffect: { balance?: number; savings?: number; debt?: number } }): string {
  const parts: string[] = [];
  if (d.immediateEffect.balance && d.immediateEffect.balance < 0) parts.push(`Cost ₹${Math.abs(d.immediateEffect.balance).toLocaleString('en-IN')} from balance`);
  if (d.immediateEffect.savings && d.immediateEffect.savings < 0) parts.push(`Used ₹${Math.abs(d.immediateEffect.savings).toLocaleString('en-IN')} from savings`);
  if (d.immediateEffect.debt && d.immediateEffect.debt > 0) parts.push(`Added ₹${d.immediateEffect.debt.toLocaleString('en-IN')} in debt`);
  return parts.length > 0 ? parts.join(', ') : 'No direct financial impact';
}

function generateRealLifeActions(
  metrics: { overspendCount: number; missedEmiCount: number; avoidantDecisionCount: number; maxConsecutiveSaving: number; smartDecisionCount: number },
  sim: ISimulationDocument,
  profile: IFinancialProfileDocument | null
): string[] {
  const actions: string[] = [];
  const income = profile?.monthlyIncome || 25000;

  if (sim.emergencyFund < income * 3) {
    actions.push(`Open a separate savings account and start an auto-debit of ₹${Math.round(income * 0.1).toLocaleString('en-IN')}/mo for your emergency fund. Target: ₹${(income * 3).toLocaleString('en-IN')} (3 months of expenses).`);
  }
  if (metrics.overspendCount >= 2) {
    actions.push('Track every expense for 30 days using an app like Walnut or Money Manager. Identify your top 3 unnecessary expenses and redirect that money to savings.');
  }
  if (sim.totalInvestmentValue === 0 || metrics.smartDecisionCount < 5) {
    actions.push(`Start a SIP of ₹${Math.round(income * 0.1).toLocaleString('en-IN')}/mo in an index fund (e.g., Nifty 50) through Groww, Zerodha, or Kuvera. Even ₹500/mo grows to ₹1.16 lakh in 10 years at 12% returns.`);
  }
  if (metrics.missedEmiCount >= 1) {
    actions.push('Set up auto-debit for all EMIs on salary credit day. Missed EMIs drop your CIBIL score by 50–100 points, making future loans expensive or impossible.');
  }
  if (metrics.avoidantDecisionCount >= 3) {
    actions.push('Practice making one small financial decision daily — compare prices, negotiate a bill, or review a subscription. Decision-making is a muscle that improves with use.');
  }

  // Always include at least 3
  if (actions.length < 3) {
    if (!actions.some(a => a.includes('Section 80C'))) {
      actions.push(`Invest up to ₹1.5 lakh/year in ELSS mutual funds for Section 80C tax deductions. This saves ₹15,000–₹45,000 in taxes while building wealth.`);
    }
    if (!actions.some(a => a.includes('CIBIL'))) {
      actions.push('Check your CIBIL score for free at cibil.com. Aim for 750+. A high score unlocks lower interest rates on future loans, saving lakhs over a lifetime.');
    }
    if (!actions.some(a => a.includes('budget'))) {
      actions.push(`Apply the 50/30/20 rule to your actual income: ₹${Math.round(income * 0.5).toLocaleString('en-IN')} needs, ₹${Math.round(income * 0.3).toLocaleString('en-IN')} wants, ₹${Math.round(income * 0.2).toLocaleString('en-IN')} savings/investments.`);
    }
  }

  return actions.slice(0, 3);
}
