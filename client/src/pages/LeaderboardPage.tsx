/** @format */

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import api from "@/services/api";

interface LeaderboardEntry {
  rank: number;
  name: string;
  level: number;
  xp: number;
  school?: string;
  streak: number;
  profit: number;
}

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userStanding, setUserStanding] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leaderboardData, standingData] = await Promise.all([
          api.get<LeaderboardEntry[]>("/leaderboard?limit=20"),
          api.get<LeaderboardEntry>("/leaderboard/me").catch(() => null),
        ]);
        setLeaderboard(leaderboardData);
        setUserStanding(standingData);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold mb-2">Leaderboard 🏆</h1>
            <p className="text-muted-foreground">
              Compete with students worldwide
            </p>
          </div>

          <Card className="p-12 text-center">
            <Trophy className="h-24 w-24 mx-auto mb-6 text-muted-foreground/50" />
            <h3 className="text-2xl font-bold mb-2">No Rankings Yet</h3>
            <p className="text-muted-foreground mb-6">
              Be the first to start learning and climb the leaderboard!
            </p>
            <p className="text-sm text-muted-foreground">
              Complete lessons, quizzes, and trade stocks to earn XP and rank up.
            </p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold mb-2">Leaderboard 🏆</h1>
          <p className="text-muted-foreground">
            Compete with students worldwide
          </p>
        </div>

        {/* Your Stats */}
        {userStanding && (
          <Card className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <h3 className="text-lg font-semibold mb-4">Your Ranking</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Your Rank</p>
                <p className="text-2xl font-bold">#{userStanding.rank}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">XP</p>
                <p className="text-2xl font-bold">{userStanding.xp}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold">🔥 {userStanding.streak}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stock Profit</p>
                <p className="text-2xl font-bold text-profit">
                  {userStanding.profit >= 0 ? "+" : ""}₹{userStanding.profit}
                </p>
              </div>
            </div>
            {userStanding.rank <= leaderboard.length * 0.1 && (
              <p className="text-sm text-muted-foreground mt-4">
                You're in the top 10% of learners! Keep it up! 💪
              </p>
            )}
          </Card>
        )}

        {/* Top 3 Podium */}
        {top3.length >= 3 && (
          <div className="grid md:grid-cols-3 gap-4">
            {[top3[1], top3[0], top3[2]].map((entry, i) => {
              const heights = ["h-48", "h-56", "h-40"];
              const medals = ["🥈", "🥇", "🥉"];

              if (!entry) return null;

              return (
                <Card
                  key={entry.rank}
                  className={`p-6 ${heights[i]} flex flex-col justify-end hover-lift animate-slide-up`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="text-center">
                    <div className="text-5xl mb-2">{medals[i]}</div>
                    <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                      {entry.name.charAt(0)}
                    </div>
                    <h3 className="font-bold text-lg mb-1">{entry.name}</h3>
                    {entry.school && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {entry.school}
                      </p>
                    )}
                    <div className="flex justify-center gap-4 text-sm">
                      <span className="font-semibold">L{entry.level}</span>
                      <span>{entry.xp} XP</span>
                      <span>🔥 {entry.streak}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Rest of Leaderboard */}
        {rest.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top Learners</h3>
            <div className="space-y-2">
              {rest.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                    userStanding && entry.rank === userStanding.rank
                      ? "bg-primary/10 border-2 border-primary/20"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="w-8 text-center font-bold text-muted-foreground">
                    #{entry.rank}
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-secondary flex items-center justify-center text-white text-lg font-bold">
                    {entry.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">
                      {entry.name}
                      {userStanding && entry.rank === userStanding.rank && " (YOU)"}
                    </p>
                    {entry.school && (
                      <p className="text-sm text-muted-foreground">{entry.school}</p>
                    )}
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">Level </span>
                      <span className="font-bold">{entry.level}</span>
                    </div>
                    <div>
                      <span className="font-bold">{entry.xp}</span>
                      <span className="text-muted-foreground"> XP</span>
                    </div>
                    <div>
                      <span>🔥</span>
                      <span className="font-bold ml-1">{entry.streak}</span>
                    </div>
                    <div className={entry.profit >= 0 ? "text-profit font-bold" : "text-destructive font-bold"}>
                      {entry.profit >= 0 ? "+" : ""}₹{entry.profit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Leaderboard;
