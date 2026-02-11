/**
 * RN-only helper to resolve case IDs safely for navigation and display.
 * Does NOT query DB. Uses caseOptions already available on the page.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(s: string): boolean {
  return typeof s === "string" && UUID_RE.test(s);
}

export interface CaseOption {
  id: string;
  label: string;
}

/**
 * Resolve a case reference (UUID or RC-#### style) to the case UUID.
 * - If ref is already a UUID, return it.
 * - Else try to match by label: exact, startsWith, or includes.
 * - Return null if no match.
 */
export function resolveCaseUuidFromRef(
  ref: string | null | undefined,
  caseOptions: Array<{ id: string; label: string }>
): string | null {
  if (ref == null || ref === "") return null;
  if (isUuid(ref)) return ref;
  const opt = caseOptions.find(
    (o) =>
      o.label === ref ||
      o.label.startsWith(ref) ||
      o.label.includes(ref)
  );
  return opt ? opt.id : null;
}

/**
 * Get a display label for a case ref (for "Linked: …" or similar).
 * - If ref is UUID, find option by id and return label (or "RC-####" part before " — ").
 * - If ref is code, return it or matched label.
 */
export function getCaseLabelFromRef(
  ref: string | null | undefined,
  caseOptions: Array<{ id: string; label: string }>
): string | null {
  if (ref == null || ref === "") return null;
  if (isUuid(ref)) {
    const opt = caseOptions.find((o) => o.id === ref);
    if (!opt) return null;
    const before = opt.label.split(" — ")[0];
    return before || opt.label;
  }
  const opt = caseOptions.find(
    (o) =>
      o.label === ref ||
      o.label.startsWith(ref) ||
      o.label.includes(ref)
  );
  return opt ? (opt.label.split(" — ")[0] || opt.label) : ref;
}
