// src/rn/RNCrisisScreen.tsx
// Reconcile C.A.R.E. — RN Crisis Mode Entry Screen (self-contained)
//
// This version hard-wires the crisis categories here so the RN
// always has a visible dropdown, even if other domain imports change.

import React, { useState } from "react";
import { useCrisisState } from "../domain/crisisState";

// Local crisis category list (to avoid any external dependency issues)
const CRISIS_CATEGORY_OPTIONS = [
  {
    key: "behavioral_suicide",
    label: "Behavioral / Suicide / Self-harm",
  },
  {
    key: "medical",
    label: "Medical Emergency",
  },
  {
    key: "violence_assault",
    label: "Violence / Assault / Safety",
  },
  {
    key: "other",
    label: "Other / Unsure",
  },
] as const;

const RNCrisisScreen: React.FC = () => {
  const {
    crisisCategory,
    setCrisisCategory,
    crisisDescription,
    setCrisisDescription,
    isInCrisis,
    enterCrisisMode,
    exitCrisisMode,
  } = useCrisisState();

  const [localCategory, setLocalCategory] = useState<string>(
    crisisCategory ?? ""
  );

  const [localDescription, setLocalDescription] = useState<string>(
    crisisDescription ?? ""
  );

  const handleStart = () => {
    if (!localCategory) {
      alert("Please choose a crisis type before entering crisis mode.");
      return;
    }
    setCrisisCategory(localCategory);
    setCrisisDescription(localDescription);
    enterCrisisMode();
  };

  if (isInCrisis) {
    const categoryLabel =
      CRISIS_CATEGORY_OPTIONS.find((c) => c.key === crisisCategory)?.label ??
      "Unknown";

    return (
      <div className="border rounded-xl bg-white p-4 text-[11px] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide">
            Crisis Mode Active
          </h2>
          <button
            onClick={exitCrisisMode}
            className="text-[10px] px-2 py-1 rounded-md border bg-white"
          >
            Exit Crisis Mode
          </button>
        </div>

        <p className="text-[10px] text-slate-600">
          Crisis Type: <span className="font-semibold">{categoryLabel}</span>
        </p>

        <p className="text-[10px] text-slate-600 whitespace-pre-line">
          {crisisDescription || "No description provided."}
        </p>

        <div className="border rounded-md p-2 bg-slate-50">
          <p className="text-[10px] text-slate-500">
            RN Crisis Mode Running — use the Buddy and Supervisor consoles to
            continue the workflow. This RN screen will expand as phases progress.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-xl bg-white p-4 text-[11px] space-y-4">
      <h2 className="text-[11px] font-semibold uppercase tracking-wide">
        RN Crisis Activation
      </h2>

      {/* Crisis Category Picker */}
      <div className="space-y-1">
        <label className="text-[10px] text-slate-600">Crisis Type</label>
        <select
          value={localCategory}
          onChange={(e) => setLocalCategory(e.target.value)}
          className="border rounded px-2 py-1 text-[10px] bg-white w-full"
        >
          <option value="">— Choose Crisis Type —</option>
          {CRISIS_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Crisis Description */}
      <div className="space-y-1">
        <label className="text-[10px] text-slate-600">
          Crisis Description (what the client reported / what you observed)
        </label>
        <textarea
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value)}
          className="border rounded px-2 py-1 text-[10px] w-full"
          rows={3}
          placeholder="Briefly describe the situation so the buddy/supervisor have context."
        />
      </div>

      {/* Activate */}
      <button
        onClick={handleStart}
        className="bg-red-500 text-white text-[11px] px-3 py-1.5 rounded-md"
      >
        Enter Crisis Mode
      </button>
    </div>
  );
};

export default RNCrisisScreen;
