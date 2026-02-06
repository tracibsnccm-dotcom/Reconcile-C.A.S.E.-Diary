/**
 * Helpers for optional Supabase tables (providers, audit_logs, notifications, user_preferences).
 * When a table is missing (PGREST 404/42P01 etc.), treat as "use empty" instead of breaking or spamming console.
 */
export function isOptionalTableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string; status?: number };
  const msg = (e.message || '').toLowerCase();
  return (
    e.code === '42P01' ||
    e.status === 404 ||
    msg.includes('does not exist') ||
    msg.includes('relation "public.')
  );
}
