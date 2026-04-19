/** @format */

import { useEffect, useState, useCallback } from "react";
import { useBudgetSimulator } from "@/contexts/BudgetSimulatorContext";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  IndianRupee,
  BarChart3,
  Activity,
  DollarSign,
} from "lucide-react";

interface MonthlyHistoryEntry {
  month: number;
  invested: number;
  value: number;
}

interface Investment {
  _id: string;
  type: "sip";
  monthlyAmount: number;
  totalInvested: number;
  currentValue: number;
  returnRate: number;
  riskProfile: "conservative" | "moderate" | "aggressive";
  monthlyHistory: MonthlyHistoryEntry[];
  status: "active" | "withdrawn";
}

const riskConfig: Record<string, { label: string; color: string; bg: string }> = {
  conservative: { label: "Conservative", color: "text-blue-400", bg: "from-blue-500/10 to-blue-500/5" },
  moderate: { label: "Moderate", color: "text-green-400", bg: "from-green-500/10 to-green-500/5" },
  aggressive: { label: "Aggressive", color: "text-orange-400", bg: "from-orange-500/10 to-orange-500/5" },
};

export default function InvestmentPanel() {
  const { simulation, refresh } = useBudgetSimulator();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchInvestments = useCallback(async () => {
    if (!simulation) return;
    setLoading(true);
    try {
      const data = await api.get<Investment[]>(
        `/budget-simulator/simulation/${simulation._id}/investments`
      );
      setInvestments(data || []);
    } catch {
      setInvestments([]);
    } finally {
      setLoading(false);
    }
  }, [simulation]);

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  const handleWithdraw = async () => {
    if (!simulation) return;
    setWithdrawing(true);
    try {
      await api.post(`/budget-simulator/simulation/${simulation._id}/investments/withdraw`, {});
      toast.success("Investments withdrawn successfully");
      await fetchInvestments();
      await refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to withdraw investments");
    } finally {
      setWithdrawing(false);
    }
  };

  const activeInvestments = investments.filter((i) => i.status === "active");
  const withdrawnInvestments = investments.filter((i) => i.status === "withdrawn");

  const totalInvested = activeInvestments.reduce((s, i) => s + i.totalInvested, 0);
  const totalValue = activeInvestments.reduce((s, i) => s + i.currentValue, 0);
  const totalReturn = totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0;
  const isPositiveReturn = totalReturn >= 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <div className="animate-pulse text-sm">Loading investments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Investment Portfolio</h2>
          <p className="text-sm text-muted-foreground">
            {activeInvestments.length} active SIP{activeInvestments.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Portfolio Summary */}
      {investments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <IndianRupee className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-muted-foreground">Total Invested</span>
              </div>
              <p className="text-xl font-bold">₹{totalInvested.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-green-400" />
                <span className="text-xs text-muted-foreground">Current Value</span>
              </div>
              <p className={`text-xl font-bold ${isPositiveReturn ? "text-green-400" : "text-red-400"}`}>
                ₹{totalValue.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                {isPositiveReturn ? (
                  <ArrowUpRight className="h-4 w-4 text-green-400" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-400" />
                )}
                <span className="text-xs text-muted-foreground">Returns</span>
              </div>
              <p className={`text-xl font-bold ${isPositiveReturn ? "text-green-400" : "text-red-400"}`}>
                {isPositiveReturn ? "+" : ""}
                {totalReturn.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-muted-foreground">P&L</span>
              </div>
              <p className={`text-xl font-bold ${isPositiveReturn ? "text-green-400" : "text-red-400"}`}>
                {isPositiveReturn ? "+" : ""}₹{Math.abs(totalValue - totalInvested).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Investments */}
      {activeInvestments.length === 0 && withdrawnInvestments.length === 0 ? (
        <Card className="border-dashed border-border/50 bg-card/30">
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">No Investments Yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Allocate funds to "Investment (SIP)" in your budget to start investing.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeInvestments.map((inv) => {
            const risk = riskConfig[inv.riskProfile] || riskConfig.moderate;
            const returnPct =
              inv.totalInvested > 0
                ? ((inv.currentValue - inv.totalInvested) / inv.totalInvested) * 100
                : 0;
            const isPos = returnPct >= 0;
            const historyLen = inv.monthlyHistory.length;
            const lastFew = inv.monthlyHistory.slice(-6); // last 6 months for mini chart

            return (
              <Card
                key={inv._id}
                className={`border-border/50 bg-gradient-to-br ${risk.bg} backdrop-blur-sm`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className={`h-5 w-5 ${risk.color}`} />
                      <CardTitle className="text-lg">SIP Investment</CardTitle>
                    </div>
                    <Badge className={`${isPos ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {isPos ? "+" : ""}
                      {returnPct.toFixed(1)}%
                    </Badge>
                  </div>
                  <CardDescription>
                    {risk.label} risk profile · ₹{inv.monthlyAmount.toLocaleString()}/month SIP
                  </CardDescription>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    SIP invests ₹{inv.monthlyAmount.toLocaleString('en-IN')} automatically each month regardless of market conditions — this is called <span className="text-green-400">rupee cost averaging</span>. You buy more units when markets dip, building wealth steadily. Even ₹500/mo at 12% annual return grows to ₹1.16 lakh in 10 years through compounding.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Performance Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">Monthly SIP</span>
                      <p className="font-medium">₹{inv.monthlyAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Total Invested</span>
                      <p className="font-medium">₹{inv.totalInvested.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Current Value</span>
                      <p className={`font-medium ${isPos ? "text-green-400" : "text-red-400"}`}>
                        ₹{inv.currentValue.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Duration</span>
                      <p className="font-medium">{historyLen} months</p>
                    </div>
                  </div>

                  {/* Mini value history (visual bars) */}
                  {lastFew.length > 1 && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-2">
                        Recent Performance (Last {lastFew.length} months)
                      </p>
                      <div className="flex items-end gap-1 h-12">
                        {lastFew.map((entry, idx) => {
                          const maxVal = Math.max(...lastFew.map((e) => e.value), 1);
                          const heightPct = (entry.value / maxVal) * 100;
                          const prevVal = idx > 0 ? lastFew[idx - 1].value : entry.invested;
                          const isUp = entry.value >= prevVal;
                          return (
                            <div
                              key={entry.month}
                              className={`flex-1 rounded-t transition-all ${
                                isUp ? "bg-green-500/60" : "bg-red-500/60"
                              }`}
                              style={{ height: `${Math.max(heightPct, 8)}%` }}
                              title={`Month ${entry.month}: ₹${entry.value.toLocaleString()}`}
                            />
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground/70 mt-1">
                        <span>Mo {lastFew[0]?.month}</span>
                        <span>Mo {lastFew[lastFew.length - 1]?.month}</span>
                      </div>
                    </div>
                  )}

                  {/* Growth Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Investment Growth</span>
                      <span>
                        {isPos ? "+" : ""}₹{(inv.currentValue - inv.totalInvested).toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(
                        100,
                        inv.totalInvested > 0 ? (inv.currentValue / (inv.totalInvested * 2)) * 100 : 0
                      )}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Withdraw Button */}
          {activeInvestments.length > 0 && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Withdraw All Investments</p>
                    <p className="text-xs text-muted-foreground">
                      This will liquidate all active SIPs. Impacts health score and future compounding.
                    </p>
                  </div>
                  <Button variant="destructive" onClick={handleWithdraw} disabled={withdrawing} size="sm">
                    {withdrawing ? "Withdrawing..." : "Withdraw"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Withdrawn */}
          {withdrawnInvestments.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Withdrawn Investments</h3>
              {withdrawnInvestments.map((inv) => (
                <Card key={inv._id} className="border-border/30 bg-card/30 backdrop-blur-sm opacity-75">
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">SIP ({riskConfig[inv.riskProfile]?.label})</span>
                        <span className="text-xs text-muted-foreground">
                          ₹{inv.totalInvested.toLocaleString()} invested
                        </span>
                      </div>
                      <Badge className="bg-muted text-muted-foreground">Withdrawn</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
