// ============================================================================
// RN CARE PLAN WORKFLOW - ROUTES AND NAVIGATION
// ============================================================================
// 
// INSTRUCTIONS FOR CURSOR:
//
// 1. Add these imports to main.tsx (near the top with other imports):
// 
//    import FourPsScreen from "./screens/rn/FourPsScreen";
//    import SDOHScreen from "./screens/rn/SDOHScreen";
//    import OverlaySelectionScreen from "./screens/rn/OverlaySelectionScreen";
//    import GuidelinesReferenceScreen from "./screens/rn/GuidelinesReferenceScreen";
//    import FinalizeCarePlanScreen from "./screens/rn/FinalizeCarePlanScreen";
//    import CarePlanWorkflow from "./components/rn/CarePlanWorkflow";
//
// 2. Add these routes inside <Routes> in main.tsx (after the /rn/case/:caseId/ten-vs route):
//
//    {/* RN Care Plan Workflow Routes */}
//    <Route path="/rn/case/:caseId/workflow" element={
//      <AuthProvider>
//        <AppProvider>
//          <CarePlanWorkflow />
//        </AppProvider>
//      </AuthProvider>
//    } />
//    <Route path="/rn/case/:caseId/4ps" element={
//      <AuthProvider>
//        <AppProvider>
//          <CarePlanWorkflow initialStep="4ps" />
//        </AppProvider>
//      </AuthProvider>
//    } />
//    <Route path="/rn/case/:caseId/sdoh" element={
//      <AuthProvider>
//        <AppProvider>
//          <CarePlanWorkflow initialStep="sdoh" />
//        </AppProvider>
//      </AuthProvider>
//    } />
//    <Route path="/rn/case/:caseId/overlays" element={
//      <AuthProvider>
//        <AppProvider>
//          <CarePlanWorkflow initialStep="overlays" />
//        </AppProvider>
//      </AuthProvider>
//    } />
//    <Route path="/rn/case/:caseId/guidelines" element={
//      <AuthProvider>
//        <AppProvider>
//          <CarePlanWorkflow initialStep="guidelines" />
//        </AppProvider>
//      </AuthProvider>
//    } />
//    <Route path="/rn/case/:caseId/finalize" element={
//      <AuthProvider>
//        <AppProvider>
//          <CarePlanWorkflow initialStep="finalize" />
//        </AppProvider>
//      </AuthProvider>
//    } />
//
// ============================================================================

// This is the CarePlanWorkflow component that wraps all the screens
// Save this as: src/components/rn/CarePlanWorkflow.tsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import FourPsScreen from "../../screens/rn/FourPsScreen";
import SDOHScreen from "../../screens/rn/SDOHScreen";
import OverlaySelectionScreen from "../../screens/rn/OverlaySelectionScreen";
import GuidelinesReferenceScreen from "../../screens/rn/GuidelinesReferenceScreen";
import TenVsBuilder from "./TenVsBuilder";
import FinalizeCarePlanScreen from "../../screens/rn/FinalizeCarePlanScreen";
import { useRNCaseEditMode } from "@/hooks/useRNCaseEditMode";
import { RNEmptyState } from "@/components/rn/RNEmptyState";
import { RNOutreachSection } from "@/components/rn/RNOutreachSection";
import { RNTaskNotesSection } from "@/components/rn/RNTaskNotesSection";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { isValidUuid } from "@/lib/rnUtils";
import { getEditWindowHoursFromParticipation, formatEditWindowEndsAt } from "@/lib/tenVsHelpers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { getAcceptanceState, type AcceptanceState } from "@/lib/rnAcknowledgment";

const LOAD_TIMEOUT_MS = 12000;

type WorkflowStep = "4ps" | "sdoh" | "overlays" | "guidelines" | "10vs" | "finalize";

interface CarePlanWorkflowProps {
  initialStep?: WorkflowStep;
}

const STEPS: { id: WorkflowStep; label: string; number: number }[] = [
  { id: "4ps", label: "4Ps Assessment", number: 1 },
  { id: "sdoh", label: "SDOH Assessment", number: 2 },
  { id: "overlays", label: "Condition Overlays", number: 3 },
  { id: "guidelines", label: "Guidelines Reference", number: 4 },
  { id: "10vs", label: "10-Vs Assessment", number: 5 },
  { id: "finalize", label: "Finalize Care Plan", number: 6 },
];

