// src/client/PiggyBankWidget.tsx
import { useEffect, useState } from "react";

type ChangeType = "positive" | "negative" | null;

interface PiggyBankWidgetProps {
  completedCount: number;
  missedCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  lastChange: ChangeType;
}

export default function PiggyBankWidget({
  completedCount,
  missedCount,
  soundEnabled,
  onToggleSound,
  lastChange,
}: PiggyBankWidgetProps) {
  const [bumpClass, setBumpClass] = useState("");

  const netCoins = completedCount - missedCount;
  const fillPercent = Math.max(0, Math.min(100, completedCount * 10)); // simple fill logic

  useEffect(() => {
    if (!lastChange) return;

    // Trigger a small animation bump
    const cls =
      lastChange === "positive" ? "animate-[ping_0.4s_ease-out]" : "animate-[bounce_0.4s]";
    setBumpClass(cls);

    // Optional: play sound (requires you to add audio files under public/sounds)
    if (soundEnabled) {
      const audio =
        lastChange === "positive"
          ? new Audio("/sounds/coin-positive.mp3")
          : new Audio("/sounds/coin-negative.mp3");

      audio.play().catch(() => {
        // ignore errors if file not found or autoplay blocked
      });
    }

    const timeout = setTimeout(() => setBumpClass(""), 400);
    return () => clearTimeout(timeout);
  }, [lastChange, soundEnabled]);

  return (
    <div className="rounded-xl border p-4 shadow-sm bg-white h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Recovery Journey</h3>
        <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={onToggleSound}
            className="mr-1"
          />
          Sound
        </label>
      </div>

      <p className="text-xs text-gray-600">
        Each completed task adds to your “case value.” Missed tasks pull value away. Your
        attorney and RN see this as evidence of engagement.
      </p>

      <div className="flex-1 flex items-center justify-center">
        <div className="relative h-40 w-40 rounded-full bg-gradient-to-b from-yellow-50 to-yellow-200 border-4 border-yellow-400 shadow-lg flex items-center justify-center overflow-hidden">
          {/* Fill */}
          <div
            className={`absolute bottom-0 left-0 w-full bg-yellow-500 transition-all duration-500 ${bumpClass}`}
            style={{ height: `${fillPercent}%` }}
          />

          {/* Piggy bank outline / label */}
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-xs text-gray-700 mb-1">Case Value</span>
            <span className="text-2xl font-bold text-gray-800">{netCoins}</span>
            <span className="text-[10px] text-gray-500">
              {completedCount} completed · {missedCount} missed
            </span>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-gray-500">
        This visual is not to punish you — it&apos;s a quick snapshot of how your actions support
        your recovery and your case strength over time.
      </p>
    </div>
  );
}
