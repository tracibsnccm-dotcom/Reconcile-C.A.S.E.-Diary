import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LabeledInput } from "@/components/LabeledInput";
import { useApp } from "@/context/AppContext";
import { fmtDate } from "@/lib/store";
import { Provider } from "@/config/rcms";
import { Shield, Users, Stethoscope, FileText } from "lucide-react";
import { toast } from "sonner";
import { TestActions } from "@/components/TestActions";

export default function AdminPanel() {
  const {
    tierCaps,
    currentTier,
    setCurrentTier,
    trialStartDate,
    setTrialStartDate,
    trialEndDate,
    setTrialEndDate,
    isTrialExpired,
    daysUntilInactive,
    providers,
    setProviders,
    providerSlots,
    swapsUsed,
    setSwapsUsed,
    swapsCap,
    nextReset,
    extraProviderBlocks,
    setExtraProviderBlocks,
    audit,
    log,
  } = useApp();

  const [newProv, setNewProv] = useState({
    name: "",
    specialty: "",
    city: "",
    state: "",
  });

  const activeCount = providers.filter((p) => p.active).length;
  const canAdd = activeCount < providerSlots;

  function addProvider() {
    if (!canAdd) {
      toast.error("Provider slot cap reached", {
        description: "Upgrade tier or purchase additional provider blocks",
      });
      return;
    }

    const p: Provider = {
      id: "p-" + Math.random().toString(36).slice(2, 7),
      name: newProv.name || "New Provider",
      specialty: newProv.specialty || "General",
      city: newProv.city || "City",
      state: newProv.state || "ST",
      active: true,
    };

    setProviders((arr) => [p, ...arr]);
    setNewProv({ name: "", specialty: "", city: "", state: "" });
    log("PROVIDER_ADD");
    toast.success(`Added provider: ${p.name}`);
  }

  function toggleProviderActive(id: string) {
    setSwapsUsed((n) => {
      const next = n + 1;
      if (next > swapsCap) {
        toast.error("Swap cap exceeded", {
          description: `You've used all ${swapsCap} swaps this quarter`,
        });
        return n;
      }

      setProviders((arr) => arr.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
      log("PROVIDER_SWAP");
      toast.success("Provider status toggled (swap counted)");
      return next;
    });
  }

  function buyBlock10() {
    setExtraProviderBlocks((x) => x + 1);
    log("BUY_PROVIDER_BLOCK_10");
    toast.success("Purchased +10 provider slots", {
      description: "Additional slots are now available (demo)",
    });
  }

  function startTrial() {
    // New trials use trialStartDate (single source of truth)
    const startDate = new Date();
    setCurrentTier("Trial");
    setTrialStartDate(startDate.toISOString());
    // Also set trialEndDate for backward compat (optional, can be removed in future)
    const trialEnd = new Date(startDate);
    trialEnd.setDate(trialEnd.getDate() + 30); // 30 day trial
    setTrialEndDate(trialEnd.toISOString());
    log("TRIAL_STARTED");
    toast.success("Trial started", {
      description: `30-day trial ends ${fmtDate(trialEnd)}`,
    });
  }

  function expireTrialNow() {
    // Set trialStartDate to 31 days ago (expired)
    const expiredStart = new Date();
    expiredStart.setDate(expiredStart.getDate() - 31);
    setTrialStartDate(expiredStart.toISOString());
    // Also update trialEndDate for backward compat
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setTrialEndDate(yesterday.toISOString());
    log("TRIAL_EXPIRED_MANUALLY");
    toast.warning("Trial expired (set to 31 days ago)");
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground mt-1">Manage system settings and user access</p>
        </div>

        <div className="space-y-6">
          {/* Test Actions */}
          <TestActions />

          {/* Trial Status */}
          <Card className="p-6 border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Trial & Subscription Status
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Current Tier</p>
                <p className={`text-2xl font-bold ${
                  isTrialExpired ? "text-destructive" : "text-foreground"
                }`}>
                  {currentTier}
                </p>
              </div>
              {trialStartDate && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Trial Start Date</p>
                  <p className="text-lg font-semibold text-foreground">
                    {fmtDate(trialStartDate)}
                  </p>
                </div>
              )}
              {trialEndDate && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Trial End Date (computed)</p>
                  <p className="text-lg font-semibold text-foreground">
                    {fmtDate(trialEndDate)}
                  </p>
                </div>
              )}
              {currentTier === "Expired (Trial)" && daysUntilInactive !== null && (
                <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="text-sm text-destructive mb-1">Days Until Inactive</p>
                  <p className="text-2xl font-bold text-destructive">{daysUntilInactive}</p>
                </div>
              )}
              {currentTier === "Inactive" && (
                <div className="p-4 bg-muted rounded-lg col-span-2">
                  <p className="text-sm text-muted-foreground mb-2">Account Status</p>
                  <p className="text-sm text-destructive font-medium">
                    Trial expired over 30 days ago. Upgrade required to continue.
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={startTrial} variant="outline">
                Start 30-Day Trial
              </Button>
              {currentTier === "Trial" && (
                <Button onClick={expireTrialNow} variant="destructive">
                  Expire Trial Now (Test)
                </Button>
              )}
            </div>
          </Card>

          {/* Roles & Seats */}
          <Card className="p-6 border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Roles & Seats (Tier Configuration)
            </h2>
            {tierCaps ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Attorney Seats</p>
                  <p className="text-2xl font-bold text-foreground">{tierCaps.seats.attorneys}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Staff Seats</p>
                  <p className="text-2xl font-bold text-foreground">{tierCaps.seats.staff}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">RN-CCM Seats</p>
                  <p className="text-2xl font-bold text-foreground">{tierCaps.seats.rnCcm}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No tier configuration available</p>
            )}
          </Card>

          {/* Provider Management */}
          <Card className="p-6 border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" />
                Provider List Management
              </h2>
              <div className="text-sm text-muted-foreground">
                Slots: <b className="text-foreground">{activeCount}/{providerSlots}</b> &middot; Swaps:{" "}
                <b className="text-foreground">{swapsUsed}/{swapsCap}</b> (resets {fmtDate(nextReset)})
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-4 mb-4">
              <LabeledInput
                label="Name"
                value={newProv.name}
                onChange={(v) => setNewProv((s) => ({ ...s, name: v }))}
                placeholder="Provider name"
              />
              <LabeledInput
                label="Specialty"
                value={newProv.specialty}
                onChange={(v) => setNewProv((s) => ({ ...s, specialty: v }))}
                placeholder="e.g., Orthopedics"
              />
              <LabeledInput
                label="City"
                value={newProv.city}
                onChange={(v) => setNewProv((s) => ({ ...s, city: v }))}
                placeholder="City"
              />
              <LabeledInput
                label="State"
                value={newProv.state}
                onChange={(v) => setNewProv((s) => ({ ...s, state: v }))}
                placeholder="ST"
              />
            </div>

            <div className="flex gap-2 mb-6">
              <Button
                onClick={addProvider}
                disabled={!canAdd}
                title={!canAdd ? "No provider slots available" : ""}
              >
                Add Provider
              </Button>
              <Button variant="outline" onClick={buyBlock10}>
                Buy +10 Provider Block
              </Button>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted text-left">
                      <th className="py-3 px-4 font-semibold">Name</th>
                      <th className="py-3 px-4 font-semibold">Specialty</th>
                      <th className="py-3 px-4 font-semibold">City</th>
                      <th className="py-3 px-4 font-semibold">State</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card">
                    {providers.map((p) => (
                      <tr key={p.id} className="border-t border-border hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{p.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{p.specialty}</td>
                        <td className="py-3 px-4 text-muted-foreground">{p.city}</td>
                        <td className="py-3 px-4 text-muted-foreground">{p.state}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              p.active
                                ? "bg-success/10 text-success"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {p.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleProviderActive(p.id)}
                          >
                            {p.active ? "Deactivate" : "Activate"} (swap)
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* Audit Log */}
          <Card className="p-6 border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Audit Log
            </h2>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="max-h-96 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted">
                    <tr className="text-left">
                      <th className="py-2 px-3 font-semibold">Time</th>
                      <th className="py-2 px-3 font-semibold">Actor</th>
                      <th className="py-2 px-3 font-semibold">Action</th>
                      <th className="py-2 px-3 font-semibold">Case</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card">
                    {audit.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted-foreground">
                          No audit entries yet
                        </td>
                      </tr>
                    ) : (
                      audit
                        .slice()
                        .reverse()
                        .map((e, i) => (
                          <tr key={i} className="border-t border-border hover:bg-muted/50">
                            <td className="py-2 px-3 text-muted-foreground">
                              {new Date(e.ts).toLocaleString()}
                            </td>
                            <td className="py-2 px-3 font-medium">{e.actorRole}</td>
                            <td className="py-2 px-3 text-muted-foreground">{e.action}</td>
                            <td className="py-2 px-3 text-muted-foreground">{e.caseId}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
