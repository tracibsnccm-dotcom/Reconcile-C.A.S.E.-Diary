// src/components/ClientAcknowledgement.tsx

import React from "react";

export interface ClientAcknowledgementValue {
  understood: boolean;
  hadChanceToAskQuestions: boolean;
  receivedEducation: boolean;
  consentChoice: "Yes" | "No" | "Revoked" | "";
  clientName: string;
  clientRefused: boolean;
}

interface ClientAcknowledgementProps {
  value: ClientAcknowledgementValue;
  onChange: (value: ClientAcknowledgementValue) => void;
}

/**
 * Reconcile C.A.R.E.™
 * Client Acknowledgment & Consent Stub
 *
 * Used per RN CM contact to confirm:
 * - Explanation was understood
 * - Opportunity to ask questions
 * - Education provided
 * - PHI sharing consent status (attorney / providers)
 * Allows "client refused" as a documented exception.
 */
const ClientAcknowledgement: React.FC<ClientAcknowledgementProps> = ({
  value,
  onChange,
}) => {
  const update = (patch: Partial<ClientAcknowledgementValue>) =>
    onChange({ ...value, ...patch });

  return (
    <section className="mt-4 border rounded-lg p-3 bg-slate-50">
      <div className="text-xs font-semibold mb-1">
        Client Acknowledgment &amp; Consent
      </div>
      <p className="text-[10px] text-slate-600 mb-2">
        Document that the client understood today&apos;s discussion, had the
        chance to ask questions, and confirm their current consent choice for
        information sharing. If the client refuses, record this.
      </p>

      <label className="flex items-center gap-2 text-[10px] mb-1">
        <input
          type="checkbox"
          checked={value.understood}
          onChange={(e) => update({ understood: e.target.checked })}
          disabled={value.clientRefused}
        />
        Client states they understood the RN CM&apos;s explanation.
      </label>

      <label className="flex items-center gap-2 text-[10px] mb-1">
        <input
          type="checkbox"
          checked={value.hadChanceToAskQuestions}
          onChange={(e) =>
            update({ hadChanceToAskQuestions: e.target.checked })
          }
          disabled={value.clientRefused}
        />
        Client had the opportunity to ask questions.
      </label>

      <label className="flex items-center gap-2 text-[10px] mb-2">
        <input
          type="checkbox"
          checked={value.receivedEducation}
          onChange={(e) =>
            update({ receivedEducation: e.target.checked })
          }
          disabled={value.clientRefused}
        />
        Any education/materials discussed were provided or made available.
      </label>

      <div className="text-[10px] font-semibold mb-1">
        Consent for sharing PHI with attorney / treating providers:
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] mb-2">
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="consentChoice"
            value="Yes"
            checked={value.consentChoice === "Yes"}
            onChange={() => update({ consentChoice: "Yes" })}
            disabled={value.clientRefused}
          />
          Yes – client consents.
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="consentChoice"
            value="No"
            checked={value.consentChoice === "No"}
            onChange={() => update({ consentChoice: "No" })}
            disabled={value.clientRefused}
          />
          No – client does NOT consent.
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="consentChoice"
            value="Revoked"
            checked={value.consentChoice === "Revoked"}
            onChange={() => update({ consentChoice: "Revoked" })}
            disabled={value.clientRefused}
          />
          Consent revoked at this visit.
        </label>
      </div>

      <div className="mb-2">
        <label className="block text-[10px] mb-1">
          Client acknowledgment signature (type full name)
        </label>
        <input
          type="text"
          className="border rounded px-2 py-1 w-full text-[10px]"
          value={value.clientName}
          onChange={(e) => update({ clientName: e.target.value })}
          placeholder="Client types their full name here"
          disabled={value.clientRefused}
        />
      </div>

      <label className="flex items-center gap-2 text-[10px] text-red-700">
        <input
          type="checkbox"
          checked={value.clientRefused}
          onChange={(e) =>
            update({
              clientRefused: e.target.checked,
              understood: false,
              hadChanceToAskQuestions: false,
              receivedEducation: false,
              consentChoice: "",
              clientName: "",
            })
          }
        />
        Client refused to complete acknowledgment / signature. RN CM has
        documented this in the clinical note.
      </label>
    </section>
  );
};

export default ClientAcknowledgement;
