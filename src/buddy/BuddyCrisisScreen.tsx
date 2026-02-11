import React, { useState } from "react";

type BuddyCrisisScreenProps = {
  caseId: string;
  incidentId?: string;
  onSystemUrgencyChange?: (urgency: "low" | "moderate" | "high" | null) => void;
};

const BuddyCrisisScreen: React.FC<BuddyCrisisScreenProps> = ({
  caseId,
  incidentId,
  onSystemUrgencyChange,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [systemUrgency, setSystemUrgency] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  // Simple local checklist state (true / false / null)
  const [firearmPresent, setFirearmPresent] = useState<boolean | null>(null);
  const [otherWeaponPresent, setOtherWeaponPresent] = useState<boolean | null>(
    null
  );
  const [childrenPresent, setChildrenPresent] = useState<boolean | null>(null);
  const [vulnerablePersonPresent, setVulnerablePersonPresent] = useState<
    boolean | null
  >(null);
  const [drugsEtOHInvolved, setDrugsEtOHInvolved] = useState<boolean | null>(
    null
  );
  const [immediateThreat, setImmediateThreat] = useState<boolean | null>(null);
  const [locationConfirmed, setLocationConfirmed] = useState<boolean | null>(
    null
  );
  const [visibleInjuries, setVisibleInjuries] = useState<boolean | null>(null);
  const [clientCooperative, setClientCooperative] = useState<boolean | null>(
    null
  );
  const [rnRequestsEMSNow, setRnRequestsEMSNow] = useState<boolean | null>(
    null
  );

  const resolvedIncidentId = incidentId ?? "stub-incident-id";

  const computeLocalUrgency = (): "low" | "moderate" | "high" => {
    // Same logic we used on the API side:
    // firearm OR immediate threat → high
    // drugs/ETOH or visible injuries or children present → moderate
    // else low
    if (firearmPresent === true || immediateThreat === true) {
      return "high";
    }
    if (
      drugsEtOHInvolved === true ||
      visibleInjuries === true ||
      childrenPresent === true
    ) {
      return "moderate";
    }
    return "low";
  };

  const handleSubmitChecklist = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    let resolvedUrgency: "low" | "moderate" | "high" | null = null;

    try {
      const res = await fetch("/api/crisis-buddy-checklist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          incident_id: resolvedIncidentId,
          completed_by_user_id: null, // later: real Buddy user ID
          firearm_present: firearmPresent,
          other_weapon_present: otherWeaponPresent,
          children_present: childrenPresent,
          vulnerable_person_present: vulnerablePersonPresent,
          drugs_etoh_involved: drugsEtOHInvolved,
          immediate_threat: immediateThreat,
          location_confirmed: locationConfirmed,
          visible_injuries: visibleInjuries,
          client_cooperative: clientCooperative,
          rn_requests_ems_now: rnRequestsEMSNow,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const apiUrgency = (data.system_ems_urgency as string | null) ?? null;
        if (
          apiUrgency === "low" ||
          apiUrgency === "moderate" ||
          apiUrgency === "high"
        ) {
          resolvedUrgency = apiUrgency;
        } else {
          console.warn(
            "[Buddy] API returned unknown urgency, falling back to local logic:",
            apiUrgency
          );
        }
      } else {
        console.warn(
          "[Buddy] API response not OK (likely dev / no backend). Falling back to local urgency. Status:",
          res.status
        );
      }
    } catch (err) {
      console.warn(
        "[Buddy] API unreachable (dev mode). Using local urgency instead.",
        err
      );
    }

    // If API didn't give us a usable urgency, compute it locally
    if (!resolvedUrgency) {
      resolvedUrgency = computeLocalUrgency();
    }

    // Update local state + notify app
    setSystemUrgency(resolvedUrgency);
    if (onSystemUrgencyChange) {
      onSystemUrgencyChange(resolvedUrgency);
    }

    alert(
      "Buddy checklist saved for this crisis incident (using dev/local logic if API is not available)."
    );

    setIsSubmitting(false);
  };

  const renderTriStateToggle = (
    label: string,
    value: boolean | null,
    onChange: (v: boolean | null) => void
  ) => {
    return (
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <div className="flex gap-1">
          <button
            type="button"
            className={`px-2 py-0.5 text-[10px] rounded border ${
              value === true
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700"
            }`}
            onClick={() => onChange(true)}
          >
            Yes
          </button>
          <button
            type="button"
            className={`px-2 py-0.5 text-[10px] rounded border ${
              value === false
                ? "bg-red-600 text-white"
                : "bg-white text-gray-700"
            }`}
            onClick={() => onChange(false)}
          >
            No
          </button>
          <button
            type="button"
            className={`px-2 py-0.5 text-[10px] rounded border ${
              value === null
                ? "bg-gray-300 text-gray-800"
                : "bg-white text-gray-700"
            }`}
            onClick={() => onChange(null)}
          >
            Unknown
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <header className="border-b pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-red-700">
            🚨 Crisis Support — Buddy View
          </h1>
          <p className="text-sm text-gray-700">
            Your role: complete the safety checklist and handle EMS decisions,
            so the RN can stay with the client.
          </p>
        </div>
        <div className="text-right text-xs text-gray-500">
          <div>Case ID: {caseId}</div>
          {incidentId && <div>Incident ID: {incidentId}</div>}
          {systemUrgency && (
            <div className="mt-1">
              System urgency:{" "}
              <span className="font-semibold uppercase">
                {systemUrgency || "unknown"}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Safety Checklist */}
      <section className="border rounded-md p-3 bg-white shadow-sm space-y-2">
        <h2 className="font-semibold text-sm">Safety Checklist</h2>
        <p className="text-xs text-gray-500">
          Answer these based on what you know from the RN and chart. This will
          guide EMS urgency.
        </p>

        <div className="mt-2 space-y-2">
          {renderTriStateToggle(
            "Firearm present in the home?",
            firearmPresent,
            setFirearmPresent
          )}
          {renderTriStateToggle(
            "Other weapons accessible?",
            otherWeaponPresent,
            setOtherWeaponPresent
          )}
          {renderTriStateToggle(
            "Children present or likely to return soon?",
            childrenPresent,
            setChildrenPresent
          )}
          {renderTriStateToggle(
            "Other vulnerable person in the home?",
            vulnerablePersonPresent,
            setVulnerablePersonPresent
          )}
          {renderTriStateToggle(
            "Drugs or alcohol currently involved?",
            drugsEtOHInvolved,
            setDrugsEtOHInvolved
          )}
          {renderTriStateToggle(
            "Immediate threat to self or others?",
            immediateThreat,
            setImmediateThreat
          )}
          {renderTriStateToggle(
            "Location confirmed and specific enough for EMS?",
            locationConfirmed,
            setLocationConfirmed
          )}
          {renderTriStateToggle(
            "Visible injuries or acute medical symptoms?",
            visibleInjuries,
            setVisibleInjuries
          )}
          {renderTriStateToggle(
            "Client cooperative with safety instructions?",
            clientCooperative,
            setClientCooperative
          )}
          {renderTriStateToggle(
            "RN requesting EMS dispatch now?",
            rnRequestsEMSNow,
            setRnRequestsEMSNow
          )}
        </div>

        <p className="mt-2 text-xs text-red-700 font-semibold">
          This version is wired to use the Buddy checklist API when available,
          and falls back to local logic in dev if the API is not reachable.
        </p>
      </section>

      {/* Decision Buttons (still placeholders for now) */}
      <section className="border rounded-md p-3 bg-white shadow-sm space-y-3">
        <h2 className="font-semibold text-sm">What do you want to do?</h2>
        <p className="text-xs text-gray-500">
          In a later iteration, these will directly call EMS, escalate to
          Supervisor, or document a no-EMS decision. For now, only the checklist
          submission is wired.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <button className="flex-1 px-3 py-2 rounded-md text-sm font-semibold bg-red-700 text-white">
            Call EMS Now (placeholder)
          </button>
          <button className="flex-1 px-3 py-2 rounded-md text-sm font-semibold bg-yellow-600 text-white">
            Consult Supervisor First (placeholder)
          </button>
          <button className="flex-1 px-3 py-2 rounded-md text-sm font-semibold bg-gray-200 text-gray-800">
            Do NOT Call EMS (document) (placeholder)
          </button>
        </div>
      </section>

      {/* Notes */}
      <section className="border rounded-md p-3 bg-white shadow-sm">
        <h3 className="font-semibold text-sm mb-1">Buddy Notes</h3>
        <p className="text-xs text-gray-500 mb-2">
          Use this area to jot down key details (e.g., weapon location, who is
          in the home, dispatch info). Later this will save into the crisis
          incident record.
        </p>
        <textarea
          className="w-full border rounded-md p-2 text-sm"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Example: RN reports firearm in bedroom closet, children ages 4 and 7 in living room with grandmother..."
        />
        <div className="mt-2 flex justify-between items-center">
          <button
            type="button"
            className="px-3 py-1 rounded-md text-sm font-semibold bg-gray-800 text-white"
            onClick={handleSubmitChecklist}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Saving Buddy Checklist..."
              : "Save Buddy Checklist"}
          </button>
          <span className="text-[10px] text-gray-500">
            Notes button is a placeholder for now.
          </span>
        </div>
      </section>
    </div>
  );
};

export default BuddyCrisisScreen;
