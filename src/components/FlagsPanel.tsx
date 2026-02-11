// src/components/FlagsPanel.tsx

import React from "react";
import { Flag } from "../lib/models";

interface FlagsPanelProps {
  flags: Flag[];
}

/**
 * Reconcile C.A.R.E.™ Flags Panel
 * Shows active risk, support, and quality flags.
 * Each flag now includes its V-Framework category (Vigilance, Viability, Verification).
 */
const FlagsPanel: React.FC<FlagsPanelProps> = ({ flags }) => {
  const openFlags = flags.filter((f) => f.status === "Open");

  if (openFlags.length === 0) {
    return (
      <section className="bg-white border rounded-xl p-3 shadow-sm mb-4">
        <div className="text-xs font-semibold text-slate-700">
          Active Flags &amp; Alerts
        </div>
        <div className="text-xs text-slate-500 mt-1">
          No active risk or support flags at this time.
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white border rounded-xl p-3 shadow-sm mb-4">
      <div className="text-xs font-semibold text-slate-700 mb-1">
        Active Flags &amp; Alerts
      </div>
      <div className="text-[10px] text-slate-500 mb-2">
        Flags reflect your V-Framework for clinical reasoning:
        Vigilance = risks, Viability = stability / resources, Verification = audit / follow-up.
      </div>

      <ul className="space-y-1">
        {openFlags.map((flag) => {
          const category = mapFlagToV(flag);
          return (
            <li
              key={flag.id}
              className={
                "text-xs px-2 py-1 rounded border flex items-start gap-2 " +
                flagSeverityClass(flag.severity)
              }
            >
              <span className="mt-[2px]">•</span>
              <div>
                <div className="font-semibold">
                  {category.emoji} {category.label}: {flag.label}
                </div>
                <div className="text-[10px] text-slate-600">
                  Type: {flag.type} | Severity: {flag.severity}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

// --- Helper Functions ---

function mapFlagToV(flag: Flag): { label: string; emoji: string } {
  const t = flag.type?.toLowerCase?.() || "";
  if (t.includes("sdoh") || t.includes("risk")) {
    return { label: "Vigilance Flag", emoji: "⚙️" };
  }
  if (t.includes("support") || t.includes("viability")) {
    return { label: "Viability Flag", emoji: "🌿" };
  }
  if (t.includes("task") || t.includes("audit") || t.includes("follow")) {
    return { label: "Verification Flag", emoji: "🧾" };
  }
  return { label: "General Flag", emoji: "📌" };
}

function flagSeverityClass(severity: Flag["severity"]): string {
  switch (severity) {
    case "Critical":
      return "border-red-500 bg-red-50 text-red-700";
    case "High":
      return "border-orange-400 bg-orange-50 text-orange-700";
    case "Moderate":
      return "border-amber-300 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default FlagsPanel;
