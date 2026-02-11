import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, Minus, Activity, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

interface BaselineScores {
  fourPs: {
    physical: number;
    psychological: number;
    psychosocial: number;
    professional: number;
  };
  sdoh: {
    housing: number;
    food: number;
    transport: number;
    insuranceGap: number;
    financial: number;
    employment: number;
    social_support: number;
    safety: number;
    healthcare_access: number;
  };
  baselineDate: string;
}

interface CurrentScores {
  physical: number;
  psychological: number;
  psychosocial: number;
  professional: number;
  housing: number;
  food: number;
  transport: number;
  insurance: number;
  financial: number;
  employment: number;
  social_support: number;
  safety: number;
  healthcare_access: number;
  checkinDate: string;
}

interface BaselineProgressComparisonProps {
  caseId: string;
}

// Migration helpers for displaying old scale values (0-4 or 0-100) on new 1-5 scale
// Migration behavior: old 0-4 values are converted by adding 1 (0->1, 1->2, 2->3, 3->4, 4->5)
// Old 0-100 values (stored percentages) are converted: (value / 25) + 1
function migrateOld4PsValue(value: number | null | undefined): number {
  if (value === null || value === undefined) return 3; // Default to middle (3)
  // If value is 0-4 (old scale), add 1 to convert to 1-5
  if (value >= 0 && value <= 4) return value + 1;
  // If value is 0-100 (stored percentage), convert to 1-5 scale
  if (value > 4 && value <= 100) {
    // Map 0-100 to 1-5: 0->1, 25->2, 50->3, 75->4, 100->5
    return Math.max(1, Math.min(5, Math.round((value / 25) + 1)));
  }
  // If already 1-5, return as-is
  return Math.max(1, Math.min(5, value));
}

function migrateOldSdohValue(value: number | null | undefined): number {
  if (value === null || value === undefined) return 1; // Default to minimum (1)
  // If value is 0-4 (old scale), add 1 to convert to 1-5
  if (value >= 0 && value <= 4) return value + 1;
  // If already 1-5, return as-is
  return Math.max(1, Math.min(5, value));
}

