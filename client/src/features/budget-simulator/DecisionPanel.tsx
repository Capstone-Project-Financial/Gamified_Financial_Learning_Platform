/** @format */

import { useBudgetSimulator } from "@/contexts/BudgetSimulatorContext";
import { Sparkles } from "lucide-react";
import { useState, useCallback } from "react";
import EventDecisionCard from "./EventDecisionCard";
import { toast } from "sonner";

export default function DecisionPanel() {
  const { pendingEvents, submitDecision, refresh } = useBudgetSimulator();
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  const totalEvents = pendingEvents.length;

  const handleDecide = useCallback(async (optionId: string) => {
    const event = pendingEvents[currentEventIndex];
    if (!event) return;

    try {
      await submitDecision(event.eventId, optionId);
      toast.success("Decision submitted!");

      const nextIndex = currentEventIndex + 1;
      const newCompleted = completedCount + 1;
      setCompletedCount(newCompleted);

      if (nextIndex >= totalEvents) {
        // All events decided — refresh will transition to REPORT_VIEW
        await refresh();
      } else {
        setCurrentEventIndex(nextIndex);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit decision");
    }
  }, [pendingEvents, currentEventIndex, completedCount, totalEvents, submitDecision, refresh]);

  if (totalEvents === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg">No pending events</p>
        <p className="text-sm">All events have been resolved.</p>
      </div>
    );
  }

  const currentEvent = pendingEvents[currentEventIndex];
  if (!currentEvent) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Financial Events</h1>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {totalEvents} event{totalEvents > 1 ? "s" : ""} require your attention.
          </p>
          {totalEvents > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-blue-400">
                Event {currentEventIndex + 1} of {totalEvents}
              </span>
              <div className="flex gap-1">
                {Array.from({ length: totalEvents }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i < completedCount
                        ? "bg-green-500"
                        : i === currentEventIndex
                          ? "bg-blue-500"
                          : "bg-gray-600"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <EventDecisionCard
        key={currentEvent.eventId}
        event={currentEvent}
        onDecide={handleDecide}
      />
    </div>
  );
}
