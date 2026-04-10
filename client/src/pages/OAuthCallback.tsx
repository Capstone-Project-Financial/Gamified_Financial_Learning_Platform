/** @format */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setToken } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      toast.error("Google sign-in failed. Please try again.");
      setStatus("error");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    if (!token) {
      toast.error("No authentication token received.");
      setStatus("error");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    // Store the token and fetch user profile
    const completeOAuth = async () => {
      try {
        setToken(token);
        await refreshUser();
        toast.success("Signed in with Google successfully!");
        navigate("/dashboard", { replace: true });
      } catch {
        toast.error("Failed to complete sign-in. Please try again.");
        setStatus("error");
        setTimeout(() => navigate("/login"), 2000);
      }
    };

    completeOAuth();
  }, [searchParams, navigate, refreshUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center">
      <div className="text-center space-y-4 animate-scale-in">
        {status === "loading" ? (
          <>
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-lg text-muted-foreground">
              Completing sign-in...
            </p>
          </>
        ) : (
          <>
            <div className="text-5xl">⚠️</div>
            <p className="text-lg text-muted-foreground">
              Sign-in failed. Redirecting to login...
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
