import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabaseGet } from "@/lib/supabaseRest";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { audit } from "@/lib/supabaseOperations";
import {
  recordUnassign,
  recordReassign,
  recordNudge,
  repairLegacyEpoch,
} from "@/lib/rnAcknowledgment";
import {
  GOV_RN_ASSIGNED_TO_CASE,
  generateEpochId,
  type GovernanceAssignmentMeta,
} from "@/lib/governanceEvents";
import { resolveRNByAuthUserId } from "@/lib/rnRcRnsResolver";
import { format } from "date-fns";
import { AlertCircle, Users, CheckCircle2, ArrowLeft, FileCheck, AlertTriangle, ClipboardList, Activity, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getClientDisplayName } from "@/lib/rnClientNameHelper";
import {
  recordRnOutreachAttempt,
  getOutreachSlaStatus,
  type OutreachChannel,
  type OutreachSlaStatus,
} from "@/lib/rnOutreachSla";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const LOAD_TIMEOUT_MS = 10000;

interface PendingCase {
  id: string;
  case_number: string | null;
  case_type: string | null;
  date_of_injury: string | null;
  attorney_attested_at: string | null;
  assigned_rn_id?: string | null;
  rc_clients?: { first_name: string | null; last_name: string | null } | null;
  rc_users?: Record<string, any> | null;
  intake_json?: any;
}

interface AvailableRN {
  id: string;
  email: string | null;
  rn_id: string | null;
  auth_user_id: string | null;
  full_name?: string | null;
}

interface AssignedCaseWithSla {
  id: string;
  case_number: string | null;
  assigned_rn_id: string;
  rn_name: string;
  sla_status: OutreachSlaStatus;
}

function formatRcRnsDisplayName(row: { full_name?: string | null; email?: string | null; rn_id?: string | null; id?: string } | null): string {
  if (!row) return "Supervisor";
  if (row.full_name) return row.full_name;
  if (row.email) return row.email;
  if (row.rn_id) return row.rn_id;
  if (row.id) return row.id.slice(0, 8);
  return "Supervisor";
}

