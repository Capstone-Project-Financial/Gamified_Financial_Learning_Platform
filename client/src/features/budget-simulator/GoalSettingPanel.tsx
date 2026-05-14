/** @format */

import { useState, useEffect } from "react";
import { useBudgetSimulator } from "@/contexts/BudgetSimulatorContext";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Target, Plus, Trash2, Flag, Trophy, PiggyBank, ShoppingBag, Shield, TrendingDown } from "lucide-react";

const goalTypes = [
  { value: "savings_target", label: "Savings Target", icon: PiggyBank, color: "text-green-400" },
  { value: "purchase", label: "Purchase Goal", icon: ShoppingBag, color: "text-blue-400" },
  { value: "emergency_fund", label: "Emergency Fund", icon: Shield, color: "text-yellow-400" },
  { value: "investment_milestone", label: "Investment Milestone", icon: TrendingDown, color: "text-purple-400" },
  { value: "debt_payoff", label: "Debt Payoff", icon: Flag, color: "text-red-400" },
];

const priorityOptions = [
  { value: "low", label: "Low", color: "bg-blue-500/20 text-blue-400" },
  { value: "medium", label: "Medium", color: "bg-yellow-500/20 text-yellow-400" },
  { value: "high", label: "High", color: "bg-red-500/20 text-red-400" },
];

