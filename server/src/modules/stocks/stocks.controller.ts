import { Request, Response } from 'express';

import ApiError from '../../utils/ApiError';
import asyncHandler from '../../utils/asyncHandler';
import sendSuccess from '../../utils/response';
import { evaluateAchievements } from '../achievements/achievements.service';
import { buyStock, getPortfolio, listStocks, refreshStockPrices, sellStock } from './stocks.service';

export const listStocksController = asyncHandler(async (req: Request, res: Response) => {
  const stocks = await listStocks();
  return sendSuccess(res, stocks);
});

export const portfolioController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  const portfolio = await getPortfolio(req.user.id);
  return sendSuccess(res, portfolio);
});

export const buyStockController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  const { symbol } = req.params;
  const { shares } = req.body;
  const result = await buyStock(req.user.id, symbol, shares);
  await evaluateAchievements(req.user.id);
  return sendSuccess(res, result, 'Stock purchased', 201);
});

export const sellStockController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  const { symbol } = req.params;
  const { shares } = req.body;
  const result = await sellStock(req.user.id, symbol, shares);
  await evaluateAchievements(req.user.id);
  return sendSuccess(res, result, 'Stock sold');
});

export const refreshStocksController = asyncHandler(async (_req: Request, res: Response) => {
  const stocks = await refreshStockPrices();
  return sendSuccess(res, stocks, 'Stock prices refreshed');
});

