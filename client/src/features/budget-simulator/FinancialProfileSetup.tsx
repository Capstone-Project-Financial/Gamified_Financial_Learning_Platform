/** @format */

import { useState } from "react";
import { useBudgetSimulator } from "@/contexts/BudgetSimulatorContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Wallet, TrendingUp, Shield, Sparkles } from "lucide-react";

const incomePresets: Record<string, { min: number; max: number; label: string }> = {
  student: { min: 5000, max: 15000, label: "Student" },
  intern: { min: 10000, max: 25000, label: "Intern" },
  job: { min: 25000, max: 80000, label: "Job / Full-Time" },
  freelancer: { min: 15000, max: 60000, label: "Freelancer" },
};

const riskOptions = [
  { value: "conservative", label: "Conservative", icon: Shield, desc: "Lower risk, stable returns" },
  { value: "moderate", label: "Moderate", icon: TrendingUp, desc: "Balanced risk & reward" },
  { value: "aggressive", label: "Aggressive", icon: Sparkles, desc: "Higher risk, higher potential" },
];

const lifestyleOptions = [
  { value: "minimal", label: "Minimal", desc: "Basic living, low expenses" },
  { value: "moderate", label: "Moderate", desc: "Comfortable lifestyle" },
  { value: "premium", label: "Premium", desc: "Upscale living" },
];

export default function FinancialProfileSetup({ onComplete }: { onComplete?: () => void }) {
  const { createProfile, updateProfile, profile } = useBudgetSimulator();
  const [incomeType, setIncomeType] = useState(profile?.incomeType || "");
  const [monthlyIncome, setMonthlyIncome] = useState(profile?.monthlyIncome?.toString() || "");
  const [riskLevel, setRiskLevel] = useState(profile?.riskLevel || "");
  const [lifestyleLevel, setLifestyleLevel] = useState(profile?.lifestyleLevel || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!incomeType || !monthlyIncome || !riskLevel || !lifestyleLevel) {
      toast.error("Please fill all fields");
      return;
    }
    const income = parseInt(monthlyIncome);
    const preset = incomePresets[incomeType];
    if (income < preset.min || income > preset.max) {
      toast.error(`Income must be between ₹${preset.min.toLocaleString()} and ₹${preset.max.toLocaleString()} for ${preset.label}`);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        incomeType,
        monthlyIncome: income,
        riskLevel,
        lifestyleLevel,
      } as any;

      if (profile) {
        await updateProfile(payload);
        toast.success("Financial profile updated!");
      } else {
        await createProfile(payload);
        toast.success("Financial profile created!");
      }
      if (onComplete) onComplete();
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
          <Wallet className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold">Set Up Your Financial Profile</h1>
        <p className="text-muted-foreground">
          Tell us about your financial situation to personalize the simulation.
        </p>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Income Details</CardTitle>
          <CardDescription>Select your income type and monthly income</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Income Type</Label>
            <Select value={incomeType} onValueChange={(v) => { setIncomeType(v); setMonthlyIncome(""); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select your income type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(incomePresets).map(([key, preset]) => (
                  <SelectItem key={key} value={key}>
                    {preset.label} (₹{preset.min.toLocaleString()} – ₹{preset.max.toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Monthly Income (₹)</Label>
            <Input
              type="number"
              placeholder={incomeType ? `₹${incomePresets[incomeType]?.min} – ₹${incomePresets[incomeType]?.max}` : "Select income type first"}
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              disabled={!incomeType}
            />
            {Number(monthlyIncome) > 0 && (
              <div className="mt-2 p-3 rounded-lg bg-blue-950/30 border border-blue-800/30">
                <p className="text-xs text-blue-300 font-medium mb-1">50/30/20 guide for your income</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-xs text-blue-400">Rent limit (30%)</p><p className="text-sm font-medium text-white">₹{Math.round(Number(monthlyIncome)*0.3).toLocaleString('en-IN')}</p></div>
                  <div><p className="text-xs text-blue-400">Save target (20%)</p><p className="text-sm font-medium text-white">₹{Math.round(Number(monthlyIncome)*0.2).toLocaleString('en-IN')}</p></div>
                  <div><p className="text-xs text-blue-400">Emergency fund</p><p className="text-sm font-medium text-white">₹{Math.round(Number(monthlyIncome)*3).toLocaleString('en-IN')}+</p></div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Risk Level</CardTitle>
          <CardDescription>This affects event severity and investment returns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {riskOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setRiskLevel(opt.value)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    riskLevel === opt.value
                      ? "border-primary bg-primary/10"
                      : "border-border/50 hover:border-border"
                  }`}
                >
                  <Icon className="h-5 w-5 mb-2 text-primary" />
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Lifestyle Level</CardTitle>
          <CardDescription>Sets minimum expense thresholds for the simulation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {lifestyleOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLifestyleLevel(opt.value)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  lifestyleLevel === opt.value
                    ? "border-primary bg-primary/10"
                    : "border-border/50 hover:border-border"
                }`}
              >
                <div className="font-medium">{opt.label}</div>
                <div className="text-xs text-muted-foreground">{opt.desc}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} disabled={loading} className="w-full h-12 text-lg" size="lg">
        {loading ? "Creating..." : "Create Profile & Start Simulator"}
      </Button>
    </div>
  );
}
