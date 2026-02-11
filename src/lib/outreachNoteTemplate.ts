/**
 * RN Block 3 — Step 8: Pre-approved outreach note template (non-editable).
 * Used by the one-click outreach control. Template is the ONLY note text recorded.
 */

export function getOutreachNoteTemplate(args: { channel: string }): string {
  const channel = args.channel || "other";
  return `Outreach attempt recorded via ${channel}. No response yet. Next attempt will follow per SLA.`;
}
