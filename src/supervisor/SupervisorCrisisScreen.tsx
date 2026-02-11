// src/supervisor/SupervisorCrisisScreen.tsx
// Supervisor view for active crisis incidents (dev-only decision recording)

import React, { useState } from "react";

type SupervisorCrisisScreenProps = {
  caseId: string;
  incidentId?: string;
};

type SupervisorDecision =
  | "ems_confirmed"
  | "ems_overridden"
  | "resolved_no_ems"
  | null;

const SupervisorCrisisScreen: React.FC<SupervisorCrisisScreenProps> = ({
  caseId,
  incidentId,
}) => {
  const [decision, setDecision] = useState<SupervisorDecision>(null);

  const handleDecision = (value: SupervisorDecision) => {
    setDecision(value);
    // In a later phase, this is where we'll write to Supabase.
    // For now, this is dev-only and just updates local UI state.
  };

  const renderDecisionSummary = () => {
    if (!decision) return null;

    let label = "";
    if (decision === "ems_confirmed") {
      label = "Supervisor confirmed EMS / law enforcement activation.";
    } else if (decision === "ems_overridden") {
      label = "Supervisor overrode EMS activation — alternative plan selected.";
    } else if (decision === "resolved_no_ems") {
      label = "Supervisor resolved crisis without EMS activation.";
    }

    return (
      <div className="mt-2 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-xs text-green-800">
        <div className="font-semibold">Decision recorded (dev-only):</div>
        <div>{label}</div>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <header className="border-b pb-3">
        <h1 className="text-xl font-semibold text-purple-700">
          🛡 Crisis Oversight — Supervisor View
        </h1>
        <p className="text-sm text-gray-700">
          Your role: review information and make the final determination
          regarding EMS activation and crisis resolution.
        </p>

        <div className="mt-2 text-xs text-gray-500 space-y-1">
          <div>Case ID: {caseId}</div>
          {incidentId && <div>Incident ID: {incidentId}</div>}
        </div>
      </header>

      {/* Crisis Type explanation (badge is in header, handled by App) */}
      <section className="border rounded-md p-3 bg-white shadow-sm">
        <h2 className="font-semibold text-sm">Crisis Context</h2>
        <p className="text-xs text-gray-600">
          Crisis type and system urgency are displayed in the header above.
          The Supervisor uses that information, plus RN/Buddy reports, to make
          the final decision below.
        </p>
      </section>

      {/* System Urgency explanation */}
      <section className="border rounded-md p-3 bg-white shadow-sm">
        <h2 className="font-semibold text-sm">System Urgency</h2>
        <p className="text-xs text-gray-600">
          The Buddy checklist generates a low / moderate / high urgency level.
          This is meant to guide, not replace, the Supervisor&apos;s judgment.
        </p>
        <p className="mt-1 p-2 rounded bg-yellow-50 text-yellow-800 text-xs border border-yellow-200">
          Use the urgency badge in the header as a quick signal. Always combine
          it with clinical judgment and organizational policy.
        </p>
      </section>

      {/* Supervisor Decision (dev-only) */}
      <section className="border rounded-md p-3 bg-white shadow-sm space-y-3">
        <h2 className="font-semibold text-sm">Supervisor Decision</h2>
        <p className="text-xs text-gray-600">
          In this dev build, the decision is recorded locally only. In a later
          phase, these actions will write to the crisis incident record in the
          database for full audit and reporting.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold ${
              decision === "ems_confirmed"
                ? "bg-red-800 text-white"
                : "bg-red-700 text-white"
            }`}
            onClick={() => handleDecision("ems_confirmed")}
          >
            Confirm EMS Activation
          </button>

          <button
            type="button"
            className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold ${
              decision === "ems_overridden"
                ? "bg-green-800 text-white"
                : "bg-green-700 text-white"
            }`}
            onClick={() => handleDecision("ems_overridden")}
          >
            Override — No EMS Needed
          </button>

          <button
            type="button"
            className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold ${
              decision === "resolved_no_ems"
                ? "bg-gray-400 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
            onClick={() => handleDecision("resolved_no_ems")}
          >
            Resolve Crisis &amp; Close (Dev)
          </button>
        </div>

        {renderDecisionSummary()}
      </section>
    </div>
  );
};

export default SupervisorCrisisScreen;
