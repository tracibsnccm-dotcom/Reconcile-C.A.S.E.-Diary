// src/lib/rcms-core.ts
// Unified RCMS core module - single import for all access control, trial, and helper functions

// Re-export everything from access control
export {
  ROLES,
  FEATURE,
  type Role,
  type Feature,
  type User,
  type CaseConsent,
  type RcmsCase,
  canAccess,
  exportAllowed,
  hasIdentityAccess,
  canSeeSensitive,
  isBlockedForAttorney,
  isDesignated,
  sameFirm,
  maskName,
  getDisplayName,
  canSearchByName,
} from "./access";

// Re-export everything from trial utilities
export {
  TRIAL_DAYS,
  coerceTrialStartDate,
  trialDaysRemaining,
  isTrialActive,
  getTrialEndDate,
} from "../utils/trial";

// Convenience aliases for common patterns
import { getDisplayName, canSearchByName } from "./access";
import type { Role, RcmsCase, User } from "./access";

/**
 * Alias for getDisplayName - returns safe display name based on user permissions
 */
export function safeDisplayName(user: User, theCase: any): string {
  return getDisplayName(user.role, theCase, user);
}

/**
 * Alias for canSearchByName - check if role can search by client name
 */
export function canSearchNames(role: Role): boolean {
  return canSearchByName(role);
}

/**
 * Designate a user for a specific case (adds user to case's designated list)
 * This is a helper for managing case-level access lists
 */
export function designateUserOnCase(
  theCase: RcmsCase,
  userId: string
): RcmsCase {
  const currentDesignated = theCase.designatedUserIds || [];
  if (currentDesignated.includes(userId)) {
    return theCase; // already designated
  }
  
  return {
    ...theCase,
    designatedUserIds: [...currentDesignated, userId],
  };
}
