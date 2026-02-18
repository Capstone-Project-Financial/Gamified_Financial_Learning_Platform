/** @format */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft } from "lucide-react";



const Signup = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    grade: "",
  });
  const { signup } = useAuth();
  const navigate = useNavigate();

  const progress = (step / 3) * 100;

  const handleNext = () => {
    if (step === 1) {
      if (
        !formData.name ||
        !formData.email ||
        !formData.password ||
        !formData.confirmPassword
      ) {
        toast.error("Please fill all fields");
        return;
      }
      if (formData.name.length > 50) {
        toast.error("Name must not exceed 50 characters");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      if (formData.password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }
      if (!/[A-Z]/.test(formData.password)) {
        toast.error("Password must contain at least one uppercase letter");
        return;
      }
      if (!/[a-z]/.test(formData.password)) {
        toast.error("Password must contain at least one lowercase letter");
        return;
      }
      if (!/[0-9]/.test(formData.password)) {
        toast.error("Password must contain at least one digit");
        return;
      }
      if (!/[^A-Za-z0-9]/.test(formData.password)) {
        toast.error("Password must contain at least one special character (!@#$%...)");
        return;
      }
    }
    if (step === 2) {
      if (!formData.age || !formData.grade) {
        toast.error("Please fill all fields");
        return;
      }
    }
    if (step === 3) return;
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      await signup(
        {
          name: formData.name,
          email: formData.email,
          age: parseInt(formData.age),
          grade: formData.grade,
        },
        formData.password
      );

      toast.success("Verification code sent to your email");
      navigate("/verify-otp", { state: { email: formData.email, flow: "signup" } });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Signup failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-2xl bg-card rounded-2xl shadow-xl p-8 animate-scale-in">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Join MoneyMaster! 🎉</h1>
            <span className="text-sm text-muted-foreground">Step {step}/3</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="At least 6 characters"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Re-enter password"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold">Tell Us About You</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="10"
                  max="25"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                  placeholder="Your age"
                />
              </div>
              <div>
                <Label htmlFor="grade">Grade/Class</Label>
                <select
                  id="grade"
                  value={formData.grade}
                  onChange={(e) =>
                    setFormData({ ...formData, grade: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select grade</option>
                  <option value="5th">5th Grade</option>
                  <option value="6th">6th Grade</option>
                  <option value="7th">7th Grade</option>
                  <option value="8th">8th Grade</option>
                  <option value="9th">9th Grade</option>
                  <option value="10th">10th Grade</option>
                  <option value="11th">11th Grade</option>
                  <option value="12th">12th Grade</option>
                  <option value="college">College</option>
                </select>
              </div>

            </div>
          </div>
        )}



        {step === 3 && (
          <div className="space-y-6 text-center animate-bounce-in">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold">Welcome, {formData.name}!</h2>
            <div className="p-6 bg-muted rounded-lg">
              <p className="text-4xl mb-4">💡</p>
              <p className="text-lg italic text-muted-foreground">
                "{[
                  "Do not save what is left after spending, but spend what is left after saving. — Warren Buffett",
                  "An investment in knowledge pays the best interest. — Benjamin Franklin",
                  "The habit of saving is itself an education. — T.T. Munger",
                  "A penny saved is a penny earned. — Benjamin Franklin",
                  "Financial freedom is available to those who learn about it and work for it. — Robert Kiyosaki",
                  "It's not how much money you make, but how much money you keep. — Robert Kiyosaki",
                  "The best time to plant a tree was 20 years ago. The second best time is now. — Chinese Proverb",
                  "Money is a terrible master but an excellent servant. — P.T. Barnum",
                  "Rich people have small TVs and big libraries, and poor people have small libraries and big TVs. — Zig Ziglar",
                  "Beware of little expenses; a small leak will sink a great ship. — Benjamin Franklin",
                ][Math.floor(Math.random() * 10)]}
              </p>
            </div>
            <Button
              onClick={handleSubmit}
              size="lg"
              className="w-full bg-primary hover:bg-primary/90"
            >
              Let's Begin! <ArrowRight className="ml-2" />
            </Button>
          </div>
        )}

        {step < 3 && (
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="mr-2" /> Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Next <ArrowRight className="ml-2" />
            </Button>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
