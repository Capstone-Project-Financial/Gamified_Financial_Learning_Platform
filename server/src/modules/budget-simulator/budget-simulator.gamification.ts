import { UserModel } from '../../models/User';
import { calculateLevel } from '../../utils/gamification';
import { SimulationModel, ISimulationDocument } from '../../models/BudgetSimulator';
import { SIM_CONFIG } from './budget-simulator.config';
import { SimulationLogger } from './budget-simulator.logger';
import { CycleStep } from '../../models/BudgetSimulator';

/**
 * Award XP to user and recalculate level.
 * Also tracks total XP earned in the simulation.
 */
export async function awardXp(
  userId: string,
  simulationId: string,
  amount: number,
  reason: string,
  monthNumber: number
): Promise<void> {
  if (amount === 0) return;

  const user = await UserModel.findById(userId);
  if (!user) return;

  // Prevent XP from going below 0
  const actualAmount = Math.max(amount, -user.xp);

  user.xp += actualAmount;
  user.level = calculateLevel(user.xp);
  await user.save();

  // Track in simulation
  await SimulationModel.updateOne(
    { _id: simulationId },
    { $inc: { xpEarnedTotal: actualAmount } }
  );

  await SimulationLogger.log(simulationId, monthNumber, {
    step: CycleStep.GAMIFICATION_DONE,
    action: 'XP_AWARDED',
    detail: { amount: actualAmount, reason, totalXp: user.xp, level: user.level }
  });
}

/**
 * Evaluate XP rewards/penalties for a completed month.
 */
export async function evaluateMonthGamification(
  userId: string,
  simulation: ISimulationDocument,
  monthNumber: number
): Promise<number> {
  let totalXp = 0;
  const config = SIM_CONFIG.xp;

  // 1. Month completion bonus
  totalXp += config.monthComplete;

  // 2. Savings bonus (if savings ≥ 20% of income)
  const profile = await import('../../models/BudgetSimulator').then(m =>
    m.FinancialProfileModel.findById(simulation.profile)
  );
  if (profile) {
    const savingsRate = simulation.totalSavings / profile.monthlyIncome;
    if (savingsRate >= 0.20) {
      totalXp += config.savingsBonus;
    }
  }

  // 3. Health score bonus/penalty
  if (simulation.healthScore >= 80) {
    totalXp += config.healthScoreHigh;
  } else if (simulation.healthScore < 30) {
    totalXp += config.penalties.healthScoreLow;
  }

  // 4. Overspend penalty
  const metrics = simulation.behaviorMetrics;
  if (metrics.budgetAdherenceHistory.length > 0) {
    const lastAdherence = metrics.budgetAdherenceHistory[metrics.budgetAdherenceHistory.length - 1];
    if (lastAdherence > 1.0) {
      totalXp += config.penalties.overspend;
    }
  }

  // Award total XP
  await awardXp(userId, simulation.id, totalXp, `Month ${monthNumber} completion`, monthNumber);

  return totalXp;
}
