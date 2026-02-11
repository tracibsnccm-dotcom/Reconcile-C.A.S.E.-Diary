/**
 * RN-only: Pure UI logic for acknowledged-assignment priority (no DB).
 * Pins acknowledged, newly-assigned cases to Today's Priorities and Upcoming Deadlines.
 * Used by: RNTodaysPriorities, RNUpcomingDeadlines, TodayDeadlinesPanel, RNPortalLanding.
 */

export type AssignedCasePriorityItem = {
  case_id: string;
  case_label: string;
  case_status: string;
  created_at: string;
  acknowledged_at?: string | null;
  due_at?: string | null;
  is_overdue?: boolean;
  is_due_within_24h?: boolean;
};

/**
 * Returns ISO string for created_at + 24h (initial care plan due).
 */
export function computeInitialCarePlanDueAt(createdAtIso: string): string {
  if (!createdAtIso) return "";
  try {
    const d = new Date(createdAtIso);
    if (Number.isNaN(d.getTime())) return "";
    d.setHours(d.getHours() + 24);
    return d.toISOString();
  } catch {
    return "";
  }
}

export type CaseForAck = {
  id: string;
  created_at: string | null;
  case_status: string | null;
  case_number?: string | null;
  client_name?: string | null;
};

const NEWLY_ASSIGNED_STATUSES = ["attorney_confirmed", "intake_pending"] as const;

export type BuildAcknowledgedAssignmentItemsParams = {
  rnUserId: string;
  cases: CaseForAck[];
  getAcknowledgedAt: (rnUserId: string, caseId: string) => string | null;
  caseLabelResolver: (c: CaseForAck) => string;
};

/**
 * Builds the list of acknowledged assignment items for pin-to-today and deadlines.
 * - Only cases that are acknowledged (ack timestamp exists)
 * - Only status in attorney_confirmed, intake_pending (exclude active)
 * - Sorted: overdue first, then soonest due_at, then oldest acknowledged_at
 */
export function buildAcknowledgedAssignmentItems(
  params: BuildAcknowledgedAssignmentItemsParams
): AssignedCasePriorityItem[] {
  const { rnUserId, cases, getAcknowledgedAt, caseLabelResolver } = params;
  if (!rnUserId) return [];

  const now = new Date();
  const items: AssignedCasePriorityItem[] = [];

  for (const c of cases) {
    const ack = getAcknowledgedAt(rnUserId, c.id);
    if (!ack) continue;

    const status = (c.case_status || "").toLowerCase();
    if (!NEWLY_ASSIGNED_STATUSES.includes(status as (typeof NEWLY_ASSIGNED_STATUSES)[number])) continue;

    const created = c.created_at || "";
    const dueAtIso = created ? computeInitialCarePlanDueAt(created) : "";
    const dueAt = dueAtIso ? new Date(dueAtIso) : null;
    const isOverdue = !!dueAt && dueAt.getTime() < now.getTime();
    const isDueWithin24h =
      !!dueAt &&
      !isOverdue &&
      dueAt.getTime() - now.getTime() <= 24 * 60 * 60 * 1000;

    items.push({
      case_id: c.id,
      case_label: caseLabelResolver(c),
      case_status: c.case_status || "",
      created_at: created,
      acknowledged_at: ack,
      due_at: dueAtIso || null,
      is_overdue: isOverdue,
      is_due_within_24h: isDueWithin24h,
    });
  }

  items.sort((a, b) => {
    if (a.is_overdue && !b.is_overdue) return -1;
    if (!a.is_overdue && b.is_overdue) return 1;
    if (a.due_at && b.due_at) {
      const da = new Date(a.due_at).getTime();
      const db = new Date(b.due_at).getTime();
      if (da !== db) return da - db;
    }
    const aAck = a.acknowledged_at ? new Date(a.acknowledged_at).getTime() : 0;
    const bAck = b.acknowledged_at ? new Date(b.acknowledged_at).getTime() : 0;
    return aAck - bAck;
  });

  return items;
}
