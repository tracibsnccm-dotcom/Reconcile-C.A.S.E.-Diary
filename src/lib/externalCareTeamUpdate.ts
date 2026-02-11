/**
 * RN Block 3 — Step 6: External Care Team Update (Client + Attorney notified)
 *
 * When a case's RN Care Manager changes (assigned_rn_id), notify Client and Attorney
 * via existing rc_messages. No schema changes. Copy is neutral (no governance terms).
 */

import { supabase } from "@/integrations/supabase/client";

const NOTIFICATION_TITLE = "Care team updated";
const NOTIFICATION_BODY =
  "A new nurse care manager has been assigned to your case. If you have questions, contact your attorney's office.";

/**
 * Notifies Client and Attorney when a case's RN Care Manager changes.
 * Trigger ONLY when old_rn_user_id !== new_rn_user_id AND new_rn_user_id is not null.
 * No notification on unassign.
 */
export async function notifyCareTeamUpdated(args: {
  case_id: string;
  old_rn_user_id: string | null;
  new_rn_user_id: string | null;
  actor_user_id: string;
  actor_role: "supervisor" | "manager";
  occurred_at?: string;
}): Promise<void> {
  const {
    case_id,
    old_rn_user_id,
    new_rn_user_id,
    actor_user_id,
    actor_role,
    occurred_at,
  } = args;

  // Only notify when RN actually changed and new RN is assigned (not unassign)
  if (old_rn_user_id === new_rn_user_id || new_rn_user_id == null) {
    return;
  }

  const occurred = occurred_at ?? new Date().toISOString();

  // 1. Record internal auditable event (optional but recommended)
  await supabase.from("audit_logs").insert({
    action: "CARE_TEAM_UPDATED_NOTIFICATION",
    actor_id: actor_user_id,
    actor_role,
    case_id,
    meta: {
      external_notification: true,
      old_rn_user_id,
      new_rn_user_id,
      occurred_at: occurred,
    },
  });

  // 2. Deliver external-facing notification via rc_messages (Client + Attorney both read this)
  const messageText = `${NOTIFICATION_TITLE}: ${NOTIFICATION_BODY}`;
  await supabase.from("rc_messages").insert({
    case_id,
    sender_type: "rn",
    sender_id: new_rn_user_id,
    sender_name: "Care Team",
    message_text: messageText,
    is_read: false,
  });
}
