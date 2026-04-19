/** @format */

import { useState } from "react";
import { useBudgetSimulator, BudgetAllocation } from "@/contexts/BudgetSimulatorContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Home, Utensils, Car, Music, CreditCard, PiggyBank, TrendingUp, Shield, MoreHorizontal } from "lucide-react";

const categories = [
  { key: "rent", label: "Rent / Housing", icon: Home, color: "text-red-400" },
  { key: "food", label: "Food & Groceries", icon: Utensils, color: "text-orange-400" },
  { key: "transport", label: "Transport", icon: Car, color: "text-cyan-400" },
  { key: "entertainment", label: "Entertainment", icon: Music, color: "text-pink-400" },
  { key: "subscriptions", label: "Subscriptions", icon: CreditCard, color: "text-purple-400" },
  { key: "savings", label: "Savings", icon: PiggyBank, color: "text-green-400" },
  { key: "investment", label: "Investment (SIP)", icon: TrendingUp, color: "text-blue-400" },
  { key: "emergencyFund", label: "Emergency Fund", icon: Shield, color: "text-yellow-400" },
  { key: "miscellaneous", label: "Miscellaneous", icon: MoreHorizontal, color: "text-gray-400" },
];

const defaultBudget: BudgetAllocation = {
  rent: 0, food: 0, transport: 0, entertainment: 0,
  subscriptions: 0, savings: 0, investment: 0, emergencyFund: 0, miscellaneous: 0,
};

/** Get a live zone indicator badge for a budget category */
function getZoneBadge(key: string, pct: number): { label: string; className: string } | null {
  switch (key) {
    case "rent":
      if (pct > 30) return { label: "above 30% rule", className: "border-yellow-500 text-yellow-400 bg-yellow-500/10" };
      return null;
    case "emergencyFund":
      if (pct < 5) return { label: "too low — build this first", className: "border-red-500 text-red-400 bg-red-500/10" };
      return null;
    case "savings":
      if (pct >= 20) return { label: "on track ✓", className: "border-green-500 text-green-400 bg-green-500/10" };
      if (pct > 0 && pct < 20) return { label: `${pct}% — aim for 20%`, className: "border-yellow-500 text-yellow-400 bg-yellow-500/10" };
      return null;
    case "investment":
      if (pct > 0) return { label: "good habit", className: "border-blue-500 text-blue-400 bg-blue-500/10" };
      return null;
    default:
      return null;
  }
}

export default function BudgetAllocationForm() {
  const { profile, simulation, setBudget } = useBudgetSimulator();
  const income = profile?.monthlyIncome || 0;
  const existingBudget = simulation?.currentBudget;

  const [allocations, setAllocations] = useState<BudgetAllocation>(
    existingBudget && Object.values(existingBudget).some(v => v > 0)
      ? existingBudget
      : defaultBudget
  );
  const [loading, setLoading] = useState(false);

  const total = Object.values(allocations).reduce((s, v) => s + v, 0);
  const remaining = income - total;
  const pct = income > 0 ? Math.round((total / income) * 100) : 0;

  const updateCategory = (key: string, value: string) => {
    setAllocations((prev) => ({
      ...prev,
      [key]: Math.max(0, parseInt(value) || 0),
    }));
  };

  const handleSubmit = async () => {
    if (total > income) {
      toast.error("Total allocation exceeds your income!");
      return;
    }
    setLoading(true);
    try {
      await setBudget(allocations);
      toast.success("Budget allocation saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save budget");
    } finally {
      setLoading(false);
    }
  };

  const applySuggested = () => {
    setAllocations({
      rent: Math.round(income * 0.25),
      food: Math.round(income * 0.15),
      transport: Math.round(income * 0.08),
      entertainment: Math.round(income * 0.05),
      subscriptions: Math.round(income * 0.03),
      savings: Math.round(income * 0.20),
      investment: Math.round(income * 0.10),
      emergencyFund: Math.round(income * 0.09),
      miscellaneous: Math.round(income * 0.05),
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Allocate Your Budget</h1>
        <p className="text-muted-foreground">
          Distribute ₹{income.toLocaleString()} across categories. Total must not exceed your income.
        </p>
      </div>

      {/* 50/30/20 Concept Card */}
      <div className="p-4 bg-blue-950/30 border border-blue-800/40 rounded-xl">
        <p className="text-xs font-medium text-blue-400 uppercase tracking-wider mb-2">
          Financial concept — 50/30/20 rule
        </p>
        <p className="text-sm text-blue-200 leading-relaxed">
          The <strong>50/30/20 rule</strong> is the most widely recommended budgeting framework:
          allocate 50% to needs (rent, food, transport), 30% to wants (entertainment, subscriptions),
          and 20% to financial goals (savings, investments, emergency fund). This is your starting benchmark.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="bg-blue-900/30 rounded-lg p-2">
            <p className="text-xs text-blue-400">Needs (50%)</p>
            <p className="text-sm font-medium text-white">₹{Math.round(income * 0.5).toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-blue-900/30 rounded-lg p-2">
            <p className="text-xs text-blue-400">Wants (30%)</p>
            <p className="text-sm font-medium text-white">₹{Math.round(income * 0.3).toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-blue-900/30 rounded-lg p-2">
            <p className="text-xs text-blue-400">Goals (20%)</p>
            <p className="text-sm font-medium text-white">₹{Math.round(income * 0.2).toLocaleString("en-IN")}</p>
          </div>
        </div>
      </div>

      {/* Summary Bar */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Allocated: ₹{total.toLocaleString()} ({pct}%)</span>
            <span className={remaining < 0 ? "text-destructive font-bold" : "text-green-400"}>
              Remaining: ₹{remaining.toLocaleString()}
            </span>
          </div>
          <Progress value={Math.min(pct, 100)} className="h-3" />
          {remaining < 0 && (
            <p className="text-destructive text-sm mt-2">⚠️ Over budget by ₹{Math.abs(remaining).toLocaleString()}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={applySuggested}>
          Apply 50/30/20 Suggested Split
        </Button>
      </div>

      {/* Category Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const value = allocations[cat.key as keyof BudgetAllocation] || 0;
          const catPct = income > 0 ? Math.round((value / income) * 100) : 0;
          const badge = getZoneBadge(cat.key, catPct);
          return (
            <Card key={cat.key} className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`h-4 w-4 ${cat.color}`} />
                  <Label className="text-sm font-medium">{cat.label}</Label>
                  <span className="ml-auto text-xs text-muted-foreground">{catPct}%</span>
                </div>
                {badge && (
                  <div className="mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                )}
                <Input
                  type="number"
                  min={0}
                  value={value || ""}
                  onChange={(e) => updateCategory(cat.key, e.target.value)}
                  placeholder="₹0"
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button onClick={handleSubmit} disabled={loading || total > income} className="w-full h-12 text-lg" size="lg">
        {loading ? "Saving..." : "Save Budget & Continue"}
      </Button>
    </div>
  );
}
