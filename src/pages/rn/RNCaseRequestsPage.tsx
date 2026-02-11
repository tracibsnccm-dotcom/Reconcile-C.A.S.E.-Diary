import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { RNCaseRequestsPanel } from "@/components/rn/RNCaseRequestsPanel";
import { RNEmptyState } from "@/components/rn/RNEmptyState";
import { isValidUuid } from "@/lib/rnUtils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { useRNCaseEditMode } from "@/hooks/useRNCaseEditMode";
import { RNCaseStateBadge } from "@/components/rn/RNCaseStateBadge";
import { supabase } from "@/integrations/supabase/client";
import { printHtml } from "@/lib/print";
import {
  buildRnReleasedReportBody,
  buildCaseSummaryFromReleasedData,
  RN_PRINT_STYLES,
} from "@/pages/rn/print/buildRnReleasedReportBody";

interface RnPrintExportButtonProps {
  onClick: () => void;
  printLoading: boolean;
}

function RnPrintExportButton({ onClick, printLoading }: RnPrintExportButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={printLoading}
      className="inline-flex items-center gap-2 border-[#0f2a6a] text-[#0f2a6a] hover:bg-[#0f2a6a]/10"
    >
      <Printer className="w-4 h-4" />
      {printLoading ? "Preparing…" : "Print / Export"}
    </Button>
  );
}

