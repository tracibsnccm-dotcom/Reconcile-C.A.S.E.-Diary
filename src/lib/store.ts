// Local storage utilities for demo purposes

export const store = {
  get<T>(key: string, fallback: T): T {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Failed to remove from localStorage:", error);
    }
  },
};

export function nextQuarterReset(today = new Date()): Date {
  const quarterResets = ["01-01", "04-01", "07-01", "10-01"];
  const y = today.getFullYear();
  const candidates = quarterResets.map((mmdd) => new Date(`${y}-${mmdd}T00:00:00`));
  const future = candidates.find((d) => d > today);
  if (future) return future;
  return new Date(`${y + 1}-${quarterResets[0]}T00:00:00`);
}

export function fmtDate(dtLike: string | Date): string {
  if (typeof dtLike === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dtLike)) {
    // Date-only string: parse as local date to avoid timezone shift
    const [year, month, day] = dtLike.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString();
  }
  const d = new Date(dtLike);
  return d.toLocaleDateString();
}
