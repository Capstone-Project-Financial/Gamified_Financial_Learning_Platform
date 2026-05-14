/** @format */

import { useState } from "react";
import {
  BudgetSimulatorProvider,
  useBudgetSimulator,
} from "@/contexts/BudgetSimulatorContext";
import DashboardLayout from "@/layouts/DashboardLayout";
import FinancialProfileSetup from "@/features/budget-simulator/FinancialProfileSetup";
import BudgetAllocationForm from "@/features/budget-simulator/BudgetAllocationForm";
import GoalSettingPanel from "@/features/budget-simulator/GoalSettingPanel";
import SimulationDashboard from "@/features/budget-simulator/SimulationDashboard";
import DecisionPanel from "@/features/budget-simulator/DecisionPanel";
import MonthlyReport from "@/features/budget-simulator/MonthlyReport";
import FinalSummary from "@/features/budget-simulator/FinalSummary";
import DebtPanel from "@/features/budget-simulator/DebtPanel";
import InvestmentPanel from "@/features/budget-simulator/InvestmentPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Target,
  TrendingDown,
  TrendingUp,
  Play,
  X,
  Loader2,
  AlertTriangle,
  PiggyBank,
  ArrowRight,
} from "lucide-react";

type SidePanel = "goals" | "debts" | "investments" | null;