export default function RNCaseRequestsPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { mode, isViewOnly, backToDraftId, loading: modeLoading } = useRNCaseEditMode(caseId ?? null);
  const [caseInfo, setCaseInfo] = useState<{ clientName?: string; caseNumber?: string } | null>(null);
  const [releasedPlanId, setReleasedPlanId] = useState<string | null>(null);
  const [planLookupLoading, setPlanLookupLoading] = useState(false);
  const [planLookupError, setPlanLookupError] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);

  const loadCaseInfo = useCallback(async () => {
    if (!caseId) return;
    try {
      const { data: caseData } = await supabase
        .from("rc_cases")
        .select("case_number, client_id")
        .eq("id", caseId)
        .eq("is_superseded", false)
        .limit(1)
        .maybeSingle();
      if (!caseData) {
        setCaseInfo({});
        return;
      }
      let clientName: string | undefined;
      if (caseData.client_id) {
        const { data: clientData } = await supabase
          .from("rc_clients")
          .select("first_name, last_name")
          .eq("id", caseData.client_id)
          .limit(1)
          .maybeSingle();
        if (clientData) {
          clientName = [clientData.first_name, clientData.last_name].filter(Boolean).join(" ").trim() || undefined;
        }
      }
      setCaseInfo({ clientName, caseNumber: caseData.case_number ?? undefined });
    } catch {
      setCaseInfo({});
    }
  }, [caseId]);

  useEffect(() => {
    loadCaseInfo();
  }, [loadCaseInfo]);

  // When viewing a released/closed case, check if a submitted care plan exists (released snapshot).
  // Gate: only then show Print/Export. Uses rc_cases.revision_of_case_id + rc_care_plans (submitted).
  // Runs only when caseId exists and mode is released/closed. Cancels on caseId/mode change.
  useEffect(() => {
    if (!caseId || (mode !== "released" && mode !== "closed")) {
      setReleasedPlanId(null);
      setPlanLookupLoading(false);
      setPlanLookupError(false);
      return;
    }
    let cancelled = false;
    setPlanLookupLoading(true);
    setPlanLookupError(false);
    (async () => {
      try {
        const { data: caseRow } = await supabase
          .from("rc_cases")
          .select("revision_of_case_id")
          .eq("id", caseId)
          .maybeSingle();
        if (cancelled) return;
        const tryIds = [caseRow?.revision_of_case_id, caseId].filter(Boolean) as string[];
        for (const cid of tryIds) {
          const { data: plans } = await supabase
            .from("rc_care_plans")
            .select("id")
            .eq("case_id", cid)
            .eq("status", "submitted")
            .order("created_at", { ascending: false })
            .limit(1);
          if (cancelled) return;
          if (plans && plans.length > 0) {
            setReleasedPlanId(plans[0].id);
            setPlanLookupError(false);
            return;
          }
        }
        setReleasedPlanId(null);
        setPlanLookupError(true);
      } catch {
        if (!cancelled) {
          setReleasedPlanId(null);
          setPlanLookupError(true);
        }
      } finally {
        if (!cancelled) setPlanLookupLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [caseId, mode]);

  const handleBackToDraft = (draftId: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("rcms_active_case_id", draftId);
    }
    navigate(`/rn/case/${draftId}/requests`);
  };

  if (!caseId) {
    return (
      <AppLayout>
        <div className="p-6">
          <RNEmptyState
            title="No case selected"
            message="Select a case to continue."
            variant="empty"
            actions={[{ label: "Back to Dashboard", onClick: () => navigate("/rn/dashboard") }]}
          />
        </div>
      </AppLayout>
    );
  }

  if (!isValidUuid(caseId)) {
    return (
      <AppLayout>
        <div className="p-6">
          <RNEmptyState
            title="Case not available"
            message="Case not available."
            variant="error"
            actions={[{ label: "Back to Dashboard", onClick: () => navigate("/rn/dashboard") }]}
          />
        </div>
      </AppLayout>
    );
  }

  const caseIdentifier = [caseInfo?.clientName, caseInfo?.caseNumber].filter(Boolean).join(" • ") || (caseId ? caseId.slice(-8) : "—");

  const canPrintReleased =
    (mode === "released" || mode === "closed") &&
    !!releasedPlanId &&
    !planLookupError &&
    !planLookupLoading;

  const handlePrint = useCallback(async () => {
    if (!releasedPlanId) return;
    setPrintLoading(true);
    try {
      const [fourPsRes, vsRes, sdohRes] = await Promise.all([
        supabase
          .from("rc_fourps_assessments")
          .select("*")
          .eq("care_plan_id", releasedPlanId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("rc_care_plan_vs")
          .select("v_number, status, findings, recommendations")
          .eq("care_plan_id", releasedPlanId)
          .order("v_number", { ascending: true }),
        supabase
          .from("rc_sdoh_assessments")
          .select("*")
          .eq("care_plan_id", releasedPlanId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (fourPsRes.error || vsRes.error || sdohRes.error) return;
      const fourPsRow = fourPsRes.data ?? null;
      const careVsRows = (vsRes.data ?? []) as Array<{ v_number: number; status?: string | null; findings?: string | null; recommendations?: string | null }>;
      const sdohRow = sdohRes.data ?? null;
      if (!fourPsRow && (!careVsRows || careVsRows.length === 0) && !sdohRow) return;
      const summary = buildCaseSummaryFromReleasedData(fourPsRow, careVsRows, sdohRow);
      const body = `<style>${RN_PRINT_STYLES}</style>\n` + buildRnReleasedReportBody(summary);
      printHtml("Reconcile C.A.R.E. — RN Report (Released)", body, caseIdentifier);
    } catch {
      // silent; no toasts, no raw errors
    } finally {
      setPrintLoading(false);
    }
  }, [releasedPlanId, caseIdentifier]);

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header: Back to Dashboard + Case identifier; fixed min-height to prevent layout jump */}
        <div className="min-h-[3.5rem] flex items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/rn/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <span className="text-sm font-semibold text-slate-900">
              Case <span className="font-mono text-slate-600">{caseIdentifier}</span>
            </span>
            <Link
              to={`/rn/case/${caseId}/ten-vs`}
              className="text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              10-Vs
            </Link>
          </div>
          {canPrintReleased && (
            <RnPrintExportButton onClick={handlePrint} printLoading={printLoading} />
          )}
        </div>
        <RNCaseStateBadge
          mode={mode}
          isViewOnly={isViewOnly}
          loading={modeLoading}
          backToDraftId={backToDraftId}
          onBackToDraft={handleBackToDraft}
          showBackToDraft={true}
          showPublishHint={true}
          sourceCaseId={caseId}
          onCreateRevisionSuccess={(newDraftId) => {
            if (typeof window !== "undefined") {
              window.localStorage.setItem("rcms_active_case_id", newDraftId);
            }
            toast.success("Revision created. You are now editing a new draft.");
            navigate(`/rn/case/${newDraftId}/requests`);
          }}
        />
        <RNCaseRequestsPanel caseId={caseId} readOnly={isViewOnly} />
      </div>
    </AppLayout>
  );
}
