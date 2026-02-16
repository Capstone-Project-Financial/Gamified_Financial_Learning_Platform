import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { toast } from "sonner";
import api from "@/services/api";
import { useAuth } from "./AuthContext";

/* ── Types ── */
interface WalletData {
  lucreBalance: number;
  activeBalance: number;
  discretionaryBalance: number;
  totalEarned: number;
  lastPayout: string;
  expenses: {
    tax: number;
    rent: number;
    food: number;
    utilities: number;
    other: number;
  };
}

interface Transaction {
  _id: string;
  type: string;
  description: string;
  amount: number;
  balanceAfter: number;
  createdAt: string;
}

interface WalletContextType {
  wallet: WalletData;
  transactions: Transaction[];
  addToLucre: (amount: number, description: string) => Promise<void>;
  deductFromDiscretionary: (
    amount: number,
    description: string
  ) => Promise<boolean>;
  addToDiscretionary: (amount: number, description: string) => Promise<void>;
  processWeeklyPayout: () => Promise<void>;
  allocateExpenses: (expenses: WalletData["expenses"]) => Promise<void>;
  refreshWallet: () => Promise<void>;
}

const defaultWallet: WalletData = {
  lucreBalance: 0,
  activeBalance: 500,
  discretionaryBalance: 500,
  totalEarned: 500,
  lastPayout: new Date().toISOString(),
  expenses: { tax: 0, rent: 0, food: 0, utilities: 0, other: 0 },
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

/* ── Provider ── */
export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData>(defaultWallet);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const refreshWallet = useCallback(async () => {
    try {
      const data = await api.get<{ wallet: WalletData; transactions: Transaction[] }>("/wallet");
      setWallet(data.wallet);
      setTransactions(data.transactions);
    } catch {
      /* user not logged in yet – ignore */
    }
  }, []);

  useEffect(() => {
    if (user) refreshWallet();
  }, [user, refreshWallet]);

  const addToLucre = async (amount: number, description: string) => {
    const updated = await api.post<WalletData>("/wallet/earn", {
      amount,
      description,
    });
    setWallet(updated);
  };

  const deductFromDiscretionary = async (
    amount: number,
    description: string
  ): Promise<boolean> => {
    try {
      const updated = await api.post<WalletData>("/wallet/discretionary/deduct", {
        amount,
        description,
      });
      setWallet(updated);
      return true;
    } catch {
      toast.error("Insufficient balance!");
      return false;
    }
  };

  const addToDiscretionary = async (amount: number, description: string) => {
    const updated = await api.post<WalletData>("/wallet/discretionary/add", {
      amount,
      description,
    });
    setWallet(updated);
  };

  const processWeeklyPayout = async () => {
    const updated = await api.post<WalletData>("/wallet/payout");
    setWallet(updated);
    if (updated.lucreBalance === 0 && wallet.lucreBalance > 0) {
      toast.success(`💰 Salary Received!`);
    }
  };

  const allocateExpenses = async (expenses: WalletData["expenses"]) => {
    const updated = await api.put<WalletData>("/wallet/expenses", expenses);
    setWallet(updated);
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        transactions,
        addToLucre,
        deductFromDiscretionary,
        addToDiscretionary,
        processWeeklyPayout,
        allocateExpenses,
        refreshWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within WalletProvider");
  return context;
};
