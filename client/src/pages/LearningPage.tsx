/** @format */

import { useProgress } from "@/contexts/ProgressContext";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Lock, CheckCircle, Circle, Trophy, BookOpen, Clock, Zap } from "lucide-react";

const modules = [
  {
    id: 1,
    title: "Money Basics",
    icon: "🪙",
    lessons: [
      { id: "1", title: "What is Money?", duration: "5 min" },
      { id: "2", title: "Earning Money", duration: "5 min" },
      { id: "3", title: "Saving vs Spending", duration: "6 min" },
    ],
  },
  {
    id: 2,
    title: "Smart Spending",
    icon: "🛒",
    lessons: [
      { id: "1", title: "Needs vs Wants", duration: "5 min" },
      { id: "2", title: "Making Choices", duration: "6 min" },
      { id: "3", title: "Avoiding Waste", duration: "5 min" },
    ],
  },
  {
    id: 3,
    title: "The Saving Adventure",
    icon: "💰",
    lessons: [
      { id: "1", title: "Why Save Money?", duration: "5 min" },
      { id: "2", title: "Setting Goals", duration: "6 min" },
      { id: "3", title: "Piggy Banks & Bank Accounts", duration: "7 min" },
    ],
  },
  {
    id: 4,
    title: "Understanding Banks",
    icon: "🏦",
    lessons: [
      { id: "1", title: "What Banks Do", duration: "5 min" },
      { id: "2", title: "Interest - Money That Grows!", duration: "6 min" },
      { id: "3", title: "Keeping Money Safe", duration: "5 min" },
    ],
  },
  {
    id: 5,
    title: "Introduction to Earning",
    icon: "💼",
    lessons: [
      { id: "1", title: "Jobs and Work", duration: "5 min" },
      { id: "2", title: "Allowance and Chores", duration: "6 min" },
      { id: "3", title: "Starting Small Businesses", duration: "7 min" },
    ],
  },
];

// Circular progress component
const CircularProgress = ({ percentage, size = 120 }: { percentage: number; size?: number }) => {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="progress-ring">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted opacity-20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress-ring-circle transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(210 100% 56%)" />
            <stop offset="100%" stopColor="hsl(180 100% 50%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          {Math.round(percentage)}%
        </span>
        <span className="text-xs text-muted-foreground">Complete</span>
      </div>
    </div>
  );
};

