/** @format */

import { useBudgetSimulator } from "@/contexts/BudgetSimulatorContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function MonthlyReport() {
  const { currentMonth, simulation } = useBudgetSimulator();
  if (!currentMonth || currentMonth.status !== "completed") return null;

  const totalExpenses = currentMonth.fixedExpenses.reduce((s, e) => s + e.amount, 0);
  const breakdown = currentMonth.healthBreakdown || { savingsScore: 0, debtScore: 0, emergencyFundScore: 0, spendingScore: 0, investmentScore: 0, insights: [], actionableTips: {} };
  const tips = breakdown.actionableTips || {};

  // Separate expense types
  const regularExpenses = currentMonth.fixedExpenses.filter(e => !e.category.startsWith("emi_") && e.category !== "investment");
  const emiExpenses = currentMonth.fixedExpenses.filter(e => e.category.startsWith("emi_"));
  const totalEmi = emiExpenses.reduce((s, e) => s + e.amount, 0);
  const totalRegular = regularExpenses.reduce((s, e) => s + e.amount, 0);
  const sipAmount = simulation?.currentBudget?.investment || 0;

  // Decision effects
  const decisionBalanceEffect = currentMonth.decisions.reduce((s, d) => s + (d.immediateEffect?.balance || 0), 0);
  const decisionDebtEffect = currentMonth.decisions.reduce((s, d) => s + (d.immediateEffect?.debt || 0), 0);
  const decisionSavingsEffect = currentMonth.decisions.reduce((s, d) => s + (d.immediateEffect?.savings || 0), 0);
  const decisionInvestmentEffect = currentMonth.decisions.reduce((s, d) => s + ((d.immediateEffect as any)?.investment || 0), 0);

  // Net worth
  const investmentValue = (currentMonth as any).investmentValue || 0;
  const debtBalance = currentMonth.debtBalance || 0;
  const netWorth = currentMonth.balanceEnd + (currentMonth.savingsBalance || 0) + investmentValue - debtBalance;

  // Investment P&L data
  const investmentPL = currentMonth.investmentPL;
  const debtDetails = currentMonth.debtDetails || [];
  const goalSnapshots = currentMonth.goalSnapshots || [];

  const balanceChange = currentMonth.balanceEnd - currentMonth.balanceStart;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Month {currentMonth.monthNumber} Report</h1>
        <p className="text-muted-foreground">
          Every ₹ is traceable — see exactly how each decision affected your budget.
        </p>
      </div>

      {/* ═══ BUDGET IMPACT STORY — The Main Narrative ═══ */}
      {currentMonth.budgetImpactNarrative && (
        <Card className="border-blue-700/40 bg-gradient-to-br from-blue-950/40 to-indigo-950/30 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-blue-300">
              <span className="text-lg">📖</span> What Happened This Month
            </CardTitle>
            <p className="text-[10px] text-blue-400/60">
              A cause-and-effect story of every money movement
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-gray-300">{currentMonth.budgetImpactNarrative}</p>
            {currentMonth.aiInsight && (
              <div className="mt-3 pt-3 border-t border-blue-700/30">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-800/60 text-purple-300 border border-purple-600/30">
                    ✨ AI Coach
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-purple-200/80">{currentMonth.aiInsight}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══ STEP-BY-STEP MONEY FLOW WATERFALL ═══ */}
      <Card className="border-emerald-700/40 bg-gradient-to-br from-emerald-950/20 to-teal-950/10 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">💰</span> Money Flow — Step by Step
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Follow your money from income → expenses → savings → SIP → EMI → events → final balance
          </p>
        </CardHeader>
        <CardContent className="space-y-0">
          {/* Starting Balance */}
          <FlowRow
            label="Starting Balance"
            sublabel="What you had at the start of this month"
            amount={currentMonth.balanceStart}
            color="text-gray-400"
            isBold
          />

          {/* Income */}
          <FlowRow
            label="+ Monthly Income (salary credited)"
            sublabel="Your monthly salary added to your balance"
            amount={currentMonth.incomeReceived}
            color="text-green-400"
            prefix="+"
          />

          {/* Living Expenses */}
          <div className="py-2 border-b border-border/20">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm text-red-400">− Living Expenses (from your budget)</span>
                <p className="text-[10px] text-muted-foreground">Auto-deducted based on your budget allocation</p>
              </div>
              <span className="text-sm font-semibold text-red-400">−₹{totalRegular.toLocaleString()}</span>
            </div>
            <div className="ml-4 mt-1 space-y-0.5">
              {regularExpenses.map((exp) => (
                <div key={exp.category} className="flex justify-between text-[11px] text-muted-foreground">
                  <span className="capitalize">{exp.category.replace(/_/g, " ")}</span>
                  <span>₹{exp.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SIP Investment */}
          {sipAmount > 0 && (
            <div className="py-2 border-b border-border/20">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-purple-400">− SIP Investment (moved to portfolio)</span>
                  <p className="text-[10px] text-green-400/70">⚡ NOT a loss — money moved from cash → investment portfolio for growth</p>
                </div>
                <span className="text-sm font-semibold text-purple-400">−₹{sipAmount.toLocaleString()}</span>
              </div>
              {investmentPL && (
                <div className="ml-4 mt-1 text-[11px] text-muted-foreground space-y-0.5">
                  <div className="flex justify-between">
                    <span>Total invested so far</span>
                    <span>₹{investmentPL.totalInvested.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current portfolio value</span>
                    <span className="text-purple-400">₹{investmentPL.currentValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Market return this month</span>
                    <span className={investmentPL.marketReturnThisMonth >= 0 ? "text-green-400" : "text-red-400"}>
                      {investmentPL.marketReturnThisMonth >= 0 ? "+" : ""}₹{investmentPL.marketReturnThisMonth.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* EMI Payment */}
          {totalEmi > 0 && (
            <div className="py-2 border-b border-border/20">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-orange-400">− EMI Payments (debt repayment)</span>
                  <p className="text-[10px] text-muted-foreground">Auto-deducted to reduce your outstanding loans</p>
                </div>
                <span className="text-sm font-semibold text-orange-400">−₹{totalEmi.toLocaleString()}</span>
              </div>
              {debtDetails.filter(d => d.emiPaid > 0).map((debt, i) => (
                <div key={i} className="ml-4 mt-1 text-[11px] text-muted-foreground space-y-0.5">
                  <div className="flex justify-between">
                    <span className="capitalize">{debt.type.replace(/_/g, " ")} EMI</span>
                    <span>₹{debt.emiPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-green-400/60">→ ₹{debt.principalPortion.toLocaleString()} reduced your loan</span>
                    <span className="text-red-400/60">₹{debt.interestPortion.toLocaleString()} was interest (bank's fee)</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Missed EMI Warning */}
          {debtDetails.some(d => d.missed) && (
            <div className="py-2 border-b border-border/20">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-red-500">⚠️ MISSED EMI Payment</span>
                  <p className="text-[10px] text-red-400/80">Insufficient balance — 1.5x penalty interest applied! This drops your health score.</p>
                </div>
                <span className="text-sm font-semibold text-red-500">Penalty</span>
              </div>
            </div>
          )}

          {/* Non-decision Events (auto-applied) */}
          {currentMonth.events.filter(e => !e.requiresDecision).map((event) => (
            <FlowRow
              key={event.eventId}
              label={`${event.category === "positive" ? "+" : "−"} ${event.title}`}
              sublabel={`Auto-applied ${event.category} event — no decision needed`}
              amount={event.financialImpact}
              color={event.category === "positive" ? "text-green-400" : "text-red-400"}
              prefix={event.category === "positive" ? "+" : "−"}
            />
          ))}

          {/* Decision Events — each one with full cause-effect */}
          {currentMonth.decisions.map((dec, i) => {
            const event = currentMonth.events.find(e => e.eventId === dec.eventId);
            const tagStyles: Record<string, string> = {
              smart: "bg-green-900/50 text-green-400 border-green-700/40",
              risky: "bg-red-900/50 text-red-400 border-red-700/40",
              avoidant: "bg-yellow-900/50 text-yellow-400 border-yellow-700/40",
              neutral: "bg-blue-900/50 text-blue-400 border-blue-700/40",
            };
            const hasBalance = dec.immediateEffect?.balance && dec.immediateEffect.balance !== 0;
            const hasSavings = dec.immediateEffect?.savings && dec.immediateEffect.savings !== 0;
            const hasDebt = dec.immediateEffect?.debt && dec.immediateEffect.debt > 0;
            const hasInvestment = (dec.immediateEffect as any)?.investment && (dec.immediateEffect as any).investment !== 0;

            return (
              <div key={i} className="py-2 border-b border-border/20">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-amber-300">⚡ {event?.title || dec.eventId}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border font-medium ${tagStyles[dec.behaviorTag] || tagStyles.neutral}`}>
                        {dec.behaviorTag}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">You chose: "{dec.label}"</p>
                  </div>
                </div>

                {/* Show each effect as a traceable line */}
                <div className="ml-4 mt-1.5 space-y-1">
                  {hasBalance && (
                    <div className="flex justify-between text-[11px]">
                      <span className={dec.immediateEffect.balance! > 0 ? "text-green-400" : "text-red-400"}>
                        → {dec.immediateEffect.balance! > 0 ? "Added to" : "Deducted from"} your cash balance
                      </span>
                      <span className={`font-medium ${dec.immediateEffect.balance! > 0 ? "text-green-400" : "text-red-400"}`}>
                        {dec.immediateEffect.balance! > 0 ? "+" : ""}₹{dec.immediateEffect.balance!.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {hasSavings && (
                    <div className="flex justify-between text-[11px]">
                      <span className={dec.immediateEffect.savings! > 0 ? "text-green-400" : "text-amber-400"}>
                        → {dec.immediateEffect.savings! < 0 ? "Used from" : "Added to"} your savings
                      </span>
                      <span className={`font-medium ${dec.immediateEffect.savings! > 0 ? "text-green-400" : "text-amber-400"}`}>
                        {dec.immediateEffect.savings! > 0 ? "+" : ""}₹{dec.immediateEffect.savings!.toLocaleString()} savings
                      </span>
                    </div>
                  )}
                  {hasDebt && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-red-400">→ Created new debt (EMI starts next month)</span>
                      <span className="font-medium text-red-400">+₹{dec.immediateEffect.debt!.toLocaleString()} debt</span>
                    </div>
                  )}
                  {hasInvestment && (
                    <div className="flex justify-between text-[11px]">
                      <span className={(dec.immediateEffect as any).investment > 0 ? "text-purple-400" : "text-red-400"}>
                        → {(dec.immediateEffect as any).investment > 0 ? "Added to" : "Withdrawn from"} portfolio
                      </span>
                      <span className={`font-medium ${(dec.immediateEffect as any).investment > 0 ? "text-purple-400" : "text-red-400"}`}>
                        {(dec.immediateEffect as any).investment > 0 ? "+" : ""}₹{(dec.immediateEffect as any).investment.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Show how this decision connects to goals */}
                  {hasSavings && goalSnapshots.some(g => g.type === "savings_target" || g.type === "purchase") && (
                    <p className="text-[10px] text-blue-400/70 mt-0.5">
                      📎 This affected your savings-linked goals: {goalSnapshots.filter(g => g.type === "savings_target" || g.type === "purchase").map(g => `"${g.name}" (now ${g.progress}%)`).join(", ")}
                    </p>
                  )}
                  {hasDebt && goalSnapshots.some(g => g.type === "debt_payoff") && (
                    <p className="text-[10px] text-red-400/70 mt-0.5">
                      📎 New debt affects your debt payoff goal: {goalSnapshots.filter(g => g.type === "debt_payoff").map(g => `"${g.name}" (now ${g.progress}%)`).join(", ")}
                    </p>
                  )}
                </div>

                {/* Explanation & Counterfactual */}
                {dec.explanation && (
                  <p className="text-xs text-gray-400 ml-4 mt-1">💡 {dec.explanation}</p>
                )}
                {dec.counterfactual && (
                  <p className="text-xs text-gray-500 italic ml-4 mt-0.5">⤷ What if: {dec.counterfactual}</p>
                )}
              </div>
            );
          })}

          {/* ═══ FINAL LINE — Ending Balance ═══ */}
          <div className="flex justify-between items-center py-3 mt-1 border-t-2 border-emerald-700/40">
            <div>
              <span className="text-sm font-bold text-white">= Ending Balance</span>
              <p className="text-[10px] text-muted-foreground">
                {balanceChange >= 0
                  ? `↑ Balance grew by ₹${balanceChange.toLocaleString()} this month`
                  : `↓ Balance dropped by ₹${Math.abs(balanceChange).toLocaleString()} this month`}
              </p>
            </div>
            <span className="text-lg font-bold text-white">₹{currentMonth.balanceEnd.toLocaleString()}</span>
          </div>

          {/* Net Financial Position */}
          <div className="mt-3 p-3 rounded-lg bg-muted/30 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Net Financial Position</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cash Balance</span>
              <span className="font-medium">₹{currentMonth.balanceEnd.toLocaleString()}</span>
            </div>
            {currentMonth.savingsBalance > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-400">+ Savings</span>
                <span className="font-medium text-green-400">+₹{currentMonth.savingsBalance.toLocaleString()}</span>
              </div>
            )}
            {investmentValue > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-purple-400">+ Investment Portfolio</span>
                <span className="font-medium text-purple-400">+₹{investmentValue.toLocaleString()}</span>
              </div>
            )}
            {debtBalance > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-red-400">− Outstanding Debt</span>
                <span className="font-medium text-red-400">−₹{debtBalance.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm border-t border-border/30 pt-1.5">
              <span className="font-semibold">Net Worth</span>
              <span className={`font-bold ${netWorth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ₹{netWorth.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ INVESTMENT P&L (Profit/Loss) ═══ */}
      <Card className="border-purple-700/30 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            📈 Investment Profit & Loss
          </CardTitle>
          <p className="text-[10px] text-muted-foreground">
            SIP deduction is NOT a loss — it's money moved from cash to your investment portfolio
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {investmentPL && investmentPL.currentValue > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 rounded-lg bg-muted/30 text-center">
                  <p className="text-[10px] text-muted-foreground">Total Invested</p>
                  <p className="text-sm font-bold">₹{investmentPL.totalInvested.toLocaleString()}</p>
                  <p className="text-[9px] text-muted-foreground">cumulative SIP contributions</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/30 text-center">
                  <p className="text-[10px] text-muted-foreground">Current Value</p>
                  <p className="text-sm font-bold text-purple-400">₹{investmentPL.currentValue.toLocaleString()}</p>
                  <p className="text-[9px] text-muted-foreground">invested + market returns</p>
                </div>
              </div>
              <div className={`p-3 rounded-lg text-center ${investmentPL.gain >= 0 ? "bg-green-950/30 border border-green-800/20" : "bg-red-950/30 border border-red-800/20"}`}>
                <p className="text-[10px] text-muted-foreground">
                  Unrealized {investmentPL.gain >= 0 ? "Profit" : "Loss"}
                </p>
                <p className={`text-xl font-bold ${investmentPL.gain >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {investmentPL.gain >= 0 ? "+" : ""}₹{investmentPL.gain.toLocaleString()} ({investmentPL.gainPercent}%)
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {investmentPL.gain >= 0
                    ? "If you withdraw now, you keep this profit. Staying invested lets compounding grow it further."
                    : "Market fluctuations are normal. SIPs average out over time — don't panic withdraw."}
                </p>
              </div>
              <div className="text-[10px] text-gray-500 flex justify-between">
                <span>SIP deducted this month: ₹{investmentPL.sipDeductedThisMonth.toLocaleString()}</span>
                <span>Market return: {investmentPL.marketReturnThisMonth >= 0 ? "+" : ""}₹{investmentPL.marketReturnThisMonth.toLocaleString()}</span>
              </div>
            </>
          ) : sipAmount > 0 ? (
            <p className="text-sm text-amber-400">
              📤 Portfolio was withdrawn — SIP of ₹{sipAmount.toLocaleString()} is allocated but your portfolio shows ₹0. Withdrawn funds were added back to your cash balance.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No investments active. Allocate budget to SIP to start growing wealth through compounding.</p>
          )}
        </CardContent>
      </Card>

      {/* ═══ DEBT COST BREAKDOWN ═══ */}
      {(debtDetails.length > 0 || debtBalance > 0) && (
        <Card className="border-red-700/30 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              💳 Debt Cost Breakdown
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">
              See how much of your EMI actually reduces debt vs goes to interest
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {debtDetails.length > 0 ? (
              debtDetails.map((debt, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/30 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium capitalize">{debt.type.replace(/_/g, " ")}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${debt.missed ? "bg-red-900/50 text-red-400 border border-red-700/40" : "bg-green-900/50 text-green-400 border border-green-700/40"}`}>
                      {debt.missed ? "MISSED" : "Paid"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-muted-foreground">Original Loan</span>
                      <p className="font-medium">₹{debt.principal.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Still Outstanding</span>
                      <p className="font-medium text-red-400">₹{debt.outstanding.toLocaleString()}</p>
                    </div>
                    {!debt.missed && debt.emiPaid > 0 && (
                      <>
                        <div>
                          <span className="text-green-400/70">Principal Paid ✓</span>
                          <p className="font-medium text-green-400">₹{debt.principalPortion.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-red-400/70">Interest (bank's fee)</span>
                          <p className="font-medium text-red-400">₹{debt.interestPortion.toLocaleString()}</p>
                        </div>
                      </>
                    )}
                  </div>
                  {debt.missed && (
                    <p className="text-[10px] text-red-400">⚠️ Missed EMI = 1.5x penalty interest applied. Your CIBIL score would drop 50-100 points in real life.</p>
                  )}
                  {!debt.missed && debt.interestPortion > 0 && (
                    <p className="text-[10px] text-amber-400/80">💡 ₹{debt.interestPortion.toLocaleString()} went to the bank as interest — paying early saves this amount every month.</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-green-400">✅ Debt-free! No outstanding loans.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══ GOAL PROGRESS — With Cause-Effect ═══ */}
      {goalSnapshots.length > 0 && (
        <Card className="border-blue-700/30 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              🎯 Goal Progress — How Your Decisions Affected Goals
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">
              Every goal is linked to a specific part of your budget — see the connection
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {goalSnapshots.map((goal) => {
              const isCompleted = goal.status === "completed" && goal.previousAmount < goal.targetAmount;
              return (
                <div key={goal.goalId} className="p-3 rounded-lg bg-muted/30 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{goal.name}</span>
                    <span className={goal.status === "completed" ? "text-green-400 text-sm" : "text-blue-400 text-sm"}>
                      {goal.status === "completed" ? "✓ Completed!" : `${goal.progress}%`}
                    </span>
                  </div>
                  <Progress value={goal.progress} className="h-1.5" />
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>₹{goal.currentAmount.toLocaleString()} / ₹{goal.targetAmount.toLocaleString()}</span>
                    {goal.changeThisMonth !== 0 && (
                      <span className={goal.changeThisMonth > 0 ? "text-green-400" : "text-red-400"}>
                        {goal.changeThisMonth > 0 ? "+" : ""}₹{goal.changeThisMonth.toLocaleString()} this month
                      </span>
                    )}
                  </div>
                  {/* WHY this goal changed */}
                  <div className="text-[10px] text-blue-400/70 space-y-0.5">
                    <p>📎 {goal.whatDrivesIt}</p>
                    {goal.changeThisMonth > 0 && goal.type === "savings_target" && (
                      <p>↗ Increased because you allocated ₹{(simulation?.currentBudget?.savings || 0).toLocaleString()} to savings this month</p>
                    )}
                    {goal.changeThisMonth > 0 && goal.type === "emergency_fund" && (
                      <p>↗ Increased because you allocated ₹{(simulation?.currentBudget?.emergencyFund || 0).toLocaleString()} to emergency fund</p>
                    )}
                    {goal.changeThisMonth > 0 && goal.type === "investment_milestone" && (
                      <p>↗ Increased because your SIP of ₹{sipAmount.toLocaleString()} + market returns grew the portfolio</p>
                    )}
                    {goal.changeThisMonth < 0 && (
                      <p>↘ Decreased likely due to an event decision that used savings or affected this metric</p>
                    )}
                    {isCompleted && goal.type === "purchase" && (
                      <p className="text-amber-400">⚠️ Purchase completed! ₹{goal.targetAmount.toLocaleString()} was deducted from your balance and savings.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Fallback: Show simulation goals if no snapshots (backwards compat) */}
      {goalSnapshots.length === 0 && simulation && simulation.goals.length > 0 && (
        <Card className="border-blue-700/30 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              🎯 Goal Progress This Month
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {simulation.goals.map((goal) => {
              const progress = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
              return (
                <div key={goal.goalId}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{goal.name}</span>
                    <span className={goal.status === "completed" ? "text-green-400" : "text-blue-400"}>
                      {goal.status === "completed" ? "✓ Completed!" : `${progress}%`}
                    </span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ₹{goal.currentAmount.toLocaleString()} / ₹{goal.targetAmount.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ═══ HEALTH SCORE — With Cause Explanations ═══ */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle>Health Score: {currentMonth.healthScore}/100</CardTitle>
          <p className="text-[10px] text-muted-foreground">
            Calculated from 5 factors — each one is affected by your budget and decisions
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Savings Rate", score: breakdown.savingsScore, max: 25, tip: tips?.savingsTip, cause: "Driven by your savings allocation vs income" },
            { label: "Debt Management", score: breakdown.debtScore, max: 25, tip: tips?.debtTip, cause: "Based on your debt-to-income ratio" },
            { label: "Emergency Fund", score: breakdown.emergencyFundScore, max: 20, tip: tips?.emergencyFundTip, cause: "Based on months of expenses covered" },
            { label: "Spending Discipline", score: breakdown.spendingScore, max: 15, tip: tips?.spendingTip, cause: "Based on total spending vs income" },
            { label: "Investment", score: breakdown.investmentScore, max: 15, tip: tips?.investmentTip, cause: "Based on SIP allocation vs income" },
          ].map(({ label, score, max, tip, cause }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1">
                <div>
                  <span>{label}</span>
                  <span className="text-[10px] text-muted-foreground ml-2">— {cause}</span>
                </div>
                <span>{score}/{max}</span>
              </div>
              <Progress value={max > 0 ? (score / max) * 100 : 0} className="h-1.5" />
              {tip && score < max && (
                <p className="text-xs text-amber-400/80 mt-1">💡 {tip}</p>
              )}
            </div>
          ))}

          {breakdown.insights?.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 space-y-1">
              <p className="text-sm font-medium mb-2">💡 Insights</p>
              {breakdown.insights.map((insight: string, i: number) => (
                <p key={i} className="text-xs text-muted-foreground">• {insight}</p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ EVENTS THIS MONTH ═══ */}
      {currentMonth.events.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle>Events This Month</CardTitle>
            <p className="text-[10px] text-muted-foreground">All financial events that occurred — scroll up to Money Flow to see how each one affected your balance</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {currentMonth.events.map((event) => (
              <div key={event.eventId} className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      event.category === "positive" ? "text-green-400" :
                      event.category === "negative" ? "text-red-400" : "text-yellow-400"
                    }`}>{event.title}</span>
                    {event.eventId?.startsWith("ai-gen") && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-800/50 text-purple-300 border border-purple-600/30">
                        ✨ AI
                      </span>
                    )}
                  </div>
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

/** Reusable row for the money flow waterfall */
function FlowRow({ label, sublabel, amount, color, prefix, isBold }: {
  label: string; sublabel?: string; amount: number; color: string; prefix?: string; isBold?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/20">
      <div>
        <span className={`text-sm ${color}`}>{label}</span>
        {sublabel && <p className="text-[10px] text-muted-foreground">{sublabel}</p>}
      </div>
      <span className={`text-sm ${isBold ? "font-bold" : "font-semibold"} ${color}`}>
        {prefix || ""}₹{amount.toLocaleString()}
      </span>
    </div>
  );
}
