// src/pages/AttorneyCaseDocumentsPage.tsx
// Attorney case-scoped Documents & Reports hub. Read-only. Route: /attorney/cases/:caseId/documents

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Clock, Lock } from "lucide-react";
import { resolveAttorneyCase, getAttorneyCaseById } from "@/lib/attorneyCaseQueries";
import type { Case } from "@/config/rcms";
import { getDisplayName } from "@/lib/access";
import { useAuth } from "@/auth/supabaseAuth";
import { useApp } from "@/context/AppContext";
import { AttorneyCaseDocuments } from "@/components/attorney/AttorneyCaseDocuments";
import { AttorneyPrintReportButton } from "@/attorney/AttorneyPrintReportButton";
import type { CaseWithRevision } from "@/lib/resolveLatestReleasedCase";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUuid(s: string): boolean {
  return UUID_RE.test(s);
}

function transformAttorneyCaseToCase(
  row: { id: string; case_status?: string; created_at: string; updated_at?: string | null },
  userId?: string | null
): Case {
  const status = row.case_status === "released" ? "RELEASED" : row.case_status === "closed" ? "CLOSED" : "NEW";
  return {
    id: row.id,
    firmId: userId || "unknown",
    onsetOfService: row.created_at,
    client: {
      rcmsId: row.id,
      attyRef: "",
      displayNameMasked: "Unknown",
      fullName: "Unknown",
      dobMasked: "",
      gender: "prefer_not_to_say",
      state: "",
    },
    intake: { injuries: [] } as Case["intake"],
    fourPs: {},
    sdoh: {},
    demographics: {},
    consent: { signed: true, scope: { shareWithAttorney: true, shareWithProviders: true } },
    flags: [],
    sdohFlags: [],
    riskLevel: "stable",
    status,
    checkins: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

export default function AttorneyCaseDocumentsPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { user, rolesLoading, rolesLoadError } = useAuth();
  const { role, attorneyRoleNotConfigured } = useApp();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [rawRow, setRawRow] = useState<CaseWithRevision | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (rolesLoading || attorneyRoleNotConfigured) {
      setLoading(false);
      setCaseData(null);
      setRawRow(null);
      return;
    }
    if (!caseId || !isValidUuid(caseId)) {
      setLoading(false);
      setCaseData(null);
      setRawRow(null);
      return;
    }
    setLoading(true);
    setCaseData(null);
    setRawRow(null);
    (async () => {
      const resolved = await resolveAttorneyCase(caseId);
      const row = resolved ?? (await getAttorneyCaseById(caseId));
      if (row) {
        setCaseData(transformAttorneyCaseToCase(row, user?.id));
        setRawRow(row as unknown as CaseWithRevision);
      }
      setLoading(false);
    })();
  }, [caseId, rolesLoading, attorneyRoleNotConfigured, user?.id]);

  const status = (rawRow?.case_status || "").toLowerCase();
  const isActive = status === "released" || status === "closed";

  const statusLabel =
    status === "released" ? "Released" : status === "closed" ? "Closed" : "Awaiting RN Initial Care Plan";
  const statusSentence = isActive
    ? "This case has RN work released; documents and reports will appear below as available."
    : "RN Clinical Coordination will publish the initial care plan and supporting documents here after release.";
  const displayName = caseData ? getDisplayName(role, caseData) : "Case";

  // Guards
  if (rolesLoading || loading) {
    return (
      <AppLayout>
        <div className="p-8">
          <Button variant="ghost" onClick={() => navigate("/attorney/cases")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cases
          </Button>
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </AppLayout>
    );
  }

  if (rolesLoadError) {
    return (
      <AppLayout>
        <div className="p-8">
          <Button variant="ghost" onClick={() => navigate("/attorney/cases")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cases
          </Button>
          <p className="text-muted-foreground">Unable to load. Please refresh or try again.</p>
        </div>
      </AppLayout>
    );
  }

  if (attorneyRoleNotConfigured) {
    return (
      <AppLayout>
        <div className="p-8">
          <p className="text-muted-foreground">Your account role is not configured. Contact admin.</p>
        </div>
      </AppLayout>
    );
  }

  if (!caseId || !isValidUuid(caseId)) {
    return (
      <AppLayout>
        <div className="p-8">
          <Button variant="ghost" onClick={() => navigate("/attorney/cases")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cases
          </Button>
          <p className="text-muted-foreground">Invalid case.</p>
        </div>
      </AppLayout>
    );
  }

  if (!caseData) {
    return (
      <AppLayout>
        <div className="p-8">
          <Button variant="ghost" onClick={() => navigate("/attorney/cases")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cases
          </Button>
          <p className="text-muted-foreground">Case not found.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/attorney/cases/${caseId}`)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Case
        </Button>

        <h1 className="text-2xl font-bold text-foreground mb-2">Documents & Reports</h1>
        <p className="text-muted-foreground mb-6">{displayName} · Case {caseId.slice(0, 8)}…</p>

        {/* Status callout */}
        <Card className="p-4 border-border mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Confirmed → Awaiting RN Initial Care Plan → Released
            </span>
            <Badge variant={isActive ? "default" : "secondary"}>
              {statusLabel}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{statusSentence}</p>
        </Card>

        {/* Documents */}
        <section className="mb-8">
          <AttorneyCaseDocuments caseId={caseId} variant="documents" />
        </section>

        {/* Reports */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Reports
          </h2>
          {rawRow && isActive ? (
            <Card className="p-6 border-border">
              <p className="font-medium text-foreground mb-3">Open Printable Summary</p>
              <AttorneyPrintReportButton
                resolvedCase={rawRow}
                summary={null}
                clientLabel={displayName}
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: "Initial Care Plan (PDF)", desc: "Available after RN release." },
                { title: "Case Summary (Printable)", desc: "Available after RN release." },
                { title: "Revision History", desc: "Available after RN release." },
              ].map(({ title, desc }) => (
                <Card key={title} className="p-4 border-border flex flex-col items-center justify-center text-center min-h-[120px]">
                  <Lock className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="font-medium text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
