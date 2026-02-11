import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Heart, Brain, Smile, Activity, AlertTriangle } from "lucide-react";
import { useClientCheckins } from "@/hooks/useClientCheckins";
import { Progress } from "@/components/ui/progress";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WellnessSnapshotProps {
  caseId: string;
  onViewProgress: () => void;
}

export function WellnessSnapshot({ caseId, onViewProgress }: WellnessSnapshotProps) {
  const { checkins, loading } = useClientCheckins(caseId);
  const recentCheckins = checkins.slice(0, 7);

  
  const round1 = (n: number) => Math.round(n * 10) / 10;
  const toFourScaleAvg = (vals: number[]) => {
    if (vals.length === 0) return 0;
    const avg = vals.reduce((s, v) => s + (v ?? 0), 0) / vals.length;
    return round1(avg > 4 ? avg / 25 : avg);
  };

  const avgPain = recentCheckins.length > 0
    ? round1(recentCheckins.reduce((sum, c) => sum + c.pain_scale, 0) / recentCheckins.length)
    : 0;
  const avgDepression = recentCheckins.length > 0
    ? round1(recentCheckins.reduce((sum, c) => sum + (c.depression_scale || 0), 0) / recentCheckins.length)
    : 0;
  const avgAnxiety = recentCheckins.length > 0
    ? round1(recentCheckins.reduce((sum, c) => sum + (c.anxiety_scale || 0), 0) / recentCheckins.length)
    : 0;

  const avgPhysical4 = toFourScaleAvg(recentCheckins.map((c) => c.p_physical));
  const avgPsychosocial4 = toFourScaleAvg(recentCheckins.map((c) => c.p_psychosocial));
  const avgProfession4 = toFourScaleAvg(recentCheckins.map((c) => c.p_purpose));
  const avgProtection4 = toFourScaleAvg(recentCheckins.map((c) => c.p_psychological));

  const metrics = [
    { label: "Pain", value: avgPain, max: 10, icon: Heart, color: "text-destructive" },
    { label: "Depression", value: avgDepression, max: 10, icon: Brain, color: "text-warning" },
    { label: "Anxiety", value: avgAnxiety, max: 10, icon: Brain, color: "text-warning" },
    { label: "Physical", value: avgPhysical4, max: 4, icon: Activity, color: "text-primary" },
    { label: "Psychological", value: avgProtection4, max: 4, icon: Activity, color: "text-primary" },
    { label: "Psychosocial", value: avgPsychosocial4, max: 4, icon: Activity, color: "text-primary" },
    { label: "Professional", value: avgProfession4, max: 4, icon: Smile, color: "text-primary" },
  ];

  const calculateOverallScore = () => {
    if (recentCheckins.length === 0) return 0;
    const painScore = 10 - avgPain;
    const depressionScore = 10 - avgDepression;
    const anxietyScore = 10 - avgAnxiety;
    const physicalScore = (avgPhysical4 / 4) * 10;
    const psychologicalScore = (avgProtection4 / 4) * 10;
    const psychosocialScore = (avgPsychosocial4 / 4) * 10;
    const professionalScore = (avgProfession4 / 4) * 10;
    const allScores = [painScore, depressionScore, anxietyScore, physicalScore, psychologicalScore, psychosocialScore, professionalScore];
    const average = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
    return Math.round(average * 10);
  };

  const overallScore = calculateOverallScore();
  const getWellnessStatus = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "text-green-600", bgColor: "bg-green-100" };
    if (score >= 60) return { label: "Good", color: "text-blue-600", bgColor: "bg-blue-100" };
    if (score >= 40) return { label: "Fair", color: "text-yellow-600", bgColor: "bg-yellow-100" };
    if (score >= 20) return { label: "Needs Attention", color: "text-orange-600", bgColor: "bg-orange-100" };
    return { label: "Critical", color: "text-red-600", bgColor: "bg-red-100" };
  };
  const wellnessStatus = getWellnessStatus(overallScore);

  if (loading) {
    return (
      <Card className="p-6 border-primary/20">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (recentCheckins.length === 0) {
    return (
      <Card className="p-6 bg-white border-2 border-rcms-gold shadow-xl">
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-rcms-pale-gold flex items-center justify-center">
            <TrendingUp className="w-10 h-10 text-rcms-gold" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Check-ins Yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Complete your first wellness check-in to start tracking your progress.
          </p>
          <Button onClick={onViewProgress} className="bg-rcms-gold text-rcms-black hover:bg-rcms-black hover:text-rcms-gold">
            Complete First Check-in
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white border-2 border-rcms-gold shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-rcms-teal" />
            Wellness Snapshot
          </h2>
          <p className="text-sm text-muted-foreground mt-1">7-day averages</p>
        </div>
        <Button onClick={onViewProgress} size="sm" className="bg-rcms-gold text-rcms-black hover:bg-rcms-black hover:text-rcms-gold">
          View Progress Charts
        </Button>
      </div>

      {recentCheckins.length > 0 && (
        <div className="mb-6 p-4 rounded-lg border-2 border-rcms-gold bg-gradient-to-r from-rcms-pale-gold to-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-foreground">Overall Wellness Score</h3>
              <p className="text-xs text-muted-foreground">Composite score from all metrics</p>
            </div>
            <div className={`px-4 py-2 rounded-full ${wellnessStatus.bgColor}`}>
              <span className={`text-sm font-bold ${wellnessStatus.color}`}>{wellnessStatus.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={overallScore} className="h-3" />
            </div>
            <div className="text-3xl font-bold text-foreground">{overallScore}%</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mt-6">
        {metrics.map((metric) => (
          <div key={metric.label} className="text-center">
            <div className={`flex justify-center mb-2 ${metric.color}`}>
              <metric.icon className="w-6 h-6" />
            </div>
            <div className="text-2xl font-bold text-foreground">{metric.value}</div>
            <div className="text-xs text-muted-foreground">/ {metric.max}</div>
            <div className="text-xs font-medium text-foreground mt-1">{metric.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