const Learning = () => {
  const { progress, getModuleProgress, isLessonUnlocked } = useProgress();

  const overallProgress = (progress.completedLessons.length / 15) * 100;
  const totalXP = progress.completedLessons.length * 50 + progress.completedModules.length * 100;

  // Find next lesson to continue
  const getNextLesson = () => {
    for (const module of modules) {
      for (const lesson of module.lessons) {
        const lessonKey = `${module.id}.${lesson.id}`;
        if (
          !progress.completedLessons.includes(lessonKey) &&
          isLessonUnlocked(module.id, lesson.id)
        ) {
          return { moduleId: module.id, lessonId: lesson.id, title: lesson.title };
        }
      }
    }
    return null;
  };

  const nextLesson = getNextLesson();

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="relative">
          <div className="absolute -top-4 -left-4 text-6xl animate-float opacity-20">📚</div>
          <h1 className="text-4xl font-bold mb-2 relative">
            Your Learning Journey
            <span className="ml-3 text-3xl animate-pulse-soft">✨</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Master financial literacy one lesson at a time
          </p>
        </div>

        {/* Progress Overview Card with Glassmorphism */}
        <Card className="glass-medium p-8 relative overflow-hidden group">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-primary opacity-5 animate-gradient-shift" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Circular Progress */}
              <div className="animate-scale-in">
                <CircularProgress percentage={overallProgress} />
              </div>

              {/* Stats */}
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Overall Progress</h3>
                  <p className="text-muted-foreground">
                    {progress.completedLessons.length} of 15 lessons completed
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-light p-4 rounded-lg hover:glass-medium transition-all">
                    <div className="flex items-center gap-2 text-primary mb-1">
                      <Zap className="h-5 w-5" />
                      <span className="text-sm font-medium">Total XP</span>
                    </div>
                    <p className="text-2xl font-bold">{totalXP}</p>
                  </div>
                  <div className="glass-light p-4 rounded-lg hover:glass-medium transition-all">
                    <div className="flex items-center gap-2 text-success mb-1">
                      <Trophy className="h-5 w-5" />
                      <span className="text-sm font-medium">Modules Done</span>
                    </div>
                    <p className="text-2xl font-bold">{progress.completedModules.length}/5</p>
                  </div>
                </div>

                {/* Continue Learning Button */}
                {nextLesson && (
                  <Link to={`/lesson/${nextLesson.moduleId}/${nextLesson.lessonId}`}>
                    <Button 
                      size="lg" 
                      className="w-full md:w-auto bg-gradient-primary hover:opacity-90 transition-all hover:scale-105 animate-glow"
                    >
                      <BookOpen className="mr-2 h-5 w-5" />
                      Continue: {nextLesson.title}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Learning Path */}
        <div className="space-y-6">
          {modules.map((module, moduleIndex) => {
            const isModuleUnlocked =
              moduleIndex === 0 ||
              progress.completedModules.includes(moduleIndex);
            const moduleProgress = getModuleProgress(module.id);
            const completedLessons = progress.completedLessons.filter((l) =>
              l.startsWith(`${module.id}.`)
            ).length;
            const isCompleted = progress.completedModules.includes(module.id);

            return (
              <Card
                key={module.id}
                className={`p-6 relative overflow-hidden transition-all duration-500 ${
                  isModuleUnlocked 
                    ? "card-3d-hover glass-medium animate-fade-in" 
                    : "opacity-50 cursor-not-allowed"
                } stagger-${moduleIndex + 1}`}
              >
                {/* Gradient border for unlocked modules */}
                {isModuleUnlocked && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}

                <div className="relative z-10">
                  {/* Module Header */}
                  <div className="flex items-start gap-6 mb-6">
                    {/* Animated Icon */}
                    <div className={`text-7xl transition-transform duration-300 ${
                      isModuleUnlocked ? "hover:scale-110 animate-float" : ""
                    }`}>
                      {module.icon}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h2 className="text-3xl font-bold">
                          {module.title}
                        </h2>
                        {!isModuleUnlocked && (
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted">
                            <Lock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Locked</span>
                          </div>
                        )}
                        {isCompleted && (
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-success/20 animate-scale-in">
                            <CheckCircle className="h-5 w-5 text-success" />
                            <span className="text-sm font-medium text-success">Completed!</span>
                          </div>
                        )}
                      </div>

                      {/* Module Stats */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span>{completedLessons}/{module.lessons.length} lessons</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary" />
                          <span className="font-medium text-primary">
                            +{module.lessons.length * 50 + 100} XP
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            ~{module.lessons.reduce((sum, l) => sum + parseInt(l.duration), 0)} min
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium">Progress</span>
                          <span className="text-primary font-bold">{Math.round(moduleProgress)}%</span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden relative">
                          <div
                            className="h-full bg-gradient-primary transition-all duration-1000 ease-out relative overflow-hidden"
                            style={{ width: `${moduleProgress}%` }}
                          >
                            {/* Shimmer effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lessons Grid */}
                  <div className="space-y-3 pl-0 md:pl-20">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const lessonKey = `${module.id}.${lesson.id}`;
                      const isLessonCompleted = progress.completedLessons.includes(lessonKey);
                      const isUnlocked = isLessonUnlocked(module.id, lesson.id);

                      return (
                        <div
                          key={lesson.id}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${
                            isLessonCompleted
                              ? "bg-success/10 border-success/30 hover:border-success/50"
                              : isUnlocked
                              ? "glass-light hover:glass-medium border-border/50 hover:border-primary/50"
                              : "bg-muted/30 border-muted opacity-60"
                          }`}
                        >
                          {/* Status Icon */}
                          <div className="flex-shrink-0">
                            {isLessonCompleted ? (
                              <div className="relative">
                                <CheckCircle className="h-7 w-7 text-success animate-scale-in" />
                                <div className="absolute inset-0 animate-ping opacity-20">
                                  <CheckCircle className="h-7 w-7 text-success" />
                                </div>
                              </div>
                            ) : isUnlocked ? (
                              <Circle className="h-7 w-7 text-primary animate-pulse-soft" />
                            ) : (
                              <Lock className="h-7 w-7 text-muted-foreground" />
                            )}
                          </div>

                          {/* Lesson Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base mb-1 truncate">
                              {lesson.title}
                            </h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {lesson.duration}
                              </span>
                              <span className="flex items-center gap-1">
                                <Zap className="h-3 w-3 text-primary" />
                                +50 XP
                              </span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="flex-shrink-0">
                            {isUnlocked && !isLessonCompleted && (
                              <Link to={`/lesson/${module.id}/${lesson.id}`}>
                                <Button 
                                  className="bg-primary hover:bg-primary/90 hover:scale-105 transition-transform"
                                  size="sm"
                                >
                                  Start
                                </Button>
                              </Link>
                            )}
                            {isLessonCompleted && (
                              <Link to={`/lesson/${module.id}/${lesson.id}`}>
                                <Button variant="outline" size="sm" className="hover:scale-105 transition-transform">
                                  Review
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Module Quiz */}
                    <div
                      className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all duration-300 ${
                        isCompleted
                          ? "bg-accent/10 border-accent/30 hover:border-accent/50"
                          : moduleProgress === 100
                          ? "glass-light hover:glass-medium border-border/50 hover:border-accent/50 animate-glow"
                          : "bg-muted/30 border-muted opacity-60"
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <Trophy
                          className={`h-8 w-8 ${
                            isCompleted
                              ? "text-accent animate-bounce-in"
                              : moduleProgress === 100
                              ? "text-accent/70 animate-pulse-soft"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>

                      <div className="flex-1">
                        <h4 className="font-bold text-lg mb-1">
                          {module.title} Challenge
                        </h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            10 questions
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-accent" />
                            +100 XP
                          </span>
                        </p>
                      </div>

                      <div className="flex-shrink-0">
                        {moduleProgress === 100 && !isCompleted && (
                          <Link to={`/quiz/${module.id}`}>
                            <Button 
                              className="bg-accent hover:bg-accent/90 text-accent-foreground hover:scale-105 transition-transform animate-pulse-soft"
                              size="sm"
                            >
                              Take Quiz
                            </Button>
                          </Link>
                        )}
                        {isCompleted && (
                          <Link to={`/quiz/${module.id}`}>
                            <Button variant="outline" size="sm" className="hover:scale-105 transition-transform">
                              Retake
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Motivational Footer */}
        {overallProgress < 100 && (
          <Card className="glass-light p-6 text-center animate-fade-in">
            <p className="text-lg font-medium mb-2">
              🌟 Keep going! You're doing amazing!
            </p>
            <p className="text-muted-foreground">
              {15 - progress.completedLessons.length} lessons left to master financial literacy
            </p>
          </Card>
        )}

        {overallProgress === 100 && (
          <Card className="glass-medium p-8 text-center animate-bounce-in bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="text-6xl mb-4 animate-float">🎉</div>
            <h3 className="text-3xl font-bold mb-2">Congratulations!</h3>
            <p className="text-lg text-muted-foreground">
              You've completed all lessons! You're a financial literacy champion!
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Learning;
