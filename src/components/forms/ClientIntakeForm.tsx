// src/components/forms/ClientIntakeForm.tsx

import React, { useState } from "react";
import { AppState, Client, Flag, Task } from "../../lib/models";
import { evaluateTenVs, FourPsSnapshot } from "../../lib/vEngine";
import { evaluateIntakeWorkloadForNewCase } from "../../lib/workloadEnforcement";
import { createWorkloadOverrideFromIntake } from "../../lib/overrides";

/**
 * Reconcile C.A.R.E.™
 * Initial Intake Form — 10-Vs + Auto-Flags/Tasks + Workload Enforcement
 *
 * This form:
 * - Captures core client identity + Voice/View.
 * - Captures key 4Ps-related risk inputs (pain, mental health, SDOH, work).
 * - Builds a FourPsSnapshot for the 10-Vs engine.
 * - Runs the 10-Vs Clinical Logic Engine on intake.
 * - Computes an initial Viability Score + Viability Status from severity.
 * - Auto-creates initial Flags and Tasks from 4Ps + risk profile.
 * - Evaluates RN workload (Option A policy) against Director-defined limits.
 * - Blocks assignment when workload would exceed limit (Red),
 *   requiring Supervisor + Director involvement in future consoles.
 */

// Simple id helpers for flags/tasks (in-memory for now)
let flagCounter = 0;
let taskCounter = 0;

const nextFlagId = () => `flag-intake-${Date.now()}-${flagCounter++}`;
const nextTaskId = () => `task-intake-${Date.now()}-${taskCounter++}`;

// Map 4Ps snapshot to initial clinical flags
const buildInitialFlagsFromFourPs = (fourPs: FourPsSnapshot): Flag[] => {
  const flags: Flag[] = [];

  // Pain
  if (fourPs.physical.painScore !== undefined && fourPs.physical.painScore >= 7) {
    flags.push({
      id: nextFlagId(),
      label: `High pain score: ${fourPs.physical.painScore}/10`,
      severity: "High",
      status: "Open",
      type: "Physical Pain",
      created_at: new Date().toISOString(),
    } as Flag);
  }

  // Uncontrolled chronic condition
  if (fourPs.physical.uncontrolledChronicCondition) {
    flags.push({
      id: nextFlagId(),
      label: "Uncontrolled chronic condition reported",
      severity: "High",
      status: "Open",
      type: "Chronic Condition",
      created_at: new Date().toISOString(),
    } as Flag);
  }

  // Depression / anxiety
  if (fourPs.psychological.positiveDepressionAnxiety) {
    flags.push({
      id: nextFlagId(),
      label: "Depression / anxiety concern",
      severity: "High",
      status: "Open",
      type: "Psychological",
      created_at: new Date().toISOString(),
    } as Flag);
  }

  // High stress
  if (fourPs.psychological.highStress) {
    flags.push({
      id: nextFlagId(),
      label: "High stress reported",
      severity: "Moderate",
      status: "Open",
      type: "Psychological",
      created_at: new Date().toISOString(),
    } as Flag);
  }

  // SDOH barrier
  if (fourPs.psychosocial.hasSdohBarrier) {
    flags.push({
      id: nextFlagId(),
      label: "Social Determinant of Health barrier reported",
      severity: "High",
      status: "Open",
      type: "SDOH",
      created_at: new Date().toISOString(),
    } as Flag);
  }

  // Limited support
  if (fourPs.psychosocial.limitedSupport) {
    flags.push({
      id: nextFlagId(),
      label: "Limited / unreliable social support",
      severity: "Moderate",
      status: "Open",
      type: "Support",
      created_at: new Date().toISOString(),
    } as Flag);
  }

  // Unable to work
  if (fourPs.professional.unableToWork) {
    flags.push({
      id: nextFlagId(),
      label: "Unable to work due to condition / injury",
      severity: "High",
      status: "Open",
      type: "Professional / Work",
      created_at: new Date().toISOString(),
    } as Flag);
  }

  // Accommodations needed
  if (fourPs.professional.accommodationsNeeded) {
    flags.push({
      id: nextFlagId(),
      label: "Workplace accommodations needed or requested",
      severity: "Moderate",
      status: "Open",
      type: "Professional / Accommodations",
      created_at: new Date().toISOString(),
    } as Flag);
  }

  return flags;
};

