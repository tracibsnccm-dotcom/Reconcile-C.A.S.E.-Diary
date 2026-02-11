/**
 * RCMS Compliance Constants
 * 
 * Single source of truth for:
 * - Time windows (client intake, attorney confirmation)
 * - Reminder thresholds
 * - HIPAA attestation and deletion/restart language
 * - Compliance messaging for Client + Attorney
 */

// Time Windows (in hours)
export const CLIENT_INTAKE_WINDOW_HOURS = 168; // 7 days
export const ATTORNEY_CONFIRM_WINDOW_HOURS = 48;

// Reminder thresholds for attorney confirmation window (in hours remaining)
export const ATTORNEY_REMINDER_THRESHOLDS_HOURS = [24, 8, 4, 1];

/**
 * Format milliseconds to HH:MM:SS string
 * - Zero-padded, floored (never negative)
 * - Returns "00:00:00" if negative input
 * 
 * @param ms - Milliseconds to format
 * @returns Formatted string "HH:MM:SS"
 */
export function formatHMS(ms: number): string {
  if (ms < 0) {
    return "00:00:00";
  }
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Compliance Copy
 * 
 * Centralized messaging for HIPAA attestation, deadlines, and data deletion warnings.
 * All strings are exact and must be used verbatim throughout the application.
 */
export const COMPLIANCE_COPY = {
  /**
   * Attorney Attestation - Initial Screen
   * FINAL copy for attorney attestation screen
   */
  attorneyAttestation: {
    title: "ATTORNEY ATTESTATION – REQUIRED",
    bodyLines: [
      "Before accessing any Protected Health Information (PHI), you must confirm that this individual is your client.",
      "Accessing Protected Health Information (PHI) for an individual who is not your client is a HIPAA violation and a reportable privacy breach.",
      "**If confirmation is not provided within 48 hours, all intake information will be permanently deleted and cannot be retrieved. The client will be required to complete the intake process again.**",
      "By proceeding, you attest that you are authorized to access this client's Protected Health Information (PHI) and that a valid attorney–client relationship exists.",
    ],
    primaryCta: "✅ Confirm Client Relationship",
    secondaryCta: "❌ This Is Not My Client",
  },

  /**
   * Attorney Follow-up Notices
   * Used for 24/8/4/1 hour notices; may appear in banners/cards/emails
   */
  attorneyFollowup: {
    title: "ACTION REQUIRED – CLIENT CONFIRMATION PENDING",
    bodyLines: [
      "A client has completed an intake and identified you as their attorney.",
      "Before any Protected Health Information (PHI) can be released, you must confirm that this individual is your client.",
      "If confirmation is not received within 48 hours, all intake information will be permanently deleted, cannot be retrieved, and the client will be required to complete the intake process again.",
    ],
  },

  /**
   * Attorney View After Expiration
   * Message displayed when intake has expired
   */
  attorneyExpired: {
    title: "INTAKE EXPIRED – DATA PERMANENTLY DELETED",
    bodyLines: [
      "The intake information associated with this individual has expired and has been permanently deleted in accordance with HIPAA data-minimization requirements.",
      "Deleted information cannot be retrieved. The client must complete the intake process again to proceed.",
    ],
  },

  /**
   * Deadline Explainer
   * Copy explaining the time remaining before expiration
   */
  deadlineExplainer:
    "Time remaining before automatic data deletion and intake restart requirement:",

  /**
   * Client Pending Attorney Copy
   * Message shown to client when attorney has not yet confirmed
   * Clarifies that RCMS is not at fault and explains restart requirement
   */
  clientPendingAttorneyCopy:
    "Your attorney has not yet completed their review of this case. While waiting for attorney review, your intake data is protected. However, if your attorney does not complete their review within 48 hours, all intake data will be permanently deleted and you will need to restart the intake process. RCMS is not responsible for delays caused by attorney non-response.",

  /**
   * Client expired copy (48h attorney confirmation window passed)
   * Shown in ClientPendingAttorneyConfirmation when the link/access has expired.
   * Premium, non-punitive, legally neutral; clear next step (contact attorney's office).
   */
  expiredCopy:
    "For your privacy, intake links expire after a limited time. Please contact your attorney's office for a new link.",
} as const;

/**
 * Client Document Texts
 * Required documents for client electronic signature
 */
export const CLIENT_DOCUMENTS = {
  clientConsentTitle: "Consent & Privacy",
  clientEsignDisclosureText: "By typing your name below, you are signing electronically. This is the legal equivalent of your handwritten signature.",
  clientPrivacyPolicyText: `PRIVACY POLICY

Reconcile C.A.R.E. (RCMS) is committed to protecting your privacy and personal health information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services.

1. Information We Collect
We collect information that you provide directly to us, including:
- Personal identification information (name, date of birth, contact information)
- Health and medical information
- Insurance information
- Attorney and case information
- Information provided through client check-ins and assessments

2. How We Use Your Information
We use your information to:
- Provide care coordination services
- Communicate with you, your care team, and authorized parties
- Track your health progress and outcomes
- Comply with legal and regulatory requirements
- Improve our services

3. Information Sharing
We may share your information with:
- Authorized members of your care team (RN Care Managers, providers, attorneys)
- Service providers who assist in delivering our services
- As required by law or in response to legal process

4. Data Security
We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

5. Your Rights
You have the right to:
- Access your personal health information
- Request corrections to your information
- Request restrictions on how we use or disclose your information
- File a complaint if you believe your privacy rights have been violated

6. HIPAA Compliance
RCMS complies with the Health Insurance Portability and Accountability Act (HIPAA) and its privacy and security rules.`,

  clientHipaaNoticeText: `NOTICE OF PRIVACY PRACTICES

THIS NOTICE DESCRIBES HOW MEDICAL INFORMATION ABOUT YOU MAY BE USED AND DISCLOSED AND HOW YOU CAN GET ACCESS TO THIS INFORMATION. PLEASE REVIEW IT CAREFULLY.

1. Uses and Disclosures of Health Information
We may use and disclose your protected health information (PHI) for:
- Treatment: To coordinate your care and communicate with your healthcare providers
- Payment: To process claims and obtain payment for services
- Health Care Operations: To improve our services and conduct quality assessments
- As required by law: Including reporting requirements and responding to legal process

2. Your Health Information Rights
You have the right to:
- Receive a copy of this notice
- Request restrictions on certain uses and disclosures
- Request confidential communications
- Inspect and copy your health information
- Request amendment of your health information
- Receive an accounting of disclosures
- File a complaint if you believe your privacy rights have been violated

3. Our Responsibilities
We are required to:
- Maintain the privacy of your PHI
- Provide you with this notice of our legal duties and privacy practices
- Abide by the terms of this notice
- Notify you if there is a breach of your unsecured PHI

4. Complaints
You may file a complaint with:
- RCMS Privacy Officer
- U.S. Department of Health and Human Services Office for Civil Rights

We will not retaliate against you for filing a complaint.`,

  clientConsentToCareText: `CONSENT TO CARE COORDINATION

By signing this consent, you authorize Reconcile C.A.R.E. (RCMS) to coordinate your care and share information with members of your authorized care team.

1. Authorization to Coordinate Care
I authorize RCMS and its RN Care Managers to:
- Coordinate my medical care and treatment
- Communicate with my healthcare providers, attorneys, and authorized representatives
- Access and share my health information as necessary for care coordination
- Schedule appointments and facilitate care delivery

2. Information Sharing
I understand that RCMS may share my health information with:
- My designated attorney and law firm
- My healthcare providers
- Insurance companies as needed for treatment and payment
- Other parties as authorized by me or required by law

3. Right to Revoke
I understand that I may revoke this consent at any time by providing written notice to RCMS. However, revocation will not affect actions already taken in reliance on this consent.

4. Duration
This consent will remain in effect until:
- I revoke it in writing
- The case is closed
- The relationship with RCMS is terminated

5. Understanding
I have read and understand this consent. I acknowledge that I have had the opportunity to ask questions and have received satisfactory answers.`,

} as const;