// src/client/WeeklyTasks.tsx
import { useEffect, useMemo, useRef, useState } from "react";

type Task = {
  id: string;
  label: string;
  description: string;
};

const BASE_TASKS: Task[] = [
  {
    id: "attend-pt",
    label: "Attend PT / therapy",
    description: "Make it to your scheduled PT, OT, or therapy sessions.",
  },
  {
    id: "log-pain",
    label: "Log pain at least once",
    description: "Use the pain diary to track how you feel today.",
  },
  {
    id: "take-meds",
    label: "Take medications as prescribed",
    description: "Follow the plan your providers have set for you.",
  },
  {
    id: "movement",
    label: "Gentle movement",
    description: "Complete your light movement or stretching goal for the day.",
  },
];

function getCurrentWeekKey() {
  const now = new Date();
  const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
  const pastDaysOfYear =
    (Number(now) - Number(firstDayOfYear)) / (1000 * 60 * 60 * 24);
  const week = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week}`;
}

export default function WeeklyTasks() {
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const weekKey = useMemo(getCurrentWeekKey, []);

  const positiveSoundRef = useRef<HTMLAudioElement | null>(null);
  const negativeSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    positiveSoundRef.current = new Audio("/sounds/coin-positive.mp3");
    negativeSoundRef.current = new Audio("/sounds/coin-negative.mp3");

    try {
      const stored = window.localStorage.getItem(
        `rcms-weekly-tasks-${weekKey}`
      );
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        if (Array.isArray(parsed)) {
          setCompletedTaskIds(parsed);
        }
      }

      const storedSoundPref = window.localStorage.getItem(
        "rcms-weekly-tasks-sound"
      );
      if (storedSoundPref === "off") {
        setSoundEnabled(false);
      }
    } catch {
      // ignore localStorage errors
    }
  }, [weekKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        `rcms-weekly-tasks-${weekKey}`,
        JSON.stringify(completedTaskIds)
      );
    } catch {
      // ignore localStorage errors
    }
  }, [weekKey, completedTaskIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "rcms-weekly-tasks-sound",
        soundEnabled ? "on" : "off"
      );
    } catch {
      // ignore
    }
  }, [soundEnabled]);

  const coins = completedTaskIds.length;
  const maxCoins = BASE_TASKS.length;

  const handleToggleTask = (taskId: string) => {
    setCompletedTaskIds((prev) => {
      const isCompleted = prev.includes(taskId);
      let next: string[];
      if (isCompleted) {
        next = prev.filter((id) => id !== taskId);
        if (soundEnabled && negativeSoundRef.current) {
          negativeSoundRef.current.currentTime = 0;
          negativeSoundRef.current.play().catch(() => {});
        }
      } else {
        next = [...prev, taskId];
        if (soundEnabled && positiveSoundRef.current) {
          positiveSoundRef.current.currentTime = 0;
          positiveSoundRef.current.play().catch(() => {});
        }
      }
      return next;
    });
  };

  const completionPercent =
    maxCoins === 0 ? 0 : Math.round((coins / maxCoins) * 100);

  return (
    <section className="rounded-xl border p-4 shadow-sm bg-white space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-sm">Weekly Tasks &amp; Recovery Bank</h3>
          <p className="text-xs text-gray-600">
            Each completed task adds a &quot;coin&quot; to your recovery bank. If you
            uncheck a task, you&apos;ll see a coin leave the bank. This isn&apos;t
            punishment — it&apos;s a visual reminder of how your actions support your
            case and your health.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSoundEnabled((v) => !v)}
          className="text-[11px] px-2 py-1 border rounded-lg bg-gray-50 hover:bg-gray-100"
        >
          {soundEnabled ? "🔊 Sound on" : "🔇 Sound off"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-4">
        {/* Task list */}
        <div className="space-y-2 text-sm">
          {BASE_TASKS.map((task) => {
            const checked = completedTaskIds.includes(task.id);
            return (
              <label
                key={task.id}
                className="flex items-start gap-2 rounded-lg border px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={checked}
                  onChange={() => handleToggleTask(task.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{task.label}</span>
                    {checked && (
                      <span className="text-xs text-emerald-700 font-semibold">
                        +1 coin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">{task.description}</p>
                </div>
              </label>
            );
          })}
        </div>

        {/* Piggy bank visual */}
        <div className="flex flex-col items-stretch justify-between">
          <div className="rounded-xl border px-4 py-3 bg-gradient-to-b from-amber-50 to-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-800">
                Recovery Bank
              </span>
              <span className="text-xs text-gray-600">
                {coins} / {maxCoins} coins
              </span>
            </div>

            <div className="flex flex-col items-center py-2">
              <div className="relative w-24 h-20 rounded-full bg-amber-100 border border-amber-300 flex items-end justify-center overflow-hidden">
                <div
                  className="w-full bg-amber-400 transition-all duration-500 ease-out"
                  style={{
                    height: `${(coins / maxCoins) * 100 || 0}%`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-xl">🐷</span>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-gray-600 text-center px-1">
                As you complete tasks, your bank fills. If you uncheck a task,
                you&apos;ll see a coin leave — a reminder that missed actions can
                &quot;cost&quot; you in recovery and in your case.
              </p>
            </div>

            <div className="mt-2 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-gray-600">
              <span>{completionPercent}% of weekly tasks</span>
              {coins === maxCoins && maxCoins > 0 && (
                <span className="text-emerald-700 font-semibold">
                  Great job this week!
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden audio references (actual files go in /public/sounds) */}
      <div className="hidden" aria-hidden="true">
        {/* These tags are optional; we primarily use Audio() in JS, but you can
            also rely on <audio> elements if you later prefer ref-based control. */}
        <audio src="/sounds/coin-positive.mp3" />
        <audio src="/sounds/coin-negative.mp3" />
      </div>
    </section>
  );
}
  
