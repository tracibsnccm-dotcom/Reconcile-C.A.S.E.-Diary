// src/components/ConsentDemo.tsx

import React from "react";

const ConsentDemo: React.FC = () => {
  return (
    <section className="mt-4 border rounded-lg p-3 bg-slate-50">
      <div className="text-xs font-semibold mb-1">
        Privacy, RN Contact &amp; 7-Day Rule (Demo)
      </div>
      <p className="text-[10px] text-slate-700 mb-2">
        In the live Reconcile C.A.R.E.™ platform, this section contains the full
        HIPAA-compliant consent and acknowledgment workflow. For this demo:
      </p>
      <ul className="list-disc ml-4 text-[10px] text-slate-700 mb-2">
        <li>No information entered here is stored or sent anywhere.</li>
        <li>
          In production, you will review and sign authorizations that allow an
          RN to review your records and coordinate with your attorney and
          providers.
        </li>
        <li>
          Any intake that is not completed within <strong>7 days</strong> is
          automatically and permanently deleted to protect your privacy.
        </li>
      </ul>
      <p className="text-[10px] text-slate-600">
        This demo is for illustration only and does not create a legal or
        clinical relationship.
      </p>
    </section>
  );
};

export default ConsentDemo;
