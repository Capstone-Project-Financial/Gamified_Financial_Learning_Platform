/** @format */

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";

/* ── Types ── */

export type UIState =
  | "LOADING"
  | "SETUP_PROFILE"
  | "SET_GOALS"
  | "ALLOCATE_BUDGET"
  | "MONTH_IN_PROGRESS"
  | "AWAITING_DECISIONS"
  | "REPORT_VIEW"
  | "SIMULATION_COMPLETE"
  | "NO_SIMULATION";

export interface BudgetAllocation {
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

export interface Goal {
  goalId: string;
  name: string;
  type: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: number;
  priority: string;
  status: string;
  completedAtMonth?: number;
}

export interface TriggeredEvent {
  eventId: string;
  title: string;
  description: string;
  category: "positive" | "negative" | "neutral";
  financialImpact: number;
  requiresDecision: boolean;
  resolved: boolean;
  decisionMade?: unknown;
  availableOptions?: DecisionOption[];
  conceptCard?: { title: string; body: string };
}

export interface DecisionOption {
  optionId: string;
  label: string;
  description: string;
  immediateEffect: { balance?: number; savings?: number; debt?: number };
  futureEffect?: {
    monthsAffected: number;
    monthlyImpact: number;
    type: string;
  };
  xpModifier: number;
  behaviorTag: string;
  disabled?: boolean;
  explanation?: string;
  counterfactual?: string;
}

export interface FinancialProfile {
  _id: string;
  incomeType: string;
  monthlyIncome: number;
  riskLevel: string;
  lifestyleLevel: string;
}

export interface BehaviorMetrics {
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

export interface SimulationMonth {
  _id: string;
  monthNumber: number;
  status: string;
  incomeReceived: number;
  balanceStart: number;
  balanceEnd: number;
  savingsBalance: number;
  debtBalance: number;
  investmentValue: number;
  healthScore: number;
  healthBreakdown: {
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
  };
  events: TriggeredEvent[];
  decisions: MadeDecision[];
  fixedExpenses: { category: string; amount: number }[];
  xpEarned: number;
  isFastForwarded: boolean;
  budgetUsed: BudgetAllocation;
  conceptsEncountered?: string[];
}

export interface MadeDecision {
  eventId: string;
  optionId: string;
  label: string;
  behaviorTag: string;
  explanation?: string;
  counterfactual?: string;
  immediateEffect: { balance?: number; savings?: number; debt?: number };
  xpModifier: number;
}

export interface BehavioralReport {
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

export interface FinalSummary {
  totalMonths: number;
  totalIncomeEarned: number;
  totalExpenses: number;
  totalSavings: number;
  totalDebtAccumulated: number;
  totalDebtPaid: number;
  finalDebt: number;
  investmentPerformance: { totalInvested: number; finalValue: number; returnPercent: number };
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
  behavioralReport?: BehavioralReport;
  aiCoachingReport?: {
    personalizedLetter: string;
    biggestStrength: string;
    criticalImprovement: string;
    motivationalClosing: string;
    generatedAt: string;
  };
}

export interface Simulation {
  _id: string;
  status: string;
  cycleStatus: string;
  currentMonth: number;
  maxMonths: number;
  currentBalance: number;
  totalSavings: number;
  emergencyFund: number;
  totalDebt: number;
  totalInvestmentValue: number;
  healthScore: number;
  currentBudget: BudgetAllocation;
  goals: Goal[];
  xpEarnedTotal: number;
  behaviorMetrics: BehaviorMetrics;
  startedAt: string;
  completedAt?: string;
  finalSummary?: FinalSummary;
}

interface BudgetSimulatorContextType {
  uiState: UIState;
  simulation: Simulation | null;
  profile: FinancialProfile | null;
  currentMonth: SimulationMonth | null;
  pendingEvents: TriggeredEvent[];
  isAdvancing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createProfile: (data: Omit<FinancialProfile, "_id">) => Promise<void>;
  updateProfile: (data: Partial<FinancialProfile>) => Promise<void>;
  createSimulation: (maxMonths?: number) => Promise<void>;
  setBudget: (allocations: BudgetAllocation) => Promise<void>;
  addGoal: (goal: { name: string; type: string; targetAmount: number; deadline?: number; priority?: string }) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  advanceMonth: (fastForward?: boolean, monthsToSimulate?: number, autoDecide?: boolean) => Promise<void>;
  submitDecision: (eventId: string, optionId: string) => Promise<void>;
  endSimulation: () => Promise<void>;
  fetchPendingDecisions: () => Promise<void>;
}

const BudgetSimulatorContext = createContext<BudgetSimulatorContextType | null>(null);

export const useBudgetSimulator = () => {
  const ctx = useContext(BudgetSimulatorContext);
  if (!ctx) throw new Error("useBudgetSimulator must be used within BudgetSimulatorProvider");
  return ctx;
};

/* ── Provider ── */

export const BudgetSimulatorProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [uiState, setUiState] = useState<UIState>("LOADING");
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [currentMonth, setCurrentMonth] = useState<SimulationMonth | null>(null);
  const [pendingEvents, setPendingEvents] = useState<TriggeredEvent[]>([]);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSimulationIdRef = useRef<string | null>(null);

