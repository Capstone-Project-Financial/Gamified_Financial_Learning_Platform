/** @format */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Calculator, PiggyBank, Gamepad2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "hsl(var(--danger))",
];

export default function Tools() {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Financial Tools</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate("/budget-simulator")}
        >
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <PiggyBank className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">Budget Simulator</h3>
          <p className="text-muted-foreground mb-4">
            AI-powered budget simulation with life events and financial decisions
          </p>
          <Button className="w-full">Open Tool</Button>
        </Card>

        <Card
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setActiveTool("investment")}
        >
          <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
            <Calculator className="w-8 h-8 text-secondary" />
          </div>
          <h3 className="text-xl font-bold mb-2">Investment Calculator</h3>
          <p className="text-muted-foreground mb-4">
            See how your money can grow over time with compound interest
          </p>
          <Button className="w-full">Open Tool</Button>
        </Card>

        <Card
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setActiveTool("scenario")}
        >
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <Gamepad2 className="w-8 h-8 text-accent" />
          </div>
          <h3 className="text-xl font-bold mb-2">Financial Scenarios</h3>
          <p className="text-muted-foreground mb-4">
            Play through real-life money situations and learn from choices
          </p>
          <Button className="w-full">Open Tool</Button>
        </Card>
      </div>


      {activeTool === "investment" && (
        <InvestmentCalculator onClose={() => setActiveTool(null)} />
      )}
      {activeTool === "scenario" && (
        <FinancialScenario onClose={() => setActiveTool(null)} />
      )}
    </div>
  );
}


