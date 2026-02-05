import React, { useEffect } from "react";
import type { IntakeFormData, IntakePersonal } from "./intakeTypes";

const CARD_CLASS =
  "bg-slate-800/95 border border-slate-600 rounded-xl shadow-xl shadow-black/30 p-6 sm:p-8 text-left";
const LABEL_CLASS = "block text-sm font-medium text-slate-300 mb-2";
const INPUT_CLASS =
  "w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent";

interface IntakeStepPersonalProps {
  data: IntakeFormData;
  onChange: (personal: IntakePersonal) => void;
  onValidityChange: (valid: boolean) => void;
}

function required(s: string) {
  return s.trim().length > 0;
}

function validEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function validPhone(s: string) {
  return /^[\d\s\-().+]{10,}$/.test(s.replace(/\D/g, ""));
}

export function IntakeStepPersonal({
  data,
  onChange,
  onValidityChange,
}: IntakeStepPersonalProps) {
  const p = data.personal;
  const valid =
    required(p.firstName) &&
    required(p.lastName) &&
    required(p.dateOfBirth) &&
    required(p.email) &&
    validEmail(p.email) &&
    required(p.phone) &&
    validPhone(p.phone);

  useEffect(() => {
    onValidityChange(valid);
  }, [valid, onValidityChange]);

  return (
    <div className={CARD_CLASS}>
      <h2 className="text-xl font-semibold text-white mb-2">
        Personal Information
      </h2>
      <p className="text-slate-400 text-sm mb-6">
        Your name, date of birth, and contact information.
      </p>
      <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL_CLASS}>First name *</label>
          <input
            type="text"
            className={INPUT_CLASS}
            value={p.firstName}
            onChange={(e) => onChange({ ...p, firstName: e.target.value })}
            placeholder="First name"
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Last name *</label>
          <input
            type="text"
            className={INPUT_CLASS}
            value={p.lastName}
            onChange={(e) => onChange({ ...p, lastName: e.target.value })}
            placeholder="Last name"
          />
        </div>
      </div>
      <div>
        <label className={LABEL_CLASS}>Date of birth *</label>
        <input
          type="date"
          className={INPUT_CLASS}
          value={p.dateOfBirth}
          onChange={(e) => onChange({ ...p, dateOfBirth: e.target.value })}
        />
      </div>
      <div>
        <label className={LABEL_CLASS}>Email *</label>
        <input
          type="email"
          className={INPUT_CLASS}
          value={p.email}
          onChange={(e) => onChange({ ...p, email: e.target.value })}
          placeholder="email@example.com"
        />
      </div>
      <div>
        <label className={LABEL_CLASS}>Phone *</label>
        <input
          type="tel"
          className={INPUT_CLASS}
          value={p.phone}
          onChange={(e) => onChange({ ...p, phone: e.target.value })}
          placeholder="(555) 555-5555"
        />
      </div>
      </div>
    </div>
  );
}
