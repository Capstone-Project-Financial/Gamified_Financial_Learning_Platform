import { Schema, model, Document, Types } from 'mongoose';

export interface IExpenses {
  tax: number;
  rent: number;
  food: number;
  utilities: number;
  other: number;
}

export interface IWallet {
  user: Types.ObjectId;
  lucreBalance: number;
  activeBalance: number;
  discretionaryBalance: number;
  totalEarned: number;
  lastPayout: Date;
  expenses: IExpenses;
}

export interface IWalletDocument extends IWallet, Document {}

const walletSchema = new Schema<IWalletDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    lucreBalance: { type: Number, default: 0 },
    activeBalance: { type: Number, default: 500 },
    discretionaryBalance: { type: Number, default: 500 },
    totalEarned: { type: Number, default: 500 },
    lastPayout: { type: Date, default: () => new Date() },
    expenses: {
      tax: { type: Number, default: 0 },
      rent: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
      utilities: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

export const WalletModel = model<IWalletDocument>('Wallet', walletSchema);

export interface ITransaction {
  wallet: Types.ObjectId;
  type: 'earning' | 'expense' | 'income';
  description: string;
  amount: number;
  balanceAfter: number;
  createdAt: Date;
}

export interface ITransactionDocument extends ITransaction, Document {}

const transactionSchema = new Schema<ITransactionDocument>(
  {
    wallet: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
    type: { type: String, enum: ['earning', 'expense', 'income'], required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true }
  },
  { timestamps: true }
);

export const TransactionModel = model<ITransactionDocument>('Transaction', transactionSchema);

