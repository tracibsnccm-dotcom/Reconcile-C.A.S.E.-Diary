import React from "react";
import CrisisModeButton from "../components/CrisisModeButton";

const RNCaseView: React.FC = () => {
  // TODO: replace this with the real case ID from your routing/state
  const caseId = "TEST-CASE-ID";

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">RN Case View</h1>
          <p className="text-sm text-gray-600">
            This screen shows the RN-facing case details and actions.
          </p>
        </div>
        <CrisisModeButton caseId={caseId} />
      </header>

      <section className="mt-4">
        {/* TODO: move your existing RN case details UI into this section */}
        <p className="text-gray-700">
          Placeholder for RN case details. Your existing fields and timeline
          components can be added or moved here.
        </p>
      </section>
    </div>
  );
};

export default RNCaseView;
