import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Calendar, User, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface CarePlan {
  id: string;
  plan_text: string;
  plan_type: string;
  version: number;
  created_at: string;
  created_by: string | null;
  profiles?: {
    display_name: string | null;
  } | null;
}

interface CarePlansViewerProps {
  caseId: string;
}

interface BaselineScores {
  fourPs: {
    physical: number;
    psychological: number;
    psychosocial: number;
    professional: number;
  };
  sdoh: Record<string, number>;
  bmi: number | null;
  baselineDate: string;
}

export function CarePlansViewer({ caseId }: CarePlansViewerProps) {
  const [carePlans, setCarePlans] = useState<CarePlan[]>([]);
  const [baseline, setBaseline] = useState<BaselineScores | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCarePlans();
  }, [caseId]);

  const fetchCarePlans = async () => {
    try {
      setLoading(true);
      
      // Fetch care plans
      const { data, error } = await supabase
        .from("care_plans")
        .select(`
          *,
          profiles!care_plans_created_by_fkey (
            display_name
          )
        `)
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCarePlans(data || []);

      // Fetch baseline scores including BMI from intake
      const { data: caseData, error: caseError } = await supabase
        .from("rc_cases")
        .select(`
          fourps, 
          sdoh, 
          created_at,
          intakes!inner(intake_data)
        `)
        .eq("id", caseId)
        .eq("is_superseded", false)
        .single();

      if (!caseError && caseData?.fourps && caseData?.sdoh) {
        // Extract BMI from intake_data if available
        const intakeData = caseData.intakes?.[0]?.intake_data as any;
        const bmi = intakeData?.summary?.bmi || intakeData?.bmi || null;
        
        setBaseline({
          fourPs: caseData.fourps as any,
          sdoh: caseData.sdoh as any,
          bmi: bmi,
          baselineDate: caseData.created_at
        });
      }
    } catch (err: any) {
      console.error("Error fetching care plans:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Error loading care plans: {error}</AlertDescription>
      </Alert>
    );
  }

  if (carePlans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Care Plans
          </CardTitle>
          <CardDescription>View your preliminary care plans and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              No care plans available yet. Your care team will create a preliminary care plan after your initial assessment.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Care Plans
        </CardTitle>
        <CardDescription>
          View your preliminary care plans and updates. The most recent plan is shown first.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Baseline Scores Reference */}
        {baseline && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Baseline Assessment Reference
              </CardTitle>
              <CardDescription className="text-xs">
                Intake completed on {format(new Date(baseline.baselineDate), "PPP")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h5 className="text-xs font-semibold mb-2 text-foreground">4Ps of Wellness</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { label: "Physical", value: baseline.fourPs.physical },
                      { label: "Psychological", value: baseline.fourPs.psychological },
                      { label: "Psychosocial", value: baseline.fourPs.psychosocial },
                      { label: "Professional", value: baseline.fourPs.professional }
                    ].map((item) => (
                      <div key={item.label} className="text-center p-2 bg-background rounded">
                        <div className="text-lg font-bold text-foreground">{item.value}</div>
                        <div className="text-xs text-muted-foreground">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {baseline.bmi && (
                  <div>
                    <h5 className="text-xs font-semibold mb-2 text-foreground">Baseline Biometrics</h5>
                    <div className="text-center p-2 bg-background rounded max-w-[150px]">
                      <div className="text-lg font-bold text-foreground">{baseline.bmi}</div>
                      <div className="text-xs text-muted-foreground">BMI</div>
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  <strong>Note:</strong> These baseline scores guide your care plan and track progress throughout your recovery journey.
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {carePlans.map((plan, index) => (
          <Card key={plan.id} className={index === 0 ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      {plan.plan_type.charAt(0).toUpperCase() + plan.plan_type.slice(1)} Care Plan
                    </CardTitle>
                    {index === 0 && (
                      <Badge variant="default">Most Recent</Badge>
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(plan.created_at), "PPP")}
                    </span>
                    {plan.profiles?.display_name && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {plan.profiles.display_name}
                      </span>
                    )}
                    <Badge variant="outline">Version {plan.version}</Badge>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-foreground">{plan.plan_text}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
