// src/provider/ProviderVisitNoteForm.tsx
// Reconcile C.A.R.E. — Provider Visit Note (demo-only)
//
// Uses your canonical 4Ps and official 10-Vs. No made-up labels.
// This is a structured shell for Dec 31 demos — not wired to the DB yet.

import React from "react";
import { FOUR_PS } from "../domain/reconcileDomain";
import { TEN_VS_ORDERED, TEN_VS_DICTIONARY } from "../domain/tenVs";

const ProviderVisitNoteForm: React.FC = () => {
  return (
    <div className="border rounded-xl bg-white p-3 space-y-3 text-[11px] text-slate-800">
      {/* Header */}
      <header className="border-b pb-2 mb-2">
        <h2 className="text-[12px] font-semibold uppercase tracking-wide">
          Provider Visit Note – Structured Summary
        </h2>
        <p className="text-[10px] text-slate-500">
          Structured recap of a treating provider visit so the RN, attorney, and
          client stay aligned. Demo-only for Dec 31 (no live save yet).
        </p>
      </header>

      {/* Visit Meta */}
      <section className="space-y-1">
        <div className="text-[10px] font-semibold uppercase text-slate-600">
          Visit Details
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-600">Provider</span>
            <input
              className="border rounded px-1 py-0.5 text-[10px]"
              placeholder="Name / specialty"
            />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-600">Visit Date</span>
            <input
              type="date"
              className="border rounded px-1 py-0.5 text-[10px]"
            />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-600">Visit Type</span>
            <select className="border rounded px-1 py-0.5 text-[10px] bg-white">
              <option>Office Visit</option>
              <option>Telehealth</option>
              <option>Urgent Care / ED</option>
              <option>Surgery / Procedure</option>
              <option>Therapy / Rehab</option>
              <option>Other</option>
            </select>
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-600">Service Focus</span>
            <select className="border rounded px-1 py-0.5 text-[10px] bg-white">
              <option>Injury Follow-Up</option>
              <option>Post-Op Check</option>
              <option>Diagnostics / Imaging Review</option>
              <option>Medication Management</option>
              <option>Pain Management</option>
              <option>Behavioral Health</option>
              <option>Other</option>
            </select>
          </label>
        </div>
      </section>

      {/* 4Ps from Provider Perspective */}
      <section className="space-y-2 border rounded-md p-2 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase text-slate-600">
            4Ps – Provider Snapshot
          </div>
          <div className="text-[9px] text-slate-500">
            Physical · Psychological · Psychosocial · Professional
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {FOUR_PS.map((pLabel) => (
            <div className="space-y-1" key={pLabel}>
              <div className="text-[10px] font-semibold text-slate-700">
                {pLabel}
              </div>
              <select className="border rounded px-1 py-0.5 text-[10px] bg-white w-full">
                <option>No major change reported</option>
                <option>Improved vs prior</option>
                <option>Worsened vs prior</option>
                <option>New issue identified</option>
              </select>
              <textarea
                className="border rounded px-1 py-0.5 text-[10px] w-full"
                rows={2}
                placeholder={`Key findings from provider for ${pLabel.toLowerCase()} lens...`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 10-Vs Quick Impressions */}
      <section className="space-y-2 border rounded-md p-2 bg-white">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase text-slate-600">
            10-Vs Impressions
          </div>
          <div className="text-[9px] text-slate-500">
            RN translates the visit into your 10-Vs language for strategy.
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {TEN_VS_ORDERED.map((vKey) => {
            const vDef = TEN_VS_DICTIONARY[vKey];
            return (
              <div className="space-y-1" key={vKey}>
                <div className="text-[10px] font-semibold text-slate-700">
                  {vDef.label}
                </div>
                <textarea
                  className="border rounded px-1 py-0.5 text-[10px] w-full"
                  rows={2}
                  placeholder={`RN note for ${vDef.label} lens...`}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Work & Function */}
      <section className="space-y-2 border rounded-md p-2 bg-slate-50">
        <div className="text-[10px] font-semibold uppercase text-slate-600">
          Work Status & Function
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-600">Reported Work Status</span>
            <select className="border rounded px-1 py-0.5 text-[10px] bg-white">
              <option>Working Full Duty</option>
              <option>Working with Restrictions</option>
              <option>Off Work – Medically Directed</option>
              <option>Off Work – Other / Unknown</option>
            </select>
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-600">
              Did the provider address RTW?
            </span>
            <select className="border rounded px-1 py-0.5 text-[10px] bg-white">
              <option>Yes – Discussed in detail</option>
              <option>Yes – Briefly mentioned</option>
              <option>No – Not addressed</option>
              <option>Unknown</option>
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-600">
            Functional Capacity / Restrictions
          </span>
          <textarea
            className="border rounded px-1 py-0.5 text-[10px] w-full"
            rows={3}
            placeholder="Lifting limits, standing/walking tolerance, sit/stand options, use of affected extremity, cognitive limits, etc."
          />
        </label>
      </section>

      {/* Plan & Follow-Up */}
      <section className="space-y-2 border rounded-md p-2 bg-white">
        <div className="text-[10px] font-semibold uppercase text-slate-600">
          Plan, Orders, and Follow-Up
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-600">Key Orders / Changes</span>
            <textarea
              className="border rounded px-1 py-0.5 text-[10px] w-full"
              rows={3}
              placeholder="New meds, imaging, therapy, referrals, DME, documentation requests, etc."
            />
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-600">
              RN / Case Management Follow-Up Needs
            </span>
            <textarea
              className="border rounded px-1 py-0.5 text-[10px] w-full"
              rows={3}
              placeholder="Scheduling follow-ups, verifying orders completed, coordinating with attorney, addressing benefit barriers, etc."
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-600">
              Next Provider Follow-Up (per note)
            </span>
            <input
              type="date"
              className="border rounded px-1 py-0.5 text-[10px]"
            />
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-600">
              RN Recommended Follow-Up Window
            </span>
            <select className="border rounded px-1 py-0.5 text-[10px] bg-white">
              <option>Within 1 week</option>
              <option>1–2 weeks</option>
              <option>2–4 weeks</option>
              <option>Next provider visit</option>
              <option>PRN / As issues arise</option>
            </select>
          </label>
        </div>
      </section>

      {/* Demo Footer */}
      <section className="border-t pt-2">
        <p className="text-[9px] text-slate-400">
          Demo note: This Provider Visit Note layout is intended to keep the RN,
          attorney, and client aligned on what each visit produced in terms of
          function, 4Ps, and 10-Vs. In a future phase, these fields will map
          directly to the case record and attorney dashboard views.
        </p>
      </section>
    </div>
  );
};

export default ProviderVisitNoteForm;