  const deriveUiState = useCallback(
    (prof: FinancialProfile | null, sim: Simulation | null, month: SimulationMonth | null) => {
      if (!prof) return "SETUP_PROFILE" as UIState;
      if (!sim) return "NO_SIMULATION" as UIState;
      if (sim.status === "completed") return "SIMULATION_COMPLETE" as UIState;

      // Check current budget
      const budgetTotal = sim.currentBudget
        ? Object.values(sim.currentBudget).reduce((s: number, v) => s + ((v as number) || 0), 0)
        : 0;
      if (budgetTotal === 0 && sim.status === "setup") return "ALLOCATE_BUDGET" as UIState;

      if (month) {
        if (month.status === "awaiting_decisions") return "AWAITING_DECISIONS" as UIState;
        if (month.status === "completed") return "REPORT_VIEW" as UIState;
        if (["pending", "income_credited", "expenses_processed", "events_generated"].includes(month.status)) {
          return "MONTH_IN_PROGRESS" as UIState;
        }
      }

      // Active sim with budget set, but no current month data — show dashboard
      return "MONTH_IN_PROGRESS" as UIState;
    },
    []
  );

  const refresh = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const profData = await api.get<FinancialProfile>("/budget-simulator/profile");
      setProfile(profData);

      // Try active simulation first
      let simData: Simulation | null = null;
      try {
        simData = await api.get<Simulation>("/budget-simulator/simulation/active");
      } catch {
        simData = null;
      }

      // If no active sim but we have a last known ID, fetch it directly (handles completed state)
      if (!simData && lastSimulationIdRef.current) {
        try {
          simData = await api.get<Simulation>(
            `/budget-simulator/simulation/${lastSimulationIdRef.current}`
          );
        } catch {
          simData = null;
          lastSimulationIdRef.current = null;
        }
      }

      // Track the simulation ID
      if (simData?._id) {
        lastSimulationIdRef.current = simData._id;
      }

      setSimulation(simData);

      let monthData: SimulationMonth | null = null;
      if (simData && simData.status !== "completed") {
        try {
          monthData = await api.get<SimulationMonth>(
            `/budget-simulator/simulation/${simData._id}/month/${simData.currentMonth}`
          );
        } catch {
          if (simData.currentMonth > 1) {
            try {
              monthData = await api.get<SimulationMonth>(
                `/budget-simulator/simulation/${simData._id}/month/${simData.currentMonth - 1}`
              );
            } catch {
              /* ignored */
            }
          }
        }
      }
      setCurrentMonth(monthData);

      if (simData && simData.status === "active") {
        try {
          const pending = await api.get<{ events: TriggeredEvent[] }>(
            `/budget-simulator/simulation/${simData._id}/pending-decisions`
          );
          setPendingEvents(pending?.events || []);
        } catch {
          setPendingEvents([]);
        }
      } else {
        setPendingEvents([]);
      }

