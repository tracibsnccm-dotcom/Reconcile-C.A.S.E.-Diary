/* -------------------------------
   FILE: src/lib/templates.ts
   (Provider messages + PDFs + SMS text)
   ------------------------------- */
export const Templates = {
  sms: {
    apptReminder: (name:string, provider:string, when:string) =>
      `Hi ${name}, reminder: ${provider} ${when}. Please log your pain tonight in RCMS C.A.R.E.`,
    diaryNudge: (name:string) =>
      `Hi ${name}, please record today's pain level in RCMS C.A.R.E. It helps your case.`,
  },
  providerUpdate: (providerName:string, clientToken:string) => ({
    subject: `Update requested for RCMS Case ${clientToken}`,
    body:
`Dear Dr. ${providerName},

Could you please provide a brief update on our mutual client (Case ${clientToken}) and next treatment steps?

Sincerely,
Reconcile C.A.R.E. Clinical Team`
  }),
  clinicalRecommendation: (providerName:string, firmName:string, clientLabel:string) => ({
    subject: `Formal Clinical Recommendation for ${clientLabel}`,
    body:
`Dear Dr. ${providerName},

We are writing on behalf of ${firmName} regarding our mutual patient, ${clientLabel}.

Reported Symptom: [e.g., radicular pain 7/10].
Functional Impact: [e.g., sleep disruption, limited standing].

Based on our assessment and ODG/MCG guidance, our RN Care Manager recommends considering:

• Medication trial (e.g., gabapentin) for neuropathic pain
• Diagnostic clarity (e.g., EMG/NCS)
• Specialist referral (Pain Management/PM&R)

Please let us know your plan.

Sincerely,
RN, Reconcile C.A.R.E.`
  }),
  mediationSummaryTitle: (caseLabel:string) => `Mediation Summary — ${caseLabel}`,
  mediationSummaryBody: () =>
`This 2–3 page summary assembles:
• Timeline of key events
• Pain diary excerpts
• 4Ps impact summary
• ODG/MCG validations

// TODO: Replace with server PDF generator.`
};
