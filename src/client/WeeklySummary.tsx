// src/client/WeeklySummary.tsx
import { useEffect, useMemo, useState } from "react";

function getCurrentWeekKey() {
  const now = new Date();
  const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
  const pastDaysOfYear =
    (Number(now) - Number(firstDayOfYear)) / (1000 * 60 * 60 * 24);
  const week = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week}`;
}

// Keep this in sync with BASE_TASKS in WeeklyTasks.tsx
const TOTAL_TASKS_THIS_WEEK = 4;

export default function WeeklySummary() {
  const [completedCount, setCompletedCount] = useState(0);
  const weekKey = useMemo(getCurrentWeekKey, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem(
        `rcms-weekly-tasks-${weekKey}`
      );
      if (!stored) {
        setCompletedCount(0);
        return;
      }

      const parsed = JSON.parse(stored) as unknown;
      if (Array.isArray(parsed)) {
        setCompletedCount(parsed.length);
      } else {
        setCompletedCount(0);
      }
    } catch {
      setCompletedCount(0);
    }
  }, [weekKey]);

  const percent =
    TOTAL_TASKS_THIS_WEEK === 0
      ? 0
      : Math.round((completedCount / TOTAL_TASKS_THIS_WEEK) * 100);

  let statusMessage: string;
  if (percent === 0) {
    statusMessage =
      "This week is a fresh start. Even one completed task moves your recovery forward.";
  } else if (percent < 50) {
    statusMessage =
      "You’ve started your recovery work. Let’s build on this and aim for a few more actions next week.";
  } else if (percent < 100) {
    statusMessage =
      "You’re doing a solid job following through. Each task you complete strengthens your health and your case.";
  } else {
    statusMessage =
      "You completed all of your recovery tasks this week. That’s a strong signal to your providers and your attorney.";
  }

  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-sm">Weekly Recovery Summary</h3>
          <p className="text-xs text-gray-600">
            This is a quick snapshot of how consistently you followed your
            recovery tasks for the current week.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold text-gray-800">
            {completedCount} / {TOTAL_TASKS_THIS_WEEK} tasks
          </div>
          <div className="text-[11px] text-gray-500">Current week</div>
        </div>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="text-[11px] text-gray-700">{statusMessage}</p>

      <p className="text-[11px] text-gray-500">
        Your RN Care Manager and attorney will use patterns over time (not one
        bad day) to understand how recovery actions, symptoms, and outcomes line
        up.
      </p>
    </section>
  );
}
