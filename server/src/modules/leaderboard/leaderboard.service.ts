import { UserModel } from '../../models/User';
import { HoldingModel, StockModel } from '../../models/Stock';

const computeProfitMap = async (userIds: string[]) => {
  if (!userIds.length) return new Map<string, number>();
  const holdings = await HoldingModel.find({ user: { $in: userIds } });
  const stocks = await StockModel.find({});
  const priceMap = new Map(stocks.map((stock) => [stock.symbol, stock.price]));

  const profitMap = new Map<string, number>();
  holdings.forEach((holding) => {
    const currentPrice = priceMap.get(holding.symbol) ?? holding.avgCost;
    const profit = (currentPrice - holding.avgCost) * holding.shares;
    profitMap.set(holding.user.toString(), (profitMap.get(holding.user.toString()) ?? 0) + profit);
  });

  return profitMap;
};

export const getLeaderboard = async (limit: number) => {
  const users = await UserModel.find().sort({ xp: -1 }).limit(limit);
  const profitMap = await computeProfitMap(users.map((user) => user.id));

  return users.map((user, index) => ({
    rank: index + 1,
    name: user.name,
    level: user.level,
    xp: user.xp,
    school: user.school,
    streak: user.currentStreak,
    profit: Math.round(profitMap.get(user.id) ?? 0)
  }));
};

export const getUserStanding = async (userId: string) => {
  const user = await UserModel.findById(userId);
  if (!user) return null;

  const higherRankedCount = await UserModel.countDocuments({ xp: { $gt: user.xp } });
  const profitMap = await computeProfitMap([userId]);

  return {
    rank: higherRankedCount + 1,
    name: user.name,
    level: user.level,
    xp: user.xp,
    school: user.school,
    streak: user.currentStreak,
    profit: Math.round(profitMap.get(userId) ?? 0)
  };
};

