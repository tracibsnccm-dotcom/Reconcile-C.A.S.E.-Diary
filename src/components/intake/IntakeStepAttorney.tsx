import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { IntakeAttorney, IntakeFormData } from "./intakeTypes";

const CARD_CLASS =
  "bg-slate-800 border border-slate-700 rounded-xl p-6 text-left";
const LABEL_CLASS = "block text-sm font-medium text-slate-300 mb-2";
const INPUT_CLASS =
  "w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent";

interface IntakeStepAttorneyProps {
  data: IntakeFormData;
  onChange: (attorney: IntakeFormData["attorney"]) => void;
  onValidityChange: (valid: boolean) => void;
}

export function IntakeStepAttorney({
  data,
  onChange,
  onValidityChange,
}: IntakeStepAttorneyProps) {
  const [attorneys, setAttorneys] = useState<IntakeAttorney[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load attorneys via get_attorney_directory RPC (same as C.A.R.E. client intake)
  useEffect(() => {
    if (!supabase) {
      setError("Database not configured");
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error: e } = await supabase.rpc("get_attorney_directory");
      if (e || !data) {
        setError(e?.message ?? "Unable to load attorneys. Please refresh or contact support.");
        setAttorneys([]);
      } else {
        const rows = Array.isArray(data) ? data : [data];
        setAttorneys(
          rows.map(
            (r: { attorney_id: string; attorney_name: string; attorney_code?: string | null }) => ({
              attorneyId: r.attorney_id,
              attorneyCode: r.attorney_code ?? "",
              displayName: r.attorney_name || "Unknown",
            })
          )
        );
      }
      setLoading(false);
    })();
  }, []);

  const valid = !!data.attorney?.attorneyId;
  useEffect(() => {
    onValidityChange(valid);
  }, [valid, onValidityChange]);

  return (
    <div className={CARD_CLASS}>
      <h2 className="text-xl font-semibold text-white mb-2">
        Attorney Selection
      </h2>
      <p className="text-slate-400 text-sm mb-6">
        Select the attorney who referred you or who will represent you.
      </p>
      {loading ? (
        <p className="text-slate-400">Loading attorneys...</p>
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : (
        <div>
          <label className={LABEL_CLASS}>Attorney</label>
          <select
            className={INPUT_CLASS}
            value={data.attorney?.attorneyId ?? ""}
            onChange={(e) => {
              const id = e.target.value;
              const a = attorneys.find((x) => x.attorneyId === id) ?? null;
              onChange(a);
            }}
          >
            <option value="">— Select an attorney —</option>
            {attorneys.map((a) => (
              <option key={a.attorneyId} value={a.attorneyId}>
                {a.displayName} {a.attorneyCode ? `(${a.attorneyCode})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
