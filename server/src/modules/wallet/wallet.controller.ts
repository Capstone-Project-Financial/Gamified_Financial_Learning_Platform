import { Request, Response } from 'express';

import ApiError from '../../utils/ApiError';
import asyncHandler from '../../utils/asyncHandler';
import sendSuccess from '../../utils/response';
import { addDiscretionary, addLucre, deductDiscretionary, getTransactions, getWallet, processPayout, updateExpenses } from './wallet.service';

export const getWalletSummary = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  const wallet = await getWallet(req.user.id);
  const transactions = await getTransactions(wallet.id.toString());
  return sendSuccess(res, { wallet, transactions });
});

export const earnLucre = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  const wallet = await addLucre(req.user.id, req.body.amount, req.body.description);
  return sendSuccess(res, wallet, 'Lucre updated', 201);
});

export const addDiscretionaryFunds = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  const wallet = await addDiscretionary(req.user.id, req.body.amount, req.body.description);
  return sendSuccess(res, wallet, 'Balance updated');
});

export const deductDiscretionaryFunds = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  const wallet = await deductDiscretionary(req.user.id, req.body.amount, req.body.description);
  return sendSuccess(res, wallet, 'Expense recorded');
});

export const payout = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  const wallet = await processPayout(req.user.id);
  return sendSuccess(res, wallet, 'Payout processed');
});

export const setExpenses = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  const wallet = await updateExpenses(req.user.id, req.body);
  return sendSuccess(res, wallet, 'Expenses updated');
});

