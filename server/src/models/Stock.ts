import { Schema, model, Document, Types } from 'mongoose';

export interface IStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  history: number[];
  icon: string;
  description: string;
  sector: string;
}

export interface IStockDocument extends IStock, Document {}

const stockSchema = new Schema<IStockDocument>(
  {
    symbol: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    change: { type: Number, required: true },
    changePercent: { type: Number, required: true },
    history: { type: [Number], default: [] },
    icon: String,
    description: String,
    sector: String
  },
  { timestamps: true }
);

export const StockModel = model<IStockDocument>('Stock', stockSchema);

export interface IHolding {
  user: Types.ObjectId;
  stock: Types.ObjectId;
  symbol: string;
  shares: number;
  avgCost: number;
}

export interface IHoldingDocument extends IHolding, Document {}

const holdingSchema = new Schema<IHoldingDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stock: { type: Schema.Types.ObjectId, ref: 'Stock', required: true },
    symbol: { type: String, required: true },
    shares: { type: Number, required: true },
    avgCost: { type: Number, required: true }
  },
  { timestamps: true }
);

holdingSchema.index({ user: 1, stock: 1 }, { unique: true });

export const HoldingModel = model<IHoldingDocument>('Holding', holdingSchema);

export interface ITrade {
  user: Types.ObjectId;
  stock: Types.ObjectId;
  symbol: string;
  type: 'buy' | 'sell';
  shares: number;
  price: number;
}

export interface ITradeDocument extends ITrade, Document {}

const tradeSchema = new Schema<ITradeDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stock: { type: Schema.Types.ObjectId, ref: 'Stock', required: true },
    symbol: { type: String, required: true },
    type: { type: String, enum: ['buy', 'sell'], required: true },
    shares: { type: Number, required: true },
    price: { type: Number, required: true }
  },
  { timestamps: true }
);

export const TradeModel = model<ITradeDocument>('Trade', tradeSchema);

