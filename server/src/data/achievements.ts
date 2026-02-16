export interface AchievementTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  total?: number;
}

export const achievementTemplates: AchievementTemplate[] = [
  { id: 'first-steps', name: 'First Steps', description: 'Complete your first lesson', icon: '🎖️', xpReward: 50 },
  { id: 'quiz-master', name: 'Quiz Master', description: 'Pass 5 quizzes with 80%+', icon: '🧠', xpReward: 100, total: 5 },
  { id: 'early-investor', name: 'Early Investor', description: 'Buy your first stock', icon: '📈', xpReward: 75 },
  { id: 'streak-warrior', name: 'Streak Warrior', description: '7-day login streak', icon: '🔥', xpReward: 150, total: 7 },
  { id: 'money-master', name: 'Money Master', description: 'Complete all beginner modules', icon: '💰', xpReward: 200, total: 5 },
  { id: 'diversification-pro', name: 'Diversification Pro', description: 'Own shares in all 5 companies', icon: '📊', xpReward: 250, total: 5 },
  { id: 'quiz-champion', name: 'Quiz Champion', description: 'Score 100% on 10 quizzes', icon: '🏆', xpReward: 300, total: 10 },
  { id: 'trading-tycoon', name: 'Trading Tycoon', description: 'Make ₹1000 profit from stocks', icon: '💼', xpReward: 500, total: 1000 },
  { id: 'battle-victor', name: 'Battle Victor', description: 'Win 10 quiz battles', icon: '⚔️', xpReward: 200, total: 10 }
];

export const buildAchievementState = () =>
  achievementTemplates.map((achievement) => ({
    ...achievement,
    unlocked: false,
    progress: 0
  }));

