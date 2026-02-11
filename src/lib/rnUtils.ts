/**
 * RN-only utilities. Do not use from Attorney or Client code.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(s: string | null | undefined): boolean {
  return typeof s === "string" && s.length > 0 && UUID_RE.test(s);
}