// Map 4Ps snapshot + flags into initial RN CM tasks
const buildInitialTasksFromFourPs = (
  fourPs: FourPsSnapshot,
  flags: Flag[]
): Task[] => {
  const tasks: Task[] = [];
  const today = new Date();
  const dueInDays = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  // Pain-related task
  if (fourPs.physical.painScore !== undefined && fourPs.physical.painScore >= 7) {
    tasks.push({
      id: nextTaskId(),
      label: "Review high pain score with client and provider",
      status: "Open",
      due_date: dueInDays(3),
    } as Task);
  }

  // Uncontrolled chronic condition task
  if (fourPs.physical.uncontrolledChronicCondition) {
    tasks.push({
      id: nextTaskId(),
      label: "Coordinate follow-up plan for uncontrolled chronic condition",
      status: "Open",
      due_date: dueInDays(5),
    } as Task);
  }

  // Psychological / depression/anxiety
  if (fourPs.psychological.positiveDepressionAnxiety) {
    tasks.push({
      id: nextTaskId(),
      label: "Screen / refer for depression & anxiety support",
      status: "Open",
      due_date: dueInDays(5),
    } as Task);
  }

  // SDOH barrier
  if (fourPs.psychosocial.hasSdohBarrier) {
    tasks.push({
      id: nextTaskId(),
      label: "Address SDOH barrier(s) reported at intake",
      status: "Open",
      due_date: dueInDays(7),
    } as Task);
  }

  // Unable to work
  if (fourPs.professional.unableToWork) {
    tasks.push({
      id: nextTaskId(),
      label: "Clarify work status and discuss restrictions / RTW planning",
      status: "Open",
      due_date: dueInDays(7),
    } as Task);
  }

  // Accommodations needed
  if (fourPs.professional.accommodationsNeeded) {
    tasks.push({
      id: nextTaskId(),
      label: "Review workplace accommodation needs / documentation",
      status: "Open",
      due_date: dueInDays(10),
    } as Task);
  }

  // If there are any open High or Critical flags, create a general RN follow-up task
  const hasHighOrCritical = (flags || []).some(
    (f) =>
      f.status === "Open" &&
      (f.severity === "High" || f.severity === "Critical")
  );
  if (hasHighOrCritical) {
    tasks.push({
      id: nextTaskId(),
      label: "RN CM Priority Review: High-risk issues identified at intake",
      status: "Open",
      due_date: dueInDays(2),
    } as Task);
  }

  return tasks;
};

// Helper: compute a simple Viability Score from severity
const computeViabilityFromSeverity = (severityLevel: 1 | 2 | 3 | 4): number => {
  // Conservative mapping:
  // L1 (Simple)            → 10
  // L2 (Moderate)          → 8
  // L3 (Complex)           → 6
  // L4 (Severely Complex)  → 4
  switch (severityLevel) {
    case 1:
      return 10;
    case 2:
      return 8;
    case 3:
      return 6;
    case 4:
    default:
      return 4;
  }
};

const computeViabilityStatus = (score: number): string => {
  if (score >= 8) return "Stable / Lower-Intensity Needs";
  if (score >= 5) return "Moderate / Watchful Needs";
  return "High / Intensive Care Management Needs";
};

const nextFollowupDateISO = (daysAhead: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
};

interface ClientIntakeFormProps {
  onSaved: (state: AppState) => void;
}

