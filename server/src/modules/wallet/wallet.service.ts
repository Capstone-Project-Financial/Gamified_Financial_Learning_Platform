import ApiError from '../../utils/ApiError';
import { WalletModel, TransactionModel, IExpenses } from '../../models/Wallet';

export const getWallet = async (userId: string) => {
  const wallet =
    (await WalletModel.findOne({ user: userId })) ||
    (await WalletModel.create({
      user: userId
    }));

  return wallet;
};

export const getTransactions = async (walletId: string, limit = 50) => {
  return TransactionModel.find({ wallet: walletId }).sort({ createdAt: -1 }).limit(limit);
};

const recordTransaction = async (
  walletId: string,
  type: 'earning' | 'expense' | 'income',
  description: string,
  amount: number,
  balanceAfter: number
) => {
  await TransactionModel.create({
    wallet: walletId,
    type,
    description,
    amount,
    balanceAfter
  });
};

export const addLucre = async (userId: string, amount: number, description: string) => {
  const wallet = await getWallet(userId);
  wallet.lucreBalance += amount;
  wallet.totalEarned += amount;
  await wallet.save();

  await recordTransaction(wallet.id, 'earning', description, amount, wallet.discretionaryBalance);
  return wallet;
};

export const addDiscretionary = async (userId: string, amount: number, description: string) => {
  const wallet = await getWallet(userId);
  wallet.discretionaryBalance += amount;
  await wallet.save();

  await recordTransaction(wallet.id, 'income', description, amount, wallet.discretionaryBalance);
  return wallet;
};

export const deductDiscretionary = async (userId: string, amount: number, description: string) => {
  const wallet = await getWallet(userId);
  if (wallet.discretionaryBalance < amount) {
    throw new ApiError(400, 'Insufficient balance');
  }

  wallet.discretionaryBalance -= amount;
  await wallet.save();

  await recordTransaction(wallet.id, 'expense', description, -amount, wallet.discretionaryBalance);
  return wallet;
};

export const processPayout = async (userId: string) => {
  const wallet = await getWallet(userId);
  if (wallet.lucreBalance <= 0) {
    return wallet;
  }

  const payoutAmount = wallet.lucreBalance;
  wallet.lucreBalance = 0;
  wallet.activeBalance += payoutAmount;
  wallet.discretionaryBalance += payoutAmount;
  wallet.lastPayout = new Date();
  await wallet.save();

  await recordTransaction(wallet.id, 'income', 'Weekly payout', payoutAmount, wallet.discretionaryBalance);
  return wallet;
};

export const updateExpenses = async (userId: string, expenses: IExpenses) => {
  const wallet = await getWallet(userId);
  wallet.expenses = expenses;
  const totalExpenses = Object.values(expenses).reduce((sum, value) => sum + value, 0);
  wallet.discretionaryBalance = Math.max(wallet.activeBalance - totalExpenses, 0);
  await wallet.save();
  return wallet;
};

