// src/components/rn/FourPsAssessment.tsx
// RN 4Ps Panel — controlled by parent via onChange

import React, { useState } from "react";

export type FourPId = "physical" | "psychological" | "psychosocial" | "professional";

type FourPsAssessmentProps = {
  values?: Partial<Record<FourPId, number>>;
  onChange?: (id: FourPId, value: number) => void;
};

type FourPConfig = {
  id: FourPId;
  label: string;
  description: string;
};

const FOUR_PS_CONFIG: FourPConfig[] = [
  {
    id: "physical",
    label: "Physical",
    description:
      "Medical conditions, pain, mobility, treatment adherence, and overall physical stability.",
  },
  {
    id: "psychological",
    label: "Psychological",
    description:
      "Mood, cognition, coping, stress, trauma impact, and emotional functioning.",
  },
  {
    id: "psychosocial",
    label: "Psychosocial",
    description:
      "Supports, home environment, finances, transportation, relationships, and SDOH.",
  },
  {
    id: "professional",
    label: "Professional",
    description:
      "Work capacity, role identity, job demands, income dependency, and return-to-work feasibility.",
  },
];

const scoreOptions = [1, 2, 3, 4, 5];

const FourPsAssessment: React.FC<FourPsAssessmentProps> = ({ values, onChange }) => {
  const [localScores, setLocalScores] = useState<Partial<Record<FourPId, number>>>({});

  const getScore = (id: FourPId): number | undefined => {
    if (values && values[id] != null) return values[id]!;
    return localScores[id];
  };

  const handleScoreChange = (id: FourPId, value: number) => {
    setLocalScores((prev) => ({ ...prev, [id]: value }));
    if (onChange) {
      onChange(id, value);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-3 mb-4">
      <h2 className="text-base font-semibold mb-1">RN 4Ps of Wellness</h2>
      <p className="text-[11px] text-slate-600 mb-2">
        Score each P from 1 (very unstable / high concern) to 5 (stable / low concern).
        These scores will feed the Viability and 10-Vs clinical logic.
      </p>

      <div className="space-y-3">
        {FOUR_PS_CONFIG.map((p) => {
          const score = getScore(p.id) ?? 0;

          return (
            <div
              key={p.id}
              className="border border-slate-200 rounded-md p-2 bg-slate-50"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="text-[12px] font-semibold">{p.label}</div>
                  <div className="text-[11px] text-slate-700">
                    {p.description}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-600">Score</span>
                  <div className="flex gap-1">
                    {scoreOptions.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleScoreChange(p.id, n)}
                        className={
                          "w-6 h-6 rounded text-[11px] border flex items-center justify-center " +
                          (score === n
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-800 border-slate-300")
                        }
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FourPsAssessment;
