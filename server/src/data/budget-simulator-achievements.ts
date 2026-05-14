import { AchievementTemplate } from './achievements';

export const budgetSimulatorAchievements: AchievementTemplate[] = [
  {
    id: 'budget-first-month',
    name: 'Budget Rookie',
    description: 'Complete your first budget simulation month',
    icon: '📋',
    xpReward: 50
  },
  {
    id: 'smart-saver',
    name: 'Smart Saver',
    description: 'Save ≥ 30% of income for 3 consecutive months',
    icon: '💡',
    xpReward: 150,
    total: 3
  },
  {
    id: 'debt-free-champion',
    name: 'Debt-Free Champion',
    description: 'Complete a simulation with zero debt',
    icon: '🏆',
    xpReward: 200
  },
  {
    id: 'investment-guru',
    name: 'Investment Guru',
    description: 'Earn ≥ 20% total return on investments',
    icon: '📈',
    xpReward: 175
  },
  {
    id: 'budget-master',
    name: 'Budget Master',
    description: 'Complete a 12-month simulation with avg score ≥ 80',
    icon: '👑',
    xpReward: 300
  },
  {
    id: 'crisis-handler',
    name: 'Crisis Handler',
    description: 'Handle 5 negative events without going into debt',
    icon: '🛡️',
    xpReward: 125,
    total: 5
  },
  {
    id: 'financial-planner',
    name: 'Financial Planner',
    description: 'Complete all financial goals in a simulation',
    icon: '📊',
    xpReward: 250
  }
];