const ClientIntakeForm: React.FC<ClientIntakeFormProps> = ({ onSaved }) => {
  // Basic identity
  const [name, setName] = useState("");
  const [voice, setVoice] = useState("");
  const [view, setView] = useState("");

  // 4Ps-related inputs
  const [painScore, setPainScore] = useState<number | undefined>(undefined);
  const [uncontrolledChronic, setUncontrolledChronic] = useState(false);
  const [depAnx, setDepAnx] = useState(false);
  const [highStress, setHighStress] = useState(false);
  const [sdohBarrier, setSdohBarrier] = useState(false);
  const [limitedSupport, setLimitedSupport] = useState(false);
  const [unableToWork, setUnableToWork] = useState(false);
  const [accommodationsNeeded, setAccommodationsNeeded] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Client name is required.");
      return;
    }

    setSaving(true);
    try {
      const clientId = `client-${Date.now()}`;

      // Build FourPsSnapshot based on intake responses
      const fourPs: FourPsSnapshot = {
        physical: {
          painScore: painScore,
          uncontrolledChronicCondition: uncontrolledChronic,
        },
        psychological: {
          positiveDepressionAnxiety: depAnx,
          highStress: highStress,
        },
        psychosocial: {
          hasSdohBarrier: sdohBarrier,
          limitedSupport: limitedSupport,
        },
        professional: {
          unableToWork: unableToWork,
          accommodationsNeeded: accommodationsNeeded,
        },
        anyHighRiskOrUncontrolled:
          (painScore !== undefined && painScore >= 7) ||
          uncontrolledChronic ||
          depAnx ||
          sdohBarrier ||
          unableToWork,
      };

      // Build initial flags & tasks from 4Ps snapshot
      const flags: Flag[] = buildInitialFlagsFromFourPs(fourPs);
      const tasks: Task[] = buildInitialTasksFromFourPs(fourPs, flags);

      // Temporary client for engine (Voice/View matter for V1)
      const clientForEval: Client = {
        id: clientId,
        name: name.trim(),
        voiceView:
          voice.trim() || view.trim()
            ? {
                voice: voice.trim(),
                view: view.trim(),
              }
            : undefined,
        cmDeclined: false,
      };

      const tenVsEval = evaluateTenVs({
        appState: { client: clientForEval, flags, tasks },
        client: clientForEval,
        flags,
        tasks,
        fourPs,
      });

      // 🔒 Workload enforcement (Option A — strict clinical ops)
      //
      // In this single-case sandbox, we assume current RN workload points = 0.
      // In production, this should come from a true RN workload summary that
      // accounts for all active cases.
      const currentRnWorkloadPoints = 0; // TODO: replace with real RN workload from backend
      const workloadDecision = evaluateIntakeWorkloadForNewCase(
        currentRnWorkloadPoints,
        tenVsEval.suggestedSeverity
      );

      if (!workloadDecision.allowAssignment) {
        // Block intake completion for RN.
        // Also create a workload override request object for future
        // Supervisor / Director consoles.
        const estimatedUtilizationPercent =
          workloadDecision.status === "Red"
            ? 100
            : 0;

        const overrideRequest = createWorkloadOverrideFromIntake({
          caseId: clientId,
          clientName: name.trim(),
          rnId: "rn-1", // TODO: replace with real RN id once auth/roles wired
          currentSeverityLevel: tenVsEval.suggestedSeverity,
          currentWorkloadPercent: estimatedUtilizationPercent,
          rnWorkloadStatus: "Red",
        });

        console.log("[INTAKE_WORKLOAD_BLOCKED]", {
          clientId,
          severity: tenVsEval.suggestedSeverity,
          workloadDecision,
          overrideRequest,
        });

        setError(workloadDecision.messageForRn);
        setSaving(false);
        return;
      }

      if (workloadDecision.status === "Amber") {
        console.log("[INTAKE_WORKLOAD_AMBER]", {
          clientId,
          severity: tenVsEval.suggestedSeverity,
          workloadDecision,
        });
      }

      const viabilityScore = computeViabilityFromSeverity(
        tenVsEval.suggestedSeverity
      );
      const viabilityStatus = computeViabilityStatus(viabilityScore);

      // Final client object used by the app
      const client: Client = {
        id: clientId,
        name: name.trim(),
        voiceView:
          voice.trim() || view.trim()
            ? {
                voice: voice.trim(),
                view: view.trim(),
              }
            : undefined,
        viabilityScore,
        viabilityStatus,
        cmDeclined: false,
        lastFollowupDate: undefined,
        nextFollowupDue: nextFollowupDateISO(30),
      };

      const appState: AppState = {
        client,
        flags,
        tasks,
      };

      // Log for dev/QMP / audit trail building
      console.log("[INTAKE_TEN_VS_EVAL]", {
        clientId: client.id,
        viabilityScore,
        viabilityStatus,
        suggestedSeverity: tenVsEval.suggestedSeverity,
        vitalityScore: tenVsEval.vitalityScore,
        ragStatus: tenVsEval.ragStatus,
        triggeredVs: tenVsEval.triggeredVs,
        requiredActions: tenVsEval.requiredActions,
        workloadDecision,
        flagsCount: flags.length,
        tasksCount: tasks.length,
      });

      onSaved(appState);
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to complete intake. Please review all required items."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="font-semibold text-lg">Initial Intake — 10-Vs Oriented</h2>
      <p className="text-xs text-slate-600">
        Capture the client’s identity, Voice/View, and key 4Ps factors. The
        system will calculate an initial Viability Score, create risk flags,
        generate starting RN CM tasks, and check RN workload against
        Director-defined limits.
      </p>

      {/* Client Identity */}
      <section>
        <label className="block text-sm font-semibold mb-1">
          Client Name <span className="text-red-500">*</span>
        </label>
        <input
          className="w-full border rounded p-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Example: Jane Doe"
        />
      </section>

      {/* Voice / View */}
      <section>
        <div className="font-semibold text-sm mb-1">Voice / View</div>
        <p className="text-xs text-slate-600 mb-2">
          Voice = the client’s own words about what happened and what is
          happening now. View = how they see themselves and how they want the
          treatment or plan to progress.
        </p>
        <label className="block text-xs font-semibold mb-1">Voice</label>
        <textarea
          className="w-full border rounded p-2 text-xs mb-2"
          rows={2}
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          placeholder='Example: "Since the accident, I can’t sleep and the pain makes it hard to do simple things."'
        />
        <label className="block text-xs font-semibold mb-1">View</label>
        <textarea
          className="w-full border rounded p-2 text-xs"
          rows={2}
          value={view}
          onChange={(e) => setView(e.target.value)}
          placeholder='Example: "I want to be able to go back to work without fear of re-injury and manage my pain better."'
        />
      </section>

      {/* Physical (4Ps) */}
      <section>
        <div className="font-semibold text-sm mb-1">Physical (4Ps)</div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-xs">
            Pain Score (0–10, client-reported)
          </label>
          <input
            type="number"
            min={0}
            max={10}
            className="w-20 border rounded p-1 text-xs"
            value={painScore ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setPainScore(v === "" ? undefined : Number(v));
            }}
          />
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={uncontrolledChronic}
            onChange={(e) => setUncontrolledChronic(e.target.checked)}
          />
          Uncontrolled chronic condition (e.g., high A1C, BP, unstable
          condition).
        </label>
      </section>

      {/* Psychological (4Ps) */}
      <section>
        <div className="font-semibold text-sm mb-1">Psychological (4Ps)</div>
        <label className="flex items-center gap-2 text-xs mb-1">
          <input
            type="checkbox"
            checked={depAnx}
            onChange={(e) => setDepAnx(e.target.checked)}
          />
          Positive screen or strong concern for depression and/or anxiety.
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={highStress}
            onChange={(e) => setHighStress(e.target.checked)}
          />
          Client reports high stress related to condition, finances, or life
          events.
        </label>
      </section>

      {/* Psychosocial (4Ps) */}
      <section>
        <div className="font-semibold text-sm mb-1">Psychosocial (4Ps)</div>
        <label className="flex items-center gap-2 text-xs mb-1">
          <input
            type="checkbox"
            checked={sdohBarrier}
            onChange={(e) => setSdohBarrier(e.target.checked)}
          />
          At least one Social Determinant of Health barrier (transport, food,
          housing, safety, etc.).
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={limitedSupport}
            onChange={(e) => setLimitedSupport(e.target.checked)}
          />
          Limited or unreliable social support.
        </label>
      </section>

      {/* Professional (4Ps) */}
      <section>
        <div className="font-semibold text-sm mb-1">Professional (4Ps)</div>
        <label className="flex items-center gap-2 text-xs mb-1">
          <input
            type="checkbox"
            checked={unableToWork}
            onChange={(e) => setUnableToWork(e.target.checked)}
          />
          Currently unable to work or major role disruption due to condition or
          injury.
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={accommodationsNeeded}
            onChange={(e) => setAccommodationsNeeded(e.target.checked)}
          />
          Workplace accommodations needed or requested.
        </label>
      </section>

      {error && (
        <div className="text-red-600 text-xs">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 border rounded text-sm"
      >
        {saving ? "Saving..." : "Start Case with 10-Vs Profile"}
      </button>
    </form>
  );
};

export default ClientIntakeForm;

