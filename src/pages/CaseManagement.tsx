import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkline } from "@/components/Sparkline";
import { RestrictedBanner } from "@/components/RestrictedBanner";
import { useApp } from "@/context/AppContext";
import { canSeeSensitive } from "@/lib/accessControl";
import { exportCSV, exportPDFStub } from "@/lib/export";
import { fmtDate } from "@/lib/store";
import { cn } from "@/lib/utils";
import { FileDown, Download, XCircle, UserCheck } from "lucide-react";
import { RCMS_CONFIG, ROLES } from "@/config/rcms";

export default function CaseManagement() {
  const {
    cases,
    setCases,
    role,
    exportAllowed,
    log,
    revokeConsent,
  } = useApp();

  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Case Management</h1>
          <p className="text-muted-foreground mt-1">
            Detailed case overview with export and management controls
          </p>
        </div>

        {cases.length === 0 ? (
          <Card className="p-12 text-center border-border">
            <p className="text-muted-foreground">No cases yet. Create cases via the Intake Wizard.</p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {cases.map((c) => {
              const restricted = c.consent.restrictedAccess;
              const allowed = canSeeSensitive(c, role);
              const latestCheckins = (c.checkins || []).slice(-6);
              const pains = latestCheckins.map((ci) => ci.pain);

              return (
                <Card key={c.id} className="p-6 border-border">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-foreground">{c.id}</h3>
                    <Badge
                      className={cn(
                        "text-xs",
                        c.status === "HOLD_SENSITIVE"
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {c.status.replace(/_/g, " ")}
                    </Badge>
                  </div>

                  {restricted && !allowed && (
                    <div className="mb-4">
                      <RestrictedBanner />
                    </div>
                  )}

                  <div className="space-y-3 text-sm mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium text-foreground">Client:</span>{" "}
                          <span className="select-none text-muted-foreground" title="PHI block">
                            {allowed ? c.client.rcmsId : "Restricted"}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-foreground">DOB:</span>{" "}
                          <span className="select-none text-muted-foreground">
                            {allowed ? c.client.dobMasked : "1980-XX-XX"}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium text-foreground">Consent:</span>{" "}
                          <Badge variant={c.consent.signed ? "default" : "destructive"} className="ml-1">
                            {c.consent.signed ? "Signed" : "Not signed"}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Restricted:</span>{" "}
                          {c.consent.restrictedAccess ? "Yes" : "No"}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border">
                      <p>
                        <span className="font-medium text-foreground">Incident:</span>{" "}
                        {c.intake.incidentType} on {fmtDate(c.intake.incidentDate)} &middot;{" "}
                        <span className="font-medium text-foreground">Tx:</span>{" "}
                        {c.intake.initialTreatment}
                      </p>
                    </div>

                    <div>
                      <span className="font-medium text-foreground">Injuries:</span>{" "}
                      {allowed ? (c.intake.injuries.join(", ") || "—") : "Hidden"}
                    </div>

                    {pains.length > 0 && (
                      <div className="pt-2 border-t border-border flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Recent pain trend</span>
                        <Sparkline values={pains} color="hsl(var(--primary))" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        exportCSV(c);
                        log("EXPORT_CSV", c.id);
                      }}
                      disabled={!exportAllowed || c.status === "HOLD_SENSITIVE"}
                      title={
                        !exportAllowed
                          ? "Your role cannot export"
                          : c.status === "HOLD_SENSITIVE"
                          ? "Exports disabled after consent revocation"
                          : ""
                      }
                    >
                      <FileDown className="w-4 h-4 mr-1" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        exportPDFStub(c);
                        log("EXPORT_PDF", c.id);
                      }}
                      disabled={!exportAllowed || c.status === "HOLD_SENSITIVE"}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      PDF
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => revokeConsent(c.id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Revoke
                    </Button>
                    {RCMS_CONFIG.featureFlags.enableSensitiveCase && role === ROLES.ATTORNEY && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCases((arr) =>
                            arr.map((x) =>
                              x.id === c.id
                                ? {
                                    ...x,
                                    designatedAttorneyId: x.designatedAttorneyId
                                      ? undefined
                                      : "user-001",
                                  }
                                : x
                            )
                          );
                          log("TOGGLE_DESIGNATED_ATTORNEY", c.id);
                        }}
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        {c.designatedAttorneyId ? "Unset" : "Designate Me"}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
