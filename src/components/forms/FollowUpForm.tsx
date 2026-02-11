// src/components/forms/FollowUpForm.tsx

import React, { useState } from "react";
import { Client, Flag, Task, AppState } from "../../lib/models";
import { onFollowUpSubmit } from "../../lib/workflows";
import { applyEffects } from "../../lib/executor";
import ClientAcknowledgement, {
  ClientAcknowledgementValue,
} from "../ClientAcknowledgement";
import { evaluateTenVs, FourPsSnapshot } from "../../lib/vEngine";
import { getVDefinitionByLabel } from "../../config/tenVsOperationalGuide";

interface FollowUpFormProps {
  client: Client;
  flags: Flag[];
  tasks: Task[];
  onSaved: (state: AppState) => void;
}

/**
 * Reconcile C.A.R.E.™
 * 30-Day Follow-Up Form
 *
 * - RN CM must confirm review of all open High/Critical flags.
 * - Client can change decision: Accept or Decline Care Management.
 * - Next 30-day follow-up task is auto-created by workflow.
 * - Client Acknowledgment & Consent is required or refusal documented.
 * - 10-Vs Clinical Engine enforces per-V documentation (hard-stop).
 */

// Build a conservative 4Ps snapshot from current client + flags.
// TODO: later we will map real 4Ps and psychosocial fields into this.
const buildFourPsFromState = (client: Client, flags: Flag[]): FourPsSnapshot => {
  return {
    physical: {
      painScore: undefined, // TODO: hook to actual pain score when available
      uncontrolledChronicCondition: false, // TODO: map from chronic condition fields
    },
    psychological: {
      positiveDepressionAnxiety: false, // TODO: map from PHQ/GAD or similar
      highStress: false, // TODO: map from stress question
    },
    psychosocial: {
      // If any open SDOH-type flag, treat as SDOH barrier
      hasSdohBarrier: flags.some(
        (f) =>
          f.status === "Open" &&
          (f.type || "").toLowerCase().includes("sdoh")
      ),
      limitedSupport: false, // TODO: map from social support field
    },
    professional: {
      unableToWork: false, // TODO: map from work status
      accommodationsNeeded: false, // TODO: map from "needs accommodations" field
    },
    anyHighRiskOrUncontrolled: flags.some(
      (f) =>
        f.status === "Open" &&
        (f.severity === "High" || f.severity === "Critical")
    ),
  };
};

