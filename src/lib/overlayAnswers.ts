// src/lib/overlayAnswers.ts
// Helpers for overlay_answers in intake_session.form_data. Stable keys only.

/**
 * Read overlay_answers from form_data. Safe for undefined formData.
 */
export function getOverlayAnswers(formData: { overlay_answers?: Record<string, unknown> } | null | undefined): Record<string, unknown> {
  if (!formData || typeof formData !== "object") return {};
  const o = formData.overlay_answers;
  return o && typeof o === "object" && !Array.isArray(o) ? (o as Record<string, unknown>) : {};
}

/**
 * Return new formData with overlay_answers updated for one key. Immutable.
 */
export function setOverlayAnswer<T extends Record<string, unknown>>(
  formData: T,
  key: string,
  value: unknown
): T {
  const prev = getOverlayAnswers(formData);
  return {
    ...formData,
    overlay_answers: { ...prev, [key]: value },
  } as T;
}