function InvestmentCalculator({ onClose }: { onClose: () => void }) {
  const [initial, setInitial] = useState(1000);
  const [monthly, setMonthly] = useState(100);
  const [rate, setRate] = useState(8);
  const [years, setYears] = useState(10);

  const calculateGrowth = () => {
    const data = [];
    let balance = initial;
    const monthlyRate = rate / 100 / 12;

    for (let year = 0; year <= years; year++) {
      data.push({
        year,
        investment: initial + monthly * 12 * year,
        balance: Math.round(balance),
      });

      for (let month = 0; month < 12; month++) {
        balance = balance * (1 + monthlyRate) + monthly;
      }
    }

    return data;
  };

  const data = calculateGrowth();
  const finalValue = data[data.length - 1].balance;
  const totalInvested = data[data.length - 1].investment;
  const interestEarned = finalValue - totalInvested;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Investment Calculator</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Initial Investment: ₹{initial}
              </label>
              <Input
                type="number"
                value={initial}
                onChange={(e) => setInitial(Number(e.target.value))}
                min={0}
                step={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Monthly Contribution: ₹{monthly}
              </label>
              <Input
                type="number"
                value={monthly}
                onChange={(e) => setMonthly(Number(e.target.value))}
                min={0}
                step={10}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Interest Rate: {rate}%
            </label>
            <Slider
              value={[rate]}
              onValueChange={([val]) => setRate(val)}
              min={1}
              max={20}
              step={0.5}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Time Period: {years} years
            </label>
            <Slider
              value={[years]}
              onValueChange={([val]) => setYears(val)}
              min={1}
              max={30}
              step={1}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Total Invested
              </p>
              <p className="text-2xl font-bold">
                ₹{totalInvested.toLocaleString()}
              </p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Interest Earned
              </p>
              <p className="text-2xl font-bold text-success">
                ₹{interestEarned.toLocaleString()}
              </p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Future Value</p>
              <p className="text-2xl font-bold text-primary">
                ₹{finalValue.toLocaleString()}
              </p>
            </Card>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="year"
                label={{ value: "Years", position: "insideBottom", offset: -5 }}
              />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="investment"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                name="Invested"
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Total Value"
              />
            </LineChart>
          </ResponsiveContainer>

          <Card className="p-4 bg-muted">
            <p className="text-sm font-medium mb-2">💡 Investment Insight:</p>
            <p className="text-sm">
              By investing ₹{monthly} every month for {years} years at {rate}%
              annual return, you'll earn ₹{interestEarned.toLocaleString()} in
              interest - that's{" "}
              {Math.round((interestEarned / totalInvested) * 100)}% more than
              just saving!
            </p>
          </Card>

          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FinancialScenario({ onClose }: { onClose: () => void }) {
  const [currentScene, setCurrentScene] = useState(0);
  const [choices, setChoices] = useState<string[]>([]);

  const scenario = {
    title: "The Toy Dilemma",
    scenes: [
      {
        text: "You saved ₹500 from your pocket money! 🎉 You see a toy you really want for ₹400. But your best friend's birthday is next week, and a nice gift costs ₹150.",
        image: "🛍️",
        options: [
          { text: "Buy the toy now (₹400)", next: 1 },
          { text: "Buy the birthday gift first (₹150)", next: 3 },
          { text: "Save all the money", next: 6 },
        ],
      },
      {
        text: "You bought the toy! It's amazing and you're very happy. But now you only have ₹100 left. Your friend's birthday is tomorrow. You don't have enough for a good gift.",
        image: "😢",
        options: [
          { text: "Give a handmade card", next: 2 },
          { text: "Ask parents for money", next: 2 },
        ],
      },
      {
        text: "Your friend appreciated the gesture, but you feel bad for not planning ahead. Next time, you'll think about upcoming expenses before spending!",
        image: "💭",
        result: {
          stars: 1,
          xp: 30,
          lesson: "Always think ahead about upcoming expenses!",
        },
        options: [],
      },
      {
        text: "You bought a nice gift for ₹150! Your friend is very happy! 🎁 You have ₹350 left. The toy is still ₹400.",
        image: "🎉",
        options: [
          { text: "Wait and save ₹50 more", next: 4 },
          { text: "Buy a cheaper toy for ₹300", next: 5 },
          { text: "Keep saving for later", next: 5 },
        ],
      },
      {
        text: "You waited and saved ₹50 more from your next allowance! Now you have ₹400. You buy the toy! You helped your friend AND got what you wanted!",
        image: "⭐",
        result: {
          stars: 3,
          xp: 100,
          lesson: "Patience and planning help you achieve all your goals!",
        },
        options: [],
      },
      {
        text: "Smart choice! You found a good balance between helping your friend and treating yourself. You still have some savings left too!",
        image: "✨",
        result: {
          stars: 2,
          xp: 70,
          lesson: "Finding balance in spending is a valuable skill!",
        },
        options: [],
      },
      {
        text: "You decided to save. Your friend's birthday came, and you made a handmade card. Your friend loved it! You still have ₹500 saved.",
        image: "💰",
        result: {
          stars: 2,
          xp: 60,
          lesson:
            "Saving is great, but it's okay to spend on important things!",
        },
        options: [],
      },
    ],
  };

  const scene = scenario.scenes[currentScene];

  const makeChoice = (optionIndex: number) => {
    const option = scene.options[optionIndex];
    setChoices([...choices, option.text]);
    setCurrentScene(option.next);
  };

  const restart = () => {
    setCurrentScene(0);
    setChoices([]);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{scenario.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <div className="text-8xl mb-4">{scene.image}</div>
            <p className="text-lg leading-relaxed">{scene.text}</p>
          </div>

          {scene.options.length > 0 ? (
            <div className="space-y-3">
              {scene.options.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => makeChoice(index)}
                  variant="outline"
                  className="w-full h-auto py-4 text-left justify-start"
                >
                  {option.text}
                </Button>
              ))}
            </div>
          ) : scene.result ? (
            <Card className="p-6 text-center">
              <div className="text-4xl mb-4">
                {Array.from(
                  { length: scene.result.stars },
                  (_, i) => "⭐"
                ).join("")}
              </div>
              <p className="text-xl font-bold mb-2">
                {scene.result.stars === 3
                  ? "Excellent!"
                  : scene.result.stars === 2
                  ? "Good Job!"
                  : "Nice Try!"}
              </p>
              <p className="text-lg mb-4">+{scene.result.xp} XP earned</p>
              <Card className="p-4 bg-muted mb-4">
                <p className="text-sm font-medium mb-1">💡 Lesson Learned:</p>
                <p className="text-sm">{scene.result.lesson}</p>
              </Card>
              <div className="flex gap-2">
                <Button onClick={restart} variant="outline" className="flex-1">
                  Play Again
                </Button>
                <Button onClick={onClose} className="flex-1">
                  Close
                </Button>
              </div>
            </Card>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
