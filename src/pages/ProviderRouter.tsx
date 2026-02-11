import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { KPI } from "@/components/KPI";
import { LabeledSelect } from "@/components/LabeledSelect";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApp } from "@/context/AppContext";
import { fmtDate } from "@/lib/store";
import { AlertCircle, MapPin, MoreHorizontal } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { canAccess, FEATURE } from "@/lib/access";
import { PortalSharePanel } from "@/pages/provider/PortalShareDemo";

export default function ProviderRouter() {
  const {
    providers,
    providerSlots,
    routerEnabled,
    cases,
    setCases,
    swapsUsed,
    swapsCap,
    nextReset,
    log,
    role,
  } = useApp();

  const [specialtyFilter, setSpecialtyFilter] = useState("All Specialties");
  const [sortByDistance, setSortByDistance] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  const activeProviders = providers.filter((p) => p.active);
  const used = activeProviders.length;
  const remain = Math.max(0, providerSlots - used);

  const list = activeProviders
    .filter((p) => (specialtyFilter && specialtyFilter !== "All Specialties" ? p.specialty === specialtyFilter : true))
    .sort((a, b) =>
      sortByDistance
        ? (a.distanceMiles ?? 999) - (b.distanceMiles ?? 999)
        : a.name.localeCompare(b.name)
    );

  function routeCaseToProvider(caseId: string, providerId: string) {
    const theCase = cases.find((c) => c.id === caseId);
    if (!theCase) return;

    // Check if routing is allowed based on consent
    if (!canAccess(role, theCase, FEATURE.ROUTE_PROVIDER)) {
      toast.error("Routing disabled — client consent must allow provider sharing.");
      log("ACCESS_BLOCKED_ROUTE", caseId);
      return;
    }

    setCases((arr) =>
      arr.map((c) =>
        c.id === caseId
          ? { ...c, assignedProviderId: providerId, status: "ROUTED" }
          : c
      )
    );
    log("ROUTE_CASE", caseId);
    const provider = providers.find((p) => p.id === providerId);
    toast.success(`Case ${caseId} routed to ${provider?.name}`);
  }

  const allSpecialties = Array.from(new Set(providers.map((p) => p.specialty)));

  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Provider Router</h1>
          <p className="text-muted-foreground mt-1">Route cases to healthcare providers</p>
        </div>

        {!routerEnabled ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This module is not available in your current tier. Upgrade to access the Provider
              Router.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            <Card className="p-6 border-border">
              <div className="flex flex-wrap items-end gap-4 mb-6">
                <KPI
                  label="Active Providers"
                  value={`${used}/${providerSlots}`}
                  note={`${remain} remaining`}
                />

                <div className="flex-1 min-w-[200px]">
                  <LabeledSelect
                    label="Filter by specialty"
                    value={specialtyFilter}
                    onChange={setSpecialtyFilter}
                    options={["All Specialties", ...allSpecialties]}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sort-distance"
                    checked={sortByDistance}
                    onCheckedChange={(checked) => setSortByDistance(checked as boolean)}
                  />
                  <Label htmlFor="sort-distance" className="text-sm font-medium cursor-pointer">
                    Sort by proximity
                  </Label>
                </div>
              </div>

              <div className="rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted text-left">
                        <th className="py-3 px-4 font-semibold text-foreground">Name</th>
                        <th className="py-3 px-4 font-semibold text-foreground">Specialty</th>
                        <th className="py-3 px-4 font-semibold text-foreground">Location</th>
                        <th className="py-3 px-4 font-semibold text-foreground">Distance</th>
                        <th className="py-3 px-4 font-semibold text-foreground text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card">
                      {list.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-muted-foreground">
                            No active providers found
                          </td>
                        </tr>
                      ) : (
                        list.map((p) => (
                          <tr key={p.id} className="border-t border-border hover:bg-muted/50">
                            <td className="py-3 px-4 font-medium text-foreground">{p.name}</td>
                            <td className="py-3 px-4 text-muted-foreground">{p.specialty}</td>
                            <td className="py-3 px-4 text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {p.city}, {p.state}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {p.distanceMiles ? `${p.distanceMiles} mi` : "—"}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                    <span className="ml-2">Route case</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent 
                                  align="end" 
                                  className="w-56 bg-popover z-50"
                                >
                                  {cases.length === 0 ? (
                                    <DropdownMenuItem disabled>No cases available</DropdownMenuItem>
                                  ) : (
                                    cases.map((c) => (
                                      <DropdownMenuItem
                                        key={c.id}
                                        onClick={() => {
                                          routeCaseToProvider(c.id, p.id);
                                          setSelectedCaseId(c.id);
                                          setSelectedProviderId(p.id);
                                        }}
                                        className="cursor-pointer"
                                      >
                                        Route {c.id}
                                      </DropdownMenuItem>
                                    ))
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <b className="text-foreground">Provider Swaps:</b> {swapsUsed}/{swapsCap} used
                  this quarter (resets {fmtDate(nextReset)}). Swaps are enforced at
                  add/deactivate time.
                </p>
              </div>
            </Card>

            {/* Secure Portal Share - Show when a case and provider are selected */}
            {selectedCaseId && selectedProviderId && (() => {
              const selectedCase = cases.find(c => c.id === selectedCaseId);
              const selectedProvider = providers.find(p => p.id === selectedProviderId);
              
              if (!selectedCase || !selectedProvider) return null;

              // Build a non-PHI summary from case data
              const injuries = selectedCase.intake?.injuries?.join(", ") || "Injury details available";
              const caseSummary = `${selectedCase.intake?.incidentType || "Incident"} case - ${injuries}. Care coordination in progress.`;

              return (
                <div className="mt-6">
                  <PortalSharePanel
                    currentRole={role as any}
                    consent={{
                      scope: {
                        shareWithProviders: selectedCase.consent?.scope?.shareWithProviders ?? false
                      }
                    }}
                    caseInfo={{
                      id: selectedCase.id,
                      isSensitive: selectedCase.consent?.restrictedAccess ?? false,
                      clientLabel: selectedCase.client?.displayNameMasked || selectedCase.id,
                      summary: caseSummary
                    }}
                    provider={{
                      id: selectedProvider.id,
                      name: selectedProvider.name,
                      city: selectedProvider.city,
                      state: selectedProvider.state
                    }}
                  />
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
