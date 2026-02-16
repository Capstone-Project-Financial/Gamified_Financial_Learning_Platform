/** @format */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProgress } from "@/contexts/ProgressContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

const generateQuizQuestions = (moduleId: number) => {
  const questions = [
    {
      question: "What does 'saving money' mean?",
      options: [
        "Keeping money safe for later",
        "Spending all your money",
        "Giving money away",
      ],
      correct: 0,
    },
    {
      question: "If you have ₹100 and spend ₹30, how much is left?",
      options: ["₹130", "₹70", "₹30"],
      correct: 1,
    },
    {
      question: "What is a 'budget'?",
      options: [
        "A type of coin",
        "A plan for spending money",
        "A bank account",
      ],
      correct: 1,
    },
    {
      question: "What does 'investing' mean?",
      options: [
        "Buying toys",
        "Putting money somewhere to grow it",
        "Hiding money",
      ],
      correct: 1,
    },
    {
      question: "What is a 'stock'?",
      options: [
        "A piece of ownership in a company",
        "A type of food",
        "A savings account",
      ],
      correct: 0,
    },
    {
      question: "Banks keep your money safe. True or False?",
      options: ["True", "False"],
      correct: 0,
    },
    {
      question:
        "If you save ₹10 every day for 10 days, how much will you have?",
      options: ["₹50", "₹100", "₹200"],
      correct: 1,
    },
    {
      question: "What should you do with your pocket money?",
      options: [
        "Spend it all immediately",
        "Save some for later",
        "Give it all away",
      ],
      correct: 1,
    },
    {
      question: "Which is more important?",
      options: ["Needs", "Wants", "Both are equal"],
      correct: 0,
    },
    {
      question: "Interest means...",
      options: [
        "Money you lose",
        "Money that grows in a bank",
        "Money you give to others",
      ],
      correct: 1,
    },
  ];

  return questions;
};

const Quiz = () => {
  const { moduleId } = useParams();
  const { completeQuiz } = useProgress();
  const navigate = useNavigate();

  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());

  const questions = generateQuizQuestions(parseInt(moduleId!));

  useEffect(() => {
    if (started && !completed && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !completed) {
      handleComplete();
    }
  }, [started, timeLeft, completed]);

  const handleStart = () => {
    setStarted(true);
    toast.success("Quiz started! Good luck! 🍀");
  };

  const handleAnswer = (answerIndex: number) => {
    const isCorrect = answerIndex === questions[currentQuestion].correct;

    if (isCorrect) {
      setScore(score + 1);
      toast.success("Correct! +10 XP");
    } else {
      setLives(lives - 1);
      toast.error(
        `Wrong! The correct answer is: ${
          questions[currentQuestion].options[questions[currentQuestion].correct]
        }`
      );

      if (lives - 1 === 0) {
        setTimeout(() => handleComplete(), 2000);
        return;
      }
    }

    setAnswers([...answers, answerIndex]);

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
      }, 2000);
    } else {
      setTimeout(() => {
        handleComplete();
      }, 2000);
    }
  };

  const handleComplete = () => {
    setCompleted(true);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    completeQuiz(`quiz-${moduleId}`, score, questions.length, timeSpent);
  };

  const percentage = (score / questions.length) * 100;
  const rating =
    percentage >= 90
      ? "⭐⭐⭐"
      : percentage >= 70
      ? "⭐⭐"
      : percentage >= 50
      ? "⭐"
      : "💪";
  const message =
    percentage >= 90
      ? "Excellent! You're a Money Master!"
      : percentage >= 70
      ? "Good Job! Keep learning!"
      : percentage >= 50
      ? "Nice Try! Review and try again!"
      : "Don't give up! Practice more!";

  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center animate-scale-in">
          <div className="text-6xl mb-6">📝</div>
          <h1 className="text-3xl font-bold mb-4">Module {moduleId} Quiz</h1>
          <div className="space-y-3 text-left mb-8">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Questions:</span>
              <span className="font-bold">10</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time Limit:</span>
              <span className="font-bold">5 minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lives:</span>
              <span className="font-bold">❤️❤️❤️</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">XP Reward:</span>
              <span className="font-bold">100 XP</span>
            </div>
          </div>
          <Button
            onClick={handleStart}
            size="lg"
            className="w-full bg-primary hover:bg-primary/90"
          >
            Start Quiz
          </Button>
        </Card>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center animate-bounce-in">
          <div className="text-6xl mb-6">{rating}</div>
          <h1 className="text-3xl font-bold mb-2">Quiz Complete!</h1>
          <p className="text-xl text-muted-foreground mb-8">{message}</p>

          <div className="space-y-3 mb-8">
            <div className="flex justify-between text-lg">
              <span>Score:</span>
              <span className="font-bold">
                {score}/{questions.length} ({percentage.toFixed(0)}%)
              </span>
            </div>
            <div className="flex justify-between text-lg">
              <span>XP Earned:</span>
              <span className="font-bold text-accent">{score * 10} XP</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>Time:</span>
              <span className="font-bold">
                {Math.floor((300 - timeLeft) / 60)}:
                {((300 - timeLeft) % 60).toString().padStart(2, "0")}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/learning")}
            >
              Back to Path
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={() => window.location.reload()}
            >
              Retake
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <Clock
                className={`h-5 w-5 ${timeLeft < 60 ? "text-destructive" : ""}`}
              />
              <span
                className={`font-bold ${
                  timeLeft < 60 ? "text-destructive" : ""
                }`}
              >
                {Math.floor(timeLeft / 60)}:
                {(timeLeft % 60).toString().padStart(2, "0")}
              </span>
            </div>
            <span className="text-sm font-medium">
              {currentQuestion + 1}/10
            </span>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <span key={i} className={i < lives ? "" : "opacity-30"}>
                  ❤️
                </span>
              ))}
            </div>
          </div>
          <Progress
            value={((currentQuestion + 1) / questions.length) * 100}
            className="h-2"
          />
        </div>

        {/* Question Card */}
        <Card className="p-8 animate-fade-in">
          <h2 className="text-2xl font-bold mb-8 text-center">
            {questions[currentQuestion].question}
          </h2>

          <div className="space-y-4">
            {questions[currentQuestion].options.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full p-6 text-lg justify-start hover-lift"
                onClick={() => handleAnswer(index)}
              >
                {String.fromCharCode(65 + index)}. {option}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Quiz;
