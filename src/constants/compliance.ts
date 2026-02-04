export const COMPLIANCE_COPY = {
  attorneyAttestation: {
    title: "Attorney Confirmation of Representation",
    bodyLines: [
      "By confirming, you attest that the individual identified in this intake is your client and that you are authorized to receive clinical care management information on their behalf.",
      "This confirmation activates the client's case and generates their initial care plan based on intake data.",
      "You will receive monthly reports summarizing your client's recovery progress, treatment compliance, and clinical recommendations.",
      "This platform does not provide legal advice. All clinical information is for care coordination purposes only.",
    ],
  },
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

export function formatHMS(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map(v => v.toString().padStart(2, "0")).join(":");
}
