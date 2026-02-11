// src/utils/priorityEngine.ts

import {
  CaseSummary,
  SeverityScore,
  FOUR_PS,
  TEN_VS,
  P_TO_V_MAP,
  PId,
  VId,
} from "../constants/reconcileFramework";

export interface PriorityV {
  vId: VId;
  label: string;
  definition: string;
  score: SeverityScore | null; // null if not scored yet
}

export interface PriorityP {
  pId: PId;
  label: string;
  shortLabel: string;
  score: SeverityScore;
  mappedVs: PriorityV[];
}

/**
 * Internal: fixed P ordering for tie-breaks (P1→P4).
 */
const P_PRIORITY_ORDER: PId[] = [
  "physical",
  "psychological",
  "psychosocial",
  "professional",
];

/**
 * Compute the ordered list of Ps and their mapped Vs based on the latest
 * RN scoring in CaseSummary.
 *
 * Rules:
 *  - Ps are ordered by ascending score (lower = more severe).
 *  - Ties are broken by P1→P4 order (physical, psychological, psychosocial, professional).
 *  - Each P pulls its mapped Vs from P_TO_V_MAP.
 *  - Each V includes its current score if available, otherwise null.
 */
export function computePVPriorities(
  summary: CaseSummary | null
): PriorityP[] {
  if (!summary || !summary.fourPs) return [];

  const fourPsDims = summary.fourPs.dimensions || [];
  const tenVsDims = summary.tenVs?.dimensions || [];

  // Helper: get a P score by id
  const getPScore = (pId: PId): SeverityScore | null => {
    const dim = fourPsDims.find((d) => d.id === pId);
    return dim ? dim.score : null;
  };

  // Helper: get a V score by id
  const getVScore = (vId: VId): SeverityScore | null => {
    const dim = tenVsDims.find((d) => d.id === vId);
    return dim ? dim.score : null;
  };

  // Build PriorityP list for all Ps that have a score
  const priorityPs: PriorityP[] = [];

  for (const pId of P_PRIORITY_ORDER) {
    const score = getPScore(pId);
    if (!score) continue; // skip Ps not scored yet

    const pDef = FOUR_PS.find((p) => p.id === pId);
    const mapping = P_TO_V_MAP.find((m) => m.pId === pId);

    const label = pDef?.label ?? pId;
    const shortLabel = pDef?.shortLabel ?? label;

    const mappedVs: PriorityV[] =
      mapping?.vIds.map((vId) => {
        const vDef = TEN_VS.find((v) => v.id === vId);
        const vScore = getVScore(vId);
        return {
          vId,
          label: vDef?.label ?? vId,
          definition: vDef?.definition ?? "",
          score: vScore ?? null,
        };
      }) ?? [];

    priorityPs.push({
      pId,
      label,
      shortLabel,
      score,
      mappedVs,
    });
  }

  // Sort Ps by score ASC, tie-break by P_PRIORITY_ORDER
  priorityPs.sort((a, b) => {
    if (a.score !== b.score) {
      return a.score - b.score; // lower score = higher priority
    }
    const ia = P_PRIORITY_ORDER.indexOf(a.pId);
    const ib = P_PRIORITY_ORDER.indexOf(b.pId);
    return ia - ib;
  });

  return priorityPs;
}
