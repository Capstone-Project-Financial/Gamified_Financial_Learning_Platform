/** @format */

import { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Swords, Trophy, Timer, Target } from "lucide-react";
import { toast } from "sonner";

interface Battle {
  id: string;
  opponent: string;
  topic: string;
  stake: number;
  result: "won" | "lost";
  date: string;
  yourScore: number;
  opponentScore: number;
}

interface PendingChallenge {
  id: string;
  opponent: string;
  topic: string;
  stake: number;
}

interface BattleQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

const topics = [
  "Money Basics",
  "Smart Spending",
  "Saving",
  "Banking",
  "Investing",
];
const stakes = [50, 100, 200, 500];
const opponentNames = [
  "Priya K.",
  "Rahul M.",
  "Ananya S.",
  "Arjun P.",
  "Sneha R.",
  "Vikram T.",
];

const battleQuestions: Record<string, BattleQuestion[]> = {
  "Money Basics": [
    {
      question: "What is money used for?",
      options: ["Buying things", "Eating", "Sleeping", "Running"],
      correctIndex: 0,
    },
    {
      question: "Which is a type of money?",
      options: ["Leaves", "Coins", "Rocks", "Sticks"],
      correctIndex: 1,
    },
    {
      question: "What does saving mean?",
      options: ["Spending all", "Keeping for later", "Giving away", "Losing"],
      correctIndex: 1,
    },
    {
      question: "If you have ₹100 and spend ₹40, what is left?",
      options: ["₹140", "₹60", "₹40", "₹100"],
      correctIndex: 1,
    },
    {
      question: "What is a budget?",
      options: ["A toy", "A plan for money", "A game", "A book"],
      correctIndex: 1,
    },
    {
      question: "Banks help keep money:",
      options: ["Dirty", "Safe", "Hidden", "Lost"],
      correctIndex: 1,
    },
    {
      question: "Earning money means:",
      options: ["Losing it", "Hiding it", "Getting it for work", "Throwing it"],
      correctIndex: 2,
    },
    {
      question: "Which is most important?",
      options: ["Toys", "Food", "Games", "Candies"],
      correctIndex: 1,
    },
    {
      question: "Interest helps money:",
      options: ["Disappear", "Grow", "Shrink", "Break"],
      correctIndex: 1,
    },
    {
      question: "A need is something you:",
      options: ["Want", "Must have", "Like", "Enjoy"],
      correctIndex: 1,
    },
  ],
};

