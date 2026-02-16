/** @format */

import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Home,
  BookOpen,
  Wallet,
  Trophy,
  Swords,
  Calculator,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const menuItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: BookOpen, label: "Learning Path", path: "/learning" },
  { icon: Wallet, label: "My Wallet", path: "/wallet" },
  { icon: Trophy, label: "Achievements", path: "/achievements" },
  { icon: Swords, label: "Quiz Battles", path: "/battles" },
  { icon: Calculator, label: "Financial Tools", path: "/tools" },
  { icon: BarChart3, label: "Leaderboard", path: "/leaderboard" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card/40 backdrop-blur-xl border-r border-border/50 transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="h-full flex flex-col">
          {/* Close button for mobile */}
          <div className="p-4 border-b border-border/30 flex items-center justify-end lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-border/30 bg-background/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xl font-bold">
                {user?.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{user?.name}</p>
                <p className="text-sm text-muted-foreground">
                  Level {user?.level}
                </p>
              </div>
            </div>
            <div className="mt-3 p-2 bg-muted/60 backdrop-blur-sm rounded-lg">
              <div className="flex justify-between text-sm mb-1">
                <span>XP Progress</span>
                <span className="font-medium">{user?.xp % 250}/250</span>
              </div>
              <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-primary transition-all duration-300"
                  style={{ width: `${(((user?.xp || 0) % 250) / 250) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                    ${
                      isActive
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-muted text-foreground"
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border/30 bg-background/10">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 border-b border-border/50 bg-card/30 backdrop-blur-2xl flex items-center px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden md:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 backdrop-blur-sm rounded-lg">
                <span className="text-muted-foreground">Level</span>
                <span className="font-bold">{user?.level}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 backdrop-blur-sm rounded-lg">
                <span className="text-muted-foreground">XP</span>
                <span className="font-bold">{user?.xp}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 backdrop-blur-sm rounded-lg">
                <span>🔥</span>
                <span className="font-bold">{user?.currentStreak}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>

        {/* Footer */}
        <footer className="border-t border-border/50 bg-card/30 backdrop-blur-xl py-4 px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-4 text-muted-foreground order-2 sm:order-1">
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
            </div>
            
            {/* Centered Watermark */}
            <div className="order-1 sm:order-2 flex flex-col items-center">
              <span className="text-lg font-bold" style={{
                background: 'linear-gradient(135deg, hsl(210 100% 56%), hsl(200 90% 55%))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                MoneyMaster
              </span>
              <p className="text-xs text-muted-foreground/60">Making financial literacy fun</p>
            </div>
            
            <div className="flex items-center gap-4 text-muted-foreground order-3">
              <a href="#" className="hover:text-primary transition-colors">Help</a>
              <a href="#" className="hover:text-primary transition-colors">About</a>
            </div>
          </div>
        </footer>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
