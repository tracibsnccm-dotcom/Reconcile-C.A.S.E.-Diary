// src/rn/RNFollowUpForm.tsx
// RN Subsequent Care Plan form for non-crisis case work.
//
// Uses canonical domain dictionary:
//  - 4Ps: Physical · Psychological · Psychosocial · Professional
//  - Contact types / focus
//  - Follow-up timeframes / routing
//  - Official 10-Vs (Voice/View, Viability, Vision, Veracity, Versatility,
//    Vitality, Vigilance, Verification, Value, Validation)
//
// Demo-only for Dec 31 (no backend wiring yet).

import React from "react";
import {
  CONTACT_TYPES,
  CONTACT_FOCUS_OPTIONS,
  FOUR_PS,
  FOLLOW_UP_TIMEFRAMES,
  ROUTING_OPTIONS,
} from "../domain/reconcileDomain";
import {
  TEN_VS_ORDERED,
  TEN_VS_DICTIONARY,
} from "../domain/tenVs";

const RNFollowUpForm: React.FC = () => {
  return (
    <div className="border rounded-xl bg-white p-3 space-y-3 text-[11px] text-slate-800">
      {/* Header */}
      <header className="border-b pb-2 mb-2">
        <h2 className="text-[12px] font-semibold uppercase tracking-wide">
          Subsequent Care Plan – Case Workbench
        </h2>
        <p className="text-[10px] text-slate-500">
          Use this space to document routine (non-crisis) contact using your
          4Ps and 10-Vs frameworks. This version is for demo/testing only and
          does not save to the live database yet.
        </p>
      </header>

      {/* Contact Snapshot */}
      <section className="space-y-1">
        <div className="text-[10px] font-semibold uppercase text-slate-600">
          Contact Snapshot
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-600">Contact Type</span>
            <select className="border rounded px-1 py-0.5 text-[10px] bg-white">
              {CONTACT_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-600">Contact Focus</span>
            <select className="border rounded px-1 py-0.5 text-[10px] bg-white">
              {CONTACT_FOCUS_OPTIONS.map((focus) => (
                <option key={focus}>{focus}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* 4Ps Snapshot */}
      <section className="space-y-2 border rounded-md p-2 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase text-slate-600">
            4Ps Snapshot
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
                {/* Simple, generic options – can be refined per P later */}
                <option>Stable</option>
                <option>Improved</option>
                <option>Worsened</option>
                <option>New Concern</option>
              </select>
              <textarea
                className="border rounded px-1 py-0.5 text-[10px] w-full"
                rows={2}
                placeholder={`RN notes for ${pLabel.toLowerCase()} lens...`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 10-Vs High-Level Panel */}
      <section className="space-y-2 border rounded-md p-2 bg-white">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase text-slate-600">
            10-Vs Checkpoint
          </div>
          <div className="text-[9px] text-slate-500">
            Quick notes by V, using your official 10-Vs framework.
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

      {/* RN Plan / Tasks */}
      <section className="space-y-2 border rounded-md p-2 bg-white">
        <div className="text-[10px] font-semibold uppercase text-slate-600">
          RN Actions & Next Steps
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-600">
              Planned RN Actions
            </span>
            <textarea
              className="border rounded px-1 py-0.5 text-[10px] w-full"
              rows={3}
              placeholder="Example: Call ortho office to confirm subsequent care plan; message attorney with functional update; request updated PT notes..."
            />
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-600">
              Client Education / Coaching
            </span>
            <textarea
              className="border rounded px-1 py-0.5 text-[10px] w-full"
              rows={3}
              placeholder="Education given, self-management coaching, red-flag review, return-to-work guidance, etc."
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-600">
              Subsequent care plan timeframe
            </span>
            <select className="border rounded px-1 py-0.5 text-[10px] bg-white">
              {FOLLOW_UP_TIMEFRAMES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-600">Routing / FYI</span>
            <select className="border rounded px-1 py-0.5 text-[10px] bg-white">
              {ROUTING_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Demo Notice */}
      <section className="border-t pt-2">
        <p className="text-[9px] text-slate-400">
          Demo note: This Subsequent Care Plan form is currently local-only for
          walkthroughs and Dec 31 testing. In a later phase, these fields will
          be wired to the case record, attorney view, and reporting.
        </p>
      </section>
    </div>
  );
};

export default RNFollowUpForm;


