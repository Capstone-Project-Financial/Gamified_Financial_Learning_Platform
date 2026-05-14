/** @format */

import { useState, useEffect } from "react";
import { useBudgetSimulator, SimulationMonth } from "@/contexts/BudgetSimulatorContext";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  IndianRupee, TrendingUp, TrendingDown, PiggyBank, AlertTriangle,
  Play, Square, ChevronRight, Heart, Target
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

export default function SimulationDashboard() {
  const { simulation, profile, currentMonth, isAdvancing, advanceMonth, endSimulation } = useBudgetSimulator();
  const [allMonths, setAllMonths] = useState<SimulationMonth[]>([]);

  // Fetch all months for the trend chart
  useEffect(() => {
    if (!simulation) return;
    const fetchMonths = async () => {
      try {
        const result = await api.get<{ months: SimulationMonth[] }>(
          `/budget-simulator/simulation/${simulation._id}/months?limit=12`
        );
        if (result?.months) {
          setAllMonths(result.months.sort((a, b) => a.monthNumber - b.monthNumber));
        }
      } catch {
        // silently fail — chart just won't show
      }
    };
    fetchMonths();
  }, [simulation?._id, simulation?.currentMonth]);

  if (!simulation || !profile) return null;

  const healthColor =
    simulation.healthScore >= 80 ? "text-green-400" :
    simulation.healthScore >= 60 ? "text-yellow-400" :
    simulation.healthScore >= 40 ? "text-orange-400" : "text-red-400";

  const healthBg =
    simulation.healthScore >= 80 ? "from-green-500/20 to-green-500/5" :
    simulation.healthScore >= 60 ? "from-yellow-500/20 to-yellow-500/5" :
    simulation.healthScore >= 40 ? "from-orange-500/20 to-orange-500/5" : "from-red-500/20 to-red-500/5";

  // Build chart data
  const completedMonths = allMonths.filter(m => m.status === "completed");
  const chartData = completedMonths.map(m => ({
    name: `M${m.monthNumber}`,
    balance: m.balanceEnd,
    savings: m.savingsBalance,
    debt: m.debtBalance,
    investments: m.investmentValue,
  }));

  // Compute worst debt month annotation
  const worstDebtMonth = completedMonths.reduce<SimulationMonth | null>((worst, m) => {
    if (m.debtBalance > (worst?.debtBalance || 0)) return m;
    return worst;
  }, null);

  let debtAnnotation: string | null = null;
  if (worstDebtMonth && worstDebtMonth.debtBalance > 0) {
    const causingEvent = worstDebtMonth.events.find(
      e => e.category === "negative" && e.requiresDecision
    );
    const eventName = causingEvent?.title || "financial event";
    debtAnnotation = `Month ${worstDebtMonth.monthNumber}: ${eventName} caused a ₹${worstDebtMonth.debtBalance.toLocaleString("en-IN")} debt spike`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Budget Simulator</h1>
          <p className="text-muted-foreground">
            Month {simulation.currentMonth - 1} of {simulation.maxMonths} · {profile.incomeType.charAt(0).toUpperCase() + profile.incomeType.slice(1)} · ₹{profile.monthlyIncome.toLocaleString()}/mo
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => advanceMonth()}
            disabled={isAdvancing}
            className="gap-2"
          >
            {isAdvancing ? (
              <>Processing...</>
            ) : (
              <><Play className="h-4 w-4" /> Advance Month</>
            )}
          </Button>
          {simulation.currentMonth > 3 && (
            <Button variant="outline" onClick={endSimulation} className="gap-2">
              <Square className="h-4 w-4" /> End Simulation
            </Button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Simulation Progress</span>
            <span className="text-muted-foreground">
              {Math.round(((simulation.currentMonth - 1) / simulation.maxMonths) * 100)}%
            </span>
          </div>
          <Progress value={((simulation.currentMonth - 1) / simulation.maxMonths) * 100} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Month 1</span>
            <span>Month {simulation.maxMonths}</span>
          </div>
        </CardContent>
      </Card>

      {/* AI Financial Position — from last completed month */}
      {(() => {
        const lastCompleted = [...completedMonths].sort((a, b) => b.monthNumber - a.monthNumber)[0];
        const aiInsight = lastCompleted?.aiInsight;
        if (!aiInsight) return null;
        return (
          <Card className="border-purple-700/40 bg-gradient-to-br from-purple-950/40 to-indigo-950/30 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-purple-300 text-sm">
                <span>✨</span> AI Financial Summary (Month {lastCompleted.monthNumber})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-gray-300">{aiInsight}</p>
              <div className="mt-2">
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-800/60 text-purple-300 border border-purple-600/30">
                  Powered by Gemini AI
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* 12-month Trend Chart */}
      {chartData.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-5 pb-4">
            <h3 className="text-sm font-medium text-gray-300 mb-4">
              {completedMonths.length}-month financial trajectory
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#6B7280" tick={{ fontSize: 11 }} />
                <YAxis
                  stroke="#6B7280"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, ""]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="savings" stroke="#10B981" strokeWidth={2} dot={false} name="Savings" />
                <Line type="monotone" dataKey="debt" stroke="#EF4444" strokeWidth={2} dot={false} name="Debt" />
                <Line type="monotone" dataKey="balance" stroke="#3B82F6" strokeWidth={2} dot={false} name="Balance" />
                <Line type="monotone" dataKey="investments" stroke="#8B5CF6" strokeWidth={2} dot={false} name="Investments" />
              </LineChart>
            </ResponsiveContainer>

            {/* Debt spike annotation */}
            {debtAnnotation && (
              <p className="text-xs text-gray-500 mt-2">
                📌 {debtAnnotation}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-muted-foreground">Balance</span>
            </div>
            <p className="text-2xl font-bold">₹{simulation.currentBalance.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <PiggyBank className="h-4 w-4 text-green-400" />
              <span className="text-sm text-muted-foreground">Total Savings</span>
            </div>
            <p className="text-2xl font-bold">₹{simulation.totalSavings.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              {simulation.totalDebt > 0 ? (
                <AlertTriangle className="h-4 w-4 text-red-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-400" />
              )}
              <span className="text-sm text-muted-foreground">Total Debt</span>
            </div>
            <p className={`text-2xl font-bold ${simulation.totalDebt > 0 ? "text-red-400" : ""}`}>
              ₹{simulation.totalDebt.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-muted-foreground">Investments</span>
            </div>
            <p className="text-2xl font-bold">₹{simulation.totalInvestmentValue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Health Score + Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Health Score */}
        <Card className={`border-border/50 bg-gradient-to-br ${healthBg} backdrop-blur-sm`}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" /> Financial Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`text-5xl font-bold ${healthColor}`}>{simulation.healthScore}</div>
              <div className="text-sm text-muted-foreground">/ 100</div>
            </div>
            <div className="mt-3">
              <span className={`text-sm font-medium ${healthColor}`}>
                {simulation.healthScore >= 80 ? "Excellent" :
                 simulation.healthScore >= 60 ? "Good" :
                 simulation.healthScore >= 40 ? "Fair" : "Needs Attention"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Goals */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" /> Financial Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {simulation.goals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No goals set yet.</p>
            ) : (
              simulation.goals.map((goal) => {
                const progress = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
                return (
                  <div key={goal.goalId}>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="font-medium">{goal.name}</span>
                      <Badge variant={goal.status === "completed" ? "default" : "secondary"}>
                        {goal.status === "completed" ? "✓ Done" : `${progress}%`}
                      </Badge>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ₹{goal.currentAmount.toLocaleString()} / ₹{goal.targetAmount.toLocaleString()}
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Last Month Summary */}
      {currentMonth && currentMonth.status === "completed" && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <ChevronRight className="h-5 w-5" /> Month {currentMonth.monthNumber} Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Income</span>
                <p className="font-medium text-green-400">+₹{currentMonth.incomeReceived.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Expenses</span>
                <p className="font-medium text-red-400">
                  -₹{currentMonth.fixedExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Events</span>
                <p className="font-medium">{currentMonth.events.length} events</p>
              </div>
              <div>
                <span className="text-muted-foreground">XP Earned</span>
                <p className="font-medium text-purple-400">+{currentMonth.xpEarned} XP</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* XP Earned */}
      <div className="text-center text-sm text-muted-foreground">
        Total XP earned in this simulation: <strong className="text-foreground">{simulation.xpEarnedTotal} XP</strong>
      </div>
    </div>
  );
}
