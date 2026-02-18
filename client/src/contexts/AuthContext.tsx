import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import api, { setToken, clearToken, getToken } from "@/services/api";

/* ── Types ── */
export interface User {
  _id: string;
  name: string;
  email: string;
  age?: number;
  grade?: string;
  school?: string;
  level: number;
  xp: number;
  knowledgeLevel?: string;
  currentStreak: number;
  longestStreak: number;
  createdAt: string;
  lastLogin: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ requiresOtp: boolean }>;
  signup: (
    userData: {
      name: string;
      email: string;
      age?: number;
      grade?: string;
      school?: string;
      knowledgeLevel?: string;
    },
    password: string
  ) => Promise<{ requiresOtp: boolean }>;
  verifyOtp: (email: string, otp: string, flow: "login" | "signup") => Promise<boolean>;
  resendOtp: (email: string, flow: "login" | "signup", password?: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  addXP: (amount: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ── Provider ── */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* Restore session on mount */
  useEffect(() => {
    const restoreSession = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const userData = await api.get<User>("/auth/me");
        setUser(userData);
      } catch {
        clearToken();
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  /* ── Auth actions ── */
  const login = async (email: string, password: string): Promise<{ requiresOtp: boolean }> => {
    await api.post("/auth/login", { email, password });
    return { requiresOtp: true };
  };

  const signup = async (
    userData: {
      name: string;
      email: string;
      age?: number;
      grade?: string;
      school?: string;
      knowledgeLevel?: string;
    },
    password: string
  ): Promise<{ requiresOtp: boolean }> => {
    await api.post("/auth/signup", { ...userData, password });
    return { requiresOtp: true };
  };

  const verifyOtp = async (
    email: string,
    otp: string,
    flow: "login" | "signup"
  ): Promise<boolean> => {
    try {
      const data = await api.post<{ token: string; user: User }>(
        "/auth/verify-otp",
        { email, otp, flow }
      );
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch {
      return false;
    }
  };

  const resendOtp = async (
    email: string,
    flow: "login" | "signup",
    password?: string
  ): Promise<void> => {
    await api.post("/auth/resend-otp", { email, flow, password });
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    const updated = await api.patch<User>("/auth/me", updates);
    setUser(updated);
  };

  const addXP = async (amount: number) => {
    const updated = await api.post<User>("/auth/xp", { amount });
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, verifyOtp, resendOtp, logout, updateUser, addXP }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