export default function GoalSettingPanel() {
  const { simulation, profile, addGoal, deleteGoal } = useBudgetSimulator();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const goals = simulation?.goals || [];
  const maxGoals = 5;

  // AI Suggestions
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ name: string; type: string; targetAmount: number; reason: string }>>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const fetchAISuggestions = async () => {
    if (!simulation) return;
    setLoadingSuggestions(true);
    try {
      const result = await api.get<any>(`/budget-simulator/simulation/${simulation._id}/ai-goal-suggestions`);
      if (result?.data && Array.isArray(result.data)) {
        setAiSuggestions(result.data);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const quickAddGoal = async (suggestion: { name: string; type: string; targetAmount: number }) => {
    setLoading(true);
    try {
      await addGoal({
        name: suggestion.name,
        type: suggestion.type,
        targetAmount: suggestion.targetAmount,
        priority: "medium",
      });
      toast.success(`Goal "${suggestion.name}" added!`);
      setAiSuggestions(prev => prev.filter(s => s.name !== suggestion.name));
    } catch (err: any) {
      toast.error(err.message || "Failed to add goal");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setType("");
    setTargetAmount("");
    setDeadline("");
    setPriority("medium");
    setShowForm(false);
  };

  const handleAdd = async () => {
    if (!name.trim() || !type || !targetAmount) {
      toast.error("Please fill in name, type, and target amount");
      return;
    }
    const amount = parseInt(targetAmount);
    if (amount <= 0) {
      toast.error("Target amount must be greater than 0");
      return;
    }
    if (deadline && parseInt(deadline) < 1) {
      toast.error("Deadline must be at least month 1");
      return;
    }

    setLoading(true);
    try {
      await addGoal({
        name: name.trim(),
        type,
        targetAmount: amount,
        deadline: deadline ? parseInt(deadline) : undefined,
        priority,
      });
      toast.success("Goal added!");
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to add goal");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (goalId: string) => {
    setDeletingId(goalId);
    try {
      await deleteGoal(goalId);
      toast.success("Goal removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove goal");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Financial Goals</h2>
            <p className="text-sm text-muted-foreground">
              {goals.length}/{maxGoals} goals set
            </p>
          </div>
        </div>
        {goals.length < maxGoals && !showForm && (
          <Button onClick={() => setShowForm(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Add Goal
          </Button>
        )}
      </div>

      {/* AI Goal Suggestions */}
      {goals.length < maxGoals && (
        <Card className="border-purple-700/40 bg-gradient-to-br from-purple-950/30 to-indigo-950/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-purple-300">
              <span>✨</span> AI-Suggested Goals
            </CardTitle>
            <CardDescription className="text-xs">Personalized goals based on your financial profile</CardDescription>
          </CardHeader>
          <CardContent>
            {aiSuggestions.length === 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAISuggestions}
                disabled={loadingSuggestions}
                className="w-full border-purple-700/40 hover:bg-purple-900/20"
              >
                {loadingSuggestions ? "Generating..." : "Get AI Suggestions"}
              </Button>
            ) : (
              <div className="space-y-2">
                {aiSuggestions.map((s, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/30 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.reason}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-400">{s.type.replace(/_/g, " ")}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-900/40 text-green-400">₹{s.targetAmount.toLocaleString()}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => quickAddGoal(s)} disabled={loading} className="text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>
                ))}
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-800/60 text-purple-300 border border-purple-600/30">
                  Powered by Gemini AI
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Goal Form */}
      {showForm && (
        <Card className="border-primary/30 bg-primary/5 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">New Financial Goal</CardTitle>
            <CardDescription>Define a target to work towards during the simulation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Goal Name</Label>
                <Input
                  placeholder="e.g. Laptop Fund, Emergency Savings"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label>Goal Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {goalTypes.map((gt) => (
                      <SelectItem key={gt.value} value={gt.value}>
                        {gt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Target Amount (₹)</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="₹ Amount"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Deadline (Month #)</Label>
                <Input
                  type="number"
                  min={1}
                  max={simulation?.maxMonths || 24}
                  placeholder="Optional"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((po) => (
                      <SelectItem key={po.value} value={po.value}>
                        {po.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleAdd} disabled={loading} className="flex-1">
                {loading ? "Adding..." : "Add Goal"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals List */}
      {goals.length === 0 && !showForm ? (
        <Card className="border-dashed border-border/50 bg-card/30">
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground">No financial goals set yet.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Add up to {maxGoals} goals to track during your simulation.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const progress =
              goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
            const goalType = goalTypes.find((gt) => gt.value === goal.type);
            const GoalIcon = goalType?.icon || Target;
            const prioStyle = priorityOptions.find((p) => p.value === goal.priority)?.color || "";
            const isCompleted = goal.status === "completed";

            return (
              <Card
                key={goal.goalId}
                className={`border-border/50 backdrop-blur-sm transition-all ${
                  isCompleted ? "bg-green-500/5 border-green-500/30" : "bg-card/50"
                }`}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isCompleted ? "bg-green-500/20" : "bg-muted/50"
                        }`}
                      >
                        <GoalIcon className={`h-4 w-4 ${isCompleted ? "text-green-400" : goalType?.color || ""}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{goal.name}</span>
                          {isCompleted && (
                            <Badge className="bg-green-500/20 text-green-400 text-xs">✓ Completed</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground capitalize">
                            {goal.type.replace(/_/g, " ")}
                          </span>
                          <Badge className={`text-xs ${prioStyle}`}>{goal.priority}</Badge>
                          {goal.deadline && (
                            <span className="text-xs text-muted-foreground">by Month {goal.deadline}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {!isCompleted && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(goal.goalId)}
                        disabled={deletingId === goal.goalId}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        ₹{goal.currentAmount.toLocaleString()} / ₹{goal.targetAmount.toLocaleString()}
                      </span>
                      <span className={`font-medium ${isCompleted ? "text-green-400" : ""}`}>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    {goal.type === 'emergency_fund' && (
                      <p className="text-xs text-amber-400/80 mt-2">Aim for 3–6 months of expenses (₹{Math.round((profile?.monthlyIncome || 0) * 3).toLocaleString('en-IN')}–₹{Math.round((profile?.monthlyIncome || 0) * 6).toLocaleString('en-IN')}). Build this before investing — it prevents debt when emergencies hit.</p>
                    )}
                    {goal.type === 'investment_milestone' && (
                      <p className="text-xs text-blue-400/80 mt-2">Compound interest doubles money roughly every 6 years at 12% annual return. Starting early matters more than starting with a large amount.</p>
                    )}
                    {goal.type === 'debt_payoff' && (
                      <p className="text-xs text-red-400/80 mt-2">Avalanche method: pay minimums on all debts, then put extra money on the highest-interest debt first. This saves the most money overall.</p>
                    )}
                    {goal.type === 'savings_target' && (
                      <p className="text-xs text-green-400/80 mt-2">Automate this — treat savings like a fixed expense that gets paid first every month before discretionary spending.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
