/** @format */

import { useEffect, useState, useCallback } from "react";
import { useBudgetSimulator } from "@/contexts/BudgetSimulatorContext";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  CreditCard,
  GraduationCap,
  Banknote,
  AlertTriangle,
  CheckCircle2,
  IndianRupee,
  Clock,
  TrendingDown,
} from "lucide-react";

interface Debt {
  _id: string;
  type: "credit_card" | "personal_loan" | "education_loan";
  principal: number;
  outstandingBalance: number;
  interestRate: number;
  emiAmount: number;
  tenure: number;
  remainingTenure: number;
  monthsDelinquent: number;
  status: "active" | "paid_off" | "defaulted";
  createdAtMonth: number;
}

const debtTypeConfig: Record<string, { label: string; icon: typeof CreditCard; color: string; bg: string }> = {
  credit_card: {
    label: "Credit Card",
    icon: CreditCard,
    color: "text-orange-400",
    bg: "from-orange-500/10 to-orange-500/5",
  },
  personal_loan: {
    label: "Personal Loan",
    icon: Banknote,
    color: "text-blue-400",
    bg: "from-blue-500/10 to-blue-500/5",
  },
  education_loan: {
    label: "Education Loan",
    icon: GraduationCap,
    color: "text-purple-400",
    bg: "from-purple-500/10 to-purple-500/5",
  },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-yellow-500/20 text-yellow-400" },
  paid_off: { label: "Paid Off", color: "bg-green-500/20 text-green-400" },
  defaulted: { label: "Defaulted", color: "bg-red-500/20 text-red-400" },
};