const CarePlanWorkflow: React.FC<CarePlanWorkflowProps> = ({ initialStep = "4ps" }) => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(initialStep);
  const [caseInfo, setCaseInfo] = useState<{ caseNumber?: string; clientName?: string }>({});
  const [caseInfoLoading, setCaseInfoLoading] = useState(false);
  const [caseInfoError, setCaseInfoError] = useState<string | null>(null);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isViewOnly } = useRNCaseEditMode(caseId ?? null);

  // RN acceptance gate: banner when status "pending" or "no_epoch"
  const [acceptanceState, setAcceptanceState] = useState<AcceptanceState | null>(null);
  const ackRequired = acceptanceState?.status === "pending" || acceptanceState?.status === "no_epoch";

  // Edit-window state: care plan submitted + within/outside edit window (from rc_care_plans.participation_status; do not read V2 after submission)
  const [carePlanSubmitted, setCarePlanSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [participationStatus, setParticipationStatus] = useState<string | null>(null);
  // Revision mode (plan_type === 'follow_up') and revision number for header/footer badge
  const [isRevisionMode, setIsRevisionMode] = useState(false);
  const [revisionNumber, setRevisionNumber] = useState<number | null>(null);

  // Phase 1: Dirty state = actual content changed (4Ps/SDOH/10Vs/Overlays). Navigation must NOT set dirty.
  const [isDirty, setIsDirty] = useState(false);
  // Phase 1: Edit mode enabled = user confirmed "Begin edits" for a finalized plan within edit window.
  const [editModeEnabled, setEditModeEnabled] = useState(false);
  const onMarkDirty = useCallback(() => setIsDirty(true), []);
  const handleFinalizeComplete = useCallback(() => {
    setIsDirty(false);
    setEditModeEnabled(false);
  }, []);

  // Store caseId in localStorage for the screens to use
  useEffect(() => {
    if (caseId && typeof window !== "undefined") {
      window.localStorage.setItem("rcms_active_case_id", caseId);
    }
  }, [caseId]);

  // Phase 1: Reset dirty and edit-mode when case changes; never set dirty from navigation.
  useEffect(() => {
    setIsDirty(false);
    setEditModeEnabled(false);
  }, [caseId]);

  const loadCaseInfo = useCallback(async () => {
    if (!caseId) return;
    setCaseInfoLoading(true);
    setCaseInfoError(null);
    setLoadTimedOut(false);
    try {
      const SUPABASE_URL = 'https://zmjxyspizdqhrtdcgkwk.supabase.co';
      const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptanh5c3BpemRxaHJ0ZGNna3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMjgxODMsImV4cCI6MjA3OTcwNDE4M30.i5rqJXZPSHYFeaA8E26Vh69UPzgCmhrU9zL2kdE8jrM';

      const response = await fetch(`${SUPABASE_URL}/rest/v1/rc_cases?id=eq.${caseId}&is_superseded=eq.false&select=case_number,client_id`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });

      const caseData = await response.json();
      if (!caseData || caseData.length === 0) {
        setCaseInfoError("Case not found");
        return;
      }

      let clientName = "Unknown Client";
      if (caseData[0].client_id) {
        try {
          const clientResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/rc_clients?id=eq.${caseData[0].client_id}&select=first_name,last_name`,
            {
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
              },
            }
          );
          const clientData = await clientResponse.json();
          if (clientData && clientData.length > 0) {
            clientName = `${clientData[0].first_name || ''} ${clientData[0].last_name || ''}`.trim();
          }
        } catch (_) {
          // keep Unknown Client
        }
      }

      setCaseInfo({ caseNumber: caseData[0].case_number, clientName });
    } catch (error) {
      console.error("Failed to load case info:", error);
      setCaseInfoError(error instanceof Error ? error.message : "Failed to load case");
    } finally {
      setCaseInfoLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    loadCaseInfo();
  }, [loadCaseInfo]);

  // Load care plan status + participation_status + plan_type for edit-window and revision badge
  useEffect(() => {
    if (!caseId) {
      setCarePlanSubmitted(false);
      setSubmittedAt(null);
      setParticipationStatus(null);
      setIsRevisionMode(false);
      setRevisionNumber(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data: plan } = await supabase
          .from("rc_care_plans")
          .select("status, submitted_at, participation_status, plan_type")
          .eq("case_id", caseId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (cancelled) return;
        const submitted = plan?.status === "submitted" || plan?.status === "approved";
        setCarePlanSubmitted(!!submitted);
        setSubmittedAt(plan?.submitted_at ?? null);
        setParticipationStatus(plan?.participation_status ?? "unknown");
        const revisionMode = plan?.plan_type === "follow_up";
        setIsRevisionMode(!!revisionMode);
        if (revisionMode) {
          const { data: released } = await supabase
            .from("rc_care_plans")
            .select("id")
            .eq("case_id", caseId)
            .in("status", ["submitted", "approved"]);
          if (!cancelled) {
            const count = Array.isArray(released) ? released.length : 0;
            setRevisionNumber(count + 1);
          }
        } else {
          setRevisionNumber(null);
        }
      } catch {
        if (!cancelled) setParticipationStatus("unknown");
      }
    })();
    return () => { cancelled = true; };
  }, [caseId]);

  // Reset loadTimedOut when caseId changes
  useEffect(() => {
    setLoadTimedOut(false);
  }, [caseId]);

  // RN acceptance: load state when caseId and user change
  useEffect(() => {
    if (caseId && user?.id) {
      getAcceptanceState(caseId, user.id).then(setAcceptanceState).catch(console.error);
    }
  }, [caseId, user?.id]);

  // 12s timeout: if caseInfoLoading persists, show "taking longer than expected"
  useEffect(() => {
    if (!caseId || !caseInfoLoading) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }
    timeoutRef.current = setTimeout(() => {
      setLoadTimedOut(true);
      timeoutRef.current = null;
    }, LOAD_TIMEOUT_MS);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [caseId, caseInfoLoading]);

  // No case selected
  if (!caseId) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "1.5rem", display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
        <RNEmptyState
          title="No case selected"
          message="Select a case to continue."
          variant="empty"
          actions={[{ label: "Back to Dashboard", onClick: () => navigate("/rn/dashboard") }]}
        />
      </div>
    );
  }

  // Invalid case ID
  if (!isValidUuid(caseId)) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "1.5rem", display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
        <RNEmptyState
          title="Case not available"
          message="Case not available."
          variant="error"
          actions={[{ label: "Back to Dashboard", onClick: () => navigate("/rn/dashboard") }]}
        />
      </div>
    );
  }

  // Edit-window: from rc_care_plans.submitted_at + participation_status (do NOT read V2 after submission)
  const editWindowHours = getEditWindowHoursFromParticipation(participationStatus ?? "unknown");
  const editWindowEndsAt = submittedAt ? new Date(new Date(submittedAt).getTime() + editWindowHours * 3600000) : null;
  const editWindowClosed = !editWindowEndsAt || new Date() > editWindowEndsAt;
  const editWindowEndsAtFormatted = editWindowEndsAt ? formatEditWindowEndsAt(editWindowEndsAt) : null;
  // Phase 1: Allow edits when user confirmed "Begin edits" (editModeEnabled) even if view-only / finalized.
  const readOnly = (isViewOnly || (carePlanSubmitted && editWindowClosed)) && !editModeEnabled;

  const goToStep = (step: WorkflowStep) => {
    setCurrentStep(step);
    // Update URL without full page reload
    const stepPath = step === "10vs" ? "ten-vs" : step;
    window.history.pushState({}, "", `/rn/case/${caseId}/${stepPath}`);
  };

  const goBack = () => {
    navigate("/rn/dashboard");
  };

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  const renderCurrentScreen = () => {
    const finalizeProps = {
      readOnly,
      isDirty,
      carePlanSubmitted,
      editWindowOpen: carePlanSubmitted && !editWindowClosed,
      onBeginEditsConfirm: () => setEditModeEnabled(true),
      editModeEnabled,
      onFinalizeComplete: handleFinalizeComplete,
    };
    switch (currentStep) {
      case "4ps":
        return <FourPsScreen readOnly={readOnly} onMarkDirty={onMarkDirty} />;
      case "sdoh":
        return <SDOHScreen readOnly={readOnly} onMarkDirty={onMarkDirty} />;
      case "overlays":
        return <OverlaySelectionScreen readOnly={readOnly} onMarkDirty={onMarkDirty} />;
      case "guidelines":
        return <GuidelinesReferenceScreen readOnly={readOnly} onMarkDirty={onMarkDirty} />;
      case "10vs":
        return <TenVsBuilder readOnly={readOnly} onMarkDirty={onMarkDirty} />;
      case "finalize":
        return <FinalizeCarePlanScreen {...finalizeProps} />;
      default:
        return <FourPsScreen readOnly={readOnly} onMarkDirty={onMarkDirty} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header: min-height to prevent layout jump */}
      <div style={{
        minHeight: "3.5rem",
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        padding: "0.75rem 1.5rem",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={goBack}
              style={{
                padding: "0.3rem 0.6rem",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                background: "#ffffff",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              ← Back to Dashboard
            </button>
            <div>
              <h1 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>
                Case <span style={{ fontFamily: "monospace", color: "#64748b", fontWeight: 500 }}>
                  {[caseInfo.clientName, caseInfo.caseNumber].filter(Boolean).join(" • ") || (caseInfoLoading ? "Loading…" : (caseId ? caseId.slice(-8) : "—"))}
                </span>
              </h1>
              {isRevisionMode && revisionNumber != null && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
                  <span style={{
                    fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", color: "#0c4a6e",
                    padding: "0.2rem 0.5rem", borderRadius: "6px", background: "#e0f2fe", border: "1px solid #0ea5e9"
                  }}>
                    REVISION
                  </span>
                  <span style={{
                    fontSize: "0.8rem", fontWeight: 600, color: "#0369a1",
                    padding: "0.2rem 0.5rem", borderRadius: "6px", background: "#e0f2fe", border: "1px solid #0ea5e9"
                  }}>
                    Revision #{revisionNumber}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
            Step {currentStepIndex + 1} of {STEPS.length}
          </div>
        </div>

        {/* Step Navigation */}
        <div style={{
          display: "flex",
          gap: "0.25rem",
          overflowX: "auto",
          paddingBottom: "0.25rem",
        }}>
          {STEPS.map((step, index) => {
            const isActive = step.id === currentStep;
            const isPast = index < currentStepIndex;
            
            return (
              <button
                key={step.id}
                onClick={() => goToStep(step.id)}
                style={{
                  flex: "1 0 auto",
                  minWidth: "120px",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                  border: isActive ? "2px solid #0ea5e9" : "1px solid #e2e8f0",
                  background: isActive ? "#f0f9ff" : isPast ? "#f0fdf4" : "#ffffff",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}>
                  <span style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: isActive ? "#0ea5e9" : isPast ? "#22c55e" : "#e2e8f0",
                    color: isActive || isPast ? "#ffffff" : "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                  }}>
                    {isPast ? "✓" : step.number}
                  </span>
                  <span style={{
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#0369a1" : isPast ? "#166534" : "#64748b",
                  }}>
                    {step.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
        {caseInfoError || loadTimedOut ? (
          <RNEmptyState
            title={loadTimedOut ? "Loading is taking longer than expected" : (caseInfoError === "Case not found" ? "Case not available" : "We couldn't load this case right now.")}
            message={loadTimedOut ? "This is taking longer than expected. Please retry." : (caseInfoError === "Case not found" ? "Case not available." : "We couldn't load this case right now.")}
            variant="error"
            actions={[
              { label: "Retry", onClick: () => { setCaseInfoError(null); setLoadTimedOut(false); loadCaseInfo(); } },
              { label: "Back to Dashboard", onClick: () => navigate("/rn/dashboard") },
            ]}
          />
        ) : (
          <>
            {ackRequired && (
              <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-900">
                <AlertTitle>Assignment acceptance required</AlertTitle>
                <AlertDescription className="flex flex-wrap items-center justify-between gap-3 mt-2">
                  <span>Please accept this assignment from your Work Queue before performing clinical actions.</span>
                </AlertDescription>
              </Alert>
            )}
            {carePlanSubmitted && readOnly && currentStep !== "finalize" && (
              <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-900">
                <AlertTitle>Viewing released plan (read-only)</AlertTitle>
                <AlertDescription className="flex flex-wrap items-center justify-between gap-3 mt-2">
                  <span>To make changes, go to Finalize → Begin edits.</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100"
                    onClick={() => navigate(`/rn/case/${caseId}/finalize`)}
                  >
                    Go to Finalize
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {renderCurrentScreen()}
            <RNOutreachSection caseId={caseId} />
            <RNTaskNotesSection caseId={caseId} readOnly={isViewOnly} />
          </>
        )}
      </div>

      {/* Footer Navigation */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#ffffff",
        borderTop: "1px solid #e2e8f0",
        padding: "0.75rem 1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <button
          onClick={() => currentStepIndex > 0 && goToStep(STEPS[currentStepIndex - 1].id)}
          disabled={currentStepIndex === 0}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            background: currentStepIndex === 0 ? "#f1f5f9" : "#ffffff",
            color: currentStepIndex === 0 ? "#94a3b8" : "#0f172a",
            fontSize: "0.85rem",
            cursor: currentStepIndex === 0 ? "not-allowed" : "pointer",
          }}
        >
          ← Previous Step
        </button>
        
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {isRevisionMode && revisionNumber != null && (
            <span style={{
              fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", color: "#0c4a6e",
              padding: "0.2rem 0.5rem", borderRadius: "6px", background: "#e0f2fe", border: "1px solid #0ea5e9"
            }}>
              REVISION • Revision #{revisionNumber}
            </span>
          )}
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
            {STEPS[currentStepIndex].label}
          </span>
        </div>

        {currentStep !== "finalize" && (
          <button
            onClick={() => currentStepIndex < STEPS.length - 1 && goToStep(STEPS[currentStepIndex + 1].id)}
            disabled={currentStepIndex === STEPS.length - 1}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: "none",
              background: currentStepIndex === STEPS.length - 1 ? "#94a3b8" : "#0ea5e9",
              color: "#ffffff",
              fontSize: "0.85rem",
              cursor: currentStepIndex === STEPS.length - 1 ? "not-allowed" : "pointer",
            }}
          >
            Next Step →
          </button>
        )}
      </div>

      {/* Bottom padding to account for fixed footer */}
      <div style={{ height: "60px" }} />
    </div>
  );
};

export default CarePlanWorkflow;
