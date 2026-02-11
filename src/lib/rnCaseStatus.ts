/**
 * RN Case Status Helpers
 * 
 * Defines the RN workflow state machine for case statuses.
 * These helpers gate UI controls and enforce read-only behavior.
 */

export type RNCaseStatus = 
  | 'draft'      // Initial draft state
  | 'working'    // Actively being worked on
  | 'revised'    // Revised draft (can continue editing)
  | 'ready'      // Ready for release (releasable)
  | 'released'   // Released snapshot (immutable)
  | 'closed';   // Closed snapshot (immutable)

/**
 * Check if a case status allows editing
 * Editable statuses: draft, working, revised, ready
 */
export function isEditableRNStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  const editableStatuses: string[] = ['draft', 'working', 'revised', 'ready'];
  return editableStatuses.includes(status.toLowerCase());
}

/**
 * Check if a case status allows release to attorney
 * Releasable statuses: 'ready' (preferred)
 * Only cases marked as ready can be released to attorneys
 */
export function isReleasableRNStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  // Only 'ready' status allows release to attorney
  const releasableStatuses: string[] = ['ready'];
  return releasableStatuses.includes(status.toLowerCase());
}

/**
 * Check if a case status is released or closed (immutable)
 * These statuses should never be editable
 */
export function isReleasedOrClosed(status: string | null | undefined): boolean {
  if (!status) return false;
  const immutableStatuses: string[] = ['released', 'closed'];
  return immutableStatuses.includes(status.toLowerCase());
}

/**
 * Get user-friendly status label
 */
export function getRNStatusLabel(status: string | null | undefined): string {
  if (!status) return 'Unknown';
  const labels: Record<string, string> = {
    'draft': 'Draft',
    'working': 'Working',
    'revised': 'Revised',
    'ready': 'Ready for Release',
    'released': 'Released',
    'closed': 'Closed',
  };
  return labels[status.toLowerCase()] || status;
}
