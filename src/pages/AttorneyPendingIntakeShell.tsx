// Attorney Pending Intake Shell — /attorney/intakes/:intakeId
// View for intakes in "Awaiting RN Initial Care Plan" (attorney_confirmed).
// Separate from /attorney/cases/:caseId which is for released cases only.

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, FileText } from "lucide-react";
import { AttorneyCommunicationCenter } from "@/components/attorney/AttorneyCommunicationCenter";
import { AttorneyCaseDocuments } from "@/components/attorney/AttorneyCaseDocuments";
import { AttorneyCaseReports } from "@/components/attorney/AttorneyCaseReports";
import { AttorneyRnAssignmentReadOnly } from "@/components/attorney/AttorneyRnAssignmentReadOnly";
import { getAttorneyCaseStageLabel } from "@/lib/attorneyCaseStageLabels";
import { supabaseGet } from "@/lib/supabaseRest";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUuid(s: string): boolean {
  return UUID_RE.test(s);
}

type Intake = {
  id: string;
  case_id: string;
  intake_status: string;
  attorney_attested_at: string | null;
};

type CaseData = {
  assigned_rn_id: string | null;
  updated_at: string | null;
};

export default function AttorneyPendingIntakeShell() {
  const { intakeId } = useParams<"intakeId">();
  const navigate = useNavigate();
  const [intake, setIntake] = useState<Intake | null>(null);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [submittedCarePlanId, setSubmittedCarePlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const loadCaseData = useCallback(async (cId: string) => {
    const { data } = await supabaseGet<CaseData[] | CaseData>(
      "rc_cases",
      `id=eq.${cId}&select=assigned_rn_id,updated_at&is_superseded=eq.false`
    );
    const row = Array.isArray(data) ? data[0] : data;
    setCaseData(row ?? null);
  }, []);

  useEffect(() => {
    if (!intakeId || !isValidUuid(intakeId)) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    setLoading(true);
    setNotFound(false);
    (async () => {
      const { data, error } = await supabaseGet<Intake[] | Intake>(
        "rc_client_intakes",
        `id=eq.${intakeId}&select=id,case_id,intake_status,attorney_attested_at`
      );
      if (error || !data) {
        setIntake(null);
        setNotFound(true);
        setLoading(false);
        return;
      }
      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.case_id) {
        setIntake(null);
        setNotFound(true);
        setLoading(false);
        return;
      }
      // Shell is for "Awaiting RN Initial Care Plan" — attorney_confirmed or attested
      const isViewable =
        row.intake_status === "attorney_confirmed" || !!row.attorney_attested_at;
      if (!isViewable) {
        setIntake(null);
        setNotFound(true);
        setLoading(false);
        return;
      }
      setIntake(row);
      if (row?.case_id) {
        loadCaseData(row.case_id).catch(() => setCaseData(null));
        // Check for submitted care plan (status === 'submitted')
        supabaseGet<{ id: string }[] | { id: string }>(
          "rc_care_plans",
          `case_id=eq.${row.case_id}&status=eq.submitted&select=id&order=submitted_at.desc&limit=1`
        ).then(({ data }) => {
          const plan = Array.isArray(data) ? data[0] : data;
          setSubmittedCarePlanId(plan?.id ?? null);
        }).catch(() => setSubmittedCarePlanId(null));
      }
      setLoading(false);
    })();
  }, [intakeId, loadCaseData]);

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/attorney/pending-intakes")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Intake List
          </Button>
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </AppLayout>
    );
  }

  if (notFound || !intake) {
    return (
      <AppLayout>
        <div className="p-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/attorney/pending-intakes")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Intake List
          </Button>
          <p className="text-muted-foreground">Intake not found</p>
        </div>
      </AppLayout>
    );
  }

  const caseId = intake.case_id;

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header + Back */}
        <Button
          variant="ghost"
          onClick={() => navigate("/attorney/pending-intakes")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Intake List
        </Button>

        {/* ATTORNEY-5: RN Care Plan Released callout — do not present as "still in intake" */}
        {submittedCarePlanId && (
          <Card className="mb-6 border-l-4 border-primary bg-primary/5">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-foreground mb-2">RN Care Plan Released</h2>
              <p className="text-sm text-muted-foreground mb-4">
                The initial RN care plan has been released. This case is now active.
              </p>
              <Button asChild>
                <Link to={`/attorney/care-plans/${submittedCarePlanId}`} className="inline-flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  View Released Care Plan
                </Link>
              </Button>
            </div>
          </Card>
        )}

        {/* RN Assignment — read-only (attorneys do not assign; RN Supervisor does) */}
        <div className="mb-6">
          <AttorneyRnAssignmentReadOnly
            assignedRnId={caseData?.assigned_rn_id ?? null}
            updatedAt={caseData?.updated_at ?? undefined}
          />
        </div>

        {/* Case Status card */}
        <Card className="p-6 border-border mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            {getAttorneyCaseStageLabel({
              attorney_attested_at: intake.attorney_attested_at,
              assigned_rn_id: caseData?.assigned_rn_id ?? null,
            })}
          </h2>
          <div className="space-y-2 text-muted-foreground">
            <p>
              {caseData?.assigned_rn_id
                ? "An RN has been assigned. RN work may be in progress."
                : "RN work has not started for this intake yet."}
            </p>
            <p>
              You can send requests to the RN, add internal notes, and review any
              uploaded documents.
            </p>
            {submittedCarePlanId && (
              <p className="pt-2">
                <Link
                  to={`/attorney/care-plans/${submittedCarePlanId}`}
                  className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                >
                  <FileText className="w-4 h-4" />
                  View Released Care Plan
                </Link>
              </p>
            )}
          </div>
        </Card>

        {/* Requests & Updates — wired by case_id (intake’s case) */}
        <div className="mb-6">
          <AttorneyCommunicationCenter caseId={caseId} />
        </div>

        {/* Documents — case-scoped; uses case_id. Empty state built-in. */}
        <div className="mb-6">
          <AttorneyCaseDocuments caseId={caseId} />
        </div>

        {/* Reports — AttorneyCaseReports provides Card + empty state */}
        <div className="mb-6">
          <AttorneyCaseReports caseId={caseId} />
        </div>
      </div>
    </AppLayout>
  );
}
