import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { Case } from "@/config/rcms";
import { toast } from "sonner";

export function TestActions() {
  const { cases, setCases, log, revokeConsent, setCurrentTier, providers, setProviders, extraProviderBlocks } = useApp();

  function createDemoCases() {
    const c1: Case = {
      id: "C-HEAD",
      firmId: "firm-001",
      client: {
        rcmsId: "RCMS-1001",
        attyRef: "AT-7001",
        dobMasked: "1980-XX-XX",
        gender: "female",
        state: "TX",
      },
      intake: {
        incidentType: "MVA",
        incidentDate: new Date().toISOString().slice(0, 10),
        initialTreatment: "ED",
        injuries: ["Head injury"],
        severitySelfScore: 7,
      },
      consent: {
        signed: true,
        signedAt: new Date().toISOString(),
        scope: { shareWithAttorney: true, shareWithProviders: true },
        restrictedAccess: true,
      },
      flags: ["HEAD_TRAUMA", "SENSITIVE"],
      status: "NEW",
      designatedAttorneyId: undefined,
      checkins: [{ ts: new Date().toISOString(), pain: 6, note: "nausea" }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const c2: Case = {
      id: "C-BACK",
      firmId: "firm-001",
      client: {
        rcmsId: "RCMS-1002",
        attyRef: "AT-7002",
        dobMasked: "1975-XX-XX",
        gender: "male",
        state: "TX",
      },
      intake: {
        incidentType: "WorkComp",
        incidentDate: new Date().toISOString().slice(0, 10),
        initialTreatment: "PCP",
        injuries: ["Back pain"],
        severitySelfScore: 5,
      },
      consent: {
        signed: true,
        signedAt: new Date().toISOString(),
        scope: { shareWithAttorney: true, shareWithProviders: true },
        restrictedAccess: false,
      },
      flags: [],
      status: "IN_PROGRESS",
      checkins: [
        { ts: new Date().toISOString(), pain: 4 },
        { ts: new Date().toISOString(), pain: 5 },
        { ts: new Date().toISOString(), pain: 7 },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const c3: Case = {
      id: "C-CHIRO",
      firmId: "firm-001",
      client: {
        rcmsId: "RCMS-1003",
        attyRef: "AT-7003",
        dobMasked: "1990-XX-XX",
        gender: "nonbinary",
        state: "TX",
      },
      intake: {
        incidentType: "MVA",
        incidentDate: new Date().toISOString().slice(0, 10),
        initialTreatment: "Chiro",
        injuries: [],
        severitySelfScore: 3,
      },
      consent: {
        signed: false,
        scope: { shareWithAttorney: false, shareWithProviders: false },
        restrictedAccess: false,
      },
      flags: [],
      status: "AWAITING_CONSENT",
      checkins: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCases([c1, c2, c3, ...cases]);
    log("TEST_CREATE_DEMO_CASES");
    toast.success("Demo cases created", {
      description: "3 test cases added: head injury (sensitive), WorkComp back pain, MVA without consent",
    });
  }

  function simulateRevokeOnCase1() {
    const first = cases.find((c) => c.id);
    if (!first) {
      toast.error("No cases available");
      return;
    }
    revokeConsent(first.id);
  }

  function switchTierSoloToMid() {
    setCurrentTier("Mid-Sized");
    log("TIER_SWITCH_SOLO_TO_MID");
    toast.success("Tier switched to Mid-Sized", {
      description: "Provider caps and seat allocations updated",
    });
  }

  function addTenProvidersToSolo() {
    let added = 0;
    const cap = 20 + extraProviderBlocks * 10; // Solo tier cap

    for (let i = 0; i < 10; i++) {
      const activeCount = providers.filter((p) => p.active).length;
      if (activeCount >= cap) break;

      const p = {
        id: "p-auto-" + Math.random().toString(36).slice(2, 6),
        name: `AutoProv ${i + 1}`,
        specialty: "Chiropractic",
        city: "City",
        state: "TX",
        active: true,
      };
      setProviders((arr) => [p, ...arr]);
      added++;
    }

    log("TEST_ADD_10_PROVIDERS");
    toast.info(`Added ${added} providers`, {
      description: `Attempted 10, added ${added} (cap enforced at ${cap})`,
    });
  }

  return (
    <Card className="p-4 border-border bg-muted/30">
      <h3 className="font-semibold text-foreground mb-3">Test Actions (Development)</h3>
      <div className="flex flex-wrap gap-2">
        <Button onClick={createDemoCases} size="sm">
          Create 3 Demo Cases
        </Button>
        <Button variant="outline" size="sm" onClick={simulateRevokeOnCase1}>
          Revoke Consent (Case #1)
        </Button>
        <Button variant="outline" size="sm" onClick={switchTierSoloToMid}>
          Switch Tier: Solo → Mid-Sized
        </Button>
        <Button variant="outline" size="sm" onClick={addTenProvidersToSolo}>
          Add 10 Providers (Solo)
        </Button>
      </div>
    </Card>
  );
}
