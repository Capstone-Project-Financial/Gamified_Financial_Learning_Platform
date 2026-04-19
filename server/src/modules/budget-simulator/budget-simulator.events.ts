import crypto from 'crypto';
import seedrandom from 'seedrandom';
import { EVENT_POOL, EventTemplate, DecisionOptionTemplate } from '../../data/budget-simulator-events';
import { SIM_CONFIG } from './budget-simulator.config';
import { ITriggeredEvent, ISimulationMonthDocument } from '../../models/BudgetSimulator';

/**
 * Deterministic, seed-based event generator.
 * Same seed + same inputs = same events every time.
 */

/** Generate a random seed for a new month */
export function generateEventSeed(): string {
  return crypto.randomBytes(16).toString('hex');
}

/** Get eligible events for a given month + difficulty tier */
function getEligibleEvents(
  monthNumber: number,
  previousEventIds: string[]
): EventTemplate[] {
  const tier = SIM_CONFIG.difficulty.getTier(monthNumber);

  return EVENT_POOL.filter((e) => {
    // Must be within tier
    if (e.difficultyTier > tier) return false;
    // Must meet minimum month
    if (monthNumber < e.minMonth) return false;
    // Cooldown check: not in recent history
    if (previousEventIds.includes(e.eventId)) return false;
    return true;
  });
}

/** Adjust probabilities based on risk level + difficulty tier */
function adjustProbabilities(
  events: EventTemplate[],
  riskLevel: string,
  monthNumber: number
): { event: EventTemplate; adjustedProb: number }[] {
  const riskMult = SIM_CONFIG.events.riskMultipliers[riskLevel] || SIM_CONFIG.events.riskMultipliers.moderate;
  const tier = SIM_CONFIG.difficulty.getTier(monthNumber);
  const tierConfig = SIM_CONFIG.difficulty.tiers[tier];

  return events.map((e) => {
    let prob = e.probability;
    if (e.category === 'negative') {
      prob *= riskMult.negative * tierConfig.negativeBias;
    } else if (e.category === 'positive') {
      prob *= riskMult.positive;
    }
    return { event: e, adjustedProb: Math.min(prob, 1) };
  });
}

/** Compute actual financial impact from fraction + income */
export function computeImpactAmount(impactFraction: number, monthlyIncome: number, monthNumber: number): number {
  const tier = SIM_CONFIG.difficulty.getTier(monthNumber);
  const tierConfig = SIM_CONFIG.difficulty.tiers[tier];
  return Math.round(impactFraction * monthlyIncome * tierConfig.impactMultiplier);
}

/** Scale decision effects by actual impact amount */
export function scaleDecisionOptions(
  decisions: DecisionOptionTemplate[],
  impactAmount: number
): DecisionOptionTemplate[] {
  return decisions.map((d) => ({
    ...d,
    immediateEffect: {
      balance: d.immediateEffect.balance ? Math.round(d.immediateEffect.balance * impactAmount) : undefined,
      savings: d.immediateEffect.savings ? Math.round(d.immediateEffect.savings * impactAmount) : undefined,
      debt: d.immediateEffect.debt ? Math.round(d.immediateEffect.debt * impactAmount) : undefined
    },
    futureEffect: d.futureEffect
      ? {
          ...d.futureEffect,
          monthlyImpact: Math.round(d.futureEffect.monthlyImpact * impactAmount / (d.futureEffect.monthsAffected || 1))
        }
      : undefined
  }));
}

/**
 * Generate events for a month using a deterministic seed.
 *
 * @param seed         Stored on SimulationMonth
 * @param monthNumber  Current month
 * @param riskLevel    User's risk level
 * @param monthlyIncome User's monthly income
 * @param recentEventIds Event IDs from last N months (for cooldown)
 * @param recentMonthsEvents Array of events from recent months for guardrails
 */
export function generateMonthEvents(
  seed: string,
  monthNumber: number,
  riskLevel: string,
  monthlyIncome: number,
  recentEventIds: string[],
  recentCatastrophicCount: number
): ITriggeredEvent[] {
  const rng = seedrandom(seed);
  const eligible = getEligibleEvents(monthNumber, recentEventIds);
  const weighted = adjustProbabilities(eligible, riskLevel, monthNumber);

  // Determine event count (1–3) using seeded RNG
  const eventCount = Math.floor(rng() * (SIM_CONFIG.events.maxPerMonth - SIM_CONFIG.events.minPerMonth + 1)) + SIM_CONFIG.events.minPerMonth;

  const selectedEvents: ITriggeredEvent[] = [];
  const usedIds = new Set<string>();
  let catastrophicThisRound = 0;

  // Shuffle and sample
  const shuffled = weighted.sort(() => rng() - 0.5);

  for (const { event, adjustedProb } of shuffled) {
    if (selectedEvents.length >= eventCount) break;
    if (usedIds.has(event.eventId)) continue;

    // Catastrophic guard
    if (event.isCatastrophic) {
      if (catastrophicThisRound >= 1 || recentCatastrophicCount >= SIM_CONFIG.events.maxCatastrophicPer3Months) {
        continue;
      }
    }

    // Probability roll
    if (rng() <= adjustedProb) {
      const impactAmount = computeImpactAmount(event.impactFraction, monthlyIncome, monthNumber);

      selectedEvents.push({
        eventId: event.eventId,
        title: event.title,
        description: event.description,
        category: event.category,
        financialImpact: impactAmount,
        requiresDecision: event.requiresDecision,
        resolved: !event.requiresDecision
      });

      usedIds.add(event.eventId);
      if (event.isCatastrophic) catastrophicThisRound++;
    }
  }

  // Guardrail: ensure at least 1 event
  if (selectedEvents.length === 0 && eligible.length > 0) {
    const fallback = eligible.find((e) => e.category !== 'negative') || eligible[0];
    const impactAmount = computeImpactAmount(fallback.impactFraction, monthlyIncome, monthNumber);
    selectedEvents.push({
      eventId: fallback.eventId,
      title: fallback.title,
      description: fallback.description,
      category: fallback.category,
      financialImpact: impactAmount,
      requiresDecision: fallback.requiresDecision,
      resolved: !fallback.requiresDecision
    });
  }

  // Guardrail: if all events are negative, swap one for a positive
  const allNegative = selectedEvents.length > 0 && selectedEvents.every((e) => e.category === 'negative');
  if (allNegative) {
    const positiveEvent = eligible.find((e) => e.category === 'positive' || e.category === 'neutral');
    if (positiveEvent && selectedEvents.length > 1) {
      const impactAmount = computeImpactAmount(positiveEvent.impactFraction, monthlyIncome, monthNumber);
      selectedEvents[selectedEvents.length - 1] = {
        eventId: positiveEvent.eventId,
        title: positiveEvent.title,
        description: positiveEvent.description,
        category: positiveEvent.category,
        financialImpact: impactAmount,
        requiresDecision: positiveEvent.requiresDecision,
        resolved: !positiveEvent.requiresDecision
      };
    }
  }

  return selectedEvents;
}

/** Find the event template by ID (for looking up decision options) */
export function getEventTemplate(eventId: string): EventTemplate | undefined {
  return EVENT_POOL.find((e) => e.eventId === eventId);
}
