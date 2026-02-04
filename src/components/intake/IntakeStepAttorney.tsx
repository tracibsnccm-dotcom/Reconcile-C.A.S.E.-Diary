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

  useEffect(() => {
    if (!supabase) {
      setError("Database not configured");
      setLoading(false);
      return;
    }
    (async () => {
      const { data: rows, error: e } = await supabase
        .from("rc_users")
        .select("id, attorney_code, full_name, first_name, last_name")
        .eq("role", "attorney")
        .order("full_name", { ascending: true });

      if (e) {
        setError(e.message);
        setAttorneys([]);
      } else {
        setAttorneys(
          (rows || []).map((r: { id: string; attorney_code: string | null; full_name: string | null; first_name: string | null; last_name: string | null }) => ({
            attorneyId: r.id,
            attorneyCode: r.attorney_code || "",
            displayName:
              r.full_name ||
              [r.first_name, r.last_name].filter(Boolean).join(" ") ||
              `Attorney ${r.attorney_code || r.id}`,
          }))
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
