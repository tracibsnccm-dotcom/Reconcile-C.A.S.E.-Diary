import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { LabeledInput } from "@/components/LabeledInput";
import { LabeledTextarea } from "@/components/LabeledTextarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import { useCases } from "@/hooks/useSupabaseData";
import { FourPs } from "@/config/rcms";
import { Calendar, TrendingUp, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { fmtDate } from "@/lib/store";
import { Sparkline } from "@/components/Sparkline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { resolveClientByAuthUserId } from "@/lib/clientResolver";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

// Helper to validate if a string is a UUID
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isValidUuid(value: string | null | undefined): boolean {
  if (!value) return false;
  return UUID_RE.test(String(value).trim());
}

// Migration helpers for displaying old scale values (0-4 or 0-10) on new 1-5 scale
// These ensure backward compatibility with existing saved data
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

function migrateOldPainDepressionAnxiety(value: number | null | undefined): number {
  if (value === null || value === undefined) return 3; // Default to middle (3)
  // If value is 0-10 (old scale), map to 1-5: 0->1, 2->2, 4->3, 7->4, 10->5
  if (value >= 0 && value <= 10) {
    if (value === 0) return 1;
    if (value <= 2) return 2;
    if (value <= 4) return 3;
    if (value <= 7) return 4;
    return 5;
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

export default function ClientCheckins() {
  const { cases: appContextCases, setCases, log } = useApp();
  // Use useCases hook to fetch cases from Supabase (MVP data source)
  const { cases: supabaseCases, loading: casesLoading, error: casesError, refetch: refetchCases } = useCases();
  
  // Use Supabase cases if available, otherwise fall back to app context cases
  const availableCases = useMemo(() => {
    return supabaseCases.length > 0 ? supabaseCases : appContextCases;
  }, [supabaseCases, appContextCases]);
  
  const [forCase, setForCase] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmittedAt, setLastSubmittedAt] = useState<Date | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccessCooldown, setIsSuccessCooldown] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  // All scales now use 1-5 (inclusive)
  const [pain, setPain] = useState(3); // 1-5 scale
  const [depression, setDepression] = useState(1); // 1-5 scale
  const [anxiety, setAnxiety] = useState(1); // 1-5 scale
  const [note, setNote] = useState("");
  const [quick4ps, setQuick4ps] = useState<FourPs>({
    physical: 3, // 1-5 scale (was 2 on 0-4)
    psychological: 3,
    psychosocial: 3,
    professional: 3,
  });

  // SDOH state (1-5 scale, was 0-4)
  const [sdohScores, setSdohScores] = useState({
    housing: 1,
    food: 1,
    transport: 1,
    insurance: 1,
    financial: 1,
    employment: 1,
    social_support: 1,
    safety: 1,
    healthcare_access: 1,
  });

  // Fetch client_id via resolveClientByAuthUserId (rc_users.auth_user_id -> rc_clients)
  useEffect(() => {
    async function fetchClientId() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return;

        const res = await resolveClientByAuthUserId(user.id);
        if (res.ok) {
          setClientId(res.clientId);
        }
      } catch (err) {
        console.error("[ClientCheckins] Error in fetchClientId:", err);
      }
    }

    fetchClientId();
  }, []);

  // Auto-select case if exactly 1 case is available
  useEffect(() => {
    if (!casesLoading && !casesError && availableCases.length === 1) {
      const singleCase = availableCases[0];
      if (singleCase.id && isValidUuid(singleCase.id)) {
        setForCase(singleCase.id);
      }
    } else if (!casesLoading && availableCases.length === 0) {
      setForCase(undefined);
    }
  }, [availableCases, casesLoading, casesError]);

  // Validate selected case is a valid UUID
  const selectedCase = useMemo(() => {
    if (!forCase || !isValidUuid(forCase)) return undefined;
    return availableCases.find((c) => c.id === forCase);
  }, [forCase, availableCases]);

  // Determine if submit should be disabled
  const isSubmitDisabled = useMemo(() => {
    return (
      isSubmitting ||
      isSuccessCooldown ||
      casesLoading ||
      casesError !== null ||
      availableCases.length === 0 ||
      !forCase ||
      !isValidUuid(forCase) ||
      !selectedCase
    );
  }, [isSubmitting, isSuccessCooldown, casesLoading, casesError, availableCases.length, forCase, selectedCase]);

  // Get submit disabled reason for inline message
  const getSubmitDisabledReason = () => {
    if (isSubmitting) return "Submitting check-in...";
    if (isSuccessCooldown) return "Please wait before submitting again...";
    if (casesLoading) return "Loading cases...";
    if (casesError) return "Error loading cases. Please retry.";
    if (availableCases.length === 0) return "No assigned cases found. Please contact your care manager.";
    if (!forCase) return "Please select a case to enable submit.";
    if (!isValidUuid(forCase)) return "Invalid case selection. Please select a valid case.";
    if (!selectedCase) return "Selected case not found. Please select a case.";
    return null;
  };

  async function submit() {
    if (!forCase || !isValidUuid(forCase)) {
      toast.error("Please select a valid case");
      return;
    }

    if (!selectedCase) {
      toast.error("Selected case not found. Please select a case.");
      return;
    }

    if (isSubmitting) {
      return; // Prevent double submit
    }

    setIsSubmitting(true);
    setSubmitError(null); // Clear any previous error

    try {
      // Get authenticated user ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("[ClientCheckins] Auth error:", {
          message: userError.message,
          details: userError,
        });
        toast.error(`Authentication error: ${userError.message || "Please log in again"}`);
        setIsSubmitting(false);
        return;
      }

      if (!user) {
        toast.error("You must be logged in to submit a check-in");
        setIsSubmitting(false);
        return;
      }

      // Get client_id via resolveClientByAuthUserId if not already fetched
      let resolvedClientId = clientId;
      if (!resolvedClientId) {
        const res = await resolveClientByAuthUserId(user.id);
        if (!res.ok) {
          setSubmitError(res.error);
          toast.error(res.error);
          setIsSubmitting(false);
          return;
        }
        resolvedClientId = res.clientId;
        setClientId(resolvedClientId);
      }

      // Insert check-in to database (rc_client_checkins)
      // 4Ps: Convert 1-5 scale to 0-100 for storage (1->0, 2->25, 3->50, 4->75, 5->100)
      // Pain/depression/anxiety/SDOH: Store as-is (1-5)
      const { data: checkinData, error: checkinError } = await supabase
        .from("rc_client_checkins")
        .insert({
          case_id: forCase, // UUID from selected case
          client_id: resolvedClientId, // Client ID from rc_clients
          pain_scale: pain, // 1-5 scale
          depression_scale: depression, // 1-5 scale
          anxiety_scale: anxiety, // 1-5 scale
          p_physical: (quick4ps.physical - 1) * 25, // Convert 1-5 to 0-100
          p_psychological: (quick4ps.psychological - 1) * 25,
          p_psychosocial: (quick4ps.psychosocial - 1) * 25,
          p_professional: (quick4ps.professional - 1) * 25, // Note: column is p_professional, not p_purpose
          housing: sdohScores.housing, // 1-5 scale (no sdoh_ prefix per schema)
          food: sdohScores.food,
          transport: sdohScores.transport,
          insurance: sdohScores.insurance,
          financial: sdohScores.financial,
          employment: sdohScores.employment,
          social_support: sdohScores.social_support,
          safety: sdohScores.safety,
          healthcare_access: sdohScores.healthcare_access,
          note: note || null,
        })
        .select()
        .single();

      if (checkinError) {
        // Log detailed error information
        console.error("[ClientCheckins] submit failed", {
          message: checkinError.message,
          details: checkinError.details,
          hint: checkinError.hint,
          code: checkinError.code,
        });
        
        // Set error state and show toast
        const errorMessage = checkinError.message ?? "Unknown error";
        setSubmitError(errorMessage);
        toast.error("Submit failed: " + errorMessage);
        setIsSubmitting(false);
        return;
      }

      // Trigger wellness monitoring
      if (checkinData) {
        try {
          await supabase.functions.invoke('wellness-monitor', {
            body: { checkin: checkinData },
          });
        } catch (monitorError) {
          console.error('Wellness monitoring error:', monitorError);
        }
      }

      // Check for immediate alerts
      const alerts = [];
      const caseObj = availableCases.find((x) => x.id === forCase);
      const clientName = (caseObj as any)?.client_label || (caseObj as any)?.atty_ref || "Client";

      // Thresholds for 1-5 scale (Maslow-based: 1=worst, 5=best): <= 2 triggers alerts (low scores = high need)
      if (pain <= 2) {
        alerts.push({
          case_id: forCase,
          alert_type: "pain_threshold",
          severity: "high",
          message: `${clientName} reported pain level ${pain}/5 (critical). Review recommended.`,
          disclosure_scope: "internal",
          metadata: { pain, depression, anxiety, timestamp: new Date().toISOString() },
        });
      }

      if (depression <= 2) {
        alerts.push({
          case_id: forCase,
          alert_type: "depression_threshold",
          severity: "high",
          message: `${clientName} reported depression level ${depression}/5 (critical). Review recommended.`,
          disclosure_scope: "internal",
          metadata: { pain, depression, anxiety, timestamp: new Date().toISOString() },
        });
      }

      if (anxiety <= 2) {
        alerts.push({
          case_id: forCase,
          alert_type: "anxiety_threshold",
          severity: "high",
          message: `${clientName} reported anxiety level ${anxiety}/5 (critical). Review recommended.`,
          disclosure_scope: "internal",
          metadata: { pain, depression, anxiety, timestamp: new Date().toISOString() },
        });
      }

      // Check 4P scores: <= 2 on 1-5 scale (Maslow-based: 1=worst, 5=best) - low scores = critical need
      const critical4Ps = Object.entries(quick4ps).filter(([_, value]) => value <= 2);
      if (critical4Ps.length > 0) {
        const dimensions = critical4Ps.map(([key]) => key).join(", ");
        alerts.push({
          case_id: forCase,
          alert_type: "4p_critical_score",
          severity: "medium",
          message: `${clientName} has critical 4P scores (${dimensions} ≤ 2). RN review recommended.`,
          disclosure_scope: "internal",
          metadata: { fourPs: quick4ps, timestamp: new Date().toISOString() },
        });
      }

      // Check for trend alerts (3 consecutive critical readings)
      // Threshold: <= 2 on 1-5 scale (Maslow-based: 1=worst, 5=best) - low scores = critical need
      const { data: recentCheckins } = await supabase
        .from("rc_client_checkins")
        .select("pain_scale, depression_scale, anxiety_scale")
        .eq("case_id", forCase)
        .order("created_at", { ascending: false })
        .limit(3);

      if (recentCheckins && recentCheckins.length === 3) {
        // Migrate old values (0-10) to new scale (1-5) for comparison
        const allPainCritical = recentCheckins.every((c) => {
          const migrated = migrateOldPainDepressionAnxiety(c.pain_scale);
          return migrated <= 2;
        });
        const allDepressionCritical = recentCheckins.every((c) => {
          const migrated = migrateOldPainDepressionAnxiety(c.depression_scale);
          return migrated <= 2;
        });
        const allAnxietyCritical = recentCheckins.every((c) => {
          const migrated = migrateOldPainDepressionAnxiety(c.anxiety_scale);
          return migrated <= 2;
        });

        if (allPainCritical) {
          alerts.push({
            case_id: forCase,
            alert_type: "pain_trend",
            severity: "critical",
            message: `${clientName} has reported pain ≤ 2 for 3 consecutive check-ins. Immediate review required.`,
            disclosure_scope: "internal",
            metadata: { trend: "pain", checkins: recentCheckins, timestamp: new Date().toISOString() },
          });
        }

        if (allDepressionCritical) {
          alerts.push({
            case_id: forCase,
            alert_type: "depression_trend",
            severity: "critical",
            message: `${clientName} has reported depression ≤ 2 for 3 consecutive check-ins. Immediate review required.`,
            disclosure_scope: "internal",
            metadata: { trend: "depression", checkins: recentCheckins, timestamp: new Date().toISOString() },
          });
        }

        if (allAnxietyCritical) {
          alerts.push({
            case_id: forCase,
            alert_type: "anxiety_trend",
            severity: "critical",
            message: `${clientName} has reported anxiety ≤ 2 for 3 consecutive check-ins. Immediate review required.`,
            disclosure_scope: "internal",
            metadata: { trend: "anxiety", checkins: recentCheckins, timestamp: new Date().toISOString() },
          });
        }
      }

      // Insert all alerts
      if (alerts.length > 0) {
        const { error: alertError } = await supabase.from("case_alerts").insert(alerts);
        if (alertError) {
          console.error("[ClientCheckins] Alert insert error:", {
            message: alertError.message,
            details: alertError.details,
            hint: alertError.hint,
            code: alertError.code,
          });
          // Don't fail the whole submission if alerts fail - just log it
        }
      }

      // Update local state for UI (if using app context)
      if (setCases) {
        setCases((arr) =>
          arr.map((c) =>
            c.id === forCase
              ? {
                  ...c,
                  checkins: [
                    ...(c.checkins || []),
                    { ts: new Date().toISOString(), pain, depression, anxiety, note, fourPs: quick4ps },
                  ],
                  status: c.status === "NEW" ? "IN_PROGRESS" : c.status,
                }
              : c
          )
        );
      }
      if (log) {
        log("CHECKIN_SUBMIT", forCase);
      }

      // Show success message
      const submittedAt = new Date();
      setLastSubmittedAt(submittedAt);
      setSubmitError(null); // Clear any previous error on success
      toast.success("Check-in submitted successfully");
      if (alerts.length > 0) {
        toast.info(`${alerts.length} alert(s) created for RN review`);
      }

      // Reset form to defaults (1-5 scale)
      setPain(3);
      setDepression(1);
      setAnxiety(1);
      setNote("");
      setQuick4ps({ physical: 3, psychological: 3, psychosocial: 3, professional: 3 });
      setSdohScores({
        housing: 1,
        food: 1,
        transport: 1,
        insurance: 1,
        financial: 1,
        employment: 1,
        social_support: 1,
        safety: 1,
        healthcare_access: 1,
      });

      setIsSubmitting(false);
      
      // Disable button for 2 seconds after success to prevent double-click
      setIsSuccessCooldown(true);
      setTimeout(() => {
        setIsSuccessCooldown(false);
      }, 2000);
    } catch (error: any) {
      // Catch any unexpected errors
      console.error("[ClientCheckins] submit failed", {
        message: error?.message || String(error),
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        error: error,
      });
      
      const errorMessage = error?.message ?? "Unknown error";
      setSubmitError(errorMessage);
      toast.error("Submit failed: " + errorMessage);
      setIsSubmitting(false);
    }
  }

  // Format timestamp for display
  const formatSubmissionTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      second: '2-digit'
    });
  }

  const recentCheckins = (selectedCase as any)?.checkins?.slice(-5).reverse() ?? [];

  // Progress tracker helpers
  type Period = 'day' | 'week' | 'month';
  
  function formatDateForPeriod(ts: string, period: Period): string {
    const d = new Date(ts);
    if (period === 'day') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (period === 'week') return `Week ${Math.ceil(d.getDate() / 7)}`;
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }

  function aggregateCheckins(period: Period) {
    const checkins = (selectedCase as any)?.checkins || [];
    if (checkins.length === 0) return [];

    // Group by period
    const groups: Record<string, any[]> = {};
    checkins.forEach(ci => {
      const date = new Date(ci.ts);
      let key: string;
      
      if (period === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(ci);
    });

    // Aggregate data with migration support for old values
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, items]) => ({
        date: formatDateForPeriod(items[0].ts, period),
        // Migrate old pain/depression/anxiety values (0-10) to new scale (1-5)
        pain: Math.round((items.reduce((sum, i) => sum + migrateOldPainDepressionAnxiety(i.pain || 0), 0) / items.length) * 10) / 10,
        depression: Math.round((items.reduce((sum, i) => sum + migrateOldPainDepressionAnxiety(i.depression || 0), 0) / items.length) * 10) / 10,
        anxiety: Math.round((items.reduce((sum, i) => sum + migrateOldPainDepressionAnxiety(i.anxiety || 0), 0) / items.length) * 10) / 10,
        // Migrate old 4Ps values (0-4 or 0-100) to new scale (1-5)
        physical: Math.round((items.reduce((sum, i) => sum + migrateOld4PsValue(i.fourPs?.physical || 0), 0) / items.length) * 10) / 10,
        psychological: Math.round((items.reduce((sum, i) => sum + migrateOld4PsValue(i.fourPs?.psychological || 0), 0) / items.length) * 10) / 10,
        psychosocial: Math.round((items.reduce((sum, i) => sum + migrateOld4PsValue(i.fourPs?.psychosocial || 0), 0) / items.length) * 10) / 10,
        professional: Math.round((items.reduce((sum, i) => sum + migrateOld4PsValue(i.fourPs?.professional || 0), 0) / items.length) * 10) / 10,
      }));
  }

  function getTrendColor(current: number, previous: number, isHigherBetter: boolean): string {
    if (!previous) return "hsl(var(--muted-foreground))";
    const diff = current - previous;
    if (Math.abs(diff) < 0.5) return "hsl(var(--warning))"; // stable
    if (isHigherBetter) {
      return diff > 0 ? "hsl(var(--success))" : "hsl(var(--destructive))";
    } else {
      return diff < 0 ? "hsl(var(--success))" : "hsl(var(--destructive))";
    }
  }

  const submitDisabledReason = getSubmitDisabledReason();

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Client Check-ins</h1>
          <p className="text-muted-foreground mt-1">Track your wellbeing and progress over time — including pain, mood, stress, and The 4Ps of Wellness (Physical, Psychological, Psychosocial, and Professional).</p>
        </div>

        {/* Case Selector */}
        <Card className="p-6 border-border mb-6">
          <Label className="text-sm font-medium mb-2 block">Select Your Case</Label>
          {casesLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading cases...</span>
            </div>
          ) : casesError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error loading cases</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{casesError.message || "Failed to load cases"}</span>
                <Button
                  variant="link"
                  onClick={refetchCases}
                  className="p-0 h-auto text-destructive"
                >
                  Retry <RefreshCw className="w-3 h-3 ml-1" />
                </Button>
              </AlertDescription>
            </Alert>
          ) : availableCases.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No assigned cases found</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>There are no active cases assigned to your account. Please contact your care manager.</span>
                <Button
                  variant="link"
                  onClick={refetchCases}
                  className="p-0 h-auto"
                >
                  Retry <RefreshCw className="w-3 h-3 ml-1" />
                </Button>
              </AlertDescription>
            </Alert>
          ) : availableCases.length === 1 ? (
            <div className="p-3 bg-muted/50 rounded-md border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Case Selected</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(availableCases[0] as any)?.client_label || 
                     (availableCases[0] as any)?.atty_ref || 
                     `Case ${availableCases[0].id.slice(0, 8)}`}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  Auto-selected
                </Badge>
              </div>
            </div>
          ) : (
            <Select 
              value={forCase || ""} 
              onValueChange={(value) => setForCase(value)}
              disabled={casesLoading}
            >
              <SelectTrigger className="w-full bg-background border-border">
                <SelectValue placeholder="Choose your case" />
              </SelectTrigger>
              <SelectContent className="z-[60] bg-popover border-border shadow-lg">
                {availableCases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {(c as any)?.client_label || (c as any)?.atty_ref || `Case ${c.id.slice(0, 8)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {submitDisabledReason && (
            <p className="text-xs text-muted-foreground mt-2">
              {submitDisabledReason}
            </p>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Check-in Form */}
          <Card className="p-6 border-border lg:col-span-2">
            <h2 className="text-xl font-semibold text-foreground mb-6">How are you feeling today?</h2>

            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Pain Scale: {pain}/5
                </Label>
                <Slider
                  value={[pain]}
                  onValueChange={([value]) => setPain(value)}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>1 = Severe pain (worst)</span>
                  <span>2 = Significant pain</span>
                  <span>3 = Moderate pain</span>
                  <span>4 = Mild pain</span>
                  <span>5 = No/minimal pain (best)</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">
                  How depressed or down did you feel today? {depression}/5
                </Label>
                <Slider
                  value={[depression]}
                  onValueChange={([value]) => setDepression(value)}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>1 = Severe (worst)</span>
                  <span>2 = Significant</span>
                  <span>3 = Moderate</span>
                  <span>4 = Mild</span>
                  <span>5 = None/minimal (best)</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">
                  How anxious or nervous did you feel today? {anxiety}/5
                </Label>
                <Slider
                  value={[anxiety]}
                  onValueChange={([value]) => setAnxiety(value)}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>1 = Severe (worst)</span>
                  <span>2 = Significant</span>
                  <span>3 = Moderate</span>
                  <span>4 = Mild</span>
                  <span>5 = None/minimal (best)</span>
                </div>
              </div>

              <LabeledTextarea
                label="Note (optional)"
                value={note}
                onChange={setNote}
                placeholder="What's important for us to know about how you're feeling today?"
                maxLength={1000}
                rows={4}
              />

              <div className="rounded-lg border border-border bg-card p-4 mb-4">
                <h3 className="text-sm font-semibold text-foreground">How to Score the 4Ps &amp; SDOH</h3>
                <p className="text-xs text-muted-foreground mt-1">Each category measures <strong>distress or impairment</strong>, not wellness. Use this scale to rate your impairment (Maslow-based: 1 = worst/highest need, 5 = best/needs met):</p>
                <ul className="mt-3 space-y-1 text-xs text-foreground">
                  <li><span className="font-semibold">1</span> — Critical barrier / unmet basic needs (worst) - Can't do normal daily things without help</li>
                  <li><span className="font-semibold">2</span> — Really hard most days - Struggle with regular tasks and activities</li>
                  <li><span className="font-semibold">3</span> — Pretty difficult at times - Have to push through to get things done</li>
                  <li><span className="font-semibold">4</span> — A little tricky sometimes - Mostly able to do what I need to</li>
                  <li><span className="font-semibold">5</span> — Stable / needs met (best) - Doing just fine, no problems with my daily activities</li>
                </ul>
              </div>
              <div>
                <Label className="text-sm font-medium mb-3 block">Quick 4Ps Assessment</Label>
                <TooltipProvider>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label className="text-xs font-medium">
                          Physical (pain, fatigue, sleep, mobility): {quick4ps.physical}/5
                        </Label>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-sm">Physical relates to your body's comfort and energy level — pain, fatigue, sleep quality, and mobility.</p>
                          </TooltipContent>
                        </UITooltip>
                      </div>
                      <Slider
                        value={[quick4ps.physical]}
                        onValueChange={([value]) =>
                          setQuick4ps((p) => ({ ...p, physical: value }))
                        }
                        min={1}
                        max={5}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label className="text-xs font-medium">
                          Psychological (mood, coping, stress): {quick4ps.psychological}/5
                        </Label>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-sm">Psychological relates to mood, coping, stress, and emotional wellbeing.</p>
                          </TooltipContent>
                        </UITooltip>
                      </div>
                      <Slider
                        value={[quick4ps.psychological]}
                        onValueChange={([value]) =>
                          setQuick4ps((p) => ({ ...p, psychological: value }))
                        }
                        min={1}
                        max={5}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label className="text-xs font-medium">
                          Psychosocial (relationships, finances, transportation, support): {quick4ps.psychosocial}/5
                        </Label>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-sm">Psychosocial covers social and environmental stability — relationships, finances, transportation, and support systems.</p>
                          </TooltipContent>
                        </UITooltip>
                      </div>
                      <Slider
                        value={[quick4ps.psychosocial]}
                        onValueChange={([value]) =>
                          setQuick4ps((p) => ({ ...p, psychosocial: value }))
                        }
                        min={1}
                        max={5}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label className="text-xs font-medium">
                          Professional (job, school, or home-based role): {quick4ps.professional}/5
                        </Label>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-sm">Professional relates to your main occupational role — including your job, school responsibilities, or home-based duties.</p>
                          </TooltipContent>
                        </UITooltip>
                      </div>
                      <Slider
                        value={[quick4ps.professional]}
                        onValueChange={([value]) =>
                          setQuick4ps((p) => ({ ...p, professional: value }))
                        }
                        min={1}
                        max={5}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </TooltipProvider>
              </div>

              {/* SDOH Tracking (1-5 Scale) */}
              <div className="pt-4 border-t border-border">
                <Label className="text-sm font-medium mb-3 block">Social Determinants of Health (SDOH) - Optional</Label>
                <p className="text-xs text-muted-foreground mb-4">Rate your current situation: 1 = critical barrier / unmet needs (worst), 5 = stable / needs met (best)</p>
                <div className="space-y-4">
                  {[
                    { key: 'housing', label: 'Housing Stability' },
                    { key: 'food', label: 'Food Security' },
                    { key: 'transport', label: 'Transportation' },
                    { key: 'insurance', label: 'Insurance Coverage' },
                    { key: 'financial', label: 'Financial Resources' },
                    { key: 'employment', label: 'Employment Status' },
                    { key: 'social_support', label: 'Social Support' },
                    { key: 'safety', label: 'Safety & Security' },
                    { key: 'healthcare_access', label: 'Healthcare Access' },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">{label}</Label>
                        <span className="text-xs font-semibold">{(sdohScores as any)[key]}/5</span>
                      </div>
                      <Slider
                        value={[(sdohScores as any)[key]]}
                        onValueChange={([value]) => setSdohScores((s) => ({ ...s, [key]: value }))}
                        min={1}
                        max={5}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Button 
                  onClick={submit} 
                  className="w-full" 
                  disabled={isSubmitDisabled}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      Submit Check-in
                    </>
                  )}
                </Button>
                {submitError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2 text-center font-medium">
                    Error: {submitError}
                  </p>
                )}
                {lastSubmittedAt && !isSubmitting && !submitError && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2 text-center font-medium">
                    Submitted ✔ {formatSubmissionTime(lastSubmittedAt)}
                  </p>
                )}
                {submitDisabledReason && !lastSubmittedAt && !submitError && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    {submitDisabledReason}
                  </p>
                )}
                {isSuccessCooldown && !submitError && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Please wait before submitting again...
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Right column */}
          <div className="space-y-6">
            {/* Recent Check-ins */}
            <Card className="p-6 border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Recent Check-ins
              </h2>

              {recentCheckins.length === 0 ? (
                <p className="text-sm text-muted-foreground">No check-ins yet. Submit your first check-in above!</p>
              ) : (
                <div className="space-y-3">
                  {recentCheckins.map((checkin, idx) => {
                    // Migrate old pain values for display
                    const displayedPain = migrateOldPainDepressionAnxiety(checkin.pain);
                    // With 1=worst, 5=best: pain is worsening if current < previous (score decreased)
                    const isPainWorsening =
                      idx < recentCheckins.length - 1 &&
                      displayedPain < migrateOldPainDepressionAnxiety(recentCheckins[idx + 1].pain);
                    
                    return (
                      <div
                        key={idx}
                        onClick={() => document.getElementById('progress-tracker')?.scrollIntoView({ behavior: 'smooth' })}
                        className="p-3 bg-muted rounded-lg border border-border cursor-pointer hover:bg-muted/80 transition-colors"
                        role="button"
                        aria-label={`View details for ${fmtDate(checkin.ts)}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs text-muted-foreground">
                            {fmtDate(checkin.ts)}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              Pain: {displayedPain}/5
                            </span>
                            {isPainWorsening && (
                              <AlertTriangle className="w-4 h-4 text-warning" />
                            )}
                          </div>
                        </div>
                        {checkin.note && (
                          <p className="text-xs text-muted-foreground">{checkin.note}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedCase && recentCheckins.length > 0 && (
                <Alert className="mt-4">
                  <AlertDescription className="text-xs">
                    Tracking {recentCheckins.length} recent check-in
                    {recentCheckins.length !== 1 ? "s" : ""}. Trends help identify escalating
                    issues.
                  </AlertDescription>
                </Alert>
              )}
            </Card>

            {/* 📈 Progress Tracker */}
            <Card id="progress-tracker" className="p-6 border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">📈 Progress Tracker</h2>
              {!selectedCase || ((selectedCase as any).checkins || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet</p>
              ) : (
                <Tabs defaultValue="day" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="day">Daily</TabsTrigger>
                    <TabsTrigger value="week">Weekly</TabsTrigger>
                    <TabsTrigger value="month">Monthly</TabsTrigger>
                  </TabsList>
                  
                  {(["day", "week", "month"] as const).map((period) => {
                    const data = aggregateCheckins(period);
                    const latest = data[data.length - 1];
                    const previous = data[data.length - 2];
                    
                    return (
                      <TabsContent key={period} value={period} className="space-y-6">
                        {/* Symptom Trends */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-foreground">Symptom Trends (1-5)</h3>
                            {latest && (
                              <div className="flex gap-2 text-xs">
                                <span className={latest.pain <= 2 ? "text-destructive font-semibold" : ""}>
                                  Pain: {latest.pain}
                                </span>
                                <span className={latest.depression <= 2 ? "text-destructive font-semibold" : ""}>
                                  Depression: {latest.depression}
                                </span>
                                <span className={latest.anxiety <= 2 ? "text-destructive font-semibold" : ""}>
                                  Anxiety: {latest.anxiety}
                                </span>
                              </div>
                            )}
                          </div>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={data}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis 
                                dataKey="date" 
                                stroke="hsl(var(--muted-foreground))"
                                style={{ fontSize: '12px' }}
                              />
                              <YAxis 
                                domain={[1, 5]} 
                                stroke="hsl(var(--muted-foreground))"
                                style={{ fontSize: '12px' }}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'hsl(var(--popover))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                  fontSize: '12px'
                                }}
                              />
                              <Legend wrapperStyle={{ fontSize: '12px' }} />
                              <Line 
                                type="monotone" 
                                dataKey="pain" 
                                stroke="#ef4444" 
                                strokeWidth={2}
                                name="Pain"
                                dot={{ fill: '#ef4444', r: 4 }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="depression" 
                                stroke="#8b5cf6" 
                                strokeWidth={2}
                                name="Depression"
                                dot={{ fill: '#8b5cf6', r: 4 }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="anxiety" 
                                stroke="#f59e0b" 
                                strokeWidth={2}
                                name="Anxiety"
                                dot={{ fill: '#f59e0b', r: 4 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                          {latest && previous && (
                            <div className="flex gap-4 mt-2 text-xs">
                              {/* With 1=worst, 5=best: higher score = improvement (green), lower score = worsening (red) */}
                              <span style={{ color: getTrendColor(latest.pain, previous.pain, true) }}>
                                Pain {latest.pain > previous.pain ? '↑' : latest.pain < previous.pain ? '↓' : '→'}
                              </span>
                              <span style={{ color: getTrendColor(latest.depression, previous.depression, true) }}>
                                Depression {latest.depression > previous.depression ? '↑' : latest.depression < previous.depression ? '↓' : '→'}
                              </span>
                              <span style={{ color: getTrendColor(latest.anxiety, previous.anxiety, true) }}>
                                Anxiety {latest.anxiety > previous.anxiety ? '↑' : latest.anxiety < previous.anxiety ? '↓' : '→'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 4Ps Progress */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-foreground">4Ps Progress (1-5)</h3>
                            {latest && (
                              <div className="flex gap-2 text-xs">
                                <span className={latest.physical <= 2 ? "text-destructive font-semibold" : ""}>
                                  Physical: {latest.physical}
                                </span>
                                <span className={latest.psychological <= 2 ? "text-destructive font-semibold" : ""}>
                                  Psychological: {latest.psychological}
                                </span>
                                <span className={latest.psychosocial <= 2 ? "text-destructive font-semibold" : ""}>
                                  Psychosocial: {latest.psychosocial}
                                </span>
                                <span className={latest.professional <= 2 ? "text-destructive font-semibold" : ""}>
                                  Professional: {latest.professional}
                                </span>
                              </div>
                            )}
                          </div>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={data}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis 
                                dataKey="date" 
                                stroke="hsl(var(--muted-foreground))"
                                style={{ fontSize: '12px' }}
                              />
                              <YAxis 
                                domain={[1, 5]} 
                                stroke="hsl(var(--muted-foreground))"
                                style={{ fontSize: '12px' }}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'hsl(var(--popover))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                  fontSize: '12px'
                                }}
                              />
                              <Legend wrapperStyle={{ fontSize: '12px' }} />
                              <Line 
                                type="monotone" 
                                dataKey="physical" 
                                stroke="#10b981" 
                                strokeWidth={2}
                                name="Physical"
                                dot={{ fill: '#10b981', r: 4 }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="psychological" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                name="Psychological"
                                dot={{ fill: '#3b82f6', r: 4 }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="psychosocial" 
                                stroke="#ec4899" 
                                strokeWidth={2}
                                name="Psychosocial"
                                dot={{ fill: '#ec4899', r: 4 }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="professional" 
                                stroke="#6366f1" 
                                strokeWidth={2}
                                name="Professional"
                                dot={{ fill: '#6366f1', r: 4 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                          {latest && previous && (
                            <div className="flex gap-4 mt-2 text-xs">
                              <span style={{ color: getTrendColor(latest.physical, previous.physical, true) }}>
                                Physical {latest.physical > previous.physical ? '↑' : latest.physical < previous.physical ? '↓' : '→'}
                              </span>
                              <span style={{ color: getTrendColor(latest.psychological, previous.psychological, true) }}>
                                Psychological {latest.psychological > previous.psychological ? '↑' : latest.psychological < previous.psychological ? '↓' : '→'}
                              </span>
                              <span style={{ color: getTrendColor(latest.psychosocial, previous.psychosocial, true) }}>
                                Psychosocial {latest.psychosocial > previous.psychosocial ? '↑' : latest.psychosocial < previous.psychosocial ? '↓' : '→'}
                              </span>
                              <span style={{ color: getTrendColor(latest.professional, previous.professional, true) }}>
                                Professional {latest.professional > previous.professional ? '↑' : latest.professional < previous.professional ? '↓' : '→'}
                              </span>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