export function BaselineProgressComparison({ caseId }: BaselineProgressComparisonProps) {
  const [baseline, setBaseline] = useState<BaselineScores | null>(null);
  const [current, setCurrent] = useState<CurrentScores | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScores();
  }, [caseId]);

  const fetchScores = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const user = await supabase.auth.getUser();
      if (!user.data.user?.id) {
        setLoading(false);
        return;
      }

      // Fetch all check-ins for this case to find baseline (first check-in)
      const { data: allCheckins, error: checkinsError } = await supabase
        .from("rc_client_checkins")
        .select("*")
        .eq("case_id", caseId)
        .eq("client_id", user.data.user.id)
        .order("created_at", { ascending: true });

      if (checkinsError) {
        console.warn("[BaselineProgressComparison] Error fetching check-ins:", checkinsError);
        // Don't throw - just continue without baseline
      }

      // Use first check-in as baseline if available
      if (allCheckins && allCheckins.length > 0) {
        const baselineCheckin = allCheckins[0];
        const latestCheckin = allCheckins[allCheckins.length - 1];

        // Set baseline from first check-in
        // Convert 0-100 (stored) to 1-5 scale: (value / 25) + 1
        // Migration: old 0-4 values will be handled by migrateOld4PsValue
        setBaseline({
          fourPs: {
            physical: migrateOld4PsValue((baselineCheckin.p_physical || 0) / 25),
            psychological: migrateOld4PsValue((baselineCheckin.p_psychological || 0) / 25),
            psychosocial: migrateOld4PsValue((baselineCheckin.p_psychosocial || 0) / 25),
            professional: migrateOld4PsValue((baselineCheckin.p_professional || 0) / 25),
          },
          sdoh: {
            housing: migrateOldSdohValue(baselineCheckin.housing),
            food: migrateOldSdohValue(baselineCheckin.food),
            transport: migrateOldSdohValue(baselineCheckin.transport),
            insuranceGap: migrateOldSdohValue(baselineCheckin.insurance),
            financial: migrateOldSdohValue(baselineCheckin.financial),
            employment: migrateOldSdohValue(baselineCheckin.employment),
            social_support: migrateOldSdohValue(baselineCheckin.social_support),
            safety: migrateOldSdohValue(baselineCheckin.safety),
            healthcare_access: migrateOldSdohValue(baselineCheckin.healthcare_access),
          },
          baselineDate: baselineCheckin.created_at
        });

        // Set current from latest check-in (if different from baseline)
        if (allCheckins.length > 1) {
          setCurrent({
            physical: migrateOld4PsValue((latestCheckin.p_physical || 0) / 25),
            psychological: migrateOld4PsValue((latestCheckin.p_psychological || 0) / 25),
            psychosocial: migrateOld4PsValue((latestCheckin.p_psychosocial || 0) / 25),
            professional: migrateOld4PsValue((latestCheckin.p_professional || 0) / 25),
            housing: migrateOldSdohValue(latestCheckin.housing),
            food: migrateOldSdohValue(latestCheckin.food),
            transport: migrateOldSdohValue(latestCheckin.transport),
            insurance: migrateOldSdohValue(latestCheckin.insurance),
            financial: migrateOldSdohValue(latestCheckin.financial),
            employment: migrateOldSdohValue(latestCheckin.employment),
            social_support: migrateOldSdohValue(latestCheckin.social_support),
            safety: migrateOldSdohValue(latestCheckin.safety),
            healthcare_access: migrateOldSdohValue(latestCheckin.healthcare_access),
            checkinDate: latestCheckin.created_at
          });
        }
      }
    } catch (err: any) {
      console.error("[BaselineProgressComparison] Error fetching scores:", err);
      // Don't set error state - just log and continue
      // This component is non-critical and should not break the page
    } finally {
      setLoading(false);
    }
  };

  const calculateChange = (baselineVal: number, currentVal: number) => {
    const change = currentVal - baselineVal;
    return {
      value: Math.abs(change).toFixed(1),
      direction: change > 0 ? "up" : change < 0 ? "down" : "same",
      // Maslow-based: 1=worst, 5=best, so higher scores = improvement
      isImprovement: change > 0
    };
  };

  const getChangeIcon = (direction: string, isImprovement: boolean) => {
    if (direction === "same") return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (direction === "up") {
      return isImprovement ? 
        <TrendingUp className="w-4 h-4 text-green-600" /> : 
        <TrendingUp className="w-4 h-4 text-red-600" />;
    }
    return isImprovement ? 
      <TrendingDown className="w-4 h-4 text-green-600" /> : 
      <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  // If no baseline data, show minimal message and return null (non-critical component)
  if (!baseline) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Baseline Progress Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Baseline comparison unavailable. Complete your first check-in to establish a baseline.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // If baseline exists but no current data (only one check-in)
  if (!current) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Baseline Assessment Snapshot
          </CardTitle>
          <CardDescription>
            Established on {formatDate(baseline.baselineDate)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription>
              Complete your next check-in to see progress compared to your baseline.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-3">Baseline 4Ps of Wellness</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Physical", value: baseline.fourPs.physical },
                  { label: "Psychological", value: baseline.fourPs.psychological },
                  { label: "Psychosocial", value: baseline.fourPs.psychosocial },
                  { label: "Professional", value: baseline.fourPs.professional }
                ].map((item) => (
                  <div key={item.label} className="p-3 bg-muted rounded-lg text-center">
                    <div className="text-2xl font-bold text-foreground">{item.value.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate overall progress
  const fourPsComparison = [
    { label: "Physical", baseline: baseline.fourPs.physical, current: current.physical },
    { label: "Psychological", baseline: baseline.fourPs.psychological, current: current.psychological },
    { label: "Psychosocial", baseline: baseline.fourPs.psychosocial, current: current.psychosocial },
    { label: "Professional", baseline: baseline.fourPs.professional, current: current.professional }
  ];

  const sdohComparison = [
    { label: "Housing", baseline: baseline.sdoh.housing, current: current.housing },
    { label: "Food Security", baseline: baseline.sdoh.food, current: current.food },
    { label: "Transportation", baseline: baseline.sdoh.transport, current: current.transport },
    { label: "Insurance", baseline: baseline.sdoh.insuranceGap, current: current.insurance },
    { label: "Financial", baseline: baseline.sdoh.financial, current: current.financial },
    { label: "Employment", baseline: baseline.sdoh.employment, current: current.employment },
    { label: "Social Support", baseline: baseline.sdoh.social_support, current: current.social_support },
    { label: "Safety", baseline: baseline.sdoh.safety, current: current.safety },
    { label: "Healthcare Access", baseline: baseline.sdoh.healthcare_access, current: current.healthcare_access }
  ];

  // Calculate average baseline and current (1-5 scale)
  const avgBaseline = (
    [...fourPsComparison.map(c => c.baseline), ...sdohComparison.map(c => c.baseline)]
      .reduce((sum, val) => sum + val, 0) / 13
  ).toFixed(1);

  const avgCurrent = (
    [...fourPsComparison.map(c => c.current), ...sdohComparison.map(c => c.current)]
      .reduce((sum, val) => sum + val, 0) / 13
  ).toFixed(1);

  const overallChange = calculateChange(Number(avgBaseline), Number(avgCurrent));

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Baseline vs. Current Progress
            </CardTitle>
            <CardDescription>
              Comparing your journey from baseline to today
            </CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            {getChangeIcon(overallChange.direction, overallChange.isImprovement)}
            {overallChange.direction !== "same" && `${overallChange.value} change`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timeline dates */}
        <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Baseline:</span>
            <span>{formatDate(baseline.baselineDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Latest:</span>
            <span>{formatDate(current.checkinDate)}</span>
          </div>
        </div>

        {/* Overall comparison */}
        <div className="p-4 bg-primary/5 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">Overall Average Score</h4>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {avgBaseline} → {avgCurrent}
              </span>
              {getChangeIcon(overallChange.direction, overallChange.isImprovement)}
            </div>
          </div>
          {/* Progress bar: 1=worst (0%), 5=best (100%) */}
          <Progress value={((Number(avgCurrent) - 1) / 4) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Maslow-based scale: Lower scores indicate higher need (1 = Critical barrier / unmet needs, 5 = Stable / needs met)
          </p>
        </div>

        {/* 4Ps Comparison */}
        <div>
          <h4 className="font-semibold text-sm mb-3 text-foreground">4Ps of Wellness Comparison</h4>
          <div className="space-y-3">
            {fourPsComparison.map((item) => {
              const change = calculateChange(item.baseline, item.current);
              return (
                <div key={item.label} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.label}</span>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="text-xs">
                          {item.baseline.toFixed(1)} → {item.current.toFixed(1)}
                        </Badge>
                        {getChangeIcon(change.direction, change.isImprovement)}
                      </div>
                    </div>
                    {/* Progress bar: 1=worst (0%), 5=best (100%) */}
                    <Progress 
                      value={((item.current - 1) / 4) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SDOH Comparison */}
        <div>
          <h4 className="font-semibold text-sm mb-3 text-foreground">Social Determinants of Health Comparison</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sdohComparison.map((item) => {
              const change = calculateChange(item.baseline, item.current);
              return (
                <div key={item.label} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
                  <span className="flex-1">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {item.baseline.toFixed(1)} → {item.current.toFixed(1)}
                    </span>
                    {getChangeIcon(change.direction, change.isImprovement)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
