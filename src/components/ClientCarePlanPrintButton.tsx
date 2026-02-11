/**
 * Client-only: "Print / Export" for the released care plan/report.
 * Renders only when the case is released/closed AND a submitted care plan exists.
 * Uses buildClientReleasedReportBody and printHtml. No toasts; fail closed on errors.
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { printHtml } from "@/lib/print";
import { buildCaseSummaryFromReleasedData } from "@/pages/rn/print/buildRnReleasedReportBody";
import {
  buildClientReleasedReportBody,
  CLIENT_PRINT_STYLES,
} from "@/pages/client/print/buildClientReleasedReportBody";

interface ClientCarePlanPrintButtonProps {
  caseId: string;
}

export function ClientCarePlanPrintButton({ caseId }: ClientCarePlanPrintButtonProps) {
  const [releasedPlanId, setReleasedPlanId] = useState<string | null>(null);
  const [planLookupLoading, setPlanLookupLoading] = useState(false);
  const [planLookupError, setPlanLookupError] = useState(false);
  const [caseInfo, setCaseInfo] = useState<{ caseNumber?: string }>({});
  const [printLoading, setPrintLoading] = useState(false);

  // Released snapshot lookup: case_status in [released, closed] + rc_care_plans status=submitted
  // for [revision_of_case_id, caseId]. Same pattern as RNCaseRequestsPage.
  useEffect(() => {
    if (!caseId) {
      setReleasedPlanId(null);
      setPlanLookupLoading(false);
      setPlanLookupError(false);
      setCaseInfo({});
      return;
    }
    let cancelled = false;
    setPlanLookupLoading(true);
    setPlanLookupError(false);
    (async () => {
      try {
        const { data: caseRow } = await supabase
          .from("rc_cases")
          .select("case_status, revision_of_case_id, case_number")
          .eq("id", caseId)
          .eq("is_superseded", false)
          .maybeSingle();
        if (cancelled) return;

        const status = (caseRow?.case_status || "").toLowerCase();
        if (status !== "released" && status !== "closed") {
          setReleasedPlanId(null);
          setPlanLookupError(false);
          setCaseInfo({});
          return;
        }

        setCaseInfo({ caseNumber: caseRow?.case_number ?? undefined });
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
  }, [caseId]);

  const canPrintReleased =
    !!releasedPlanId && !planLookupLoading && !planLookupError;

  const caseIdentifier =
    caseInfo?.caseNumber ? `#${caseInfo.caseNumber}` : (caseId ? caseId.slice(-8) : "—");

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
      const careVsRows = (vsRes.data ?? []) as Array<{
        v_number: number;
        status?: string | null;
        findings?: string | null;
        recommendations?: string | null;
      }>;
      const sdohRow = sdohRes.data ?? null;
      if (!fourPsRow && (!careVsRows || careVsRows.length === 0) && !sdohRow) return;
      const summary = buildCaseSummaryFromReleasedData(fourPsRow, careVsRows, sdohRow);
      const body =
        `<style>${CLIENT_PRINT_STYLES}</style>\n` + buildClientReleasedReportBody(summary);
      printHtml("Reconcile C.A.R.E. — Care Plan (Released)", body, caseIdentifier);
    } finally {
      setPrintLoading(false);
    }
  }, [releasedPlanId, caseIdentifier]);

  if (!canPrintReleased) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handlePrint}
      disabled={printLoading}
      className="inline-flex items-center gap-2 border-rcms-gold text-rcms-navy hover:bg-rcms-gold/10"
    >
      <Printer className="w-4 h-4" />
      {printLoading ? "Preparing…" : "Print / Export"}
    </Button>
  );
}
