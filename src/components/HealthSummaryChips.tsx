import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useClientCheckins } from "@/hooks/useClientCheckins";

interface HealthSummaryChipsProps {
  caseId: string;
}

const FOUR_PS = [
  { name: 'p_physical', label: 'Physical' },
  { name: 'p_psychological', label: 'Psychological' },
  { name: 'p_psychosocial', label: 'Psychosocial' },
  { name: 'p_profession', label: 'Professional' }
];

const SDOH = [
  { name: 'sdoh_housing', label: 'Housing' },
  { name: 'sdoh_food', label: 'Food' },
  { name: 'sdoh_transport', label: 'Transport' },
  { name: 'sdoh_financial', label: 'Financial' },
  { name: 'sdoh_insurance', label: 'Insurance' },
  { name: 'sdoh_employment', label: 'Employment' },
  { name: 'sdoh_social_support', label: 'Support' },
  { name: 'sdoh_safety', label: 'Safety' },
  { name: 'sdoh_healthcare_access', label: 'Access to Care' }
];

export function HealthSummaryChips({ caseId }: HealthSummaryChipsProps) {
  const { checkins } = useClientCheckins(caseId);
  
  const latestCheckin = checkins[0];

  const getSeverityClass = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'bg-muted text-muted-foreground';
    if (value <= 0) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (value <= 1) return 'bg-green-100 text-green-800 border-green-300';
    if (value <= 2) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (value <= 3) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getValue = (name: string): number | null => {
    if (!latestCheckin) return null;
    const value = (latestCheckin as any)[name];
    if (value === null || value === undefined) return null;
    // Normalize to 0-4 scale if needed
    return value > 4 ? value / 25 : value;
  };

  const calculateAverage = (values: (number | null)[]): number => {
    const validValues = values.filter((v): v is number => v !== null && !isNaN(v));
    if (validValues.length === 0) return 0;
    return Math.round((validValues.reduce((a, b) => a + b, 0) / validValues.length) * 10) / 10;
  };

  const fourPsValues = FOUR_PS.map(f => {
    const key = f.name === 'p_profession' ? 'p_purpose' : f.name;
    return getValue(key);
  });
  
  const sdohValues = SDOH.map(s => getValue(s.name));
  
  const allValues = [...fourPsValues, ...sdohValues];
  const overallScore = calculateAverage(allValues);
  const healthPercentage = Math.min(100, Math.max(0, (overallScore / 4) * 100));

  if (!latestCheckin) {
    return null;
  }

  return (
    <Card className="p-6 bg-white border-2 border-rcms-gold shadow-xl">
      <div className="space-y-6">
        {/* Case Health Meter */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-foreground">Case Health Meter</h3>
            <span className="text-2xl font-bold text-rcms-teal">{overallScore.toFixed(1)}</span>
          </div>
          <Progress value={healthPercentage} className="h-4" />
          <p className="text-xs text-muted-foreground mt-1">
            Based on latest check-in averages (lower scores indicate better wellness)
          </p>
        </div>

        {/* 4Ps Chips */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">4Ps Assessment</h4>
          <div className="flex flex-wrap gap-2">
            {FOUR_PS.map((fp, idx) => {
              const key = fp.name === 'p_profession' ? 'p_purpose' : fp.name;
              const value = getValue(key);
              return (
                <div
                  key={fp.name}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${getSeverityClass(value)}`}
                >
                  <span className="font-semibold">{fp.label}:</span> {value !== null ? value.toFixed(1) : '—'}
                </div>
              );
            })}
          </div>
        </div>

        {/* SDOH Chips */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Social Determinants of Health (SDOH)</h4>
          <div className="flex flex-wrap gap-2">
            {SDOH.map((sdoh) => {
              const value = getValue(sdoh.name);
              return (
                <div
                  key={sdoh.name}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${getSeverityClass(value)}`}
                >
                  <span className="font-semibold">{sdoh.label}:</span> {value !== null ? value.toFixed(1) : '—'}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