const FollowUpForm: React.FC<FollowUpFormProps> = ({
  client,
  flags,
  tasks,
  onSaved,
}) => {
  const [reviewed, setReviewed] = useState(false);
  const [clientDecision, setClientDecision] = useState<"Accept" | "Decline">(
    client.cmDeclined ? "Decline" : "Accept"
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Client acknowledgment state
  const [ack, setAck] = useState<ClientAcknowledgementValue>({
    understood: false,
    hadChanceToAskQuestions: false,
    receivedEducation: false,
    consentChoice: "",
    clientName: "",
    clientRefused: false,
  });

  // Per-V documentation notes (Option A – separate note per V)
  const [vNotes, setVNotes] = useState<Record<string, string>>({});

  // Preview 10-Vs evaluation so RN can see required actions before saving
  const previewFourPs = buildFourPsFromState(client, flags);
  const previewTenVs = evaluateTenVs({
    appState: { client, flags, tasks },
    client,
    flags,
    tasks,
    fourPs: previewFourPs,
  });
  const requiredActions = previewTenVs.requiredActions;

  const highCriticalFlags = flags.filter(
    (f) =>
      f.status === "Open" &&
      (f.severity === "High" || f.severity === "Critical")
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Require explicit confirmation if there are serious flags
    if (highCriticalFlags.length > 0 && !reviewed) {
      setError(
        "You must confirm all open High/Critical items were reviewed with the client."
      );
      return;
    }

    // Require client acknowledgment OR documented refusal
    if (!ack.clientRefused) {
      if (
        !ack.understood ||
        !ack.hadChanceToAskQuestions ||
        !ack.receivedEducation ||
        !ack.consentChoice ||
        !ack.clientName.trim()
      ) {
        setError(
          "Complete the Client Acknowledgment section or mark that the client refused."
        );
        return;
      }
    }

    setSaving(true);
    try {
      const effects = onFollowUpSubmit(client, flags, tasks, {
        reviewedAllHighCritical: reviewed || highCriticalFlags.length === 0,
        clientDecision,
      });

      const initialState: AppState = { client, flags, tasks };
      const newState = applyEffects(initialState, effects);

      // Build 4Ps snapshot from the updated state
      const fourPs = buildFourPsFromState(newState.client, newState.flags);

      const tenVsEval = evaluateTenVs({
        appState: newState,
        client: newState.client,
        flags: newState.flags,
        tasks: newState.tasks,
        fourPs,
        // vitalityInputs can be added later; using defaults for now
      });

      // HARD-STOP: Require RN CM documentation for each triggered V
      for (const action of tenVsEval.requiredActions) {
        const noteForV = (vNotes[action.vCode] || "").trim();
        if (!noteForV) {
          setError(
            `Please document an action and rationale for "${action.label}". Reason(s): ${action.reasonSummary}`
          );
          return;
        }
      }

      // Log to console for now (helps with dev & audit)
      console.log("[TEN_VS_EVAL]", {
        clientId: newState.client.id,
        triggeredVs: tenVsEval.triggeredVs,
        requiredActions: tenVsEval.requiredActions,
        suggestedSeverity: tenVsEval.suggestedSeverity,
        vitalityScore: tenVsEval.vitalityScore,
        ragStatus: tenVsEval.ragStatus,
      });

      // Optional: attach RN CM note into audit/log
      if (note.trim()) {
        console.log(`[RN_CM_NOTE][${client.id}]: ${note.trim()}`);
      }

      // Optional: capture acknowledgment for backend persistence later
      console.log("[CLIENT_ACKNOWLEDGEMENT]", {
        clientId: client.id,
        followupAt: new Date().toISOString(),
        acknowledgment: ack,
      });

      onSaved(newState);
    } catch (err: any) {
      if (!error) {
        setError(
          err?.message ||
            "Unable to save follow-up. Please review all required items."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="font-semibold text-lg">
        30-Day Follow-Up / Readiness Review
      </h2>

      {highCriticalFlags.length > 0 && (
        <section className="border rounded p-3 bg-gray-50">
          <div className="font-semibold text-sm mb-1">
            Open High / Critical Items (Must Be Addressed)
          </div>
          <ul className="list-disc pl-5 text-sm">
            {highCriticalFlags.map((f) => (
              <li key={f.id}>
                {f.label} ({f.severity})
              </li>
            ))}
          </ul>
          <label className="flex items-center gap-2 mt-3 text-sm">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
            />
            I have reviewed and discussed all open High/Critical items with the
            client.
          </label>
        </section>
      )}

      {/* Client decision about Care Management */}
      <section>
        <div className="font-semibold text-sm mb-1">
          Client’s Current Decision About Care Management
        </div>
        <p className="text-xs text-gray-600 mb-2">
          The client may change their mind at any time. Record today’s
          decision.
        </p>
        <label className="flex items-center gap-2 text-sm mb-1">
          <input
            type="radio"
            name="cmDecision"
            value="Accept"
            checked={clientDecision === "Accept"}
            onChange={() => setClientDecision("Accept")}
          />
          Client ACCEPTS Care Management services.
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="cmDecision"
            value="Decline"
            checked={clientDecision === "Decline"}
            onChange={() => setClientDecision("Decline")}
          />
          Client DECLINES Care Management at this time.
        </label>
      </section>

      {/* 10-Vs Required Clinical Actions (Hard-Stop) */}
      {requiredActions.length > 0 && (
        <section className="border rounded p-3 bg-amber-50">
          <div className="font-semibold text-sm mb-1">
            Required 10-Vs Clinical Actions
          </div>
          <p className="text-xs text-gray-700 mb-2">
            Because of this client’s 4Ps, SDOH, and risk profile, the following
            V-domains must each have a documented plan and rationale. You must
            complete every section before saving.
          </p>
          <div className="space-y-3">
            {requiredActions.map((action) => {
              const vDef = getVDefinitionByLabel(action.label);
              return (
                <div key={action.vCode} className="border rounded p-2 bg-white">
                  <div className="text-xs font-semibold mb-1">
                    {action.label}
                  </div>
                  {vDef && (
                    <div className="text-[10px] text-gray-700 mb-2 italic border-l-2 border-blue-300 pl-2 space-y-1">
                      <div>
                        <span className="font-semibold">Literal meaning:</span> {vDef.literalMeaning}
                      </div>
                      <div>
                        <span className="font-semibold">Etymology-Aligned Definition:</span> {vDef.definition}
                      </div>
                    </div>
                  )}
                  <div className="text-[11px] text-gray-600 mb-1">
                    Triggered because: {action.reasonSummary}
                  </div>
                  <textarea
                    className="w-full border rounded p-2 text-xs"
                    rows={2}
                    value={vNotes[action.vCode] || ""}
                    onChange={(e) =>
                      setVNotes((prev) => ({
                        ...prev,
                        [action.vCode]: e.target.value,
                      }))
                    }
                    placeholder="Document your specific plan, referrals, advocacy actions, and follow-up for this V-domain."
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* RN CM Note */}
      <section>
        <div className="font-semibold text-sm mb-1">
          RN CM Clinical Summary
        </div>
        <p className="text-xs text-gray-600 mb-1">
          Summarize changes, education provided, SDOH/4Ps updates, and
          rationale.
        </p>
        <textarea
          className="w-full border rounded p-2 text-sm"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Example: Reviewed pain, meds, transportation, and financial barriers. Client understands options and confirms current decision."
        />
      </section>

      {/* Client Acknowledgment & Consent */}
      <ClientAcknowledgement value={ack} onChange={setAck} />

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
        {saving ? "Saving..." : "Save Follow-Up"}
      </button>
    </form>
  );
};

export default FollowUpForm;
