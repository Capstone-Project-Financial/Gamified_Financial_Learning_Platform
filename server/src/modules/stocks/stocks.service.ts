import ApiError from '../../utils/ApiError';
import { addDiscretionary, deductDiscretionary } from '../wallet/wallet.service';
import { HoldingModel, StockModel, TradeModel } from '../../models/Stock';

export const listStocks = async () => {
  return StockModel.find({}).sort({ symbol: 1 });
};

export const refreshStockPrices = async () => {
  const stocks = await StockModel.find({});
  await Promise.all(
    stocks.map(async (stock) => {
      const changePercent = Math.random() * 0.08 - 0.03; // -3% to +5%
      const newPrice = parseFloat((stock.price * (1 + changePercent)).toFixed(2));
      const change = parseFloat((newPrice - stock.price).toFixed(2));
      stock.history = [...stock.history.slice(-49), newPrice];
      stock.change = change;
      stock.changePercent = parseFloat((changePercent * 100).toFixed(2));
      stock.price = newPrice;
      await stock.save();
    })
  );
  return stocks;
};

export const getPortfolio = async (userId: string) => {
  const holdings = await HoldingModel.find({ user: userId });
  const trades = await TradeModel.find({ user: userId }).sort({ createdAt: -1 }).limit(50);
  const stocks = await StockModel.find({ symbol: { $in: holdings.map((h) => h.symbol) } });

  let portfolioValue = 0;
  let totalProfit = 0;
  const enrichedHoldings = holdings.map((holding) => {
    const stock = stocks.find((s) => s.symbol === holding.symbol);
    const currentValue = stock ? stock.price * holding.shares : 0;
    const profit = stock ? (stock.price - holding.avgCost) * holding.shares : 0;
    portfolioValue += currentValue;
    totalProfit += profit;
    return {
      ...holding.toObject(),
      currentPrice: stock?.price ?? 0,
      currentValue,
      profit
    };
  });

  return {
    holdings: enrichedHoldings,
    trades,
    portfolioValue,
    totalProfit
  };
};

export const buyStock = async (userId: string, symbol: string, shares: number) => {
  const stock = await StockModel.findOne({ symbol });
  if (!stock) throw new ApiError(404, 'Stock not found');

  const cost = stock.price * shares;
  const wallet = await deductDiscretionary(userId, cost, `Bought ${shares} ${symbol} shares`);

  const holding =
    (await HoldingModel.findOne({ user: userId, stock: stock.id })) ||
    (await HoldingModel.create({ user: userId, stock: stock.id, symbol, shares: 0, avgCost: 0 }));

  const totalShares = holding.shares + shares;
  const newAvgCost = (holding.avgCost * holding.shares + cost) / totalShares;
  holding.shares = totalShares;
  holding.avgCost = parseFloat(newAvgCost.toFixed(2));
  await holding.save();

  const trade = await TradeModel.create({
    user: userId,
    stock: stock.id,
    symbol,
    type: 'buy',
    shares,
    price: stock.price
  });

  return { holding, wallet, trade, stock };
};

export const sellStock = async (userId: string, symbol: string, shares: number) => {
  const stock = await StockModel.findOne({ symbol });
  if (!stock) throw new ApiError(404, 'Stock not found');

  const holding = await HoldingModel.findOne({ user: userId, stock: stock.id });
  if (!holding || holding.shares < shares) {
    throw new ApiError(400, 'Not enough shares to sell');
  }

  const proceeds = stock.price * shares;
  const wallet = await addDiscretionary(userId, proceeds, `Sold ${shares} ${symbol} shares`);

  holding.shares -= shares;
  if (holding.shares === 0) {
    await holding.deleteOne();
  } else {
    await holding.save();
  }

  const trade = await TradeModel.create({
    user: userId,
    stock: stock.id,
    symbol,
    type: 'sell',
    shares,
    price: stock.price
  });

  return { wallet, trade, stock };
};

