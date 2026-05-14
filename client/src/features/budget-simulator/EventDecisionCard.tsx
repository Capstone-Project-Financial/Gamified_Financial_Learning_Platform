/** @format */

import { useState } from "react";
import { DecisionOption } from "@/contexts/BudgetSimulatorContext";
import { Sparkles } from "lucide-react";

interface EventDecisionCardProps {
  event: {
    eventId: string;
    title: string;
    description: string;
    category: "positive" | "negative" | "neutral";
    financialImpact: number;
    conceptCard?: { title: string; body: string };
    availableOptions?: DecisionOption[];
  };
  onDecide: (optionId: string) => Promise<void>;
}

export default function EventDecisionCard({ event, onDecide }: EventDecisionCardProps) {
  const [chosen, setChosen] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const options = event.availableOptions || [];
  const isAIGenerated = event.eventId.startsWith("ai-gen");

  const handleChoice = (index: number) => {
    if (revealed || confirming) return;
    setChosen(index);
    setRevealed(true);
  };

  const handleConfirm = async () => {
    if (chosen === null || confirming) return;
    const opt = options[chosen];
    if (!opt) return;
    setConfirming(true);
    try {
      await onDecide(opt.optionId);
    } finally {
      setConfirming(false);
    }
  };

  const chosenOpt = chosen !== null ? options[chosen] : null;

  const tagColors: Record<string, { bg: string; text: string; border: string; lightText: string }> = {
    smart: { bg: "bg-green-950/30", text: "text-green-400", border: "border-green-700/40", lightText: "text-green-200" },
    risky: { bg: "bg-red-950/30", text: "text-red-400", border: "border-red-700/40", lightText: "text-red-200" },
    avoidant: { bg: "bg-yellow-950/30", text: "text-yellow-400", border: "border-yellow-700/40", lightText: "text-yellow-200" },
    neutral: { bg: "bg-blue-950/30", text: "text-blue-400", border: "border-blue-700/40", lightText: "text-blue-200" },
  };

  const chosenColors = chosenOpt ? tagColors[chosenOpt.behaviorTag] || tagColors.neutral : tagColors.neutral;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 mb-4">

      {/* Concept card — shown before decision */}
      {event.conceptCard && !revealed && (
        <div className="mb-4 p-3 bg-amber-950/30 border border-amber-700/40 rounded-xl animate-in fade-in duration-300">
          <p className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-1">
            Before you decide — {event.conceptCard.title}
          </p>
          <p className="text-sm text-amber-200 leading-relaxed">{event.conceptCard.body}</p>
        </div>
      )}

      {/* Event header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
        <h3 className="text-base font-medium text-white">{event.title}</h3>
        <div className="flex flex-wrap items-center gap-2">
          {isAIGenerated && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-900/50 border border-indigo-700/50 text-[10px] font-medium text-indigo-300">
              <Sparkles className="h-3 w-3" />
              AI Generated
            </span>
          )}
          <span className="text-sm text-gray-400">
            Impact: ₹{Math.abs(event.financialImpact).toLocaleString("en-IN")}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-300 mb-4">{event.description}</p>

      {/* Options — NO XP/tags shown before choice */}
      <div className="flex flex-col gap-2">
        {options.map((option, index) => (
          <button
            key={option.optionId}
            onClick={() => handleChoice(index)}
            disabled={revealed || option.disabled}
            className={`
              w-full text-left p-3 rounded-xl border transition-all duration-200
              ${option.disabled
                ? "opacity-40 cursor-not-allowed border-gray-800 bg-gray-900/50"
                : revealed && chosen === index
                  ? "border-blue-500 bg-blue-950/30"
                  : revealed && chosen !== index
                    ? "border-gray-800 bg-gray-900/50 opacity-40"
                    : "border-gray-700 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800 cursor-pointer"
              }
            `}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{option.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{option.description}</p>
                {option.disabled && (
                  <p className="text-xs text-red-400 mt-1">Insufficient funds for this option</p>
                )}
              </div>
              {/* Show XP + tag ONLY after reveal for chosen option */}
              {revealed && chosen === index && (
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <span className="text-xs font-medium text-blue-400">
                    {option.xpModifier > 0 ? "+" : ""}{option.xpModifier} XP
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    option.behaviorTag === "smart" ? "bg-green-900/50 text-green-400" :
                    option.behaviorTag === "risky" ? "bg-red-900/50 text-red-400" :
                    option.behaviorTag === "avoidant" ? "bg-yellow-900/50 text-yellow-400" :
                    "bg-gray-700 text-gray-400"
                  }`}>
                    {option.behaviorTag}
                  </span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Explanation — shown after choice */}
      {revealed && chosenOpt && (
        <div className={`mt-4 p-3 rounded-xl border ${chosenColors.bg} ${chosenColors.border} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
          <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${chosenColors.text}`}>
            What this means
          </p>
          <p className={`text-sm leading-relaxed ${chosenColors.lightText}`}>
            {chosenOpt.explanation}
          </p>

          {chosenOpt.counterfactual && (
            <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-700">
              {chosenOpt.counterfactual}
            </p>
          )}

          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="mt-3 w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            {confirming ? "Submitting..." : "Confirm & Continue"}
          </button>
        </div>
      )}
    </div>
  );
}
