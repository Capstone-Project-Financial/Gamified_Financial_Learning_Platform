/** @format */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProgress } from "@/contexts/ProgressContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X, ArrowRight, ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

// Sample lesson content for Module 1, Lesson 1
const lessonContent: Record<string, any> = {
  "1.1": {
    title: "What is Money?",
    slides: [
      {
        type: "intro",
        content: {
          image: "🪙",
          text: "Hi! I'm Coinsworth 🪙. Let me tell you about MONEY!",
        },
      },
      {
        type: "content",
        content: {
          image: "💱",
          text: "Money is something we use to buy things we need and want. People trade money for toys, food, clothes, and more!",
        },
      },
      {
        type: "question",
        content: {
          question: "What can you buy with money?",
          options: [
            { id: "a", text: "🍎 Apple", correct: true },
            { id: "b", text: "☁️ Cloud", correct: false },
            { id: "c", text: "🎮 Video Game", correct: true },
          ],
          multiSelect: true,
        },
      },
      {
        type: "content",
        content: {
          image: "🏺",
          text: "Long ago, people traded shells, beads, and stones! Then they invented coins and paper money. Now we also have digital money!",
        },
      },
      {
        type: "content",
        content: {
          image: "💳",
          text: "Money comes in different forms: coins, notes, credit cards, and even digital payments on your phone!",
        },
      },
      {
        type: "question",
        content: {
          question: "Which of these is a type of money?",
          options: [
            { id: "a", text: "Coins", correct: true },
            { id: "b", text: "Rocks", correct: false },
            { id: "c", text: "Credit Card", correct: true },
            { id: "d", text: "Leaves", correct: false },
          ],
          multiSelect: true,
        },
      },
      {
        type: "story",
        content: {
          image: "🚲",
          story:
            "Raj wanted a bicycle. It cost ₹2000. He saved ₹200 every month from his pocket money. After 10 months, he had enough!",
          lesson: "Saving regularly helps you buy what you want!",
        },
      },
      {
        type: "completion",
        content: {
          message: "🎉 Lesson Complete!",
          xp: 50,
          badge: null,
        },
      },
    ],
  },
};

// Generate similar content for other lessons
const generateLessonContent = (moduleId: string, lessonId: string) => {
  const key = `${moduleId}.${lessonId}`;
  if (lessonContent[key]) return lessonContent[key];

  // Default lesson structure
  return {
    title: `Lesson ${key}`,
    slides: [
      {
        type: "intro",
        content: {
          image: "📚",
          text: `Welcome to Lesson ${key}! Let's learn something new!`,
        },
      },
      {
        type: "content",
        content: {
          image: "💡",
          text: "This is a sample lesson. In a full version, each lesson would have rich, educational content!",
        },
      },
      {
        type: "question",
        content: {
          question: "Sample question: What did we learn?",
          options: [
            { id: "a", text: "Important financial concepts", correct: true },
            { id: "b", text: "Nothing", correct: false },
          ],
        },
      },
      {
        type: "completion",
        content: {
          message: "🎉 Lesson Complete!",
          xp: 50,
        },
      },
    ],
  };
};

// Confetti effect
const createConfetti = () => {
  const colors = ['#1E90FF', '#00FFFF', '#4169E1', '#87CEEB'];
  const confettiCount = 50;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-particle';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
    document.body.appendChild(confetti);
    
    setTimeout(() => confetti.remove(), 3000);
  }
};

