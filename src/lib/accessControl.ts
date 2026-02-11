// Access control helpers for privacy-by-design with consent gating
import { Case, Role, RCMS_CONFIG, ROLES } from "@/config/rcms";

export const FEATURE = {
  VIEW_IDENTITY: "VIEW_IDENTITY",
  VIEW_CLINICAL: "VIEW_CLINICAL",
  EXPORT: "EXPORT",
  ROUTE_PROVIDER: "ROUTE_PROVIDER",
  VIEW_CASE: "VIEW_CASE",
} as const;

export type Feature = typeof FEATURE[keyof typeof FEATURE];

/**
 * Consent-aware access control
 * Blocks attorney/provider access until consent is properly signed and scoped
 * @param role - User's role
 * @param theCase - The case being accessed
 * @param feature - The feature being accessed
 * @param userId - Current user's ID
 */
export function canAccess(
  role: Role,
  theCase: Case,
  feature: Feature,
  userId: string = "user-001"
): boolean {
  // Super roles always allowed (for oversight/incident response - audited in production)
  const superRoles: Role[] = [ROLES.SUPER_USER, ROLES.SUPER_ADMIN];
  if (superRoles.includes(role)) {
    return true;
  }

  const signed = !!theCase?.consent?.signed;
  const shareWithAttorney = !!theCase?.consent?.scope?.shareWithAttorney;
  const shareWithProviders = !!theCase?.consent?.scope?.shareWithProviders;

  // Client can see their own info in client view, but dashboard is attorney side
  if (role === ROLES.CLIENT) return false;

  // ATTORNEY gating - consent required
  if (role === ROLES.ATTORNEY) {
    if (!signed) return false; // Hard block until signed
    if (!shareWithAttorney) return false; // Signed, but scope forbids attorney
    // All features require consent for attorneys
    return true;
  }

  // RN_CM (care manager) - needs signed + provider sharing
  if (role === ROLES.RN_CM) {
    if (!signed) return false;
    if (feature === FEATURE.ROUTE_PROVIDER || feature === FEATURE.VIEW_CLINICAL) {
      return shareWithProviders;
    }
    if (feature === FEATURE.VIEW_IDENTITY) {
      return shareWithProviders;
    }
    if (feature === FEATURE.EXPORT) {
      return false; // Not allowed to export
    }
    return shareWithProviders;
  }

  // STAFF - minimal access, no identity, no export
  if (role === ROLES.STAFF) {
    if (!signed) return false;
    if (feature === FEATURE.VIEW_IDENTITY) return false;
    if (feature === FEATURE.EXPORT) return false;
    return shareWithProviders; // Scheduling tasks only if allowed
  }

  return false;
}

/**
 * Determines if a user has access to view full identity information (names, full DOB)
 * This is a wrapper around canAccess for backward compatibility
 */
export function hasIdentityAccess(
  role: Role,
  theCase?: Case,
  userId: string = "user-001"
): boolean {
  if (!theCase) return false;
  return canAccess(role, theCase, FEATURE.VIEW_IDENTITY, userId);
}

/**
 * Checks if user can view sensitive/clinical information
 * Now respects consent in addition to restrictedAccess flag
 */
export function canSeeSensitive(
  theCase: Case,
  role: Role,
  userId: string = "user-001"
): boolean {
  // First check consent-based access
  if (!canAccess(role, theCase, FEATURE.VIEW_CLINICAL, userId)) {
    return false;
  }

  // Then check restrictedAccess flag
  if (!theCase?.consent?.restrictedAccess) return true;
  
  // Sensitive access roles
  if ((RCMS_CONFIG.sensitiveAccessRoles as readonly Role[]).includes(role)) {
    return true;
  }

  // Designated attorney
  if (theCase.designatedAttorneyId === userId) {
    return true;
  }

  return false;
}

/**
 * Checks if export is allowed for this role and case
 */
export function exportAllowed(
  role: Role,
  theCase: Case,
  userId: string = "user-001"
): boolean {
  const exportRoles: Role[] = [ROLES.ATTORNEY, ROLES.SUPER_USER, ROLES.SUPER_ADMIN];
  if (!exportRoles.includes(role)) return false;
  
  // Require both clinical access and consent authorization
  return canAccess(role, theCase, FEATURE.EXPORT, userId) && 
         canAccess(role, theCase, FEATURE.VIEW_CLINICAL, userId);
}

/**
 * Checks if case is blocked for attorney or staff due to consent issues
 */
export function isBlockedForAttorney(
  role: Role,
  theCase: Case
): { blocked: boolean; reason?: string } {
  // Only check for attorney and staff roles
  if (role !== ROLES.ATTORNEY && role !== ROLES.STAFF) {
    return { blocked: false };
  }
  
  const signed = !!theCase?.consent?.signed;
  const shareWithAttorney = !!theCase?.consent?.scope?.shareWithAttorney;
  const shareWithProviders = !!theCase?.consent?.scope?.shareWithProviders;
  
  if (!signed) {
    return { 
      blocked: true, 
      reason: "Client consent is not signed" 
    };
  }
  
  if (role === ROLES.ATTORNEY && !shareWithAttorney) {
    return { 
      blocked: true, 
      reason: "Consent signed but does not authorize sharing with attorneys" 
    };
  }
  
  if (role === ROLES.STAFF && !shareWithProviders) {
    return {
      blocked: true,
      reason: "Consent signed but does not authorize provider/staff access"
    };
  }
  
  return { blocked: false };
}

/**
 * Masks a full name for display (e.g., "Alice Barnes" → "A*** B***")
 */
export function maskName(fullName: string): string {
  if (!fullName) return "—";
  const parts = fullName.trim().split(/\s+/);
  return parts
    .map((part) => (part.length > 0 ? `${part[0]}${"*".repeat(3)}` : ""))
    .join(" ");
}

/**
 * Gets the display name based on user's access level
 */
export function getDisplayName(
  role: Role,
  theCase: Case,
  userId?: string
): string {
  if (hasIdentityAccess(role, theCase, userId)) {
    return theCase.client.fullName || theCase.client.displayNameMasked || "—";
  }
  return theCase.client.displayNameMasked || "Restricted";
}
