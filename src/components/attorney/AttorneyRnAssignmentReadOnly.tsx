/**
 * Attorney RN Assignment — Read-Only Display
 * ATTORNEY-2: Attorneys do NOT assign RNs. This card shows assignment state only.
 * - No dropdowns, buttons, or assignment UI.
 * - RN assignment is done by RN Supervisor / Clinical Ops (Block 3).
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AttorneyRnAssignmentReadOnlyProps {
  /** Current assigned RN auth_user_id (from rc_cases.assigned_rn_id) */
  assignedRnId: string | null;
  /** Timestamp when case was last updated (optional) */
  updatedAt?: string | null;
}

function formatRnDisplayName(row: { full_name?: string | null; email?: string | null; rn_id?: string | null } | null): string {
  if (!row) return "";
  if (row.full_name?.trim()) return row.full_name;
  if (row.email?.trim()) return row.email;
  if (row.rn_id?.trim()) return row.rn_id;
  return "";
}

export function AttorneyRnAssignmentReadOnly({
  assignedRnId,
  updatedAt,
}: AttorneyRnAssignmentReadOnlyProps) {
  const [rnDisplayName, setRnDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (!assignedRnId) {
      setRnDisplayName(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("rc_rns")
        .select("full_name, email, rn_id")
        .eq("auth_user_id", assignedRnId)
        .maybeSingle();
      if (!cancelled && data) {
        const name = formatRnDisplayName(data);
        setRnDisplayName(name || "Assigned");
      } else if (!cancelled) {
        setRnDisplayName("Assigned");
      }
    })();
    return () => { cancelled = true; };
  }, [assignedRnId]);

  const hasAssignment = !!assignedRnId;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {hasAssignment ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <UserPlus className="w-5 h-5 text-muted-foreground" />
          )}
          RN Assignment
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasAssignment ? (
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Assigned to: {rnDisplayName ?? "Assigned"}
            </p>
            {updatedAt && (
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date(updatedAt).toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-medium">Not yet assigned</p>
            <p className="text-xs text-muted-foreground">
              This case is awaiting RN Supervisor assignment.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
