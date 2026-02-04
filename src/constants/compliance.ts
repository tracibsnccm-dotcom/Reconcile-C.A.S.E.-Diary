export const CLIENT_INTAKE_WINDOW_HOURS = 168;
export const ATTORNEY_CONFIRM_WINDOW_HOURS = 48;

export function formatHMS(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map(v => v.toString().padStart(2, "0")).join(":");
}

export const COMPLIANCE_COPY = {
  attorneyAttestation: {
    title: "ATTORNEY ATTESTATION – REQUIRED",
    bodyLines: [
      "Before accessing any Protected Health Information (PHI), you must confirm that this individual is your client.",
      "Accessing PHI for an individual who is not your client is a HIPAA violation.",
      "If confirmation is not provided within 48 hours, all intake information will be permanently deleted. The client will be required to complete the intake process again.",
      "By proceeding, you attest that you are authorized to access this client's PHI and that a valid attorney–client relationship exists.",
    ],
    primaryCta: "✅ Confirm Client Relationship",
    secondaryCta: "❌ This Is Not My Client",
  },
  deadlineExplainer: "Time remaining before automatic data deletion and intake restart requirement:",
  clientConsent: {
    title: "Client Acknowledgment",
    bodyLines: [
      "By using the C.A.S.E. Diary, you agree to provide accurate information about your health, treatment, and daily functioning.",
      "Your entries are used to generate clinical care plans and progress reports shared with your attorney.",
      "This is not a substitute for medical care. If you are experiencing a medical emergency, call 911.",
      "Your data is protected under HIPAA. Only your care team and attorney have access to your records.",
    ],
  },
  hipaaNotice: "Protected Health Information (PHI) - HIPAA compliant. Unauthorized access is prohibited.",
  hibernationNotice: "No activity has been recorded for 28+ days. Your case is now considered hibernating. To wake the case up, simply enter information into your C.A.S.E. Diary for reactivation. Your case is not closed - it is just sleeping due to inactivity.",
} as const;