export default function Battles() {
  const { wallet, deductFromDiscretionary, addToDiscretionary } = useWallet();
  const [battles, setBattles] = useState<Battle[]>([]);
  const [pending, setPending] = useState<PendingChallenge[]>([]);
  const [inBattle, setInBattle] = useState(false);
  const [currentBattle, setCurrentBattle] = useState<any>(null);
  const [selectedTopic, setSelectedTopic] = useState("Money Basics");
  const [selectedStake, setSelectedStake] = useState(100);

  useEffect(() => {
    const stored = localStorage.getItem("battles");
    if (stored) {
      setBattles(JSON.parse(stored));
    }
  }, []);

  const wins = battles.filter((b) => b.result === "won").length;
  const losses = battles.filter((b) => b.result === "lost").length;
  const winRate =
    battles.length > 0 ? ((wins / battles.length) * 100).toFixed(1) : "0.0";
  const totalEarnings = battles
    .filter((b) => b.result === "won")
    .reduce((sum, b) => sum + b.stake, 0);

  const startChallenge = () => {
    if (wallet.discretionaryBalance < selectedStake) {
      toast.error("Insufficient balance!");
      return;
    }

    const opponent =
      opponentNames[Math.floor(Math.random() * opponentNames.length)];
    const challenge: PendingChallenge = {
      id: `challenge_${Date.now()}`,
      opponent,
      topic: selectedTopic,
      stake: selectedStake,
    };
    setPending([...pending, challenge]);
    toast.success(`Challenge sent to ${opponent}!`);

    // Auto-accept after 2 seconds for demo
    setTimeout(() => acceptChallenge(challenge.id), 2000);
  };

  const acceptChallenge = (id: string) => {
    const challenge = pending.find((c) => c.id === id);
    if (!challenge) return;

    if (
      !deductFromDiscretionary(
        challenge.stake,
        `Battle stake: ${challenge.topic}`
      )
    ) {
      return;
    }

    setPending(pending.filter((c) => c.id !== id));
    setCurrentBattle({
      ...challenge,
      questions:
        battleQuestions[challenge.topic] || battleQuestions["Money Basics"],
      currentQ: 0,
      userScore: 0,
      opponentScore: 0,
      userAnswers: [],
      timeLeft: 300,
      started: false,
    });
    setInBattle(true);
  };

  const startBattle = () => {
    setCurrentBattle({ ...currentBattle, started: true });
    const timer = setInterval(() => {
      setCurrentBattle((prev: any) => {
        if (!prev || prev.timeLeft <= 1) {
          clearInterval(timer);
          endBattle();
          return prev;
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
  };

  const answerQuestion = (index: number) => {
    const question = currentBattle.questions[currentBattle.currentQ];
    const isCorrect = index === question.correctIndex;
    const timeBonus = Math.floor(currentBattle.timeLeft / 30);
    const points = isCorrect ? 10 + timeBonus : 0;

    // Simulate opponent (70% accuracy)
    const opponentCorrect = Math.random() < 0.7;
    const opponentPoints = opponentCorrect
      ? 10 + Math.floor(Math.random() * 5)
      : 0;

    const newScore = currentBattle.userScore + points;
    const newOppScore = currentBattle.opponentScore + opponentPoints;

    if (currentBattle.currentQ >= currentBattle.questions.length - 1) {
      setTimeout(() => {
        endBattle(newScore, newOppScore);
      }, 1500);
    }

    setCurrentBattle({
      ...currentBattle,
      userScore: newScore,
      opponentScore: newOppScore,
      currentQ: currentBattle.currentQ + 1,
      userAnswers: [
        ...currentBattle.userAnswers,
        { index, correct: isCorrect, points },
      ],
    });
  };

  const endBattle = (finalScore?: number, finalOppScore?: number) => {
    const userScore = finalScore ?? currentBattle.userScore;
    const oppScore = finalOppScore ?? currentBattle.opponentScore;
    const won = userScore > oppScore;

    const battle: Battle = {
      id: `battle_${Date.now()}`,
      opponent: currentBattle.opponent,
      topic: currentBattle.topic,
      stake: currentBattle.stake,
      result: won ? "won" : "lost",
      date: new Date().toISOString(),
      yourScore: userScore,
      opponentScore: oppScore,
    };

    if (won) {
      addToDiscretionary(
        currentBattle.stake * 2,
        `Battle won vs ${currentBattle.opponent}`
      );
      toast.success(`🏆 Victory! You won ₹${currentBattle.stake * 2}!`);
    } else {
      toast.error(`Better luck next time!`);
    }

    const updated = [battle, ...battles];
    setBattles(updated);
    localStorage.setItem("battles", JSON.stringify(updated));
    setInBattle(false);
    setCurrentBattle(null);
  };

  if (inBattle && currentBattle) {
    if (!currentBattle.started) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full p-8 text-center">
            <div className="flex items-center justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-3xl mb-2">
                  👤
                </div>
                <p className="font-bold">You</p>
              </div>
              <Swords className="w-12 h-12 text-accent" />
              <div className="text-center">
                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center text-3xl mb-2">
                  🤖
                </div>
                <p className="font-bold">{currentBattle.opponent}</p>
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4">Battle Arena</h2>
            <div className="space-y-2 text-lg mb-8">
              <p>
                <strong>Topic:</strong> {currentBattle.topic}
              </p>
              <p>
                <strong>Stake:</strong> ₹{currentBattle.stake} each
              </p>
              <p>
                <strong>Winner takes:</strong> ₹{currentBattle.stake * 2}
              </p>
              <p>
                <strong>Questions:</strong> 10
              </p>
              <p>
                <strong>Time limit:</strong> 5 minutes
              </p>
            </div>
            <Button
              onClick={startBattle}
              size="lg"
              className="text-xl px-8 py-6"
            >
              Start Battle!
            </Button>
          </Card>
        </div>
      );
    }

    const question = currentBattle.questions[currentBattle.currentQ];
    const minutes = Math.floor(currentBattle.timeLeft / 60);
    const seconds = currentBattle.timeLeft % 60;

    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Timer
                className={`w-6 h-6 ${
                  currentBattle.timeLeft < 60
                    ? "text-danger"
                    : "text-foreground"
                }`}
              />
              <span
                className={`text-xl font-bold ${
                  currentBattle.timeLeft < 60 ? "text-danger" : ""
                }`}
              >
                {minutes}:{seconds.toString().padStart(2, "0")}
              </span>
            </div>
            <div className="text-xl font-bold">
              Question {currentBattle.currentQ + 1}/10
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Your Score</p>
              <p className="text-3xl font-bold text-primary">
                {currentBattle.userScore}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">
                {currentBattle.opponent}'s Score
              </p>
              <p className="text-3xl font-bold text-secondary">
                {currentBattle.opponentScore}
              </p>
            </Card>
          </div>

          {question && (
            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-6">{question.question}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {question.options.map((option, index) => (
                  <Button
                    key={index}
                    onClick={() => answerQuestion(index)}
                    variant="outline"
                    className="h-auto py-6 text-lg"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Swords className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Quiz Battles</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <Trophy className="w-8 h-8 text-accent mb-2" />
          <p className="text-sm text-muted-foreground">Battles Won</p>
          <p className="text-3xl font-bold text-success">{wins}</p>
        </Card>
        <Card className="p-6">
          <Target className="w-8 h-8 text-danger mb-2" />
          <p className="text-sm text-muted-foreground">Battles Lost</p>
          <p className="text-3xl font-bold text-danger">{losses}</p>
        </Card>
        <Card className="p-6">
          <div className="text-3xl mb-2">📊</div>
          <p className="text-sm text-muted-foreground">Win Rate</p>
          <p className="text-3xl font-bold">{winRate}%</p>
        </Card>
        <Card className="p-6">
          <div className="text-3xl mb-2">💰</div>
          <p className="text-sm text-muted-foreground">Total Earnings</p>
          <p className="text-3xl font-bold text-success">₹{totalEarnings}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Start New Battle</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Choose Topic
            </label>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <Button
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  variant={selectedTopic === topic ? "default" : "outline"}
                >
                  {topic}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Set Stake</label>
            <div className="flex gap-2">
              {stakes.map((stake) => (
                <Button
                  key={stake}
                  onClick={() => setSelectedStake(stake)}
                  variant={selectedStake === stake ? "default" : "outline"}
                >
                  ₹{stake}
                </Button>
              ))}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Your balance: ₹{wallet.discretionaryBalance}
          </p>
          <Button onClick={startChallenge} size="lg" className="w-full">
            <Swords className="w-5 h-5 mr-2" />
            Find Opponent
          </Button>
        </div>
      </Card>

      {pending.length > 0 && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Pending Challenges</h2>
          <div className="space-y-3">
            {pending.map((challenge) => (
              <div
                key={challenge.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-bold">{challenge.opponent}</p>
                  <p className="text-sm text-muted-foreground">
                    {challenge.topic} • ₹{challenge.stake}
                  </p>
                </div>
                <Button onClick={() => acceptChallenge(challenge.id)}>
                  Accept
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {battles.length > 0 && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Battle History</h2>
          <div className="space-y-2">
            {battles.slice(0, 10).map((battle) => (
              <div
                key={battle.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-bold">vs {battle.opponent}</p>
                  <p className="text-sm text-muted-foreground">
                    {battle.topic}
                  </p>
                </div>
                <div className="text-center mx-4">
                  <p className="text-sm font-medium">
                    {battle.yourScore} - {battle.opponentScore}
                  </p>
                </div>
                <div
                  className={`font-bold ${
                    battle.result === "won" ? "text-success" : "text-danger"
                  }`}
                >
                  {battle.result === "won"
                    ? `+₹${battle.stake * 2}`
                    : `-₹${battle.stake}`}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
