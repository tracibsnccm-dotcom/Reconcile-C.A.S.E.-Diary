// src/lib/access.ts
// Reconcile C.A.R.E. — Centralized Access Control (RBAC)
// Single drop-in file. Import these helpers anywhere you need permission checks.

/** ===== Roles & Features ===== */
export const ROLES = {
  CLIENT: "CLIENT",
  ATTORNEY: "ATTORNEY",
  RN_CM: "RN_CM",                        // RCMS Internal Nurses (more clinical/care management capabilities)
  CLINICAL_STAFF_EXTERNAL: "CLINICAL_STAFF_EXTERNAL",  // External clinical staff (restricted access)
  RCMS_CLINICAL_MGMT: "RCMS_CLINICAL_MGMT",  // RCMS Clinical Supervisors/Managers
  RN_CM_DIRECTOR: "RN_CM_DIRECTOR",      // RN Clinical Directors
  RN_CM_SUPERVISOR: "RN_CM_SUPERVISOR",  // RN Clinical Supervisors
  RN_CM_MANAGER: "RN_CM_MANAGER",        // RN Clinical Managers
  COMPLIANCE: "COMPLIANCE",              // Compliance staff
  STAFF: "STAFF",                        // firm staff (external)
  PROVIDER: "PROVIDER",                  // External providers (upload docs, messages only)
  RCMS_STAFF: "RCMS_STAFF",              // RCMS internal ops (administrative)
  SUPER_USER: "SUPER_USER",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export const FEATURE = {
  VIEW_IDENTITY: "VIEW_IDENTITY",           // Full name, full DOB
  VIEW_BASIC_CONTACT: "VIEW_BASIC_CONTACT", // Address, phone, DOB (no clinical)
  VIEW_CLINICAL: "VIEW_CLINICAL",           // Medical records, care plans, sensitive data
  VIEW_CLINICAL_NOTES: "VIEW_CLINICAL_NOTES", // RN clinical notes
  VIEW_ATTORNEY_NOTES: "VIEW_ATTORNEY_NOTES", // Attorney case notes
  UPLOAD_DOCUMENTS: "UPLOAD_DOCUMENTS",     // Can upload files to cases
  SEND_MESSAGES: "SEND_MESSAGES",           // Can send messages about cases
  EXPORT: "EXPORT",
  ROUTE_PROVIDER: "ROUTE_PROVIDER",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
export type Feature = typeof FEATURE[keyof typeof FEATURE];

/** ===== Minimal models used by access checks ===== */
export interface User {
  id: string;
  name: string;
  email?: string;
  role: Role;
  orgType: "RCMS" | "FIRM";     // who they work for
  orgId: string;                // "rcms" or firm id
  designatedCaseIds?: string[]; // optional per-user allow list
  elevatedAccess?: boolean;     // For CLINICAL_STAFF_EXTERNAL - super admin can grant full PHI access
}

export interface CaseConsent {
  signed: boolean;
  scope: { shareWithAttorney: boolean; shareWithProviders: boolean };
}

export interface RcmsCase {
  id: string;
  firmId: string;               // owner firm
  designatedUserIds?: string[]; // case-level allow list
  consent: CaseConsent;
  // (Other fields exist but are not needed by RBAC.)
}

/** ===== Helpers ===== */
export function isDesignated(user: User | undefined, theCase: RcmsCase | undefined): boolean {
  if (!user || !theCase) return false;
  // Allow designation by user.id OR by case.id on the user (supports both patterns)
  const merged = new Set([
    ...(user.designatedCaseIds || []),
    ...(theCase.designatedUserIds || []),
  ]);
  return merged.has(user.id) || merged.has(theCase.id);
}

export function sameFirm(user: User | undefined, theCase: RcmsCase | undefined): boolean {
  return !!(user && theCase && user.orgType === "FIRM" && user.orgId === theCase.firmId);
}

/** ===== Core Guard =====
 * Enforces HIPAA Minimum Necessary + consent:
 * 
 * FULL PHI ACCESS (All clinical/attorney notes):
 * - ATTORNEY: same firm + consent.shareWithAttorney
 * - RN_CM: RCMS internal nurses, provider consent required
 * - RCMS_CLINICAL_MGMT: RCMS clinical supervisors/managers (full access)
 * - RN_CM_DIRECTOR: RN clinical directors (full access)
 * - COMPLIANCE: Compliance staff (typically RCMS Director/Manager, full access)
 * - CLINICAL_STAFF_EXTERNAL: Minimum necessary by default, BUT super admin can elevate to full
 * 
 * MINIMUM NECESSARY ACCESS (Basic contact only, no clinical/attorney notes):
 * - STAFF: Firm staff - can see address/phone/DOB, upload docs, NO clinical/attorney notes
 * - RCMS_STAFF: RCMS operations - can see address/phone/DOB, upload docs, NO clinical/attorney notes
 * 
 * PROVIDER ACCESS (No PHI, documents and messages only):
 * - PROVIDER: External providers - can ONLY upload documents and send messages, NO access to any client info/PHI
 * 
 * SUPER ADMIN: Full oversight access (audited)
 */
export function canAccess(role: Role, theCase: RcmsCase, feature: Feature, user?: User): boolean {
  const signed = !!theCase?.consent?.signed;
  const shareWithAttorney = !!theCase?.consent?.scope?.shareWithAttorney;
  const shareWithProviders = !!theCase?.consent?.scope?.shareWithProviders;

  // Super oversight (always audited elsewhere)
  if (role === ROLES.SUPER_USER || role === ROLES.SUPER_ADMIN) return true;

  // COMPLIANCE - Full PHI access (typically RCMS Director/Manager)
  if (role === ROLES.COMPLIANCE) {
    if (!signed) return false;
    // Full access to all features
    return true;
  }

  // RCMS_STAFF - Minimum Necessary (basic contact info only)
  if (role === ROLES.RCMS_STAFF) {
    if (!signed || !shareWithProviders) return false;
    if (!user || !isDesignated(user, theCase)) return false;
    
    // Can see basic contact info and upload documents
    if (feature === FEATURE.VIEW_BASIC_CONTACT) return true;
    if (feature === FEATURE.UPLOAD_DOCUMENTS) return true;
    
    // NO access to clinical notes, attorney notes, full identity, export
    const blockedFeatures: Feature[] = [
      FEATURE.VIEW_CLINICAL, FEATURE.VIEW_CLINICAL_NOTES, FEATURE.VIEW_ATTORNEY_NOTES, 
      FEATURE.VIEW_IDENTITY, FEATURE.EXPORT, FEATURE.ROUTE_PROVIDER
    ];
    if (blockedFeatures.includes(feature)) {
      return false;
    }
    
    return false;
  }

  // STAFF (firm) - Minimum Necessary (basic contact info only)
  if (role === ROLES.STAFF) {
    if (!sameFirm(user, theCase) || !isDesignated(user, theCase)) return false;
    if (!signed || !shareWithProviders) return false;
    
    // Can see basic contact info and upload documents
    if (feature === FEATURE.VIEW_BASIC_CONTACT) return true;
    if (feature === FEATURE.UPLOAD_DOCUMENTS) return true;
    
    // NO access to clinical notes, attorney notes, full identity, export
    const blockedFeatures: Feature[] = [
      FEATURE.VIEW_CLINICAL, FEATURE.VIEW_CLINICAL_NOTES, FEATURE.VIEW_ATTORNEY_NOTES,
      FEATURE.VIEW_IDENTITY, FEATURE.EXPORT, FEATURE.ROUTE_PROVIDER
    ];
    if (blockedFeatures.includes(feature)) {
      return false;
    }
    
    return false;
  }

  // PROVIDER - Minimal access (upload documents and send messages ONLY)
  if (role === ROLES.PROVIDER) {
    if (!signed) return false;
    
    // Can ONLY upload documents and send messages
    if (feature === FEATURE.UPLOAD_DOCUMENTS) return true;
    if (feature === FEATURE.SEND_MESSAGES) return true;
    
    // NO access to any other features (no PHI, no contact info, no clinical data)
    return false;
  }

  // ATTORNEY - Full PHI access with consent
  if (role === ROLES.ATTORNEY) {
    if (!sameFirm(user, theCase)) return false;
    if (!signed || !shareWithAttorney) return false;
    if (feature === FEATURE.ROUTE_PROVIDER) return shareWithProviders;
    // Full access to identity, clinical, attorney notes, export
    return true;
  }

  // RN_CM - RCMS Internal Nurses (full clinical capabilities)
  if (role === ROLES.RN_CM) {
    if (!signed) return false;
    if (feature === FEATURE.EXPORT) return false; // No export
    // Full access to clinical and identity, requires provider consent
    const allowedFeatures: Feature[] = [
      FEATURE.VIEW_CLINICAL, FEATURE.VIEW_CLINICAL_NOTES, FEATURE.VIEW_IDENTITY, 
      FEATURE.ROUTE_PROVIDER, FEATURE.UPLOAD_DOCUMENTS
    ];
    if (allowedFeatures.includes(feature)) {
      return shareWithProviders;
    }
    // No access to attorney notes
    if (feature === FEATURE.VIEW_ATTORNEY_NOTES) return false;
    return shareWithProviders;
  }

  // RCMS_CLINICAL_MGMT - RCMS Clinical Management (full access)
  if (role === ROLES.RCMS_CLINICAL_MGMT || role === ROLES.RN_CM_DIRECTOR) {
    if (!signed) return false;
    if (feature === FEATURE.EXPORT) return false; // No export
    // Full access to all clinical and identity features
    return true;
  }

  // CLINICAL_STAFF_EXTERNAL - Minimum Necessary by default, elevatable by super admin
  if (role === ROLES.CLINICAL_STAFF_EXTERNAL) {
    if (!sameFirm(user, theCase) || !isDesignated(user, theCase)) return false;
    if (!signed || !shareWithProviders) return false;
    
    // Check if super admin has granted elevated access
    if (user?.elevatedAccess) {
      // Elevated: Full PHI access (like RN_CM)
      if (feature === FEATURE.EXPORT) return false; // Still no export
      if (feature === FEATURE.VIEW_ATTORNEY_NOTES) return false; // Still no attorney notes
      return true; // Full clinical access
    }
    
    // Default: Minimum Necessary access
    if (feature === FEATURE.VIEW_BASIC_CONTACT) return true;
    if (feature === FEATURE.UPLOAD_DOCUMENTS) return true;
    
    // NO access to full clinical, attorney notes, full identity
    const blockedFeatures: Feature[] = [
      FEATURE.VIEW_CLINICAL, FEATURE.VIEW_CLINICAL_NOTES, FEATURE.VIEW_ATTORNEY_NOTES,
      FEATURE.VIEW_IDENTITY, FEATURE.EXPORT, FEATURE.ROUTE_PROVIDER
    ];
    if (blockedFeatures.includes(feature)) {
      return false;
    }
    
    return false;
  }

  return false;
}

/** ===== Export helper (role + clinical permission) ===== */
export function exportAllowed(role: Role, theCase: RcmsCase, user?: User): boolean {
  const exportRoles: Role[] = [ROLES.ATTORNEY, ROLES.SUPER_USER, ROLES.SUPER_ADMIN];
  if (!exportRoles.includes(role)) return false;
  return canAccess(role, theCase, FEATURE.VIEW_CLINICAL, user);
}

/** ===== Backward compatibility helpers ===== */

/**
 * Check if a user has access to view full identity information
 */
export function hasIdentityAccess(role: Role, theCase?: RcmsCase, user?: User): boolean {
  if (!theCase) return false;
  return canAccess(role, theCase, FEATURE.VIEW_IDENTITY, user);
}

/**
 * Check if a user can see sensitive clinical information
 */
export function canSeeSensitive(theCase: RcmsCase, role: Role, user?: User): boolean {
  return canAccess(role, theCase, FEATURE.VIEW_CLINICAL, user);
}

/**
 * Check if a case is blocked for attorneys or staff due to consent issues
 */
export function isBlockedForAttorney(role: Role, theCase: RcmsCase, user?: User): { blocked: boolean; reason?: string } {
  if (role !== ROLES.ATTORNEY && role !== ROLES.STAFF && role !== ROLES.RCMS_STAFF) return { blocked: false };
  
  const consentSigned = !!theCase.consent?.signed;
  const shareWithAttorney = !!theCase.consent?.scope?.shareWithAttorney;
  const shareWithProviders = !!theCase.consent?.scope?.shareWithProviders;
  
  if (!consentSigned) {
    return { blocked: true, reason: "Client consent is not signed" };
  }
  
  if (role === ROLES.ATTORNEY && !shareWithAttorney) {
    return { blocked: true, reason: "Client consent does not authorize sharing with attorneys" };
  }
  
  if (role === ROLES.RCMS_STAFF) {
    if (!user || !isDesignated(user, theCase)) {
      return { blocked: true, reason: "Not designated for this case" };
    }
    if (!shareWithProviders) {
      return { blocked: true, reason: "Client consent does not authorize provider sharing" };
    }
  }
  
  return { blocked: false };
}

/**
 * Mask a full name for display purposes
 * e.g., "Alice Barnes" -> "A*** B***"
 */
export function maskName(fullName: string): string {
  if (!fullName) return "";
  const parts = fullName.split(/\s+/).filter(p => p.length > 0);
  return parts.map(p => p.length ? (p[0] + "*".repeat(Math.max(0, p.length - 1))) : "").join(" ");
}

/**
 * Get the display name for a client based on the user's access level
 * NOTE: Assumes theCase has a .client property (from full Case type)
 */
export function getDisplayName(role: Role, theCase: any, user?: User): string {
  if (hasIdentityAccess(role, theCase, user)) {
    return theCase.client?.fullName || theCase.client?.displayNameMasked || "Unknown";
  }
  return theCase.client?.displayNameMasked || maskName(theCase.client?.fullName || "") || "Restricted";
}

/**
 * Check if a role can search by name
 */
export function canSearchByName(role: Role): boolean {
  const searchRoles: Role[] = [ROLES.ATTORNEY, ROLES.RN_CM, ROLES.RCMS_CLINICAL_MGMT, ROLES.SUPER_USER, ROLES.SUPER_ADMIN];
  return searchRoles.includes(role);
}
