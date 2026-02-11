/**
 * Clinical Overlay catalog for RN V3 — authoritative labels.
 * RN Block B-1: multi-select, persistent in care plan draft (v3_vision.clinical_overlays).
 */

export type ClinicalOverlayValue = string;

export const CLINICAL_OVERLAY_OPTIONS = [
  { value: "60+ Overlay — Geriatric Precision", label: "60+ Overlay — Geriatric Precision" },
  { value: "Caregiver / Dependent Overlay — Symmetrical Family Assessment", label: "Caregiver / Dependent Overlay — Symmetrical Family Assessment" },
  { value: "Student Lens (Ages 18–24)", label: "Student Lens (Ages 18–24)" },
  { value: "Adolescent Lens (Ages 13–17)", label: "Adolescent Lens (Ages 13–17)" },
  { value: "Child Lens (Ages 3–12)", label: "Child Lens (Ages 3–12)" },
  { value: "Infant / Toddler Lens (Ages 0–2)", label: "Infant / Toddler Lens (Ages 0–2)" },
  { value: "Gender-Specific Health Considerations (Adults 18+)", label: "Gender-Specific Health Considerations (Adults 18+)" },
] as const;

const VALID_VALUES = new Set(CLINICAL_OVERLAY_OPTIONS.map((o) => o.value));
const CATALOG_ORDER = CLINICAL_OVERLAY_OPTIONS.map((o) => o.value);

/**
 * Returns a de-duped array of valid overlay values only, in stable catalog order.
 * Accepts array of strings; filters to catalog values; ignores unknown/legacy strings.
 */
export function normalizeOverlayArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const valid = new Set(input.filter((x): x is string => typeof x === "string" && VALID_VALUES.has(x)));
  return CATALOG_ORDER.filter((v) => valid.has(v));
}

/** B-1 catalog labels for mapping. */
const LABEL_60 = "60+ Overlay — Geriatric Precision";
const LABEL_CAREGIVER = "Caregiver / Dependent Overlay — Symmetrical Family Assessment";
const LABEL_STUDENT = "Student Lens (Ages 18–24)";
const LABEL_ADOLESCENT = "Adolescent Lens (Ages 13–17)";
const LABEL_CHILD = "Child Lens (Ages 3–12)";
const LABEL_INFANT = "Infant / Toddler Lens (Ages 0–2)";
const LABEL_GENDER = "Gender-Specific Health Considerations (Adults 18+)";

/**
 * Derive overlay defaults from intake (clinical_context.age_ranges, context_flags, demographics).
 * Returns catalog value strings only.
 */
export function deriveOverlayDefaultsFromIntake(intakeJson: unknown): string[] {
  const out: string[] = [];
  if (!intakeJson || typeof intakeJson !== "object") return out;
  const j = intakeJson as Record<string, unknown>;

  const cc = j?.clinical_context as Record<string, unknown> | undefined;
  const ageRanges = (Array.isArray(cc?.age_ranges) ? cc.age_ranges : []) as string[];
  const contextFlags = (Array.isArray(cc?.context_flags) ? cc.context_flags : []) as string[];

  for (const a of ageRanges) {
    const s = String(a).toLowerCase();
    if (/60|65|older|geriatric|senior/i.test(s) && !out.includes(LABEL_60)) out.push(LABEL_60);
    else if (/18[-–]24|18 to 24|college|young adult/i.test(s) && !out.includes(LABEL_STUDENT)) out.push(LABEL_STUDENT);
    else if (/13[-–]17|adolescent|teen/i.test(s) && !out.includes(LABEL_ADOLESCENT)) out.push(LABEL_ADOLESCENT);
    else if (/3[-–]12|child|elementary|school/i.test(s) && !out.includes(LABEL_CHILD)) out.push(LABEL_CHILD);
    else if (/0[-–]2|infant|toddler|baby/i.test(s) && !out.includes(LABEL_INFANT)) out.push(LABEL_INFANT);
  }

  for (const f of contextFlags) {
    const s = String(f);
    if (["College student", "Vocational / technical student"].includes(s) && !out.includes(LABEL_STUDENT)) out.push(LABEL_STUDENT);
    if (["I provide care for a child", "I provide care for a dependent adult"].includes(s) && !out.includes(LABEL_CAREGIVER)) out.push(LABEL_CAREGIVER);
  }

  // Top-level context_flags object (is_student, has_dependents) from client intake
  const cf = j?.context_flags as Record<string, unknown> | undefined;
  if (cf?.is_student === true && !out.includes(LABEL_STUDENT)) out.push(LABEL_STUDENT);
  if (cf?.has_dependents === true && !out.includes(LABEL_CAREGIVER)) out.push(LABEL_CAREGIVER);

  const demo = (j?.demographics ?? j?.clinical_context ?? {}) as Record<string, unknown>;
  const sex = [demo?.sex_at_birth, demo?.sex, demo?.gender, (j as any)?.gender].find((x) => x != null && String(x).trim() !== "");
  if (sex != null && String(sex).trim() !== "" && !out.includes(LABEL_GENDER)) out.push(LABEL_GENDER);

  return out;
}

/**
 * Migrate legacy v3_vision.clinical_overlays (object with age_range, student_status, caregiver_role)
 * to B-1 string[] catalog. If input is already string[], return as-is. Otherwise best-effort map.
 */
export function migrateClinicalOverlays(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as Record<string, { status?: string; value?: string }>;
  const out: string[] = [];
  if (obj.age_range != null) {
    const v = String(obj.age_range?.value ?? "").toLowerCase();
    if (/60|65|older|geriatric/i.test(v)) out.push(LABEL_60);
    else if (/18|college|24/i.test(v)) out.push(LABEL_STUDENT);
    else if (/13|17|adolescent|teen/i.test(v)) out.push(LABEL_ADOLESCENT);
    else if (/3|12|child/i.test(v)) out.push(LABEL_CHILD);
    else if (/0|2|infant|toddler/i.test(v)) out.push(LABEL_INFANT);
    else out.push(LABEL_60);
  }
  if (obj.student_status != null) out.push(LABEL_STUDENT);
  if (obj.caregiver_role != null) out.push(LABEL_CAREGIVER);
  return out;
}
