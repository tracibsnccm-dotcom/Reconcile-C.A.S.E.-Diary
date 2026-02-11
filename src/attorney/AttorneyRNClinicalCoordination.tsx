/**
 * Attorney RN Clinical Coordination — READ-ONLY view.
 * Shows RN clinical coordination outputs only after release. Never shows drafts.
 * Uses resolveAttorneyCase + rc_care_plans (submitted) as the released data source.
 */

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAttorneyCasesForPrivateNotes, resolveAttorneyCase } from "@/lib/attorneyCaseQueries";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, HeartPulse, Activity, AlertCircle } from "lucide-react";

interface CaseOption {
  id: string;
  case_number: string | null;
  client_name: string;
}

const CARE_PLAN_TYPE_LABELS: Record<string, string> = {
  initial: "Initial Care Plan",
  routine_60_day: "60-Day Routine Review",
  accelerated_30_day: "30-Day Accelerated Review",
  event_based: "Event-Based Review",
  attorney_request: "Attorney-Requested Review",
  discharge: "Discharge Care Plan",
};

const V_NAMES: Record<number, string> = {
  1: "Validate", 2: "Vitals", 3: "Verify", 4: "Visualize", 5: "Value",
  6: "Voice", 7: "Volunteer", 8: "Vigilance", 9: "Victory", 10: "Verify Discharge",
};

