/** @format */

import { useBudgetSimulator, FinalSummary as FinalSummaryType } from "@/contexts/BudgetSimulatorContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Brain, Star, AlertTriangle, CheckCircle2, ArrowRight, BookOpen, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const ARCHETYPE_EMOJIS: Record<string, string> = {
  "Financial Champion": "🏆",
  "Cautious Builder": "🛡️",
  "Risky Spender": "🎰",
  "Debt Trapped": "⛓️",
  "Financial Avoider": "🙈",
  "Balanced Learner": "📚",
};

export default function FinalSummary() {
  const { simulation, refresh } = useBudgetSimulator();
  if (!simulation?.finalSummary) return null;

  const summary = simulation.finalSummary as FinalSummaryType;
  const metrics = simulation.behaviorMetrics;
  const report = summary.behavioralReport;

  const profileColors: Record<string, string> = {
    "Financial Champion": "from-green-500 to-emerald-500",
    "Cautious Builder": "from-blue-500 to-cyan-500",
    "Risky Spender": "from-orange-500 to-red-500",
    "Debt Trapped": "from-red-500 to-rose-500",
    "Financial Avoider": "from-gray-500 to-slate-500",
    "Balanced Learner": "from-purple-500 to-violet-500",
    // Legacy fallbacks
    "Prudent Planner": "from-green-500 to-emerald-500",
    "Balanced Budgeter": "from-blue-500 to-cyan-500",
    "Risk Taker": "from-orange-500 to-red-500",
    "Spendthrift": "from-pink-500 to-rose-500",
    "Debt Warrior": "from-purple-500 to-violet-500",
  };

  const archName = report?.archetype || summary.behavioralProfile;
  const archEmoji = ARCHETYPE_EMOJIS[archName] || "📊";
  const archGradient = profileColors[archName] || "from-blue-500 to-purple-500";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-2">
          <Trophy className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold">Simulation Complete!</h1>
        <p className="text-muted-foreground">
          You completed {summary.totalMonths} months of financial simulation.
        </p>
      </div>

      {/* Archetype Hero Card */}
      <Card className={`border-0 bg-gradient-to-br ${archGradient} text-white`}>
        <CardContent className="pt-6 pb-6 text-center">
          <div className="text-4xl mb-2">{archEmoji}</div>
          <p className="text-sm opacity-90">Your Financial Archetype</p>
          <p className="text-3xl font-bold mt-1">{archName}</p>
          {report?.archetypeDescription && (
            <p className="text-sm opacity-80 mt-2 max-w-lg mx-auto leading-relaxed">
              {report.archetypeDescription}
            </p>
          )}
        </CardContent>
      </Card>

      {/* AI Coaching Report */}
      {summary.aiCoachingReport && (
        <Card className="border-border/50 bg-gradient-to-br from-indigo-950/40 to-blue-950/20 backdrop-blur-sm border-indigo-800/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-400" />
              AI Financial Coach Report
              <Badge variant="outline" className="text-xs text-indigo-300 border-indigo-700/50 ml-auto">
                Powered by Gemini AI
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Personalized Letter */}
            <div className="p-4 rounded-lg bg-indigo-950/30 border border-indigo-800/20">
              <p className="text-sm text-indigo-100 leading-relaxed whitespace-pre-line">
                {summary.aiCoachingReport.personalizedLetter}
              </p>
            </div>

            {/* Strength & Improvement */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-green-950/20 border border-green-800/20">
                <p className="text-xs text-green-400 font-medium mb-1">💪 Your Biggest Strength</p>
                <p className="text-sm text-green-200">{summary.aiCoachingReport.biggestStrength}</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/20">
                <p className="text-xs text-amber-400 font-medium mb-1">🎯 Critical Improvement</p>
                <p className="text-sm text-amber-200">{summary.aiCoachingReport.criticalImprovement}</p>
              </div>
            </div>

            {/* Motivational Closing */}
            <div className="text-center p-3 rounded-lg bg-indigo-950/20 border border-indigo-800/10">
              <p className="text-sm text-indigo-200 italic">
                "{summary.aiCoachingReport.motivationalClosing}"
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2×2 Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground">Final Health Score</p>
            <p className="text-3xl font-bold">{summary.finalHealthScore}<span className="text-sm text-muted-foreground">/100</span></p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground">Concepts Learned</p>
            <p className="text-3xl font-bold">{report?.conceptsLearned.length ?? 0}<span className="text-sm text-muted-foreground">/10</span></p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-4 pb-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
              <p className="text-xs text-muted-foreground">Smart Decisions</p>
            </div>
            <p className="text-3xl font-bold text-green-400">{metrics.smartDecisionCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-4 pb-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
              <p className="text-xs text-muted-foreground">Avoidant Decisions</p>
            </div>
            <p className="text-3xl font-bold text-yellow-400">{metrics.avoidantDecisionCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Total Income", value: `₹${summary.totalIncomeEarned?.toLocaleString()}` },
          { label: "Total Expenses", value: `₹${summary.totalExpenses?.toLocaleString()}` },
          { label: "Total Savings", value: `₹${summary.totalSavings?.toLocaleString()}` },
          { label: "Avg Health", value: `${summary.averageHealthScore}/100` },
          { label: "Total XP", value: `+${summary.totalXpEarned}` },
          { label: "Events Handled", value: `${summary.eventsHandled}` },
        ].map(({ label, value }) => (
          <Card key={label} className="border-border/50 bg-card/50">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top 3 Decisions Timeline */}
      {report?.topThreeDecisions && report.topThreeDecisions.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" />
              3 Decisions That Defined Your Simulation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.topThreeDecisions.map((dec, i) => (
              <div key={i} className="relative pl-6 pb-4 border-l-2 border-gray-700 last:border-0 last:pb-0">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-800 border-2 border-blue-500" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-400 font-medium">Month {dec.month}</span>
                    <span className="text-sm font-medium text-white">{dec.eventTitle}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Chose: <span className="text-white">{dec.choiceLabel}</span>
                  </p>
                  <p className="text-xs text-gray-500">{dec.financialImpact}</p>
                  {dec.rootCause && (
                    <p className="text-xs text-yellow-500/80">{dec.rootCause}</p>
                  )}
                  <p className="text-xs text-gray-500 italic mt-1">
                    ⤷ {dec.counterfactualImpact}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Real Life Actions */}
      {report?.realLifeActions && report.realLifeActions.length > 0 && (
        <Card className="border-border/50 bg-gradient-to-br from-green-950/40 to-emerald-950/20 backdrop-blur-sm border-green-800/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-green-400" />
              Apply This to Real Life
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.realLifeActions.map((action, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-green-950/20 border border-green-800/20">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-green-200 leading-relaxed">{action}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Concepts Learned */}
      {report && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-400" />
              Concepts: {report.conceptsLearned.length}/10
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-3">
              {report.conceptsLearned.map((concept, i) => (
                <span
                  key={i}
                  className="text-xs px-3 py-1 rounded-full bg-purple-900/40 text-purple-300 border border-purple-700/30"
                >
                  ✓ {concept}
                </span>
              ))}
            </div>
            {report.conceptsNotEncountered.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Not encountered in this simulation:</p>
                <div className="flex flex-wrap gap-2">
                  {report.conceptsNotEncountered.map((concept, i) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1 rounded-full bg-gray-800/50 text-gray-500 border border-gray-700/30"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Streaks */}
      {report?.streaks && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-xs text-muted-foreground">Longest Savings Streak</p>
              <p className="text-2xl font-bold text-green-400">{report.streaks.longestSavingsStreak} <span className="text-sm text-muted-foreground">months</span></p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-xs text-muted-foreground">Smart Decision Streak</p>
              <p className="text-2xl font-bold text-blue-400">{report.streaks.smartDecisionStreak} <span className="text-sm text-muted-foreground">in a row</span></p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Goals */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle>Goals: {summary.goalsCompleted}/{summary.goalsTotal} Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={summary.goalsTotal > 0 ? (summary.goalsCompleted / summary.goalsTotal) * 100 : 0} className="h-2" />
        </CardContent>
      </Card>

      {/* Investments */}
      {summary.investmentPerformance && summary.investmentPerformance.totalInvested > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle>Investment Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Total Invested</p>
                <p className="text-lg font-bold">₹{summary.investmentPerformance.totalInvested.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Final Value</p>
                <p className="text-lg font-bold">₹{summary.investmentPerformance.finalValue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Return</p>
                <p className={`text-lg font-bold ${summary.investmentPerformance.returnPercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {summary.investmentPerformance.returnPercent}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {summary.insights && summary.insights.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle>📝 Key Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.insights.map((insight: string, i: number) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                <Badge variant="outline" className="mt-0.5 shrink-0">{i + 1}</Badge>
                <p className="text-sm">{insight}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Run Another Simulation */}
      <div className="text-center pt-4">
        <Button
          size="lg"
          className="gap-2"
          onClick={() => window.location.reload()}
        >
          <RotateCcw className="h-4 w-4" />
          Run Another Simulation
        </Button>
      </div>
    </div>
  );
}