export default function DebtPanel() {
  const { simulation, refresh } = useBudgetSimulator();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [payAmounts, setPayAmounts] = useState<Record<string, string>>({});
  const [payingId, setPayingId] = useState<string | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  const fetchDebts = useCallback(async () => {
    if (!simulation) return;
    setLoading(true);
    try {
      const data = await api.get<Debt[]>(`/budget-simulator/simulation/${simulation._id}/debts`);
      setDebts(data || []);
    } catch {
      setDebts([]);
    } finally {
      setLoading(false);
    }
  }, [simulation]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  const handlePay = async (debtId: string) => {
    const amount = parseInt(payAmounts[debtId] || "0");
    if (!amount || amount <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }
    setPayingId(debtId);
    try {
      await api.post(`/budget-simulator/simulation/${simulation!._id}/debts/${debtId}/pay`, { amount });
      toast.success(`Payment of ₹${amount.toLocaleString()} applied!`);
      setPayAmounts((prev) => ({ ...prev, [debtId]: "" }));
      await fetchDebts();
      await refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to make payment");
    } finally {
      setPayingId(null);
    }
  };

  const activeDebts = debts.filter((d) => d.status === "active");
  const settledDebts = debts.filter((d) => d.status !== "active");
  const totalOutstanding = activeDebts.reduce((s, d) => s + d.outstandingBalance, 0);
  const totalEmi = activeDebts.reduce((s, d) => s + d.emiAmount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <div className="animate-pulse text-sm">Loading debts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
          <TrendingDown className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Debt Management</h2>
          <p className="text-sm text-muted-foreground">
            {activeDebts.length} active debt{activeDebts.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Summary */}
      {debts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <IndianRupee className="h-4 w-4 text-red-400" />
                <span className="text-xs text-muted-foreground">Total Outstanding</span>
              </div>
              <p className={`text-xl font-bold ${totalOutstanding > 0 ? "text-red-400" : "text-green-400"}`}>
                ₹{totalOutstanding.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-yellow-400" />
                <span className="text-xs text-muted-foreground">Monthly EMI Total</span>
              </div>
              <p className="text-xl font-bold">₹{totalEmi.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-xs text-muted-foreground">Settled</span>
              </div>
              <p className="text-xl font-bold text-green-400">{settledDebts.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Debt Advice */}
      {debts.length > 0 && (
        <Card className="border-purple-700/40 bg-gradient-to-br from-purple-950/30 to-indigo-950/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-purple-300">
              <span>✨</span> AI Debt Strategy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiAdvice ? (
              <div>
                <p className="text-sm leading-relaxed text-gray-300">{aiAdvice}</p>
                <span className="text-[9px] mt-2 inline-block px-2 py-0.5 rounded-full bg-purple-800/60 text-purple-300 border border-purple-600/30">
                  Powered by Gemini AI
                </span>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!simulation) return;
                  setLoadingAdvice(true);
                  try {
                    const result = await api.get<any>(`/budget-simulator/simulation/${simulation._id}/ai-portfolio-advice`);
                    if (result?.data?.debtAdvice) setAiAdvice(result.data.debtAdvice);
                  } catch {}
                  setLoadingAdvice(false);
                }}
                disabled={loadingAdvice}
                className="w-full border-purple-700/40 hover:bg-purple-900/20"
              >
                {loadingAdvice ? "Analyzing..." : "Get AI Debt Advice"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Debts */}
      {activeDebts.length === 0 && settledDebts.length === 0 ? (
        <Card className="border-dashed border-border/50 bg-card/30">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-400/40" />
            <p className="text-muted-foreground font-medium">Debt Free! 🎉</p>
            <p className="text-sm text-muted-foreground/70 mt-1">You have no debts in this simulation.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeDebts.map((debt) => {
            const typeInfo = debtTypeConfig[debt.type] || debtTypeConfig.personal_loan;
            const Icon = typeInfo.icon;
            const paidPercent =
              debt.principal > 0
                ? Math.round(((debt.principal - debt.outstandingBalance) / debt.principal) * 100)
                : 0;

            return (
              <Card
                key={debt._id}
                className={`border-border/50 bg-gradient-to-br ${typeInfo.bg} backdrop-blur-sm`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${typeInfo.color}`} />
                      <CardTitle className="text-lg">{typeInfo.label}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {debt.monthsDelinquent > 0 && (
                        <Badge className="bg-red-500/20 text-red-400 gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {debt.monthsDelinquent} missed
                        </Badge>
                      )}
                      <Badge className={statusConfig[debt.status]?.color}>{statusConfig[debt.status]?.label}</Badge>
                    </div>
                  </div>
                  <CardDescription>Created at Month {debt.createdAtMonth}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">Principal</span>
                      <p className="font-medium">₹{debt.principal.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Outstanding</span>
                      <p className="font-medium text-red-400">₹{debt.outstandingBalance.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Interest Rate</span>
                      <p className="font-medium">{(debt.interestRate * 100).toFixed(1)}%/mo · {(debt.interestRate * 12 * 100).toFixed(0)}% annual</p>
                      <p className="text-xs text-amber-400/80 mt-0.5">Missing 1 EMI can reduce your CIBIL score (300–900) by 50–100 points</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Remaining</span>
                      <p className="font-medium">
                        {debt.remainingTenure}/{debt.tenure} months
                      </p>
                    </div>
                  </div>

                  {/* Payment Progress */}
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Repayment Progress</span>
                      <span>{paidPercent}%</span>
                    </div>
                    <Progress value={paidPercent} className="h-2" />
                  </div>

                  {/* EMI Info */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <span className="text-xs text-muted-foreground">Monthly EMI</span>
                      <p className="font-bold">₹{debt.emiAmount.toLocaleString()}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      Auto-deducted each month
                    </div>
                  </div>

                  {/* Manual Payment */}
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={1}
                      placeholder="Extra payment amount"
                      value={payAmounts[debt._id] || ""}
                      onChange={(e) =>
                        setPayAmounts((prev) => ({ ...prev, [debt._id]: e.target.value }))
                      }
                    />
                    <Button
                      onClick={() => handlePay(debt._id)}
                      disabled={payingId === debt._id}
                      size="default"
                      variant="secondary"
                    >
                      {payingId === debt._id ? "Paying..." : "Pay Extra"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Settled Debts */}
          {settledDebts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Settled Debts</h3>
              {settledDebts.map((debt) => {
                const typeInfo = debtTypeConfig[debt.type] || debtTypeConfig.personal_loan;
                const Icon = typeInfo.icon;
                return (
                  <Card key={debt._id} className="border-border/30 bg-card/30 backdrop-blur-sm opacity-75">
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{typeInfo.label}</span>
                          <span className="text-xs text-muted-foreground">₹{debt.principal.toLocaleString()}</span>
                        </div>
                        <Badge className={statusConfig[debt.status]?.color}>{statusConfig[debt.status]?.label}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
