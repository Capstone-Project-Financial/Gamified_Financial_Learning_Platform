/** @format */

import { useBudgetSimulator } from "@/contexts/BudgetSimulatorContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function MonthlyReport() {
  const { currentMonth } = useBudgetSimulator();
  if (!currentMonth || currentMonth.status !== "completed") return null;

  const totalExpenses = currentMonth.fixedExpenses.reduce((s, e) => s + e.amount, 0);
  const breakdown = currentMonth.healthBreakdown;
  const tips = breakdown.actionableTips;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Month {currentMonth.monthNumber} Report</h1>
        <p className="text-muted-foreground">
          Here's how you did this month.
        </p>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Income</p>
            <p className="text-xl font-bold text-green-400">+₹{currentMonth.incomeReceived.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Expenses</p>
            <p className="text-xl font-bold text-red-400">-₹{totalExpenses.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">End Balance</p>
            <p className="text-xl font-bold">₹{currentMonth.balanceEnd.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">XP Earned</p>
            <p className="text-xl font-bold text-purple-400">+{currentMonth.xpEarned}</p>
          </CardContent>
        </Card>
      </div>

      {/* Expense Breakdown */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle>Expense Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentMonth.fixedExpenses.map((exp) => {
            const pct = totalExpenses > 0 ? Math.round((exp.amount / totalExpenses) * 100) : 0;
            return (
              <div key={exp.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize">{exp.category.replace(/_/g, " ")}</span>
                  <span>₹{exp.amount.toLocaleString()} ({pct}%)</span>
                </div>
                <Progress value={pct} className="h-1.5" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Decision Review */}
      {currentMonth.decisions.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle>Decision Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentMonth.decisions.map((dec, i) => {
              const event = currentMonth.events.find(e => e.eventId === dec.eventId);
              const tagStyles: Record<string, string> = {
                smart: "bg-green-900/50 text-green-400 border-green-700/40",
                risky: "bg-red-900/50 text-red-400 border-red-700/40",
                avoidant: "bg-yellow-900/50 text-yellow-400 border-yellow-700/40",
                neutral: "bg-blue-900/50 text-blue-400 border-blue-700/40",
              };
              return (
                <div key={i} className="p-3 rounded-lg bg-muted/30 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{event?.title || dec.eventId}</p>
                      <p className="text-xs text-muted-foreground">Chose: {dec.label}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${tagStyles[dec.behaviorTag] || tagStyles.neutral}`}>
                      {dec.behaviorTag}
                    </span>
                  </div>
                  {dec.explanation && (
                    <p className="text-xs text-gray-400">{dec.explanation}</p>
                  )}
                  {dec.counterfactual && (
                    <p className="text-xs text-gray-500 italic">⤷ {dec.counterfactual}</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Health Score Breakdown + Actionable Tips */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle>Health Score: {currentMonth.healthScore}/100</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Savings", score: breakdown.savingsScore, max: 25, tip: tips?.savingsTip },
            { label: "Debt Management", score: breakdown.debtScore, max: 25, tip: tips?.debtTip },
            { label: "Emergency Fund", score: breakdown.emergencyFundScore, max: 20, tip: tips?.emergencyFundTip },
            { label: "Spending", score: breakdown.spendingScore, max: 15, tip: tips?.spendingTip },
            { label: "Investment", score: breakdown.investmentScore, max: 15, tip: tips?.investmentTip },
          ].map(({ label, score, max, tip }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1">
                <span>{label}</span>
                <span>{score}/{max}</span>
              </div>
              <Progress value={max > 0 ? (score / max) * 100 : 0} className="h-1.5" />
              {tip && score < max && (
                <p className="text-xs text-amber-400/80 mt-1">💡 {tip}</p>
              )}
            </div>
          ))}

          {breakdown.insights.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 space-y-1">
              <p className="text-sm font-medium mb-2">💡 Insights</p>
              {breakdown.insights.map((insight, i) => (
                <p key={i} className="text-xs text-muted-foreground">• {insight}</p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Concepts Learned This Month */}
      {currentMonth.conceptsEncountered && currentMonth.conceptsEncountered.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle>Concepts Learned This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {currentMonth.conceptsEncountered.map((concept, i) => (
                <span
                  key={i}
                  className="text-xs px-3 py-1 rounded-full bg-purple-900/40 text-purple-300 border border-purple-700/30"
                >
                  {concept}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events This Month */}
      {currentMonth.events.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle>Events This Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {currentMonth.events.map((event) => (
              <div key={event.eventId} className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                <div>
                  <span className={`text-sm font-medium ${
                    event.category === "positive" ? "text-green-400" :
                    event.category === "negative" ? "text-red-400" : "text-yellow-400"
                  }`}>{event.title}</span>
                  {event.resolved && event.decisionMade && (
                    <p className="text-xs text-muted-foreground">Decision: {(event.decisionMade as any).label}</p>
                  )}
                </div>
                <span className={`text-sm ${
                  event.category === "positive" ? "text-green-400" : "text-red-400"
                }`}>
                  {event.category === "positive" ? "+" : "-"}₹{Math.abs(event.financialImpact).toLocaleString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
