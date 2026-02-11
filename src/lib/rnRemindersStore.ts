/**
 * RN-only local reminder store (localStorage). No DB. Personal reminders only.
 * Key: rc_rn_reminders:<rnUserId>
 * Used by: RNTodaysPriorities, RNUpcomingDeadlines, RNRecentActivityFeed.
 */

export interface RNReminder {
  id: string;
  text: string;
  created_at: string; // ISO
  target_date: string; // YYYY-MM-DD
  status: "open" | "done";
  completed_at: string | null; // ISO
  linked_case_id: string | null;
}

const PREFIX = "rc_rn_reminders:";

function key(u: string): string {
  return `${PREFIX}${u}`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getReminders(rnUserId: string): RNReminder[] {
  if (!rnUserId) return [];
  try {
    const raw = localStorage.getItem(key(rnUserId));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function upsertReminder(rnUserId: string, r: Partial<RNReminder> & { text: string; target_date: string }): RNReminder {
  const list = getReminders(rnUserId);
  const id = r.id || crypto.randomUUID();
  const created_at = r.created_at || new Date().toISOString();
  const existing = list.find((x) => x.id === id);
  const reminder: RNReminder = {
    id,
    text: r.text,
    created_at: existing?.created_at ?? created_at,
    target_date: r.target_date,
    status: r.status ?? "open",
    completed_at: r.completed_at ?? existing?.completed_at ?? null,
    linked_case_id: r.linked_case_id ?? existing?.linked_case_id ?? null,
  };
  const next = list.filter((x) => x.id !== id);
  next.push(reminder);
  localStorage.setItem(key(rnUserId), JSON.stringify(next));
  return reminder;
}

export function markReminderDone(rnUserId: string, reminderId: string): RNReminder | null {
  const list = getReminders(rnUserId);
  const i = list.findIndex((x) => x.id === reminderId);
  if (i < 0) return null;
  const u = { ...list[i], status: "done" as const, completed_at: new Date().toISOString() };
  list[i] = u;
  localStorage.setItem(key(rnUserId), JSON.stringify(list));
  return u;
}

export function deleteReminder(rnUserId: string, reminderId: string): void {
  const list = getReminders(rnUserId).filter((x) => x.id !== reminderId);
  localStorage.setItem(key(rnUserId), JSON.stringify(list));
}

/** For a specific calendar date (YYYY-MM-DD). */
export function getRemindersForDate(rnUserId: string, yyyy_mm_dd: string): RNReminder[] {
  return getReminders(rnUserId).filter((r) => r.target_date === yyyy_mm_dd);
}

/**
 * For Today's Priorities:
 * - Open with target_date <= today (includes carried-forward: target_date < today)
 * - Done with target_date <= today and completed_at on today (keep visible for the day)
 */
export function getRemindersForTodayView(rnUserId: string, today: string = todayStr()): RNReminder[] {
  const all = getReminders(rnUserId);
  return all.filter((r) => {
    if (r.target_date > today) return false;
    if (r.status === "open") return true;
    if (r.status === "done" && r.completed_at) {
      const d = r.completed_at.slice(0, 10);
      return d === today;
    }
    return false;
  });
}

/**
 * For Upcoming Deadlines: target_date > today. Open and done (done shown with strike-through).
 */
export function getRemindersForUpcoming(rnUserId: string, today: string = todayStr()): RNReminder[] {
  return getReminders(rnUserId).filter((r) => r.target_date > today);
}

/**
 * Completed reminders with completed_at in [fromDate, toDate] (YYYY-MM-DD inclusive).
 * For Recent Activity: yesterday + today.
 */
export function getRemindersCompletedInRange(
  rnUserId: string,
  fromDate: string,
  toDate: string
): RNReminder[] {
  const all = getReminders(rnUserId).filter((r) => r.status === "done" && r.completed_at);
  return all.filter((r) => {
    const d = r.completed_at!.slice(0, 10);
    return d >= fromDate && d <= toDate;
  });
}

/**
 * Carry-forward: display logic only. Open reminders with target_date < today
 * are included in Today's view via getRemindersForTodayView.
 * This helper answers "is this item carried forward?" for UI.
 */
export function isCarriedForward(r: RNReminder, today: string = todayStr()): boolean {
  return r.status === "open" && r.target_date < today;
}