export default function RNSupervisor() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [supervisorName, setSupervisorName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingCases, setPendingCases] = useState<PendingCase[]>([]);
  const [availableRNs, setAvailableRNs] = useState<AvailableRN[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedRnAuthUserId, setSelectedRnAuthUserId] = useState<string>("");
  const [contractBlocking, setContractBlocking] = useState(false);
  const [contractErrors, setContractErrors] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [assignedCasesWithSla, setAssignedCasesWithSla] = useState<AssignedCaseWithSla[]>([]);
  // Stage 2.5: Supervisor controls
  const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);
  const [unassignCaseId, setUnassignCaseId] = useState<string | null>(null);
  const [unassignReasonCode, setUnassignReasonCode] = useState("supervisor_override");
  const [unassignReasonText, setUnassignReasonText] = useState("");
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [reassignCaseId, setReassignCaseId] = useState<string | null>(null);
  const [reassignReasonCode, setReassignReasonCode] = useState("supervisor_override");
  const [reassignReasonText, setReassignReasonText] = useState("");
  const [reassignSelectedRnAuthUserId, setReassignSelectedRnAuthUserId] = useState("");
  const [nudgeDialogOpen, setNudgeDialogOpen] = useState(false);
  const [nudgeCaseId, setNudgeCaseId] = useState<string | null>(null);
  const [nudgeType, setNudgeType] = useState("general");
  const [nudgeMessage, setNudgeMessage] = useState("");
  const [supervisorActionLoading, setSupervisorActionLoading] = useState(false);
  const [slaLoading, setSlaLoading] = useState(false);
  const [recordingCaseId, setRecordingCaseId] = useState<string | null>(null);
  const [activeRecordRowId, setActiveRecordRowId] = useState<string | null>(null);
  const [recordChannel, setRecordChannel] = useState<OutreachChannel>("phone");
  const [recordNote, setRecordNote] = useState("");
  const [intakeMap, setIntakeMap] = useState<Map<string, { intake_json?: any; attorney_attested_at?: string | null; attorney_attested_by_id?: string | null; attorney_attested_by?: string | null }>>(new Map());
  const [totalUnfilteredCount, setTotalUnfilteredCount] = useState<number>(0);
  const [lifecycleEvents, setLifecycleEvents] = useState<Map<string, {
    epoch_id: string;
    assigned_at: string;
    rn_auth_id: string;
    rn_display_name: string;
    accepted_at: string | null;
    declined_at: string | null;
    decline_reason: string | null;
    ack_sent_at: string | null;
    last_nudge_at: string | null;
    last_nudge_type: string | null;
  }>>(new Map());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadAll = useCallback(async () => {
    if (!authUser?.id) {
      setError("Not logged in. Please sign in to access the supervisor dashboard.");
      setLoading(false);
      return;
    }

    try {
      const contractErrorsList: string[] = [];
      setError(null);
      setLoadTimedOut(false);

      const res = await resolveRNByAuthUserId(authUser.id);

      if (!res.ok) {
        setError(res.error ?? "Unable to verify supervisor access.");
        setLoading(false);
        return;
      }
      if (!res.is_supervisor) {
        setError("Access denied. This dashboard is for RN Supervisors only.");
        setLoading(false);
        return;
      }

      setSupervisorName(formatRcRnsDisplayName(res.row));

      const { data: casesData, error: casesError } = await supabaseGet<PendingCase[]>(
        "rc_cases",
        "case_status=eq.attorney_confirmed&is_superseded=eq.false&select=*"
      );

      if (casesError) {
        throw new Error(`Failed to load cases: ${casesError.message}`);
      }

      const cases = Array.isArray(casesData) ? casesData : (casesData ? [casesData] : []);

      const { data: assignmentsData, error: assignmentsError } = await supabaseGet<{ case_id: string }[]>(
        "rc_case_assignments",
        "status=in.(pending_acceptance,active)&select=case_id"
      );

      if (assignmentsError) {
        console.warn("Failed to load assignments:", assignmentsError);
      }

      const assignedCaseIds = new Set(
        (Array.isArray(assignmentsData) ? assignmentsData : assignmentsData ? [assignmentsData] : []).map((a) => a.case_id)
      );

      const pending = cases.filter((c) => !assignedCaseIds.has(c.id));

      // Collect unique attorney auth_user_ids from pending cases
      const attorneyAuthIds = [...new Set(pending.map((c) => c.attorney_id).filter(Boolean))];
      const attorneyMap = new Map<string, Record<string, any>>();

      if (attorneyAuthIds.length > 0) {
        const attorneyFilter = attorneyAuthIds.map((id) => `auth_user_id.eq.${id}`).join(",");
        const { data: attorneyUsersData, error: attorneyUsersError } = await supabaseGet<Record<string, any>[]>(
          "rc_users",
          `or=(${attorneyFilter})&select=id,full_name,role,auth_user_id`
        );
        if (attorneyUsersError) {
          contractErrorsList.push("Attorney resolution failed: " + (attorneyUsersError.message || "unknown error"));
        } else if (attorneyUsersData) {
          const attorneyUsers = Array.isArray(attorneyUsersData) ? attorneyUsersData : [attorneyUsersData];
          attorneyUsers.forEach((u: any) => {
            if (u.auth_user_id) attorneyMap.set(u.auth_user_id, u);
          });
        }
        // Check for unresolved attorneys
        const unresolvedAttorneys = attorneyAuthIds.filter((id) => !attorneyMap.has(id));
        if (unresolvedAttorneys.length > 0) {
          contractErrorsList.push(`Attorney resolution failed for ${unresolvedAttorneys.length} case(s)`);
          console.warn("[STAGING] Unresolved attorney IDs:", unresolvedAttorneys);
        }
      }

      const clientIds = [...new Set(pending.map((c) => c.client_id).filter(Boolean))];
      const clientMap = new Map<string, Record<string, any>>();
      if (clientIds.length > 0) {
        const clientIdsFilter = clientIds.map((id) => `id.eq.${id}`).join(",");
        const { data: clientsData, error: clientsError } = await supabaseGet<Record<string, any>[]>(
          "rc_clients",
          `or=(${clientIdsFilter})&select=*`
        );
        if (!clientsError && clientsData) {
          const clients = Array.isArray(clientsData) ? clientsData : [clientsData];
          clients.forEach((c: any) => { if (c.id) clientMap.set(c.id, c); });
        }
      }

      const caseIds = pending.map((c) => c.id);
      const intakeMap = new Map<string, { intake_json?: any; attorney_attested_at?: string | null; attorney_attested_by_id?: string | null; attorney_attested_by?: string | null }>();
      if (caseIds.length > 0) {
        const caseIdsFilter = caseIds.map((id) => `case_id.eq.${id}`).join(",");
        const { data: intakesData, error: intakesError } = await supabaseGet<{ case_id: string; intake_json?: any }[]>(
          "rc_client_intakes",
          `or=(${caseIdsFilter})&select=case_id,intake_json,attorney_attested_at,attorney_attested_by_id,attorney_attested_by&intake_status=eq.attorney_confirmed&order=intake_submitted_at.desc`
        );
        if (!intakesError && intakesData) {
          const intakes = Array.isArray(intakesData) ? intakesData : [intakesData];
          intakes.forEach((i: any) => {
            if (i.case_id && !intakeMap.has(i.case_id)) intakeMap.set(i.case_id, { intake_json: i.intake_json, attorney_attested_at: i.attorney_attested_at ?? null, attorney_attested_by_id: i.attorney_attested_by_id ?? null, attorney_attested_by: i.attorney_attested_by ?? null });
          });
        }
      }
      setIntakeMap(new Map(intakeMap));

      const pendingWithNames: PendingCase[] = pending.map((c: any) => {
        const attorney = c.attorney_id ? attorneyMap.get(c.attorney_id) : null;
        const client = c.client_id ? clientMap.get(c.client_id) : null;
        const intake = intakeMap.get(c.id);
        return {
          ...c,
          rc_users: attorney || null,
          rc_clients: client ? { first_name: client.first_name || null, last_name: client.last_name || null } : null,
          intake_json: intake?.intake_json || null,
        };
      });

      // Enforce invariants: exclude cases missing client_id or missing attested intake
      setTotalUnfilteredCount(pendingWithNames.length);
      const withClient = pendingWithNames.filter(c => !!c.client_id);
      const eligible = withClient.filter(c => {
        const intake = intakeMap.get(c.id);
        return !!intake?.attorney_attested_at;
      });

      // Staging containment counters
      const excludedMissingClient = pendingWithNames.length - withClient.length;
      const excludedMissingAttestation = withClient.length - eligible.length;
      if (excludedMissingClient > 0) console.warn(`[STAGING] Excluded ${excludedMissingClient} cases: missing client_id`);
      if (excludedMissingAttestation > 0) console.warn(`[STAGING] Excluded ${excludedMissingAttestation} cases: missing attorney attestation`);
      console.info("[STAGING CONTRACT] Attestation source = rc_client_intakes.attorney_attested_at (consent-to-case linkage incomplete)");

      // ── Governance event derivation (Stage 2: full lifecycle) ──
      const allCaseIds = eligible.map((c) => c.id);
      const lifecycleMap = new Map<string, {
        epoch_id: string;
        assigned_at: string;
        rn_auth_id: string;
        rn_display_name: string;
        accepted_at: string | null;
        declined_at: string | null;
        decline_reason: string | null;
        ack_sent_at: string | null;
        last_nudge_at: string | null;
        last_nudge_type: string | null;
      }>();

      if (allCaseIds.length > 0) {
        const { data: govEvents, error: govError } = await supabase
          .from("rc_audit_logs")
          .select("case_id, action, details, created_at")
          .in("case_id", allCaseIds)
          .in("action", [
            "RN_ASSIGNED_TO_CASE",
            "RN_ACCEPTED_ASSIGNMENT",
            "RN_DECLINED_ASSIGNMENT",
            "ACK_NOTE_SENT",
            "RN_UNASSIGNED_FROM_CASE",
            "RN_REASSIGNED_TO_CASE",
            "RN_NUDGED_BY_SUPERVISOR",
          ])
          .order("created_at", { ascending: false });

        if (govError) {
          console.warn("[STAGING] Failed to load governance events:", govError);
        } else if (govEvents) {
          // First pass: find latest epoch per case
          const epochMap = new Map<string, { epoch_id: string; assigned_at: string; rn_auth_id: string; rn_display_name: string }>();
          for (const evt of govEvents) {
            if (evt.action === "RN_ASSIGNED_TO_CASE" && evt.case_id && !epochMap.has(evt.case_id)) {
              const meta = typeof evt.details === "string" ? JSON.parse(evt.details) : evt.details;
              epochMap.set(evt.case_id, {
                epoch_id: meta?.assignment_epoch_id ?? "",
                assigned_at: evt.created_at ?? "",
                rn_auth_id: meta?.assigned_rn_auth_user_id ?? "",
                rn_display_name: meta?.assigned_rn_display?.full_name ?? "",
              });
            }
          }

          // Second pass: find accept/decline/ack per epoch
          for (const [caseId, epochData] of epochMap) {
            const entry = {
              ...epochData,
              accepted_at: null as string | null,
              declined_at: null as string | null,
              decline_reason: null as string | null,
              ack_sent_at: null as string | null,
              last_nudge_at: null as string | null,
              last_nudge_type: null as string | null,
            };

            for (const evt of govEvents) {
              if (evt.case_id !== caseId) continue;
              const meta = typeof evt.details === "string" ? JSON.parse(evt.details) : evt.details;
              if (meta?.assignment_epoch_id !== epochData.epoch_id) continue;

              if (evt.action === "RN_ACCEPTED_ASSIGNMENT" && !entry.accepted_at) {
                entry.accepted_at = evt.created_at ?? null;
              }
              if (evt.action === "RN_DECLINED_ASSIGNMENT" && !entry.declined_at) {
                entry.declined_at = evt.created_at ?? null;
                entry.decline_reason = meta?.reason_code ?? "unknown";
              }
              if (evt.action === "ACK_NOTE_SENT" && !entry.ack_sent_at) {
                entry.ack_sent_at = evt.created_at ?? null;
              }
              if (evt.action === "RN_NUDGED_BY_SUPERVISOR" && !entry.last_nudge_at) {
                entry.last_nudge_at = evt.created_at ?? null;
                entry.last_nudge_type = meta?.nudge_type ?? "general";
              }
            }

            lifecycleMap.set(caseId, entry);
          }
        }
      }

      // Auto-drop: Remove cases where accepted + ack_sent (Cleared state)
      const visibleCases = eligible.filter((c) => {
        const lc = lifecycleMap.get(c.id);
        if (lc && lc.accepted_at && lc.ack_sent_at) return false;
        return true;
      });
      setPendingCases(visibleCases);
      setLifecycleEvents(lifecycleMap);

      const { data: rnsData, error: rnsError } = await supabase
        .from("rc_rns")
        .select("id, email, rn_id, auth_user_id, full_name")
        .eq("is_active", true)
        .eq("is_supervisor", false)
        .not("auth_user_id", "is", null);

      if (rnsError) {
        console.warn("Failed to load RNs from rc_rns:", rnsError);
        setAvailableRNs([]);
        contractErrorsList.push("RN roster fetch failed: " + (rnsError.message || "unknown error"));
      } else {
        setAvailableRNs((rnsData ?? []) as AvailableRN[]);
        if (!rnsError && (rnsData ?? []).length === 0) {
          contractErrorsList.push("RN roster returned 0 results — assignment disabled");
        }
      }

      const rnMap = new Map<string, AvailableRN>();
      ((rnsData ?? []) as AvailableRN[]).forEach((r) => {
        if (r.auth_user_id) rnMap.set(r.auth_user_id, r);
      });

      setSlaLoading(true);
      try {
        const { data: assignedCasesData, error: assignedError } = await supabase
          .from("rc_cases")
          .select("id, case_number, assigned_rn_id, case_status")
          .not("assigned_rn_id", "is", null)
          .eq("is_superseded", false);

        if (assignedError) {
          setAssignedCasesWithSla([]);
          return;
        }

        const activeCases = (assignedCasesData ?? []).filter(
          (c: { case_status?: string | null }) => {
            const s = (c.case_status ?? "").toLowerCase();
            return s !== "closed" && s !== "released";
          }
        );

        if (activeCases.length === 0) {
          setAssignedCasesWithSla([]);
          return;
        }

        const withSla: AssignedCaseWithSla[] = await Promise.all(
          activeCases.map(async (c: { id: string; case_number: string | null; assigned_rn_id: string }) => {
            const sla = await getOutreachSlaStatus(c.id, c.assigned_rn_id);
            const rn = rnMap.get(c.assigned_rn_id);
            return {
              id: c.id,
              case_number: c.case_number,
              assigned_rn_id: c.assigned_rn_id,
              rn_name: rn ? formatRcRnsDisplayName(rn) : c.assigned_rn_id.slice(0, 8),
              sla_status: sla,
            };
          })
        );
        setAssignedCasesWithSla(withSla);
      } catch (slaErr: any) {
        console.warn("Failed to load outreach SLA:", slaErr);
        setAssignedCasesWithSla([]);
      } finally {
        setSlaLoading(false);
      }

      // Contract gate evaluation
      if (contractErrorsList.length > 0) {
        setContractBlocking(true);
        setContractErrors(contractErrorsList);
        console.error("[STAGING CONTRACT] Blocking errors:", contractErrorsList);
      } else {
        setContractBlocking(false);
        setContractErrors([]);
      }
    } catch (err: any) {
      console.error("Error loading supervisor data:", err);
      setError(err?.message || "We couldn't load supervisor data right now.");
    } finally {
      setLoading(false);
    }
  }, [authUser?.id]);

  // Timeout fallback: after 10s of loading, show "Unable to load" with Retry
  useEffect(() => {
    if (!loading) {
      setLoadTimedOut(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }
    timeoutRef.current = setTimeout(() => {
      setLoadTimedOut(true);
      timeoutRef.current = null;
    }, LOAD_TIMEOUT_MS);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [loading]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleRetry = () => {
    setLoadTimedOut(false);
    setError(null);
    setLoading(true);
    loadAll();
  };

  /** Ensure a case has an epoch. If legacy (no event), repair it. Returns epoch_id. */
  const ensureEpoch = async (caseId: string): Promise<string | null> => {
    const lc = lifecycleEvents.get(caseId);
    if (lc?.epoch_id) return lc.epoch_id;

    // Legacy case: find the assigned RN and repair
    const caseItem = pendingCases.find(c => c.id === caseId);
    if (!caseItem?.assigned_rn_id) return null;

    const authUser = (await supabase.auth.getUser()).data.user;
    if (!authUser) return null;

    const rn = availableRNs.find(r => r.auth_user_id === caseItem.assigned_rn_id);

    try {
      const epochId = await repairLegacyEpoch({
        case_id: caseId,
        supervisor_user_id: authUser.id,
        assigned_rn_auth_user_id: caseItem.assigned_rn_id,
        assigned_rn_display: {
          rn_id: rn?.rn_id ?? null,
          full_name: rn?.full_name ?? null,
        },
      });
      console.info("[STAGING] Legacy epoch repaired:", epochId, "for case:", caseId);
      return epochId;
    } catch (err) {
      console.error("[CONTRACT] Failed to repair legacy epoch:", err);
      toast.error("Cannot perform action: epoch repair failed. Contact support.");
      return null;
    }
  };

  const handleUnassignOpen = (caseId: string) => {
    setUnassignCaseId(caseId);
    setUnassignReasonCode("supervisor_override");
    setUnassignReasonText("");
    setUnassignDialogOpen(true);
  };

  const handleUnassignConfirm = async () => {
    if (!unassignCaseId) return;
    const authUser = (await supabase.auth.getUser()).data.user;
    if (!authUser) return;

    setSupervisorActionLoading(true);
    try {
      const epochId = await ensureEpoch(unassignCaseId);
      if (!epochId) return;

      const caseItem = pendingCases.find(c => c.id === unassignCaseId);
      const currentRnId = caseItem?.assigned_rn_id ?? "";

      // Clear the assignment
      const { error: updateError } = await supabase
        .from("rc_cases")
        .update({ assigned_rn_id: null })
        .eq("id", unassignCaseId)
        .select("assigned_rn_id")
        .single();

      if (updateError) throw new Error(`Failed to clear assignment: ${updateError.message}`);

      // Write audit event
      await recordUnassign({
        case_id: unassignCaseId,
        supervisor_user_id: authUser.id,
        epoch_id: epochId,
        assigned_rn_auth_user_id: currentRnId,
        reason_code: unassignReasonCode,
        reason_text: unassignReasonCode === "other" ? unassignReasonText.trim() : undefined,
      });

      toast.success("RN unassigned from case.");
      setUnassignDialogOpen(false);
      loadAll();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to unassign.");
    } finally {
      setSupervisorActionLoading(false);
    }
  };

  const handleReassignOpen = (caseId: string) => {
    setReassignCaseId(caseId);
    setReassignReasonCode("supervisor_override");
    setReassignReasonText("");
    setReassignSelectedRnAuthUserId("");
    setReassignDialogOpen(true);
  };

  const handleReassignConfirm = async () => {
    if (!reassignCaseId || !reassignSelectedRnAuthUserId) return;
    const authUser = (await supabase.auth.getUser()).data.user;
    if (!authUser) return;

    setSupervisorActionLoading(true);
    try {
      const oldEpochId = await ensureEpoch(reassignCaseId);

      const caseItem = pendingCases.find(c => c.id === reassignCaseId);
      const oldRnId = caseItem?.assigned_rn_id ?? "";
      const newRn = availableRNs.find(r => r.auth_user_id === reassignSelectedRnAuthUserId);
      const newEpochId = generateEpochId();

      // Update assignment
      const { error: updateError } = await supabase
        .from("rc_cases")
        .update({ assigned_rn_id: reassignSelectedRnAuthUserId })
        .eq("id", reassignCaseId)
        .select("assigned_rn_id")
        .single();

      if (updateError) throw new Error(`Failed to reassign: ${updateError.message}`);

      // Write reassign event
      await recordReassign({
        case_id: reassignCaseId,
        supervisor_user_id: authUser.id,
        old_epoch_id: oldEpochId,
        new_epoch_id: newEpochId,
        old_rn_auth_user_id: oldRnId,
        new_rn_auth_user_id: reassignSelectedRnAuthUserId,
        new_rn_display: {
          rn_id: newRn?.rn_id ?? null,
          full_name: newRn?.full_name ?? null,
        },
        reason_code: reassignReasonCode,
        reason_text: reassignReasonCode === "other" ? reassignReasonText.trim() : undefined,
      });

      // Write new RN_ASSIGNED_TO_CASE with new epoch (required for epoch origin)
      const assignmentMeta: GovernanceAssignmentMeta = {
        governance: true,
        assignment_epoch_id: newEpochId,
        assigned_rn_auth_user_id: reassignSelectedRnAuthUserId,
        assigned_rn_display: {
          rn_id: newRn?.rn_id ?? null,
          full_name: newRn?.full_name ?? null,
        },
        reason_code: "reassignment",
      };

      await audit({
        action: "RN_ASSIGNED_TO_CASE",
        actorId: authUser.id,
        actorRole: "supervisor",
        caseId: reassignCaseId,
        meta: assignmentMeta,
      } as any);

      toast.success(`Case reassigned to ${newRn?.full_name ?? "new RN"}.`);
      setReassignDialogOpen(false);
      loadAll();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to reassign.");
    } finally {
      setSupervisorActionLoading(false);
    }
  };

  const handleNudgeOpen = (caseId: string) => {
    const lc = lifecycleEvents.get(caseId);
    setNudgeCaseId(caseId);

    // Pre-fill based on state
    if (lc?.declined_at) {
      setNudgeType("declined_followup");
      setNudgeMessage("");
    } else if (lc?.accepted_at && !lc?.ack_sent_at) {
      setNudgeType("notify_overdue");
      setNudgeMessage("You have missed the cutoff for notifying the client and attorney of your assignment. If you are unable to send the welcome message, please respond so we can assist you in meeting this mandatory metric.");
    } else {
      setNudgeType("acceptance_overdue");
      setNudgeMessage("You have missed the cutoff for accepting this assignment. If you're experiencing case weight or capacity issues, please respond so your supervisor can support you.");
    }

    setNudgeDialogOpen(true);
  };

  const handleNudgeConfirm = async () => {
    if (!nudgeCaseId || nudgeMessage.trim().length < 20) return;
    const authUser = (await supabase.auth.getUser()).data.user;
    if (!authUser) return;

    setSupervisorActionLoading(true);
    try {
      const epochId = await ensureEpoch(nudgeCaseId);
      if (!epochId) return;

      const caseItem = pendingCases.find(c => c.id === nudgeCaseId);

      await recordNudge({
        case_id: nudgeCaseId,
        supervisor_user_id: authUser.id,
        epoch_id: epochId,
        assigned_rn_auth_user_id: caseItem?.assigned_rn_id ?? "",
        nudge_type: nudgeType,
        message: nudgeMessage.trim(),
      });

      toast.success("Nudge recorded.");
      setNudgeDialogOpen(false);
      loadAll();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to record nudge.");
    } finally {
      setSupervisorActionLoading(false);
    }
  };

  const handleAssignClick = (caseId: string) => {
    setSelectedCaseId(caseId);
    setSelectedRnAuthUserId("");
    setAssignDialogOpen(true);
  };

  const handleAssignConfirm = async () => {
    // Contract gate check
    if (contractBlocking) {
      toast.error("Assignment disabled: staging contract errors detected. Refresh and resolve.");
      return;
    }

    if (!selectedCaseId || !selectedRnAuthUserId || !authUser?.id) {
      toast.error(!selectedCaseId ? "Please select a case." : !selectedRnAuthUserId ? "Please select an RN." : "Not authenticated.");
      return;
    }

    const selectedRN = availableRNs.find((rn) => rn.auth_user_id === selectedRnAuthUserId);
    if (!selectedRN?.auth_user_id) {
      toast.error("Selected RN has no auth_user_id or was not found in roster.");
      return;
    }

    const rnName = formatRcRnsDisplayName(selectedRN);
    setAssigning(true);

    try {
      // If case already has an assigned RN (e.g. declined case), unassign first
      const existingCase = pendingCases.find(c => c.id === selectedCaseId);
      if (existingCase?.assigned_rn_id) {
        const epochId = await ensureEpoch(selectedCaseId);
        if (epochId) {
          await recordUnassign({
            case_id: selectedCaseId,
            supervisor_user_id: authUser.id,
            epoch_id: epochId,
            assigned_rn_auth_user_id: existingCase.assigned_rn_id,
            reason_code: "rn_declined",
          });
        }
      }

      // Invariant #5a: Re-check case exists in rc_cases and is eligible
      const { data: caseCheck, error: caseCheckError } = await supabase
        .from("rc_cases")
        .select("id, case_status, is_superseded")
        .eq("id", selectedCaseId)
        .single();

      if (caseCheckError || !caseCheck) {
        toast.error("Contract failure: case not found in rc_cases. Assignment blocked.");
        console.error("[CONTRACT] Case existence check failed:", selectedCaseId, caseCheckError);
        return;
      }
      if (caseCheck.is_superseded) {
        toast.error("Contract failure: case is superseded. Assignment blocked.");
        return;
      }

      // Invariant #5b: Re-check RN exists in rc_rns with matching auth_user_id
      const { data: rnCheck, error: rnCheckError } = await supabase
        .from("rc_rns")
        .select("id, auth_user_id, is_active, is_supervisor")
        .eq("auth_user_id", selectedRnAuthUserId)
        .single();

      if (rnCheckError || !rnCheck) {
        toast.error("Contract failure: RN not found in rc_rns. Assignment blocked.");
        console.error("[CONTRACT] RN existence check failed:", selectedRnAuthUserId, rnCheckError);
        return;
      }
      if (!rnCheck.is_active) {
        toast.error("Contract failure: RN is not active. Assignment blocked.");
        return;
      }
      if (rnCheck.is_supervisor) {
        toast.error("Contract failure: cannot assign to a supervisor. Assignment blocked.");
        return;
      }

      // Write assignment
      console.info("[STAGING] Assigning case:", selectedCaseId, "to RN auth_user_id:", selectedRnAuthUserId, "name:", rnName);

      const upd = await supabase
        .from("rc_cases")
        .update({ assigned_rn_id: selectedRnAuthUserId })
        .eq("id", selectedCaseId)
        .select("id, assigned_rn_id")
        .single();

      if (upd.error) {
        const msg = upd.error.message || String(upd.error);
        toast.warning(`Case assigned to ${rnName}, but queue update may be delayed. Error: ${msg}`);
        setAssignDialogOpen(false);
        setSelectedCaseId(null);
        setSelectedRnAuthUserId("");
        await loadAll();
        setAssigning(false);
        return;
      }

      // Post-write verification
      if (upd.data?.assigned_rn_id !== selectedRnAuthUserId) {
        toast.warning("Contract warning: post-write verification mismatch. Refreshing.");
        console.error("[CONTRACT] Post-write mismatch:", upd.data?.assigned_rn_id, "!==", selectedRnAuthUserId);
      } else {
        // Write governance audit event: RN_ASSIGNED_TO_CASE
        const epochId = generateEpochId();
        const assignmentMeta: GovernanceAssignmentMeta = {
          governance: true,
          assignment_epoch_id: epochId,
          assigned_rn_auth_user_id: selectedRnAuthUserId,
          assigned_rn_display: {
            rn_id: selectedRN.rn_id ?? null,
            full_name: selectedRN.full_name ?? null,
          },
          reason_code: "initial_assignment",
        };

        try {
          await audit({
            action: GOV_RN_ASSIGNED_TO_CASE,
            actorId: authUser.id,
            actorRole: "supervisor",
            caseId: selectedCaseId,
            meta: assignmentMeta,
          } as any);
          console.info("[STAGING] Audit event written:", GOV_RN_ASSIGNED_TO_CASE, "epoch:", epochId);
        } catch (auditErr: unknown) {
          // In staging, we want strictness: if audit fails, warn but don't roll back assignment
          console.error("[CONTRACT] Audit event write failed:", auditErr);
          toast.warning("Assignment succeeded but audit event failed to write. Check console.");
        }

        toast.success(`Case assigned to ${rnName}`);
      }

      setAssignDialogOpen(false);
      setSelectedCaseId(null);
      setSelectedRnAuthUserId("");
      await loadAll();
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign case.");
    } finally {
      setAssigning(false);
    }
  };

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch {
      return "—";
    }
  };

  const formatDateTime = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "MMM d, yyyy HH:mm");
    } catch {
      return "—";
    }
  };

  const handleRecordOutreach = async (caseId: string, rnUserId: string) => {
    setRecordingCaseId(caseId);
    try {
      await recordRnOutreachAttempt({
        case_id: caseId,
        rn_user_id: rnUserId,
        channel: recordChannel,
        note: recordNote.trim() || undefined,
      });
      toast.success("Outreach attempt recorded.");
      setRecordNote("");
      setActiveRecordRowId(null);
      await loadAll();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to record outreach attempt.");
    } finally {
      setRecordingCaseId(null);
    }
  };

  const formatUserName = (user: Record<string, any> | null | undefined): string => {
    if (!user) return "Unknown";
    if (user.full_name) return user.full_name;
    if (user.name) return user.name;
    if (user.display_name) return user.display_name;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`.trim();
    if (user.email) return user.email;
    if (user.id) return user.id.slice(0, 8);
    return "Unknown";
  };

  function renderCellValue(value: unknown): string {
    if (value === null || value === undefined) return "—";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    try {
      return JSON.stringify(value);
    } catch {
      return "[unrenderable]";
    }
  }

  // Error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
        <div className="max-w-xl mx-auto">
          <Card className="p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                We couldn't load supervisor data right now. {error}
              </AlertDescription>
            </Alert>
            <div className="mt-4 flex gap-3">
              {error.includes("Not logged in") || error.includes("not found") || error.includes("No supervisor profile") ? (
                <Button onClick={() => navigate("/rn-login")} variant="outline">Go to RN Login</Button>
              ) : (
                <Button onClick={handleRetry} variant="outline">Retry</Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Timeout fallback
  if (loading && loadTimedOut) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
        <div className="max-w-xl mx-auto">
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">Unable to load right now.</p>
            <Button onClick={handleRetry}>Retry</Button>
          </Card>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <div className="text-center text-muted-foreground">Loading…</div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/rn/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            <div className="mt-4 space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">RN Supervisor Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Review assignments, open items, and team activity.
              </p>
              {supervisorName && <p className="text-sm text-muted-foreground">Welcome, {supervisorName}.</p>}
            </div>
          </CardContent>
        </Card>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Cases Needing Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{pendingCases.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Recent Releases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-muted-foreground">—</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Crisis-Mode Flags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-muted-foreground">—</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Open RN Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-muted-foreground">—</div>
            </CardContent>
          </Card>
        </div>

        {/* Two-column: Supervisor Actions | Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Supervisor Actions</CardTitle>
              <CardDescription>Quick links to RN workflows and dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/rn/queue">Go to RN Work Queue</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/rn/dashboard">Go to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Latest team activity.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-muted-foreground">
                <Activity className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No recent activity to display.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {contractBlocking && (
          <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded mb-4">
            <strong>Staging Contract Error — Supervisor actions disabled</strong>
            <ul className="mt-1 text-sm list-disc list-inside">
              {contractErrors.slice(0, 5).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
            <p className="text-xs mt-1 text-red-600">
              Attestation source = rc_client_intakes.attorney_attested_at (consent-to-case linkage incomplete)
            </p>
          </div>
        )}
        {/* Pending Assignment Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Pending Assignment Queue
            </CardTitle>
            <CardDescription>
              Cases awaiting RN assignment (attorney confirmed, not yet assigned)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const totalExcluded = totalUnfilteredCount - pendingCases.length;
              if (totalExcluded <= 0) return null;
              return (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-sm">
                  <strong>Staging:</strong> {totalExcluded} case(s) excluded from queue (missing client_id or attorney attestation)
                </div>
              );
            })()}
            {pendingCases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-60" />
                <p className="font-medium">No cases waiting for assignment.</p>
                <p className="text-sm">All attorney-confirmed cases have been assigned.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold text-sm">Case Number</th>
                      <th className="text-left p-2 font-semibold text-sm">Client Name</th>
                      <th className="text-left p-2 font-semibold text-sm">Date of Injury</th>
                      <th className="text-left p-2 font-semibold text-sm">Attorney</th>
                      <th className="text-left p-2 font-semibold text-sm">Attested</th>
                      <th className="text-left p-2 font-semibold text-sm">Case Type</th>
                      <th className="text-left p-2 font-semibold text-sm border-l-2 border-gray-300">Assigned RN</th>
                      <th className="text-left p-2 font-semibold text-sm">State</th>
                      <th className="text-left p-2 font-semibold text-sm">Acceptance Timer</th>
                      <th className="text-left p-2 font-semibold text-sm">Notification</th>
                      <th className="text-left p-2 font-semibold text-sm">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingCases.map((caseItem) => {
                      const clientName = getClientDisplayName(
                        {
                          client_first_name: caseItem.rc_clients?.first_name || null,
                          client_last_name: caseItem.rc_clients?.last_name || null,
                          intake_json: caseItem.intake_json || null,
                        },
                        { intake_json: caseItem.intake_json || null }
                      );
                      const attorneyName = formatUserName(caseItem.rc_users);
                      const caseNumber = caseItem.case_number || caseItem.id.slice(0, 8);
                      return (
                        <tr key={caseItem.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-mono text-sm">{renderCellValue(caseNumber)}</td>
                          <td className="p-2 text-sm">{renderCellValue(clientName)}</td>
                          <td className="p-2 text-sm">{renderCellValue(formatDate(caseItem.date_of_injury))}</td>
                          <td className="p-2 text-sm">
                            {(() => {
                              if (!caseItem.attorney_id) return <span className="text-amber-700 text-xs">Missing attorney_id</span>;
                              if (!attorneyName || attorneyName === 'Unknown') return <span className="text-amber-700 text-xs">Contract violation</span>;
                              return renderCellValue(attorneyName);
                            })()}
                          </td>
                          <td className="p-2 text-sm">
                            {(() => {
                              const intake = intakeMap.get(caseItem.id);
                              if (!intake) return <span className="text-amber-700 text-xs">Missing intake link</span>;
                              return renderCellValue(formatDate(intake.attorney_attested_at));
                            })()}
                          </td>
                          <td className="p-2 text-sm">
                            {caseItem.case_type ? <span className="px-2 py-1 bg-muted rounded text-xs">{renderCellValue(caseItem.case_type)}</span> : "—"}
                          </td>
                          <td className="px-4 py-3 text-sm border-l-2 border-gray-300">
                            {caseItem.assigned_rn_id
                              ? (lifecycleEvents.get(caseItem.id)?.rn_display_name ||
                                 availableRNs.find((rn) => rn.auth_user_id === caseItem.assigned_rn_id)?.full_name ||
                                 caseItem.assigned_rn_id?.slice(0, 8))
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {(() => {
                              const lc = lifecycleEvents.get(caseItem.id);
                              if (!caseItem.assigned_rn_id) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">Unassigned</span>;
                              if (!lc) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Assigned (no event)</span>;
                              if (lc.declined_at) return (
                                <div>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Declined</span>
                                  <span className="block text-xs text-gray-500 mt-0.5">by {lc.rn_display_name || "RN"} — ready to reassign</span>
                                </div>
                              );
                              if (lc.accepted_at && !lc.ack_sent_at) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Pending note</span>;
                              return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Pending acceptance</span>;
                            })()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {(() => {
                              const lc = lifecycleEvents.get(caseItem.id);
                              if (!lc) return "—";
                              if (lc.accepted_at) return <span className="text-green-600 text-xs">✓ Accepted</span>;
                              if (lc.declined_at) return <span className="text-red-600 text-xs">✗ Declined</span>;
                              const assignedAt = new Date(lc.assigned_at);
                              const now = new Date();
                              const elapsedMs = now.getTime() - assignedAt.getTime();
                              const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));
                              const elapsedMins = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
                              const breached = elapsedMs > 8 * 60 * 60 * 1000;
                              return (
                                <span className={breached ? "text-red-600 font-semibold" : "text-gray-700"}>
                                  {elapsedHours}h {elapsedMins}m
                                  {breached && " ⚠ BREACH"}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {(() => {
                              const lc = lifecycleEvents.get(caseItem.id);
                              if (!lc || !lc.accepted_at) return "—";
                              if (lc.ack_sent_at) return <span className="text-green-600 text-xs">✓ Sent</span>;
                              const acceptedAt = new Date(lc.accepted_at);
                              const fourHoursLater = new Date(acceptedAt.getTime() + 4 * 60 * 60 * 1000);
                              const eod = new Date(acceptedAt);
                              eod.setHours(17, 0, 0, 0);
                              if (acceptedAt.getHours() >= 17) {
                                eod.setDate(eod.getDate() + 1);
                                while (eod.getDay() === 0 || eod.getDay() === 6) eod.setDate(eod.getDate() + 1);
                              }
                              const deadline = fourHoursLater < eod ? fourHoursLater : eod;
                              const now = new Date();
                              const remainingMs = deadline.getTime() - now.getTime();
                              const breached = remainingMs <= 0;
                              if (breached) {
                                const overMs = Math.abs(remainingMs);
                                const overH = Math.floor(overMs / (1000 * 60 * 60));
                                const overM = Math.floor((overMs % (1000 * 60 * 60)) / (1000 * 60));
                                return <span className="text-red-600 font-semibold">{overH}h {overM}m over ⚠ BREACH</span>;
                              }
                              const remH = Math.floor(remainingMs / (1000 * 60 * 60));
                              const remM = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
                              return <span className="text-gray-700">{remH}h {remM}m left</span>;
                            })()}
                          </td>
                          <td className="px-4 py-3">
                            {(() => {
                              const lc = lifecycleEvents.get(caseItem.id);

                              // Unassigned → Assign button
                              if (!caseItem.assigned_rn_id) {
                                return (
                                  <button
                                    onClick={() => { setSelectedCaseId(caseItem.id); setAssignDialogOpen(true); }}
                                    disabled={contractBlocking}
                                    className="bg-yellow-700 hover:bg-yellow-800 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                                  >
                                    Assign
                                  </button>
                                );
                              }

                              // Pending note → Send Welcome Note + Unassign
                              if (lc?.accepted_at && !lc?.ack_sent_at) {
                                return (
                                  <div className="flex flex-col gap-1">
                                    <button
                                      onClick={async () => {
                                        try {
                                          const { recordAckNoteSent } = await import("@/lib/rnAcknowledgment");
                                          const authUser = (await supabase.auth.getUser()).data.user;
                                          if (!authUser) return;
                                          await recordAckNoteSent({
                                            case_id: caseItem.id,
                                            sender_user_id: authUser.id,
                                            sender_role: "supervisor",
                                            epoch_id: lc.epoch_id,
                                            assigned_rn_auth_user_id: lc.rn_auth_id,
                                            sent_to: ["client", "attorney", "rn"],
                                          });
                                          toast.success("Welcome note recorded.");
                                          loadAll();
                                        } catch (err: unknown) {
                                          toast.error(err instanceof Error ? err.message : "Failed to send welcome note.");
                                        }
                                      }}
                                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                                    >
                                      Send Welcome Note
                                    </button>
                                    <div className="flex gap-1 mt-1">
                                      <button onClick={() => handleUnassignOpen(caseItem.id)} className="text-xs text-gray-500 hover:text-red-600 underline">Unassign</button>
                                    </div>
                                  </div>
                                );
                              }

                              // Declined → Assign (same as unassigned) + Unassign + Nudge
                              if (lc?.declined_at) {
                                return (
                                  <div className="flex flex-col gap-1">
                                    <button
                                      onClick={() => { setSelectedCaseId(caseItem.id); setAssignDialogOpen(true); }}
                                      disabled={contractBlocking}
                                      className="bg-yellow-700 hover:bg-yellow-800 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                                    >
                                      Assign
                                    </button>
                                    <div className="flex gap-1 mt-1">
                                      <button onClick={() => handleUnassignOpen(caseItem.id)} className="text-xs text-gray-500 hover:text-red-600 underline">Unassign</button>
                                      <button onClick={() => handleNudgeOpen(caseItem.id)} className="text-xs text-gray-500 hover:text-orange-600 underline">Nudge</button>
                                    </div>
                                  </div>
                                );
                              }

                              // Pending acceptance (with epoch) → Unassign + Nudge (if breached)
                              if (lc && !lc.accepted_at && !lc.declined_at) {
                                const elapsedMs = new Date().getTime() - new Date(lc.assigned_at).getTime();
                                const breached = elapsedMs > 8 * 60 * 60 * 1000;
                                return (
                                  <div className="flex flex-col gap-1">
                                    <div className="flex gap-1">
                                      <button onClick={() => handleUnassignOpen(caseItem.id)} className="text-xs text-gray-500 hover:text-red-600 underline">Unassign</button>
                                    </div>
                                    {breached && (
                                      <button onClick={() => handleNudgeOpen(caseItem.id)} className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm mt-1">Nudge</button>
                                    )}
                                  </div>
                                );
                              }

                              // Assigned (no event / legacy) → Unassign only
                              return (
                                <div className="flex gap-1">
                                  <button onClick={() => handleUnassignOpen(caseItem.id)} className="text-xs text-gray-500 hover:text-red-600 underline">Unassign</button>
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Outreach SLA Tracker (Supervisor only) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Outreach SLA Tracker
            </CardTitle>
            <CardDescription>
              SLA: first outreach attempt within 4 hours or by EOD (17:00 CT). Tracks attempted outreach only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {slaLoading ? (
              <div className="py-6 text-center text-muted-foreground">Loading SLA status…</div>
            ) : assignedCasesWithSla.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p className="font-medium">No assigned active cases.</p>
                <p className="text-sm">Cases with an assigned RN will appear here with SLA status.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold text-sm">Case</th>
                      <th className="text-left p-2 font-semibold text-sm">Assigned RN</th>
                      <th className="text-left p-2 font-semibold text-sm">SLA Status</th>
                      <th className="text-left p-2 font-semibold text-sm">Due / Breached / Last Attempt</th>
                      <th className="text-left p-2 font-semibold text-sm">Record Attempt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedCasesWithSla.map((row) => {
                      const s = row.sla_status;
                      const statusBadge =
                        s.status === "met" ? (
                          <Badge variant="default" className="bg-green-600">Met</Badge>
                        ) : s.status === "due" ? (
                          <Badge variant="secondary">Due</Badge>
                        ) : s.status === "breached" ? (
                          <Badge variant="destructive">Breached</Badge>
                        ) : (
                          <Badge variant="outline">N/A</Badge>
                        );
                      const dateDisplay =
                        s.due_at ? formatDateTime(s.due_at) :
                        s.breached_at ? formatDateTime(s.breached_at) :
                        s.last_attempt_at ? formatDateTime(s.last_attempt_at) : "—";
                      const canRecord = s.status !== "not_applicable";
                      return (
                        <tr key={row.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-mono text-sm">{row.case_number ?? row.id.slice(0, 8)}</td>
                          <td className="p-2 text-sm">{row.rn_name}</td>
                          <td className="p-2">{statusBadge}</td>
                          <td className="p-2 text-sm text-muted-foreground">{dateDisplay}</td>
                          <td className="p-2">
                            {canRecord && (
                              activeRecordRowId === row.id ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  <Select value={recordChannel} onValueChange={(v) => setRecordChannel(v as OutreachChannel)}>
                                    <SelectTrigger className="w-[120px] h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="phone">Phone</SelectItem>
                                      <SelectItem value="email">Email</SelectItem>
                                      <SelectItem value="text">Text</SelectItem>
                                      <SelectItem value="portal_message">Portal</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    placeholder="Note (optional)"
                                    className="h-8 w-32"
                                    value={recordNote}
                                    onChange={(e) => setRecordNote(e.target.value)}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => void handleRecordOutreach(row.id, row.assigned_rn_id)}
                                    disabled={recordingCaseId === row.id}
                                  >
                                    {recordingCaseId === row.id ? "Recording…" : "Record attempt"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => { setActiveRecordRowId(null); setRecordNote(""); }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => { setActiveRecordRowId(row.id); setRecordChannel("phone"); setRecordNote(""); }}
                                >
                                  Record attempt
                                </Button>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assign RN Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Case to RN</DialogTitle>
              <DialogDescription>
                Select an RN to assign this case to. The RN will receive the assignment in their work queue.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select RN</label>
                <Select value={selectedRnAuthUserId} onValueChange={setSelectedRnAuthUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an RN…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRNs.map((rn) => (
                      <SelectItem key={rn.auth_user_id} value={rn.auth_user_id ?? ""}>{formatRcRnsDisplayName(rn)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setAssignDialogOpen(false); setSelectedCaseId(null); setSelectedRnAuthUserId(""); }} disabled={assigning}>
                Cancel
              </Button>
              <Button onClick={() => void handleAssignConfirm()} disabled={assigning || contractBlocking || !selectedRnAuthUserId}>
                {assigning ? "Assigning…" : "Assign Case"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Unassign Dialog */}
        {unassignDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Unassign RN from Case</h3>
              <p className="text-sm text-gray-600 mb-4">This will remove the RN assignment and return the case to the unassigned pool.</p>

              <label className="block text-sm font-medium mb-1">Reason</label>
              <select value={unassignReasonCode} onChange={(e) => setUnassignReasonCode(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 mb-3 text-sm">
                <option value="declined">RN declined</option>
                <option value="sla_breach">SLA breach</option>
                <option value="coverage">Coverage change</option>
                <option value="supervisor_override">Supervisor override</option>
                <option value="legacy_repair">Legacy repair</option>
                <option value="other">Other (please specify)</option>
              </select>

              {unassignReasonCode === "other" && (
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Details</label>
                  <textarea value={unassignReasonText} onChange={(e) => setUnassignReasonText(e.target.value)} maxLength={300} rows={2} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Please explain..." />
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setUnassignDialogOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                <button onClick={handleUnassignConfirm} disabled={supervisorActionLoading || (unassignReasonCode === "other" && !unassignReasonText.trim())} className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">
                  {supervisorActionLoading ? "Unassigning..." : "Confirm Unassign"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reassign Dialog */}
        {reassignDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Reassign Case to New RN</h3>
              <p className="text-sm text-gray-600 mb-4">This will reassign the case, generate a new epoch, and reset acceptance clocks.</p>

              <label className="block text-sm font-medium mb-1">New RN</label>
              <select value={reassignSelectedRnAuthUserId} onChange={(e) => setReassignSelectedRnAuthUserId(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 mb-3 text-sm">
                <option value="">Choose an RN...</option>
                {availableRNs.map((rn) => (
                  <option key={rn.auth_user_id} value={rn.auth_user_id ?? ""}>{rn.full_name ?? rn.auth_user_id}</option>
                ))}
              </select>

              <label className="block text-sm font-medium mb-1">Reason</label>
              <select value={reassignReasonCode} onChange={(e) => setReassignReasonCode(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 mb-3 text-sm">
                <option value="declined">RN declined</option>
                <option value="sla_breach">SLA breach</option>
                <option value="coverage">Coverage change</option>
                <option value="supervisor_override">Supervisor override</option>
                <option value="other">Other (please specify)</option>
              </select>

              {reassignReasonCode === "other" && (
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Details</label>
                  <textarea value={reassignReasonText} onChange={(e) => setReassignReasonText(e.target.value)} maxLength={300} rows={2} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Please explain..." />
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setReassignDialogOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                <button onClick={handleReassignConfirm} disabled={supervisorActionLoading || !reassignSelectedRnAuthUserId || (reassignReasonCode === "other" && !reassignReasonText.trim())} className="px-4 py-2 text-sm bg-yellow-700 text-white rounded hover:bg-yellow-800 disabled:opacity-50">
                  {supervisorActionLoading ? "Reassigning..." : "Confirm Reassign"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Nudge Dialog */}
        {nudgeDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Nudge RN</h3>
              <p className="text-sm text-gray-600 mb-4">Record a supervisor intervention. This is an auditable note only — no notifications are sent.</p>

              <label className="block text-sm font-medium mb-1">Nudge Type</label>
              <select value={nudgeType} onChange={(e) => setNudgeType(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 mb-3 text-sm">
                <option value="acceptance_overdue">Acceptance overdue</option>
                <option value="notify_overdue">Notification overdue</option>
                <option value="declined_followup">Declined follow-up</option>
                <option value="general">General</option>
              </select>

              <label className="block text-sm font-medium mb-1">Message (20–300 characters)</label>
              <textarea value={nudgeMessage} onChange={(e) => setNudgeMessage(e.target.value)} maxLength={300} rows={4} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
              <span className="text-xs text-gray-400">{nudgeMessage.length}/300</span>

              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setNudgeDialogOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                <button onClick={handleNudgeConfirm} disabled={supervisorActionLoading || nudgeMessage.trim().length < 20} className="px-4 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50">
                  {supervisorActionLoading ? "Recording..." : "Record Nudge"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