      setUiState(deriveUiState(profData, simData, monthData));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load data";
      setError(msg);
      setUiState("SETUP_PROFILE");
    }
  }, [user, deriveUiState]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createProfileFn = useCallback(
    async (data: Omit<FinancialProfile, "_id">) => {
      await api.post("/budget-simulator/profile", data);
      await refresh();
    },
    [refresh]
  );

  const updateProfileFn = useCallback(
    async (data: Partial<FinancialProfile>) => {
      await api.patch("/budget-simulator/profile", data);
      await refresh();
    },
    [refresh]
  );

  const createSimulationFn = useCallback(
    async (maxMonths = 12) => {
      await api.post("/budget-simulator/simulation", { maxMonths });
      await refresh();
    },
    [refresh]
  );

  const setBudgetFn = useCallback(
    async (allocations: BudgetAllocation) => {
      if (!simulation) throw new Error("No simulation");
      await api.post(`/budget-simulator/simulation/${simulation._id}/budget`, allocations);
      await refresh();
    },
    [simulation, refresh]
  );

  const addGoalFn = useCallback(
    async (goal: { name: string; type: string; targetAmount: number; deadline?: number; priority?: string }) => {
      if (!simulation) throw new Error("No simulation");
      await api.post(`/budget-simulator/simulation/${simulation._id}/goals`, goal);
      await refresh();
    },
    [simulation, refresh]
  );

  const deleteGoalFn = useCallback(
    async (goalId: string) => {
      if (!simulation) throw new Error("No simulation");
      await api.delete(`/budget-simulator/simulation/${simulation._id}/goals/${goalId}`);
      await refresh();
    },
    [simulation, refresh]
  );

  const advanceMonthFn = useCallback(
    async (fastForward = false, monthsToSimulate = 1, autoDecide = false) => {
      if (!simulation) throw new Error("No simulation");
      setIsAdvancing(true);
      try {
        await api.post(`/budget-simulator/simulation/${simulation._id}/advance`, {
          fastForward,
          monthsToSimulate,
          autoDecide,
        });
        await refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to advance month");
        await refresh(); // still try to refresh state
      } finally {
        setIsAdvancing(false);
      }
    },
    [simulation, refresh]
  );

  const submitDecisionFn = useCallback(
    async (eventId: string, optionId: string) => {
      if (!simulation) throw new Error("No simulation");
      await api.post(`/budget-simulator/simulation/${simulation._id}/decide`, { eventId, optionId });
      await refresh();
    },
    [simulation, refresh]
  );

  const endSimulationFn = useCallback(async () => {
    if (!simulation) throw new Error("No simulation");
    await api.post(`/budget-simulator/simulation/${simulation._id}/end`, {});
    await refresh();
  }, [simulation, refresh]);

  const fetchPendingDecisionsFn = useCallback(async () => {
    if (!simulation) return;
    try {
      const pending = await api.get<{ events: TriggeredEvent[] }>(
        `/budget-simulator/simulation/${simulation._id}/pending-decisions`
      );
      setPendingEvents(pending?.events || []);
    } catch {
      setPendingEvents([]);
    }
  }, [simulation]);

  return (
    <BudgetSimulatorContext.Provider
      value={{
        uiState,
        simulation,
        profile,
        currentMonth,
        pendingEvents,
        isAdvancing,
        error,
        refresh,
        createProfile: createProfileFn,
        updateProfile: updateProfileFn,
        createSimulation: createSimulationFn,
        setBudget: setBudgetFn,
        addGoal: addGoalFn,
        deleteGoal: deleteGoalFn,
        advanceMonth: advanceMonthFn,
        submitDecision: submitDecisionFn,
        endSimulation: endSimulationFn,
        fetchPendingDecisions: fetchPendingDecisionsFn,
      }}
    >
      {children}
    </BudgetSimulatorContext.Provider>
  );
};
