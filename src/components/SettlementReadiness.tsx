/* ============================================
   FILE: src/components/SettlementReadiness.tsx
   - Badge with number + color
   - Meter bar
   - Breakdown tooltip/details
   ============================================ */
import React, { useMemo, useState } from "react";
import { computeSettlementReadinessScore, CaseLite } from "../lib/readiness";

const palette = {
  navy: "#0f2a6a",
  teal: "#128f8b",
  orange: "#ff7a00",
  eggplant: "#4b1d3f",
  ok: "#198754",      // green
  warn: "#f59e0b",    // amber
  bad: "#dc2626",     // red
  rail: "#e5e7eb",    // gray-200
};

type Props = { kase: CaseLite; small?: boolean; };

export function SettlementReadinessBadge({ kase, small }: Props) {
  const { score } = useMemo(() => computeSettlementReadinessScore(kase), [kase]);
  const color = score >= 80 ? palette.ok : score >= 50 ? palette.warn : palette.bad;
  const sizeCls = small ? "text-xs px-2 py-1" : "text-sm px-3 py-1.5";
  return (
    <span
      role="img"
      aria-label={`Settlement readiness ${score} out of 100`}
      className={`inline-flex items-center rounded-full font-bold text-white ${sizeCls}`}
      title={`Settlement Readiness: ${score}/100`}
      style={{ backgroundColor: color }}
    >
      SR {score}
    </span>
  );
}

export function SettlementReadinessMeter({ kase }: Props) {
  const { score, buckets, blockers } = useMemo(() => computeSettlementReadinessScore(kase), [kase]);
  const color = score >= 80 ? palette.ok : score >= 50 ? palette.warn : palette.bad;

  const [open, setOpen] = useState(false);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SettlementReadinessBadge kase={kase} />
          <button
            className="text-xs underline text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#128f8b] rounded"
            onClick={() => setOpen(v => !v)}
            aria-expanded={open}
          >
            {open ? "Hide details" : "View details"}
          </button>
        </div>
        <div className="text-xs text-gray-600" aria-hidden>
          0–49 Low • 50–79 Moderate • 80–100 High
        </div>
      </div>

      <div className="mt-2 h-3 w-full rounded-full" style={{ backgroundColor: palette.rail }}>
        <div
          className="h-3 rounded-full"
          style={{ width: `${score}%`, backgroundColor: color }}
          aria-hidden
        />
      </div>

      {open && (
        <div className="mt-3 rounded-lg border border-gray-200 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <BreakdownItem label="Medical Milestones" value={buckets.medical} color={palette.ok} />
            <BreakdownItem label="Documentation" value={buckets.documentation} color={palette.teal} />
            <BreakdownItem label="Routing & Flow" value={buckets.routing} color={palette.orange} />
            <BreakdownItem label="SDOH Stability" value={buckets.sdoh} color={palette.eggplant} />
          </div>
          {blockers.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-700">Top blockers:</p>
              <ul className="mt-1 list-disc pl-5 text-xs text-gray-700">
                {blockers.slice(0, 5).map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          ) : (
            <p className="mt-3 text-xs text-emerald-700">No major blockers detected.</p>
          )}
          {/* TODO: Hook up "Fix next" suggestions: open relevant module, e.g., request specialist report */}
        </div>
      )}
    </div>
  );
}

function BreakdownItem({ label, value, color }: { label: string; value: number; color: string }) {
  // Each bucket already on a 0..weight scale; normalize to percentage of its own max for the mini bar
  const pct = Math.round((value / 35) * 100); // worst-case max 35; visual only
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-600">{value}</span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-gray-200" aria-hidden>
        <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