const SCORE_LABELS: Record<number, string> = {
  1: "Crisis", 2: "At Risk", 3: "Struggling", 4: "Stable", 5: "Thriving",
};

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function AttorneyRNClinicalCoordination() {
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [releasedRow, setReleasedRow] = useState<{
    id: string;
    case_status: string;
    released_at: string | null;
    revision_of_case_id: string | null;
  } | null>(null);
  const [carePlan, setCarePlan] = useState<{
    id: string;
    care_plan_type: string;
    plan_number: number | null;
    created_at: string | null;
  } | null>(null);
  const [fourPs, setFourPs] = useState<Record<string, unknown> | null>(null);
  const [careVs, setCareVs] = useState<Array<{ v_number: number; v_name: string; status: string | null; findings: string | null; recommendations: string | null }>>([]);
  const [sdoh, setSdoh] = useState<Record<string, unknown> | null>(null);
  const [loadStatus, setLoadStatus] = useState<"idle" | "loading" | "released" | "not_released" | "released_no_content" | "error">("idle");

  const caseId = selectedCaseId || null;

  // Load case list (same as Private Notes / Appointments — includes pending RN)
  useEffect(() => {
    getAttorneyCasesForPrivateNotes()
      .then((data) => setCases(data))
      .catch((e) => {
        console.error("AttorneyRNClinicalCoordination: cases fetch", e);
        setCases([]);
      })
      .finally(() => setCasesLoading(false));
  }, []);

  // Resolve released case and load care plan + 4Ps/10-Vs/SDOH (released content only)
  useEffect(() => {
    if (!caseId) {
      setReleasedRow(null);
      setCarePlan(null);
      setFourPs(null);
      setCareVs([]);
      setSdoh(null);
      setLoadStatus("idle");
      return;
    }

    let cancelled = false;
    setLoadStatus("loading");
    setReleasedRow(null);
    setCarePlan(null);
    setFourPs(null);
    setCareVs([]);
    setSdoh(null);

    (async () => {
      try {
        const resolved = await resolveAttorneyCase(caseId);
        if (cancelled) return;

        if (!resolved) {
          setLoadStatus("not_released");
          return;
        }

        const status = (resolved.case_status || "").toLowerCase();
        if (status !== "released" && status !== "closed") {
          setLoadStatus("not_released");
          return;
        }

        setReleasedRow({
          id: resolved.id,
          case_status: resolved.case_status || "",
          released_at: resolved.released_at || null,
          revision_of_case_id: resolved.revision_of_case_id || null,
        });

        // Care plan: prefer parent (revision_of_case_id) then self. Only submitted = released content.
        const tryIds = [resolved.revision_of_case_id, resolved.id].filter(Boolean) as string[];
        let plan: { id: string; care_plan_type?: string; plan_number?: number; created_at?: string } | null = null;

        for (const cid of tryIds) {
          const { data: plans } = await supabase
            .from("rc_care_plans")
            .select("id, care_plan_type, plan_number, created_at")
            .eq("case_id", cid)
            .eq("status", "submitted")
            .order("created_at", { ascending: false })
            .limit(1);
          if (cancelled) return;
          if (plans && plans.length > 0) {
            plan = plans[0];
            break;
          }
        }

        if (!plan) {
          setLoadStatus("released_no_content");
          return;
        }

        setCarePlan({
          id: plan.id,
          care_plan_type: plan.care_plan_type || "initial",
          plan_number: plan.plan_number ?? null,
          created_at: plan.created_at ?? null,
        });

        const planId = plan.id;

        const [fourPsRes, vsRes, sdohRes] = await Promise.all([
          supabase
            .from("rc_fourps_assessments")
            .select("*")
            .eq("care_plan_id", planId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("rc_care_plan_vs")
            .select("v_number, status, findings, recommendations")
            .eq("care_plan_id", planId)
            .order("v_number", { ascending: true }),
          supabase
            .from("rc_sdoh_assessments")
            .select("*")
            .eq("care_plan_id", planId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (cancelled) return;

        if (fourPsRes.data) setFourPs(fourPsRes.data as Record<string, unknown>);
        if (vsRes.data) {
          setCareVs((vsRes.data as Array<{ v_number: number; status: string | null; findings: string | null; recommendations: string | null }>).map((v) => ({
            v_number: v.v_number,
            v_name: V_NAMES[v.v_number] || `V${v.v_number}`,
            status: v.status,
            findings: v.findings,
            recommendations: v.recommendations,
          })));
        }
        if (sdohRes.data) setSdoh(sdohRes.data as Record<string, unknown>);

        setLoadStatus("released");
      } catch (e) {
        if (!cancelled) {
          console.error("AttorneyRNClinicalCoordination: load error", e);
          setLoadStatus("error");
        }
      }
    })();

    return () => { cancelled = true; };
  }, [caseId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select
          value={selectedCaseId || "__none__"}
          onValueChange={(v) => setSelectedCaseId(v === "__none__" ? "" : v)}
          disabled={casesLoading}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder={casesLoading ? "Loading…" : "Select a case"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Select a case</SelectItem>
            {cases.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.case_number || c.id.slice(0, 8)} — {c.client_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!casesLoading && cases.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No cases available yet. Cases will appear here after a client intake is confirmed.
        </p>
      )}

      {/* A) No case selected */}
      {!caseId && (
        <Card className="p-8 flex flex-col items-center justify-center min-h-[200px] text-center">
          <FileText className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground font-medium">Select a case to view RN clinical coordination.</p>
        </Card>
      )}

      {/* B) Case selected, RN work not yet released */}
      {caseId && loadStatus === "not_released" && (
        <Card className="p-8 flex flex-col items-center justify-center min-h-[200px] text-center border-amber-200 bg-amber-50/50">
          <Activity className="h-10 w-10 text-amber-600 mb-3" />
          <p className="font-medium text-foreground">RN clinical coordination is in progress.</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            This section will populate once the RN releases their work.
          </p>
        </Card>
      )}

      {/* Loading */}
      {caseId && loadStatus === "loading" && (
        <Card className="p-8 flex flex-col items-center justify-center min-h-[200px] text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Loading…</p>
        </Card>
      )}

      {/* C) Released but no care plan / Error */}
      {caseId && (loadStatus === "released_no_content" || loadStatus === "error") && (
        <Card className="p-8 flex flex-col items-center justify-center min-h-[200px] text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium text-foreground">RN clinical coordination is not yet available for this case.</p>
        </Card>
      )}

      {/* D) Released + content: read-only sections */}
      {caseId && loadStatus === "released" && releasedRow && carePlan && (
        <div className="space-y-6">
          {/* Client Approval Disclaimer Banner */}
          <Card className="p-4 border-muted bg-muted/30">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Client Review Status
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              This Initial Care Plan was developed by a Registered Nurse using information provided by the client. At the time of release, the client has not yet formally reviewed or approved this plan.
            </p>
          </Card>

          <Card className="p-4 border-muted">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span><strong className="text-foreground">Released:</strong> {releasedRow.released_at ? fmtDate(releasedRow.released_at) : "—"}</span>
              <span><strong className="text-foreground">Status:</strong> {releasedRow.case_status}</span>
              <span><strong className="text-foreground">Care Plan:</strong> {CARE_PLAN_TYPE_LABELS[carePlan.care_plan_type] || carePlan.care_plan_type}</span>
              {carePlan.plan_number != null && <span>#{carePlan.plan_number}</span>}
            </div>
          </Card>

          {/* 4Ps */}
          {fourPs && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <HeartPulse className="h-4 w-4" /> 4Ps of Wellness
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {[
                  { key: "p1_physical", notesKey: "p1_notes", label: "Physical" },
                  { key: "p2_psychological", notesKey: "p2_notes", label: "Psychological" },
                  { key: "p3_psychosocial", notesKey: "p3_notes", label: "Psychosocial" },
                  { key: "p4_professional", notesKey: "p4_notes", label: "Professional" },
                ].map(({ key, notesKey, label }) => {
                  const v = (fourPs as any)[key];
                  const score = typeof v === "number" ? v : null;
                  const note = (fourPs as any)[notesKey];
                  return (
                    <div key={key} className="rounded-md border border-border p-2">
                      <div className="text-muted-foreground">{label}</div>
                      <div className="font-semibold">{score != null ? `${score}/5 ${SCORE_LABELS[score] || ""}` : "—"}</div>
                      {note && <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{String(note)}</p>}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* 10-Vs */}
          {careVs.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">10-Vs Clinical Logic</h3>
              <ul className="space-y-2 text-sm">
                {careVs.map((v) => (
                  <li key={v.v_number} className="flex flex-col gap-1 rounded border border-border p-2">
                    <span className="font-medium">{v.v_number}. {v.v_name} {v.status ? `— ${v.status}` : ""}</span>
                    {v.findings && <span className="text-muted-foreground">{v.findings}</span>}
                    {v.recommendations && <span className="text-muted-foreground">Recommendation: {v.recommendations}</span>}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* SDOH */}
          {sdoh && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Social Determinants of Health (SDOH)</h3>
              <div className="flex flex-wrap gap-2 text-sm">
                {["economic_score", "education_score", "healthcare_score", "neighborhood_score", "social_score"].map((k) => {
                  const v = (sdoh as any)[k];
                  const label = k.replace(/_score$/, "").replace(/_/g, " ");
                  return (
                    <span key={k} className="rounded-md border border-border px-2 py-1">
                      {label}: {typeof v === "number" ? `${v}/5` : "—"}
                    </span>
                  );
                })}
              </div>
              {(sdoh as any).housing_insecurity || (sdoh as any).food_insecurity || (sdoh as any).transportation_barrier || (sdoh as any).financial_hardship || (sdoh as any).social_isolation ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Flags: {["housing_insecurity", "food_insecurity", "transportation_barrier", "financial_hardship", "social_isolation"]
                    .filter((f) => (sdoh as any)[f]).join(", ")}
                </p>
              ) : null}
            </Card>
          )}

          {/* Timeline / Provider Coordination placeholders — structure only when we have any section */}
          {(fourPs || careVs.length > 0 || sdoh) && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Timeline & Provider Coordination</h3>
              <p className="text-sm text-muted-foreground">Detailed timeline and provider coordination are available in the case Documents & Reports.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
