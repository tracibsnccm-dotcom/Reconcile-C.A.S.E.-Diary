// Trial period management utilities

export const TRIAL_DAYS = 30;

interface TrialUser {
  trialStartDate?: string;
  trialEndDate?: string;
}

/**
 * Coerce trialStartDate from available data.
 * Backward-compatible: if only trialEndDate exists, derive start = end - TRIAL_DAYS
 */
export function coerceTrialStartDate(user: TrialUser): string | undefined {
  // Prefer trialStartDate if available
  if (user?.trialStartDate) return user.trialStartDate;
  
  // Back-compat: derive from trialEndDate
  if (user?.trialEndDate) {
    const end = new Date(user.trialEndDate);
    const start = new Date(end);
    start.setDate(start.getDate() - TRIAL_DAYS);
    return start.toISOString();
  }
  
  return undefined;
}

/**
 * Calculate days remaining in trial period.
 * Returns 0 if no trial or expired.
 */
export function trialDaysRemaining(user: TrialUser): number {
  const startISO = coerceTrialStartDate(user);
  if (!startISO) return 0;
  
  const start = new Date(startISO);
  const end = new Date(start);
  end.setDate(end.getDate() + TRIAL_DAYS);
  
  const today = new Date();
  const msRemaining = end.getTime() - today.getTime();
  
  return Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
}

/**
 * Check if trial is currently active.
 */
export function isTrialActive(user: TrialUser): boolean {
  return trialDaysRemaining(user) > 0;
}

/**
 * Get trial end date (computed from start + TRIAL_DAYS)
 */
export function getTrialEndDate(user: TrialUser): Date | undefined {
  const startISO = coerceTrialStartDate(user);
  if (!startISO) return undefined;
  
  const start = new Date(startISO);
  const end = new Date(start);
  end.setDate(end.getDate() + TRIAL_DAYS);
  
  return end;
}