function SimulatorContent() {
  const {
    uiState,
    simulation,
    profile,
    isAdvancing,
    error,
    createSimulation,
    advanceMonth,
    endSimulation,
    refresh,
  } = useBudgetSimulator();
  const [sidePanel, setSidePanel] = useState<SidePanel>(null);
  const [creating, setCreating] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const handleStartSimulation = async () => {
    setCreating(true);
    try {
      await createSimulation(12);
    } catch {
      /* handled in context */
    } finally {
      setCreating(false);
    }
  };

  // Loading state
  if (uiState === "LOADING") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading simulator...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && uiState === "SETUP_PROFILE") {
    // Only show error if it's truly blocking
  }

  // Side panel overlay
  const renderSidePanel = () => {
    if (!sidePanel) return null;

    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setSidePanel(null)}
        />
        {/* Panel */}
        <div className="relative w-full max-w-lg bg-background border-l border-border/50 overflow-y-auto animate-in slide-in-from-right duration-300">
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border/50 bg-background/80 backdrop-blur-xl">
            <h2 className="font-semibold text-lg">
              {sidePanel === "goals" && "Financial Goals"}
              {sidePanel === "debts" && "Debt Management"}
              {sidePanel === "investments" && "Investment Portfolio"}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidePanel(null)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="p-4">
            {sidePanel === "goals" && <GoalSettingPanel />}
            {sidePanel === "debts" && <DebtPanel />}
            {sidePanel === "investments" && <InvestmentPanel />}
          </div>
        </div>
      </div>
    );
  };

  // Quick-access toolbar (shown during active simulation states)
  const renderToolbar = () => {
    if (
      !simulation ||
      simulation.status === "completed" ||
      uiState === "SETUP_PROFILE" ||
      uiState === "NO_SIMULATION" ||
      uiState === "ALLOCATE_BUDGET"
    )
      return null;

    return (
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setSidePanel("goals")}
        >
          <Target className="h-4 w-4 text-amber-400" />
          Goals
          {(simulation.goals?.length ?? 0) > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
              {simulation.goals.length}
            </span>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setSidePanel("debts")}
        >
          <TrendingDown className="h-4 w-4 text-red-400" />
          Debts
          {simulation.totalDebt > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 h-5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
              ₹{simulation.totalDebt.toLocaleString()}
            </span>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setSidePanel("investments")}
        >
          <TrendingUp className="h-4 w-4 text-green-400" />
          Investments
          {simulation.totalInvestmentValue > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 h-5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
              ₹{simulation.totalInvestmentValue.toLocaleString()}
            </span>
          )}
        </Button>
      </div>
    );
  };

  // Main content based on UI state
  const renderMainContent = () => {
    switch (uiState) {
      case "SETUP_PROFILE":
        return <FinancialProfileSetup />;

      case "NO_SIMULATION":
        if (isEditingProfile) {
          return <FinancialProfileSetup onComplete={() => setIsEditingProfile(false)} />;
        }
        
        return (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-2">
                <PiggyBank className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold">Budget Simulator</h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Experience real-life financial scenarios, make decisions, and
                build your money management skills in a risk-free virtual
                environment.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                    <Play className="h-5 w-5 text-blue-400" />
                  </div>
                  <p className="font-medium text-sm">Monthly Cycles</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Simulate up to 24 months of financial decisions
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center mx-auto mb-2">
                    <AlertTriangle className="h-5 w-5 text-orange-400" />
                  </div>
                  <p className="font-medium text-sm">Random Events</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Face real-life financial surprises and crises
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                    <Target className="h-5 w-5 text-green-400" />
                  </div>
                  <p className="font-medium text-sm">Track & Grow</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Set goals, invest, manage debt, earn XP
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Profile Summary */}
            {profile && (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <p className="text-muted-foreground">Your profile</p>
                      <p className="font-medium">
                        {profile.incomeType.charAt(0).toUpperCase() +
                          profile.incomeType.slice(1)}{" "}
                        · ₹{profile.monthlyIncome.toLocaleString()}/mo ·{" "}
                        {profile.riskLevel} risk
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => setIsEditingProfile(true)}>
                        Edit Profile
                      </Button>
                      <Button
                        onClick={handleStartSimulation}
                        disabled={creating}
                        className="gap-2"
                      >
                        {creating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Starting...
                          </>
                        ) : (
                          <>
                            Start Simulation <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "ALLOCATE_BUDGET":
        return <BudgetAllocationForm />;

      case "SET_GOALS":
        return (
          <div className="max-w-3xl mx-auto space-y-6">
            <GoalSettingPanel />
            <div className="flex justify-center">
              <Button onClick={() => advanceMonth()} disabled={isAdvancing} className="gap-2">
                {isAdvancing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    Continue to Simulation <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case "MONTH_IN_PROGRESS":
        return <SimulationDashboard />;

      case "AWAITING_DECISIONS":
        return <DecisionPanel />;

      case "REPORT_VIEW": {
        const isFinished = simulation 
          ? simulation.currentMonth > simulation.maxMonths 
          : false;
        const canEnd = simulation 
          ? simulation.currentMonth > 3
          : false;

        return (
          <div className="space-y-6">
            <MonthlyReport />
            <div className="flex flex-col items-center gap-3">
              <div className="flex justify-center gap-3 flex-wrap">
                {!isFinished && (
                  <Button
                    onClick={() => advanceMonth()}
                    disabled={isAdvancing}
                    className="gap-2"
                  >
                    {isAdvancing ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                    ) : (
                      <><Play className="h-4 w-4" /> Advance to Next Month</>
                    )}
                  </Button>
                )}

                {canEnd && (
                  <Button
                    onClick={async () => {
                      try {
                        await endSimulation();
                      } catch {
                        /* handled */
                      }
                    }}
                    variant={isFinished ? "default" : "outline"}
                    disabled={isAdvancing}
                    className="gap-2"
                  >
                    <Target className="h-4 w-4" />
                    {isFinished
                      ? "View Final Report"
                      : "End Simulation Early"}
                  </Button>
                )}
              </div>
              {isFinished && (
                <p className="text-xs text-muted-foreground text-center">
                  You have completed all {simulation?.maxMonths} months. View your final report above.
                </p>
              )}
            </div>
          </div>
        );
      }

      case "SIMULATION_COMPLETE":
        return <FinalSummary />;

      default:
        return (
          <div className="text-center py-12 text-muted-foreground">
            <p>Unknown state. Please refresh.</p>
            <Button variant="outline" onClick={refresh} className="mt-4">
              Refresh
            </Button>
          </div>
        );
    }
  };

  return (
    <>
      {renderToolbar()}
      {renderMainContent()}
      {renderSidePanel()}
    </>
  );
}

export default function BudgetSimulatorPage() {
  return (
    <DashboardLayout>
      <BudgetSimulatorProvider>
        <SimulatorContent />
      </BudgetSimulatorProvider>
    </DashboardLayout>
  );
}