const Lesson = () => {
  const { moduleId, lessonId } = useParams();
  const { completeLesson } = useProgress();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [xpEarned, setXpEarned] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [readingProgress, setReadingProgress] = useState(0);

  const lesson = generateLessonContent(moduleId!, lessonId!);
  const progress = ((currentSlide + 1) / lesson.slides.length) * 100;
  const currentSlideData = lesson.slides[currentSlide];

  // Update reading progress based on slide
  useEffect(() => {
    setReadingProgress(progress);
  }, [progress]);

  const handleNext = () => {
    if (currentSlide < lesson.slides.length - 1) {
      setSlideDirection('right');
      setCurrentSlide(currentSlide + 1);
    } else {
      // Lesson complete
      completeLesson(parseInt(moduleId!), lessonId!);
      createConfetti();
      setTimeout(() => navigate("/learning"), 2000);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setSlideDirection('left');
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleAnswer = (
    slideIndex: number,
    answerId: string,
    multiSelect: boolean
  ) => {
    if (multiSelect) {
      const current = answers[slideIndex] || [];
      const newAnswers = current.includes(answerId)
        ? current.filter((id) => id !== answerId)
        : [...current, answerId];
      setAnswers({ ...answers, [slideIndex]: newAnswers });
    } else {
      setAnswers({ ...answers, [slideIndex]: [answerId] });

      // Auto-advance after feedback
      const slide = lesson.slides[slideIndex];
      const option = slide.content.options.find((o: any) => o.id === answerId);

      if (option?.correct) {
        setXpEarned(xpEarned + 10);
        toast.success("Correct! +10 XP", {
          icon: "✨",
          duration: 2000,
        });
        setTimeout(() => handleNext(), 1500);
      } else {
        toast.error("Not quite! Try again.", {
          icon: "🤔",
          duration: 2000,
        });
      }
    }
  };

  const handleExit = () => {
    if (
      confirm("Are you sure you want to exit? Your progress will be saved.")
    ) {
      navigate("/learning");
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentSlideData.type !== 'question') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSlide, currentSlideData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-10 left-10 text-6xl opacity-10 animate-float">💡</div>
      <div className="absolute bottom-10 right-10 text-6xl opacity-10 animate-float" style={{ animationDelay: '1s' }}>📚</div>
      <div className="absolute top-1/2 right-20 text-5xl opacity-10 animate-float" style={{ animationDelay: '0.5s' }}>✨</div>

      {/* Reading Progress Bar */}
      <div 
        className="reading-progress" 
        style={{ width: `${readingProgress}%` }}
      />

      <div className="w-full max-w-4xl relative z-10">
        {/* Header */}
        <div className="mb-6 glass-medium p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary animate-pulse-soft" />
                {lesson.title}
              </h2>
              <span className="text-sm text-muted-foreground">
                {currentSlide + 1} / {lesson.slides.length}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleExit} className="hover:bg-destructive/10">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <Progress value={progress} className="flex-1 h-3" />
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">+{xpEarned} XP</span>
            </div>
          </div>
        </div>

        {/* Slide Content */}
        <Card className={`glass-heavy p-8 md:p-12 min-h-[550px] flex flex-col items-center justify-center text-center relative overflow-hidden ${
          slideDirection === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left'
        }`}>
          {/* Slide-specific background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-50" />

          <div className="relative z-10 w-full">
            {currentSlideData.type === "intro" && (
              <div className="space-y-8 animate-scale-in">
                <div className="text-9xl mb-6 animate-bounce-in">
                  {currentSlideData.content.image}
                </div>
                <p className="text-3xl font-bold leading-relaxed max-w-2xl mx-auto">
                  {currentSlideData.content.text}
                </p>
                <Button
                  onClick={handleNext}
                  size="lg"
                  className="bg-gradient-primary hover:opacity-90 transition-all hover:scale-105 text-lg px-8 py-6 mt-8"
                >
                  Let's Start! <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}

            {currentSlideData.type === "content" && (
              <div className="space-y-8 max-w-3xl mx-auto animate-fade-in">
                <div className="text-8xl mb-8 animate-float">
                  {currentSlideData.content.image}
                </div>
                <div className="glass-light p-8 rounded-2xl">
                  <p className="text-2xl leading-relaxed font-medium">
                    {currentSlideData.content.text}
                  </p>
                </div>
                <div className="flex gap-4 justify-center mt-8">
                  {currentSlide > 0 && (
                    <Button
                      onClick={handlePrevious}
                      variant="outline"
                      size="lg"
                      className="hover:scale-105 transition-transform"
                    >
                      <ArrowLeft className="mr-2 h-5 w-5" /> Previous
                    </Button>
                  )}
                  <Button
                    onClick={handleNext}
                    size="lg"
                    className="bg-gradient-primary hover:opacity-90 transition-all hover:scale-105"
                  >
                    Continue <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {currentSlideData.type === "question" && (
              <div className="space-y-8 w-full max-w-3xl mx-auto animate-fade-in">
                <div className="glass-light p-6 rounded-2xl mb-8">
                  <p className="text-3xl font-bold mb-2">
                    {currentSlideData.content.question}
                  </p>
                  {currentSlideData.content.multiSelect && (
                    <p className="text-sm text-muted-foreground">
                      💡 Select all that apply
                    </p>
                  )}
                </div>
                <div className="space-y-4">
                  {currentSlideData.content.options.map((option: any, index: number) => {
                    const isSelected = answers[currentSlide]?.includes(option.id);
                    return (
                      <Button
                        key={option.id}
                        variant="outline"
                        className={`w-full p-6 text-xl justify-start transition-all duration-300 hover:scale-102 ${
                          isSelected 
                            ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105" 
                            : "glass-light hover:glass-medium"
                        } stagger-${index + 1}`}
                        onClick={() =>
                          handleAnswer(
                            currentSlide,
                            option.id,
                            currentSlideData.content.multiSelect
                          )
                        }
                      >
                        <span className="mr-3 text-2xl">
                          {isSelected ? "✓" : String.fromCharCode(65 + index)}
                        </span>
                        {option.text}
                      </Button>
                    );
                  })}
                </div>
                {currentSlideData.content.multiSelect &&
                  answers[currentSlide]?.length > 0 && (
                    <Button
                      onClick={handleNext}
                      size="lg"
                      className="bg-gradient-primary hover:opacity-90 transition-all hover:scale-105 w-full md:w-auto"
                    >
                      Submit Answers <CheckCircle2 className="ml-2 h-5 w-5" />
                    </Button>
                  )}
              </div>
            )}

            {currentSlideData.type === "story" && (
              <div className="space-y-8 max-w-3xl mx-auto animate-fade-in">
                <div className="text-8xl mb-8 animate-float">
                  {currentSlideData.content.image}
                </div>
                <div className="glass-light p-8 rounded-2xl space-y-6">
                  <p className="text-2xl leading-relaxed italic">
                    "{currentSlideData.content.story}"
                  </p>
                  <div className="p-6 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl border-2 border-primary/30 animate-glow">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">💡</span>
                      <div>
                        <p className="font-bold text-lg mb-1">Key Takeaway:</p>
                        <p className="text-xl font-semibold">
                          {currentSlideData.content.lesson}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 justify-center">
                  {currentSlide > 0 && (
                    <Button
                      onClick={handlePrevious}
                      variant="outline"
                      size="lg"
                      className="hover:scale-105 transition-transform"
                    >
                      <ArrowLeft className="mr-2 h-5 w-5" /> Previous
                    </Button>
                  )}
                  <Button
                    onClick={handleNext}
                    size="lg"
                    className="bg-gradient-primary hover:opacity-90 transition-all hover:scale-105"
                  >
                    Awesome! <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {currentSlideData.type === "completion" && (
              <div className="space-y-8 animate-bounce-in">
                <div className="text-9xl mb-8 animate-bounce-in">🎉</div>
                <h2 className="text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
                  {currentSlideData.content.message}
                </h2>
                <div className="glass-medium p-8 rounded-2xl inline-block">
                  <p className="text-3xl mb-2">
                    You earned{" "}
                    <span className="font-bold text-accent text-4xl animate-pulse-soft">
                      {currentSlideData.content.xp + xpEarned} XP
                    </span>
                    !
                  </p>
                  <p className="text-muted-foreground">Keep up the great work!</p>
                </div>
                {currentSlideData.content.badge && (
                  <div className="p-8 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl border-2 border-primary/30 animate-glow">
                    <p className="text-2xl font-semibold mb-4">🏆 Badge Unlocked!</p>
                    <p className="text-5xl">{currentSlideData.content.badge}</p>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                  <Button
                    onClick={() => navigate("/learning")}
                    variant="outline"
                    size="lg"
                    className="hover:scale-105 transition-transform"
                  >
                    Back to Learning Path
                  </Button>
                  <Button
                    onClick={() => navigate(`/learning`)}
                    size="lg"
                    className="bg-gradient-primary hover:opacity-90 transition-all hover:scale-105"
                  >
                    Continue Learning <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Navigation Hint */}
        <div className="mt-4 text-center text-sm text-muted-foreground glass-light p-3 rounded-lg">
          💡 Tip: Use arrow keys ← → to navigate between slides
        </div>
      </div>
    </div>
  );
};

export default Lesson;
