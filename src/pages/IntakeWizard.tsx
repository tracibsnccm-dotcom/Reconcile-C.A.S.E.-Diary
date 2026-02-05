// NOTE: Do not compute derived constants at module scope in this file.
// Vercel production build enforces TDZ strictly. All derived arrays, maps, filters,
// sorts, or calculations must live inside the component (useMemo) or in functions.
import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/Stepper";
import { WizardNav } from "@/components/WizardNav";
import { Chip } from "@/components/Chip";
import { LabeledInput } from "@/components/LabeledInput";
import { LabeledSelect } from "@/components/LabeledSelect";
import { RestrictedBanner } from "@/components/RestrictedBanner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { fmtDate } from "@/lib/store";
import {
  Client,
  Intake,
  Consent,
  FourPs,
  SDOH,
  Case,
  IncidentType,
  InitialTreatment,
  Gender,
} from "@/config/rcms";
import { AlertCircle, Check, Save, HelpCircle, ArrowRight, Info, Shield, Phone, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { maskName } from "@/lib/access";
import { IntakeProgressBar, useIntakePercent, scheduleClientReminders } from "@/modules/rcms-intake-extras";
import { IntakeMedConditionsSection } from "@/components/MedsConditionsSection";
import { type MedicationEntry } from "@/components/IntakeMedicationRecord";
import { IntakeMedicationAllergies, type AllergyEntry } from "@/components/IntakeMedicationAllergies";
import { IntakePreInjuryMedications } from "@/components/IntakePreInjuryMedications";
import { IntakePostInjuryMedications } from "@/components/IntakePostInjuryMedications";
import { IntakePreInjuryTreatments, type TreatmentEntry } from "@/components/IntakePreInjuryTreatments";
import { IntakePostInjuryTreatments } from "@/components/IntakePostInjuryTreatments";
import { IntakeBehavioralHealthMedications, type BHMedicationEntry } from "@/components/IntakeBehavioralHealthMedications";
import { IntakeWelcome } from "@/components/IntakeWelcome";
import { IntakePhysicalPreDiagnosisSelector } from "@/components/IntakePhysicalPreDiagnosisSelector";
import { IntakePhysicalPostDiagnosisSelector } from "@/components/IntakePhysicalPostDiagnosisSelector";
import { IntakeBehavioralHealthDiagnosisSelector } from "@/components/IntakeBehavioralHealthDiagnosisSelector";
import { LabeledTextarea } from "@/components/LabeledTextarea";
import { ClientIdService } from "@/lib/clientIdService";
import { IntakeSaveBar } from "@/components/IntakeSaveBar";
import { IntakeCountdownBanner } from "@/components/IntakeCountdownBanner";
import { IntakeCompletionChecklist } from "@/components/IntakeCompletionChecklist";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { CaraFloatingButton } from "@/components/CaraFloatingButton";
import { CaraGate } from "@/components/CaraGate";
import { AssessmentSnapshotExplainer } from "@/components/AssessmentSnapshotExplainer";
import { useAutosave } from "@/hooks/useAutosave";
import { useInactivityDetection } from "@/hooks/useInactivityDetection";
import { MedicationAutocomplete } from "@/components/MedicationAutocomplete";
import { FileUploadZone } from "@/components/FileUploadZone";
import { InactivityModal } from "@/components/InactivityModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { supabaseGet, supabaseInsert, supabaseUpdate } from '@/lib/supabaseRest';
import {
  isRcClientsAuthBindingError,
  getRcClientsBindingUserMessage,
  getRcClientsBindingDiagnosticDetail,
} from '@/lib/rcClientsErrorUtils';
import { audit } from '@/lib/supabaseOperations';
import { createAutoNote, generateIntakeNote } from '@/lib/autoNotes';
import { getIntakeSessionByToken, updateIntakeSession } from '@/lib/intakeSessionService';
import { IntakeSensitiveExperiences, type SensitiveExperiencesData, type SensitiveExperiencesProgress } from "@/components/IntakeSensitiveExperiences";
import { analyzeSensitiveExperiences, buildSdohUpdates } from "@/lib/sensitiveExperiencesFlags";
import { saveMentalHealthScreening } from "@/lib/sensitiveDisclosuresHelper";
import { CLIENT_INTAKE_WINDOW_HOURS, formatHMS, CLIENT_DOCUMENTS } from "@/constants/compliance";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Printer } from "lucide-react";
import { OVERLAY_QUESTIONS } from "@/config/overlayQuestions";
import { OverlayQuestionsSection } from "@/components/intake/OverlayQuestionsSection";
import {
  INTAKE_WINDOW_EXPIRED,
  INTAKE_WINDOW_EXPIRED_TOAST_TITLE,
  SAVE_AND_EXIT_RESUME,
  RESUME_IN_PROGRESS,
  UNABLE_TO_REACH_LABELS,
  formatUnableToReachBanner,
} from "@/config/clientMessaging";

// Generate temporary intake ID in INT-YYMMDD-##X format
function generateIntakeId(sequenceToday: number): string {
  const today = new Date();
  const yy = today.getFullYear().toString().slice(-2);
  const mm = (today.getMonth() + 1).toString().padStart(2, '0');
  const dd = today.getDate().toString().padStart(2, '0');
  const seq = sequenceToday.toString().padStart(2, '0');
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const randomLetter = letters[Math.floor(Math.random() * letters.length)];
  return `INT-${yy}${mm}${dd}-${seq}${randomLetter}`;
}

// --- Intake identity (STEP 1): single source of truth for rc_client_intakes.intake_json.client. Do NOT rely on SDOH. ---
export type IntakeIdentityShape = {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string | null;
};
function buildIntakeIdentity(firstName: string, lastName: string, email: string, phone: string | null | undefined): IntakeIdentityShape {
  const f = firstName.trim();
  const l = lastName.trim();
  return {
    firstName: f,
    lastName: l,
    fullName: `${f} ${l}`.trim(),
    email: email.trim(),
    phone: (phone != null && String(phone).trim() !== '') ? String(phone).trim() : null,
  };
}

export default function IntakeWizard() {
  // ALL useState - must be declared before any useEffect or derived logic (prevents TDZ in production build)
  const [attorneyGuardOk, setAttorneyGuardOk] = useState<boolean | null>(null);
  const [step, setStep] = useState(0); // Step 0 is now Incident Details (was Step 1)
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [selectedAttorneyId, setSelectedAttorneyId] = useState<string>("");
  const [attorneyCode, setAttorneyCode] = useState("");
  const [availableAttorneys, setAvailableAttorneys] = useState<{attorney_id: string, attorney_name: string, attorney_code?: string | null}[]>([]);
  const [attorneyDisplayName, setAttorneyDisplayName] = useState<string | null>(null);
  const [attorneyName, setAttorneyName] = useState<string>(() => sessionStorage.getItem("rcms_attorney_name") || "");
  const [showWelcome, setShowWelcome] = useState(false); // Skip welcome - consents already signed
  const [sensitiveTag, setSensitiveTag] = useState(false);
  const [showCaraModal, setShowCaraModal] = useState(false);
  const [medications, setMedications] = useState<any[]>([]);
  const [preInjuryMeds, setPreInjuryMeds] = useState<MedicationEntry[]>([]);
  const [postInjuryMeds, setPostInjuryMeds] = useState<MedicationEntry[]>([]);
  const [preInjuryTreatments, setPreInjuryTreatments] = useState<TreatmentEntry[]>([]);
  const [postInjuryTreatments, setPostInjuryTreatments] = useState<TreatmentEntry[]>([]);
  const [medAllergies, setMedAllergies] = useState<AllergyEntry[]>([]);
  const [bhPreMeds, setBhPreMeds] = useState<BHMedicationEntry[]>([]);
  const [bhPostMeds, setBhPostMeds] = useState<BHMedicationEntry[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [hasMeds, setHasMeds] = useState<string>('');
  const [createdCaseId, setCreatedCaseId] = useState<string | null>(null); // Track case ID for saving disclosures
  const [sensitiveProgress, setSensitiveProgress] = useState<SensitiveExperiencesProgress | null>(null);
  const [intakeStartedAt, setIntakeStartedAt] = useState<Date | null>(null); // Track when intake was first started
  const [clientWindowExpired, setClientWindowExpired] = useState(false);
  const [countdownExpired, setCountdownExpired] = useState(false);
  const [clientMsRemaining, setClientMsRemaining] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitErrorDetail, setSubmitErrorDetail] = useState<string | null>(null);
  const [submitClicks, setSubmitClicks] = useState(0);
  const [submitStage, setSubmitStage] = useState<
    | "idle"
    | "clicked"
    | "validating"
    | "blocked_validation"
    | "building_payload"
    | "writing_intake"
    | "updating_case"
    | "success"
    | "error"
  >("idle");
  const [submitDiag, setSubmitDiag] = useState<Record<string, any>>({});
  const [clientEsign, setClientEsign] = useState<{
    agreed: boolean;
    signerFullName: string;
    signerInitials: string;
  }>({
    agreed: false,
    signerFullName: "",
    signerInitials: "",
  });
  const [mentalHealth, setMentalHealth] = useState({
    depression: '',
    selfHarm: '',
    anxiety: '',
    wantHelp: false,
  });
  const [sensitiveExperiences, setSensitiveExperiences] = useState<SensitiveExperiencesData>({
    substanceUse: [],
    safetyTrauma: [],
    stressors: [],
    consentAttorney: 'unset',
    consentProvider: 'unset',
  });
  const [clinicalContext, setClinicalContext] = useState<{ age_ranges: string[] }>({
    age_ranges: [],
  });
  const [overlayContextFlags, setOverlayContextFlags] = useState<{ is_student: boolean; has_dependents: boolean }>({
    is_student: false,
    has_dependents: false,
  });
  const [overlayAnswers, setOverlayAnswers] = useState<Record<string, unknown>>({});
  const [intake, setIntake] = useState<Intake>({
    incidentType: "MVA",
    incidentDate: (typeof sessionStorage !== "undefined" ? sessionStorage.getItem("rcms_date_of_injury") : null) || new Date().toISOString().slice(0, 10),
    initialTreatment: "ED",
    injuries: [],
    severitySelfScore: 5,
  });
  const [incidentNarrative, setIncidentNarrative] = useState("");
  const [incidentNarrativeExtra, setIncidentNarrativeExtra] = useState("");
  const [physicalPreDiagnoses, setPhysicalPreDiagnoses] = useState<string[]>([]);
  const [physicalPreNotes, setPhysicalPreNotes] = useState("");
  const [physicalPreOtherText, setPhysicalPreOtherText] = useState("");
  const [physicalPostDiagnoses, setPhysicalPostDiagnoses] = useState<string[]>([]);
  const [physicalPostNotes, setPhysicalPostNotes] = useState("");
  const [physicalPostOtherText, setPhysicalPostOtherText] = useState("");
  const [bhPreDiagnoses, setBhPreDiagnoses] = useState<string[]>([]);
  const [bhPreOtherText, setBhPreOtherText] = useState("");
  const [bhPostDiagnoses, setBhPostDiagnoses] = useState<string[]>([]);
  const [bhPostOtherText, setBhPostOtherText] = useState("");
  const [bhNotes, setBhNotes] = useState("");
  const [client, setClient] = useState<Client>({
    rcmsId: "",
    attyRef: "AT-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
    dobMasked: "1985-XX-XX",
    gender: "prefer_not_to_say",
    state: "TX",
  });
  const [consent, setConsent] = useState<Consent>({
    signed: true,
    scope: { shareWithAttorney: true, shareWithProviders: true },
    restrictedAccess: false,
  });
  const [fourPs, setFourPs] = useState<FourPs>({
    physical: 3,
    psychological: 3,
    psychosocial: 3,
    professional: 3,
  });
  const [sdoh, setSdoh] = useState<SDOH>({
    housing: 3,
    food: 3,
    transport: 3,
    insuranceGap: 3,
    financial: 3,
    employment: 3,
    social_support: 3,
    safety: 3,
    healthcare_access: 3,
    income_range: undefined,
  });
  const [medsBlock, setMedsBlock] = useState({
    conditions: "",
    meds: "",
    allergies: "",
    attested: false,
    valid: false
  });

  // --- Derived state (useMemo) MUST be declared before any useEffect that references them (prevents TDZ in production) ---
  const requiredIncidentOk = !!intake.incidentDate && !!intake.incidentType;
  const intakeMeta = useMemo(() => ({
    startedAt: new Date().toISOString(),
    completedAt: null,
    required: {
      incident: !!intake.incidentDate && !!intake.incidentType,
      injuries: intake.injuries.length > 0,
      consent: consent.signed,
    },
    optional: {
      fourPs: fourPs.physical !== 3 || fourPs.psychological !== 3 || fourPs.psychosocial !== 3 || fourPs.professional !== 3,
      sdoh: (typeof sdoh.housing === 'number' && sdoh.housing !== 3) ||
            (typeof sdoh.food === 'number' && sdoh.food !== 3) ||
            (typeof sdoh.transport === 'number' && sdoh.transport !== 3) ||
            (typeof sdoh.insuranceGap === 'number' && sdoh.insuranceGap !== 3) ||
            !!(sdoh.financial || sdoh.employment || sdoh.social_support || sdoh.safety || sdoh.healthcare_access),
    },
  }), [intake, consent, fourPs, sdoh]);
  const progressPercent = useIntakePercent(intakeMeta);
  const formData = useMemo(() => ({
    client,
    consent,
    intake,
    fourPs,
    sdoh,
    medsBlock,
    sensitiveTag,
    medications,
    preInjuryMeds,
    postInjuryMeds,
    preInjuryTreatments,
    postInjuryTreatments,
    medAllergies,
    uploadedFiles,
    mentalHealth,
    hasMeds,
    incidentNarrative,
    incidentNarrativeExtra,
    physicalPreDiagnoses,
    physicalPreNotes,
    physicalPreOtherText,
    physicalPostDiagnoses,
    physicalPostNotes,
    physicalPostOtherText,
    bhPreDiagnoses,
    bhPreOtherText,
    bhPostDiagnoses,
    bhPostOtherText,
    bhNotes,
    bhPreMeds,
    bhPostMeds,
    clinicalContext,
    overlayContextFlags,
    overlay_answers: overlayAnswers,
    attorneyName,
  }), [client, consent, intake, fourPs, sdoh, medsBlock, sensitiveTag, medications, preInjuryMeds, postInjuryMeds, preInjuryTreatments, postInjuryTreatments, medAllergies, uploadedFiles, mentalHealth, hasMeds, incidentNarrative, incidentNarrativeExtra, physicalPreDiagnoses, physicalPreNotes, physicalPreOtherText, physicalPostDiagnoses, physicalPostNotes, physicalPostOtherText, bhPreDiagnoses, bhPreOtherText, bhPostDiagnoses, bhPostOtherText, bhNotes, bhPreMeds, bhPostMeds, clinicalContext, overlayContextFlags, overlayAnswers, attorneyName]);

  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const INTAKE_BUILD_MARKER = "INTAKE-IDENTITY-VERIFY-1";

  // Check if consents were completed before allowing intake access
  // Allow resume links (with resume token) to bypass this check
  useEffect(() => {
    const resumeToken = sessionStorage.getItem("rcms_resume_token");
    const consentSessionId = sessionStorage.getItem("rcms_consent_session_id");
    const consentsCompleted = sessionStorage.getItem("rcms_consents_completed");
    
    // If resuming via token, allow access (session was created after minimum identity)
    if (resumeToken) {
      return;
    }
    
    // Otherwise, require consents to be completed
    if (!consentSessionId || !consentsCompleted) {
      // Redirect to consent flow
      window.location.href = "/client-consent";
    }
  }, []);

  // Guard: require attorney_id from session or URL before allowing intake (hard gate, no partial render)
  // Validate via get_attorney_directory only - never rc_users
  useEffect(() => {
    const resumeToken = sessionStorage.getItem("rcms_resume_token");
    const storedAttorneyId = sessionStorage.getItem("rcms_current_attorney_id");
    const urlAttorneyId = searchParams.get("attorney_id");
    const urlAttorneyCode = searchParams.get("attorney_code");
    if (resumeToken) {
      setAttorneyGuardOk(true);
      return;
    }
    if (!urlAttorneyId && !urlAttorneyCode?.trim() && !storedAttorneyId) {
      window.location.href = "/client-consent?attorney_required=1";
      return;
    }
    (async () => {
      const { data } = await supabase.rpc("get_attorney_directory");
      const attorneys = Array.isArray(data) ? data : data ? [data] : [];
      let validatedId: string | null = null;
      let validatedCode: string | null = null;
      if (urlAttorneyId || storedAttorneyId) {
        const aid = urlAttorneyId || storedAttorneyId;
        const match = attorneys.find((a: { attorney_id?: string }) => a.attorney_id === aid);
        if (match) {
          validatedId = (match as { attorney_id: string }).attorney_id;
          validatedCode = (match as { attorney_code?: string | null }).attorney_code?.trim() || null;
        }
      } else if (urlAttorneyCode?.trim()) {
        const codeNorm = urlAttorneyCode.trim().toLowerCase();
        const match = attorneys.find(
          (a: { attorney_code?: string | null }) =>
            a.attorney_code && String(a.attorney_code).trim().toLowerCase() === codeNorm
        );
        if (match) {
          validatedId = (match as { attorney_id: string }).attorney_id;
          validatedCode = urlAttorneyCode.trim();
        }
      }
      if (validatedId) {
        sessionStorage.setItem("rcms_current_attorney_id", validatedId);
        if (validatedCode) sessionStorage.setItem("rcms_attorney_code", validatedCode);
        const matchForName = attorneys.find((a: { attorney_id?: string }) => a.attorney_id === validatedId);
        if (matchForName) {
          const name = (matchForName as { attorney_name?: string }).attorney_name || "";
          sessionStorage.setItem("rcms_attorney_name", name);
          setAttorneyName(name);
        }
        const sid = sessionStorage.getItem("rcms_intake_session_id");
        if (sid) {
          try {
            await updateIntakeSession(sid, { attorneyId: validatedId, attorneyCode: validatedCode || undefined });
          } catch (_) {}
        }
        setAttorneyGuardOk(true);
      } else {
        window.location.href = "/client-consent?attorney_required=1";
      }
    })();
  }, [searchParams]);

  // Hydrate incidentDate from IntakeIdentity (rcms_date_of_injury) on mount
  useEffect(() => {
    const storedDOI = sessionStorage.getItem("rcms_date_of_injury");
    if (storedDOI && storedDOI !== intake.incidentDate) {
      setIntake((prev) => ({ ...prev, incidentDate: storedDOI }));
    }
  }, []);

  // Hydrate client firstName/lastName from sessionStorage on load (set by IntakeIdentity) so name carries through wizard
  useEffect(() => {
    const storedFirst = sessionStorage.getItem("rcms_client_first_name")?.trim() || "";
    const storedLast = sessionStorage.getItem("rcms_client_last_name")?.trim() || "";
    if (storedFirst || storedLast) {
      setClient((prev) => ({
        ...prev,
        firstName: storedFirst || prev.firstName,
        lastName: storedLast || prev.lastName,
        fullName: [storedFirst, storedLast].filter(Boolean).join(" ") || prev.fullName,
      }));
    }
  }, []);

  // Load available attorneys on mount via get_attorney_directory RPC (no rc_users)
  useEffect(() => {
    const loadAttorneys = async () => {
      if (!supabase) return;
      const { data, error } = await supabase.rpc('get_attorney_directory');
      if (error) {
        console.error('IntakeWizard: Failed to load attorneys', error);
        return;
      }
      const attorneys = Array.isArray(data) ? data : data ? [data] : [];
      setAvailableAttorneys(attorneys);
    };
    loadAttorneys();
  }, []);

  // Load intake session on mount (priority: resume token > stored session ID > stored intake ID)
  useEffect(() => {
    const loadIntakeSession = async () => {
      const resumeToken = sessionStorage.getItem("rcms_resume_token");
      const intakeSessionId = sessionStorage.getItem("rcms_intake_session_id");
      const storedIntakeId = sessionStorage.getItem("rcms_intake_id");
      
      // Priority 1: If we have a resume token, load the full session
      if (resumeToken) {
        try {
          const session = await getIntakeSessionByToken(resumeToken);
          if (session) {
            // Set INT- ID immediately (fixes stuck "generating" label)
            if (session.intakeId) {
              setClient(prev => ({ ...prev, rcmsId: session.intakeId }));
            }
            // Persist to sessionStorage so countdown banner and others have intake/session ids
            if (session.intakeId) sessionStorage.setItem("rcms_intake_id", session.intakeId);
            if (session.id) sessionStorage.setItem("rcms_intake_session_id", session.id);
            // Hydrate client name/email so Review & Submit has firstName/lastName
            if (session.firstName) sessionStorage.setItem("rcms_client_first_name", session.firstName);
            if (session.lastName) sessionStorage.setItem("rcms_client_last_name", session.lastName);
            if (session.email) sessionStorage.setItem("rcms_client_email", session.email);
            // Anchor: prefer DB created_at when resuming by token; set only if missing or differs by >5s
            if (session.createdAt) {
              const existing = sessionStorage.getItem("rcms_intake_created_at");
              const dbMs = new Date(session.createdAt).getTime();
              if (!existing) {
                sessionStorage.setItem("rcms_intake_created_at", session.createdAt);
              } else {
                const existingMs = new Date(existing).getTime();
                if (Math.abs(existingMs - dbMs) > 5000) {
                  sessionStorage.setItem("rcms_intake_created_at", session.createdAt);
                }
              }
            }
            
            // Load attorney from session (fixes attorney persistence)
            if (session.attorneyId) {
              setSelectedAttorneyId(session.attorneyId);
            }
            if (session.attorneyCode) {
              setAttorneyCode(session.attorneyCode);
            }
            if (session.formData?.attorneyName) {
              setAttorneyName(session.formData.attorneyName);
              sessionStorage.setItem("rcms_attorney_name", session.formData.attorneyName);
            }
            
            // Load form data if available
            if (session.formData && Object.keys(session.formData).length > 0) {
              const data = session.formData as any;
              if (data.client) {
                setClient(data.client);
                if (data.client.firstName) sessionStorage.setItem("rcms_client_first_name", data.client.firstName);
                if (data.client.lastName) sessionStorage.setItem("rcms_client_last_name", data.client.lastName);
                if (data.client.email) sessionStorage.setItem("rcms_client_email", data.client.email);
              }
              if (data.intake) setIntake(data.intake);
              if (data.fourPs) setFourPs(data.fourPs);
              if (data.sdoh) setSdoh(data.sdoh);
              if (data.medsBlock) setMedsBlock(data.medsBlock);
              if (data.preInjuryMeds) setPreInjuryMeds(data.preInjuryMeds);
              if (data.postInjuryMeds) setPostInjuryMeds(data.postInjuryMeds);
              if (data.preInjuryTreatments) setPreInjuryTreatments(data.preInjuryTreatments);
              if (data.postInjuryTreatments) setPostInjuryTreatments(data.postInjuryTreatments);
              if (data.medAllergies) setMedAllergies(data.medAllergies);
              if (data.mentalHealth) setMentalHealth(data.mentalHealth);
              if (data.incidentNarrative) setIncidentNarrative(data.incidentNarrative);
              if (data.incidentNarrativeExtra) setIncidentNarrativeExtra(data.incidentNarrativeExtra);
              if (data.physicalPreDiagnoses) setPhysicalPreDiagnoses(data.physicalPreDiagnoses);
              if (data.physicalPreNotes) setPhysicalPreNotes(data.physicalPreNotes);
              if (data.physicalPreOtherText != null) setPhysicalPreOtherText(data.physicalPreOtherText);
              if (data.bhPreOtherText != null) setBhPreOtherText(data.bhPreOtherText);
              if (data.physicalPostDiagnoses) setPhysicalPostDiagnoses(data.physicalPostDiagnoses);
              if (data.physicalPostNotes) setPhysicalPostNotes(data.physicalPostNotes);
              if (data.physicalPostOtherText != null) setPhysicalPostOtherText(data.physicalPostOtherText);
              if (data.bhPreDiagnoses) setBhPreDiagnoses(data.bhPreDiagnoses);
              if (data.bhPostDiagnoses) setBhPostDiagnoses(data.bhPostDiagnoses);
              if (data.bhNotes) setBhNotes(data.bhNotes);
              if (data.clinicalContext) setClinicalContext({ age_ranges: data.clinicalContext.age_ranges || [] });
              if (data.overlayContextFlags) setOverlayContextFlags(data.overlayContextFlags);
              if (data.overlay_answers && typeof data.overlay_answers === "object" && !Array.isArray(data.overlay_answers)) setOverlayAnswers(data.overlay_answers);
              if (typeof data.step === 'number') setStep(data.step);
              if (data.attorneyName) {
                setAttorneyName(data.attorneyName);
                sessionStorage.setItem("rcms_attorney_name", data.attorneyName);
              }
            }

            // Set intake started time from session
            if (session.createdAt) {
              setIntakeStartedAt(new Date(session.createdAt));
            }
            
            toast({
              title: "Intake Session Loaded",
              description: `Resuming from ${new Date(session.updatedAt).toLocaleString()}`,
            });
            return; // Exit early if resume token loaded successfully
          }
        } catch (error) {
          console.error('Failed to load intake session:', error);
        }
      }
      
      // Priority 1b: INT#+PIN resume (no email token) – hydrate from sessionStorage set by /resume-intake
      const storedFormData = sessionStorage.getItem("rcms_intake_form_data");
      const storedStep = sessionStorage.getItem("rcms_intake_step");
      if (!resumeToken && storedFormData) {
        try {
          const data = JSON.parse(storedFormData) as any;
          if (data && typeof data === "object") {
            if (data.client) {
              setClient(data.client);
              if (data.client.firstName) sessionStorage.setItem("rcms_client_first_name", data.client.firstName);
              if (data.client.lastName) sessionStorage.setItem("rcms_client_last_name", data.client.lastName);
              if (data.client.email) sessionStorage.setItem("rcms_client_email", data.client.email);
            }
            if (data.intake) setIntake(data.intake);
            if (data.fourPs) setFourPs(data.fourPs);
            if (data.sdoh) setSdoh(data.sdoh);
            if (data.medsBlock) setMedsBlock(data.medsBlock);
            if (data.preInjuryMeds) setPreInjuryMeds(data.preInjuryMeds);
            if (data.postInjuryMeds) setPostInjuryMeds(data.postInjuryMeds);
            if (data.preInjuryTreatments) setPreInjuryTreatments(data.preInjuryTreatments);
            if (data.postInjuryTreatments) setPostInjuryTreatments(data.postInjuryTreatments);
            if (data.medAllergies) setMedAllergies(data.medAllergies);
            if (data.mentalHealth) setMentalHealth(data.mentalHealth);
            if (data.incidentNarrative) setIncidentNarrative(data.incidentNarrative);
            if (data.incidentNarrativeExtra) setIncidentNarrativeExtra(data.incidentNarrativeExtra);
            if (data.physicalPreDiagnoses) setPhysicalPreDiagnoses(data.physicalPreDiagnoses);
            if (data.physicalPreNotes) setPhysicalPreNotes(data.physicalPreNotes);
            if (data.physicalPreOtherText != null) setPhysicalPreOtherText(data.physicalPreOtherText);
            if (data.bhPreOtherText != null) setBhPreOtherText(data.bhPreOtherText);
            if (data.physicalPostDiagnoses) setPhysicalPostDiagnoses(data.physicalPostDiagnoses);
            if (data.physicalPostNotes) setPhysicalPostNotes(data.physicalPostNotes);
            if (data.physicalPostOtherText != null) setPhysicalPostOtherText(data.physicalPostOtherText);
            if (data.bhPreDiagnoses) setBhPreDiagnoses(data.bhPreDiagnoses);
            if (data.bhPostDiagnoses) setBhPostDiagnoses(data.bhPostDiagnoses);
            if (data.bhNotes) setBhNotes(data.bhNotes);
            if (data.clinicalContext) setClinicalContext({ age_ranges: data.clinicalContext?.age_ranges || [] });
            if (data.overlayContextFlags) setOverlayContextFlags(data.overlayContextFlags);
            if (data.overlay_answers && typeof data.overlay_answers === "object" && !Array.isArray(data.overlay_answers)) setOverlayAnswers(data.overlay_answers);
            if (typeof data.step === "number") setStep(data.step);
            if (data.attorneyName) {
              setAttorneyName(data.attorneyName);
              sessionStorage.setItem("rcms_attorney_name", data.attorneyName);
            }
          }
          const stepNum = storedStep ? parseInt(storedStep, 10) : NaN;
          if (!isNaN(stepNum) && stepNum >= 0) setStep(stepNum);
          const created = sessionStorage.getItem("rcms_intake_created_at");
          if (created) setIntakeStartedAt(new Date(created));
          const storedAttorneyId = sessionStorage.getItem("rcms_current_attorney_id");
          const storedAttorneyCode = sessionStorage.getItem("rcms_attorney_code");
          const storedAttorneyName = sessionStorage.getItem("rcms_attorney_name");
          if (storedAttorneyId) setSelectedAttorneyId(storedAttorneyId);
          if (storedAttorneyCode) setAttorneyCode(storedAttorneyCode);
          if (storedAttorneyName) setAttorneyName(storedAttorneyName);
          if (storedIntakeId && storedIntakeId.startsWith("INT-")) {
            setClient(prev => (!prev.rcmsId || !prev.rcmsId.startsWith("INT-") ? { ...prev, rcmsId: storedIntakeId } : prev));
          }
          toast({ title: "Intake Session Loaded", description: "Resuming where you left off." });
          return;
        } catch (e) {
          console.warn("Failed to hydrate from rcms_intake_form_data:", e);
        }
      }
      
      // Priority 2: If we have stored intake ID from ClientConsent (created BEFORE consents), set it immediately
      if (storedIntakeId && storedIntakeId.startsWith('INT-')) {
        setClient(prev => {
          // Only set if not already set or if current value is not an INT- ID
          if (!prev.rcmsId || !prev.rcmsId.startsWith('INT-')) {
            return { ...prev, rcmsId: storedIntakeId };
          }
          return prev;
        });
        
        // Also load attorney info if available in sessionStorage
        const storedAttorneyId = sessionStorage.getItem("rcms_current_attorney_id");
        const storedAttorneyCode = sessionStorage.getItem("rcms_attorney_code");
        const storedAttorneyName = sessionStorage.getItem("rcms_attorney_name");
        if (storedAttorneyId) {
          setSelectedAttorneyId(storedAttorneyId);
        }
        if (storedAttorneyCode) {
          setAttorneyCode(storedAttorneyCode);
        }
        if (storedAttorneyName) {
          setAttorneyName(storedAttorneyName);
        }
      }
    };
    
    loadIntakeSession();
  }, []);

  // Read attorney selection from URL parameters (set in ClientConsent) - fallback if not in session
  useEffect(() => {
    const urlAttorneyId = searchParams.get('attorney_id');
    const urlAttorneyCode = searchParams.get('attorney_code');
    console.log('IntakeWizard: Read from URL params', { urlAttorneyId, urlAttorneyCode });
    
    // Only set if not already set from session
    if (urlAttorneyId && !selectedAttorneyId) setSelectedAttorneyId(urlAttorneyId);
    if (urlAttorneyCode && !attorneyCode) setAttorneyCode(urlAttorneyCode);
  }, [searchParams]);

  // Fetch attorney display name for Case Summary when on Review step (step 4, pre-submit)
  // Use get_attorney_directory (no rc_users) - prefer availableAttorneys if already loaded
  useEffect(() => {
    if (step !== 4 || submitSuccess) return;
    if (!selectedAttorneyId) {
      setAttorneyDisplayName("Not assigned");
      return;
    }
    let cancelled = false;
    (async () => {
      setAttorneyDisplayName(null);
      // First try availableAttorneys (from get_attorney_directory on mount) - guard: never run find before directory load
      let fromCache = null;
      if (Array.isArray(availableAttorneys) && availableAttorneys.length > 0) {
        fromCache = availableAttorneys.find(a => a.attorney_id === selectedAttorneyId);
      }
      if (fromCache) {
        if (!cancelled) setAttorneyDisplayName(fromCache.attorney_name || "Not available");
        return;
      }
      const { data } = await supabase.rpc('get_attorney_directory');
      if (cancelled) return;
      const attorneys = Array.isArray(data) ? data : data ? [data] : [];
      const match = attorneys.find((a: { attorney_id?: string }) => a.attorney_id === selectedAttorneyId);
      const fallback = sessionStorage.getItem("rcms_attorney_name") || attorneyName || "Not available";
      setAttorneyDisplayName(match ? (match as { attorney_name?: string }).attorney_name || fallback : fallback);
    })();
    return () => { cancelled = true; };
  }, [step, submitSuccess, selectedAttorneyId, availableAttorneys, attorneyName]);

  // Client-friendly score labels
  const scoreLabels: Record<number, string> = {
    1: "Extremely difficult - Can't do normal daily things without help",
    2: "Really hard most days - Struggle with regular tasks and activities",
    3: "Pretty difficult at times - Have to push through to get things done",
    4: "A little tricky sometimes - Mostly able to do what I need to",
    5: "Doing just fine - No problems with my daily activities"
  };

  // Auto-create RN tasks for high-severity SDOH
  const handleSDOHChange = async (domain: string, severity: number) => {
    setSdoh((s) => ({ ...(s || {}), [domain]: Math.floor(severity) }));
    
    if (severity <= 2 && draftId) {
      try {
        await supabase.functions.invoke('rn-task-automation', {
          body: {
            type: 'sdoh_followup',
            domain: `s_${domain}`,
            severity,
            draft_id: draftId,
            case_id: null, // Will be linked after case creation
          }
        });
      } catch (error) {
        console.error('Error creating SDOH task:', error);
      }
    }
  };

  // Handle income with poverty flagging
  const handleIncomeChange = async (income_range: string) => {
    setSdoh((s) => ({ ...s, income_range }));
    
    // Poverty line flags (below $30k for simplicity)
    const povertyRanges = ['Under $15,000', '$15,000 - $29,999'];
    
    if (povertyRanges.includes(income_range) && draftId) {
      try {
        await supabase.functions.invoke('rn-task-automation', {
          body: {
            type: 'income_poverty_flag',
            income_range,
            draft_id: draftId,
            case_id: null,
          }
        });
      } catch (error) {
        console.error('Error creating poverty flag:', error);
      }
    }
  };

  const addOrRemoveInjury = (txt: string) => {
    setIntake((v) => ({
      ...v,
      injuries: v.injuries.includes(txt)
        ? v.injuries.filter((i) => i !== txt)
        : [...v.injuries, txt],
    }));
  };

  async function submit() {
    console.log('IntakeWizard: Submit started');
    setSubmitStage("validating");
    setSubmitError(null);
    setSubmitErrorDetail(null);
    setSubmitting(true);

    try {
    // Check if client window has expired
    if (clientWindowExpired) {
      setSubmitStage("blocked_validation");
      setSubmitError("Unable to submit yet.");
      setSubmitErrorDetail("Reason: client window expired");
      toast({
        title: INTAKE_WINDOW_EXPIRED_TOAST_TITLE,
        description: INTAKE_WINDOW_EXPIRED,
        variant: "destructive",
      });
      return;
    }

    if (!intake?.incidentDate || String(intake.incidentDate).trim() === "") {
      setSubmitStage("blocked_validation");
      setSubmitError("Unable to submit yet.");
      setSubmitErrorDetail("Reason: missing incident date");
      toast({
        title: "Validation",
        description: "Incident date is required.",
        variant: "destructive",
      });
      return;
    }

    if (physicalPreDiagnoses.includes("Other") && !(physicalPreOtherText || "").trim()) {
      setSubmitStage("blocked_validation");
      setSubmitError("Please describe the 'Other' pre-injury condition.");
      setSubmitErrorDetail("Go back to Medical History (Pre-injury / Chronic Conditions) and enter a description.");
      toast({
        title: "Validation",
        description: "Please describe the 'Other' pre-injury condition in Medical History.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }
    if (bhPreDiagnoses.includes("Other") && !(bhPreOtherText || "").trim()) {
      setSubmitStage("blocked_validation");
      setSubmitError("Please describe the 'Other' chronic/pre-accident condition.");
      setSubmitErrorDetail("Go back to Mental Health (Pre-accident Behavioral Health) and enter a description.");
      toast({
        title: "Validation",
        description: "Please describe the 'Other' condition in Mental Health.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }
    if (physicalPostDiagnoses.includes("Other") && !(physicalPostOtherText || "").trim()) {
      setSubmitStage("blocked_validation");
      setSubmitError("Please describe the 'Other' post-injury physical condition.");
      setSubmitErrorDetail("Go back to Medical History (Post-injury / Accident-Related) and enter a description.");
      toast({
        title: "Validation",
        description: "Please describe the 'Other' post-injury condition in Medical History.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }
    if (bhPostDiagnoses.includes("Other") && !(bhPostOtherText || "").trim()) {
      setSubmitStage("blocked_validation");
      setSubmitError("Please describe the 'Other' post-accident behavioral health condition.");
      setSubmitErrorDetail("Go back to Behavioral Health (Post-accident) and enter a description.");
      toast({
        title: "Validation",
        description: "Please describe the 'Other' post-accident condition in Behavioral Health.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    const masked = maskName(client.fullName || "");
    
    // Get intake_session_id from sessionStorage - declare at function scope for use throughout
    const intakeSessionId = sessionStorage.getItem("rcms_intake_session_id");
    
    // Get intake_id from sessionStorage - it was stored during IntakeIdentity
    // The intake_id is the INT number (e.g., INT-260115-02V) and MUST be used as the case_number
    let caseNumber: string | null = sessionStorage.getItem("rcms_intake_id");
    
    if (caseNumber) {
      console.log('IntakeWizard: Using intake_id from sessionStorage as case_number:', caseNumber);
    } else {
      // Fallback: try to get from database if sessionStorage is empty
      if (intakeSessionId) {
        try {
          const { data: sessionData } = await supabaseGet(
            'rc_client_intake_sessions',
            `id=eq.${intakeSessionId}&select=intake_id&limit=1`
          );
          if (sessionData) {
            const session = Array.isArray(sessionData) ? sessionData[0] : sessionData;
            caseNumber = session.intake_id || null;
            if (caseNumber) {
              console.log('IntakeWizard: Retrieved intake_id from database as case_number:', caseNumber);
            }
          }
        } catch (e) {
          console.error("Error loading intake session for case_number:", e);
        }
      }
    }
    
    // Only generate new ID if absolutely nothing found (should never happen)
    if (!caseNumber) {
      console.warn('IntakeWizard: No intake_id found in sessionStorage or database, generating new client ID as fallback');
      const clientIdResult = await ClientIdService.generateClientId({
        attorneyCode: attorneyCode || undefined,
        type: attorneyCode ? 'R' : 'I' // 'R' for referral with attorney, 'I' for internal if no attorney
      });
      
      if (!clientIdResult.success) {
        setSubmitStage("blocked_validation");
        setSubmitError("Unable to submit yet.");
        setSubmitErrorDetail("Reason: failed to generate case_number (client ID)");
        alert(`Error generating client ID: ${clientIdResult.error}`);
        return;
      }
      caseNumber = clientIdResult.clientId;
    }

    setSubmitStage("building_payload");

    const newCase: Case = {
      id: crypto.randomUUID(),
      firmId: "firm-001",
      client: { ...client, displayNameMasked: masked },
      intake: {
        ...intake,
        // Include medical info from medsBlock
        conditions: medsBlock.conditions,
        medList: medsBlock.meds,
        allergies: medsBlock.allergies,
        medsAttested: medsBlock.attested,
        // Include new fields
        incidentNarrative,
        incidentNarrativeExtra,
        physicalPreDiagnoses,
        physicalPreNotes,
        physicalPreOtherText,
        physicalPostDiagnoses,
        physicalPostNotes,
        physicalPostOtherText,
        bhPreDiagnoses,
        bhPreOtherText,
        bhPostDiagnoses,
        bhPostOtherText,
        bhNotes,
      },
      fourPs,
      sdoh,
      consent: { ...consent, restrictedAccess: sensitiveTag || consent.restrictedAccess },
      flags: [],
      status: consent.signed ? "NEW" : "AWAITING_CONSENT",
      checkins: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (sensitiveTag) newCase.flags.push("SENSITIVE");
    
    // Look up attorney by selectedAttorneyId or attorney_code via get_attorney_directory (no rc_users)
    console.log('IntakeWizard handleSubmit: Attorney values', { selectedAttorneyId, attorneyCode });
    let attorneyId: string | null = selectedAttorneyId || null;
    if (!attorneyId && attorneyCode?.trim()) {
      const { data: dirData } = await supabase.rpc('get_attorney_directory');
      const attorneys = Array.isArray(dirData) ? dirData : dirData ? [dirData] : [];
      const codeNorm = attorneyCode.trim().toLowerCase();
      const match = attorneys.find(
        (a: { attorney_code?: string | null }) =>
          a.attorney_code && String(a.attorney_code).trim().toLowerCase() === codeNorm
      );
      if (match) attorneyId = (match as { attorney_id: string }).attorney_id;
    }

    console.log('IntakeWizard handleSubmit: Resolved attorneyId', attorneyId);
    setSubmitDiag((prev) => ({ ...prev, attorneyIdResolved: attorneyId }));

    // Get client information: sessionStorage first (set by IntakeIdentity), then form state, then intake session DB
    // Fallback to sessionStorage so "firstName/lastName required" never appears if name was entered on IntakeIdentity
    let clientFirstName = sessionStorage.getItem("rcms_client_first_name")?.trim() || (client as any).firstName?.trim() || "";
    let clientLastName = sessionStorage.getItem("rcms_client_last_name")?.trim() || (client as any).lastName?.trim() || "";
    let clientEmail = sessionStorage.getItem("rcms_client_email") || "";
    let intakeIdFromSession: string | null = sessionStorage.getItem("rcms_intake_id") || null;
    
    if (intakeSessionId && (!clientFirstName || !clientLastName || !clientEmail || !intakeIdFromSession)) {
      try {
        const { data: sessionData } = await supabaseGet(
          'rc_client_intake_sessions',
          `id=eq.${intakeSessionId}&select=first_name,last_name,email,intake_id&limit=1`
        );
        if (sessionData) {
          const session = Array.isArray(sessionData) ? sessionData[0] : sessionData;
          if (!clientFirstName) clientFirstName = session.first_name || "";
          if (!clientLastName) clientLastName = session.last_name || "";
          if (!clientEmail) clientEmail = session.email || "";
          if (!intakeIdFromSession) intakeIdFromSession = session.intake_id || null;
        }
      } catch (e) {
        console.error("Error loading intake session:", e);
      }
    }

    // STEP 2: Email fallback from auth (fallback ONLY for email)
    if (!clientEmail) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.email) clientEmail = authData.user.email;
      } catch (_) {}
    }

    // STEP 2: Final fallback — re-read from sessionStorage in case form state was cleared
    if (!clientFirstName || !clientLastName) {
      clientFirstName = sessionStorage.getItem("rcms_client_first_name")?.trim() || clientFirstName;
      clientLastName = sessionStorage.getItem("rcms_client_last_name")?.trim() || clientLastName;
    }
    if (!clientFirstName || !clientLastName) {
      setSubmitStage("blocked_validation");
      setSubmitError("We couldn't confirm your name details. Please return to the Identity step.");
      setSubmitErrorDetail("Reason: firstName/lastName required");
      toast({ title: "Validation", description: "We couldn't confirm your name details. Please return to the Identity step.", variant: "destructive" });
      setSubmitting(false);
      return;
    }
    if (!clientEmail) {
      setSubmitStage("blocked_validation");
      setSubmitError("We couldn't confirm your email. Please return to the Identity step or sign in.");
      setSubmitErrorDetail("Reason: email required");
      toast({ title: "Validation", description: "We couldn't confirm your email. Please return to the Identity step or sign in.", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Phone: optional; from wizard state or sessionStorage (IntakeIdentity does not collect phone yet)
    const clientPhone = (client as any).phone || sessionStorage.getItem("rcms_client_phone") || "";

    // Get date of injury from sessionStorage
    const dateOfInjury = sessionStorage.getItem("rcms_date_of_injury") || intake.incidentDate || null;

    // Require intake session for submit (RPC uses it to create case)
    if (!intakeSessionId) {
      setSubmitStage("blocked_validation");
      setSubmitError("Unable to submit yet.");
      setSubmitErrorDetail("Reason: intake session missing. Please return to the Identity step and start over.");
      toast({
        title: "Validation",
        description: "Please return to the Identity step and complete the form.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    // Check if already submitted (session has case_id and submitted status)
    if (intakeIdFromSession) {
      try {
        const { data: sessionRow } = await supabaseGet(
          'rc_client_intake_sessions',
          `id=eq.${intakeSessionId}&select=intake_status,case_id&limit=1`
        );
        const s = Array.isArray(sessionRow) ? sessionRow[0] : sessionRow;
        if (s?.intake_status === 'submitted' && s?.case_id) {
          setSubmitStage("blocked_validation");
          setSubmitError("Unable to submit yet.");
          setSubmitErrorDetail("Reason: intake already submitted for this case");
          toast({ title: 'Already submitted', description: 'This intake was already submitted. It is pending attorney review.' });
          setCreatedCaseId(s.case_id);
          setSubmitting(false);
          return;
        }
      } catch (_) {}
    }

    // Update session form_data with full payload so RPC has fourps, sdoh, intake
    const fourpsData = {
      physical: Math.floor(fourPs.physical) || 1,
      psychological: Math.floor(fourPs.psychological) || 1,
      psychosocial: Math.floor(fourPs.psychosocial) || 1,
      professional: Math.floor(fourPs.professional) || 1,
    };
    const sdohData = {
      housing: sdoh.housing || 3,
      food: sdoh.food || 3,
      transport: sdoh.transport || 3,
      insuranceGap: sdoh.insuranceGap || 3,
      financial: sdoh.financial || 3,
      employment: sdoh.employment || 3,
      social_support: sdoh.social_support || 3,
      safety: sdoh.safety || 3,
      healthcare_access: sdoh.healthcare_access || 3,
      income_range: sdoh.income_range || null,
    };
    try {
      await updateIntakeSession(intakeSessionId, {
        formData: {
          ...formData,
          fourPs: fourpsData,
          sdoh: sdohData,
          intake: { ...intake, incidentDate: dateOfInjury || intake.incidentDate, incidentType: intake.incidentType || 'MVA' },
          client: { ...client, phone: clientPhone },
        },
      });
    } catch (e) {
      console.error('IntakeWizard: Failed to update session form_data before RPC:', e);
    }

    // Create case via RPC (no direct rc_cases insert)
    setSubmitStage("updating_case");
    const { data: rpcData, error: rpcError } = await supabase.rpc('submit_intake_create_case', {
      p_resume_token: intakeSessionId,
    });

    if (rpcError) {
      setSubmitStage("error");
      setSubmitError("Submission failed. Please try again.");
      setSubmitErrorDetail(rpcError?.message || String(rpcError));
      console.error("IntakeWizard: RPC submit_intake_create_case failed:", rpcError);
      toast({
        title: "Error",
        description: "Failed to create case. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    const rpcRow = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    const resolvedCaseId = rpcRow?.case_id;
    const clientId = rpcRow?.client_id ?? null;

    if (!resolvedCaseId) {
      setSubmitStage("error");
      setSubmitError("Submission failed. Please try again.");
      setSubmitErrorDetail("RPC did not return case_id");
      setSubmitting(false);
      return;
    }

    (newCase as any).id = resolvedCaseId;

    // Store case ID for sensitive disclosures
    setCreatedCaseId(resolvedCaseId);
    
    // Note: setCases and log removed - IntakeWizard is now public and doesn't use AppContext
    // setCases((arr) => [newCase, ...arr]);
    console.log("INTAKE_SUBMIT", newCase.id);
    
    // Schedule client reminders via Supabase edge function
    scheduleClientReminders(undefined, newCase as any);
    
    // --- Always run: updateIntakeSession, rc_client_intakes, consent linking (so attorney queue sees intake for unauthenticated clients) ---
    if (intakeSessionId) {
      try {
        await updateIntakeSession(intakeSessionId, { intakeStatus: 'submitted', caseId: newCase.id });
        console.log('IntakeWizard: Marked intake session as submitted:', intakeSessionId);
      } catch (e) {
        console.error('Error marking intake session as submitted:', e);
      }
    }
    const nowISO = new Date().toISOString();
    // STEP 3: intake_json.client MUST be the canonical identity (firstName, lastName, fullName, email, phone). Do NOT rely on SDOH.
    const identity = buildIntakeIdentity(clientFirstName, clientLastName, clientEmail, clientPhone || null);
    const intakeJson = {
      client: identity,
      // Flattened keys for backward compatibility (do not remove; downstream readers may use these)
      state: client.state ?? null,
      gender: client.gender ?? null,
      rcmsId: (caseNumber || client.rcmsId || intakeIdFromSession || null) as string | null,
      attyRef: client.attyRef ?? null,
      dobMasked: client.dobMasked ?? null,
      displayNameMasked: maskName(identity.fullName) || null,
      intake: {
        ...intake,
        conditions: medsBlock.conditions,
        medList: medsBlock.meds,
        allergies: medsBlock.allergies,
        medsAttested: medsBlock.attested,
        incidentNarrative,
        incidentNarrativeExtra,
        physicalPreDiagnoses,
        physicalPreNotes,
        physicalPreOtherText,
        physicalPostDiagnoses,
        physicalPostNotes,
        physicalPostOtherText,
        bhPreDiagnoses,
        bhPreOtherText,
        bhPostDiagnoses,
        bhPostOtherText,
        bhNotes,
      },
      fourPs,
      sdoh,
      consent: { ...consent, restrictedAccess: sensitiveTag || consent.restrictedAccess },
      flags: newCase.flags,
      status: newCase.status,
      createdAt: newCase.created_at,
      updatedAt: newCase.updated_at,
      clinical_context: {
        age_ranges: (clinicalContext?.age_ranges ?? []).filter((a): a is string => !!a && a !== "__skip__"),
      },
      context_flags: {
        is_student: overlayContextFlags?.is_student ?? false,
        has_dependents: overlayContextFlags?.has_dependents ?? false,
      },
      compliance: {
        client_esign: {
          signed: true,
          signed_at: nowISO,
          signer_full_name: clientEsign.signerFullName.trim(),
          signer_initials: clientEsign.signerInitials.trim() || null,
          signature_method: "typed_name",
          documents: {
            privacy_policy: { version: "v1.0", text: CLIENT_DOCUMENTS.clientPrivacyPolicyText },
            hipaa_notice: { version: "v1.0", text: CLIENT_DOCUMENTS.clientHipaaNoticeText },
            consent_to_care: { version: "v1.0", text: CLIENT_DOCUMENTS.clientConsentToCareText },
          },
        },
      },
      medications: { preInjury: preInjuryMeds, postInjury: postInjuryMeds },
      overlay_answers: overlayAnswers || {},
    };
    const now = new Date();
    const submittedAt = now.toISOString();
    const attorneyConfirmDeadlineAt = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
    setSubmitStage("writing_intake");
    setSubmitDiag((prev) => ({ ...prev, writingIntake: true, caseId: newCase.id, hasClientId: !!clientId, hasAttorneyId: !!attorneyId }));
    // TEMP VERIFY: ensure canonical client identity is present in intake_json before insert
    const hasClient = !!(intakeJson && typeof intakeJson === "object" && "client" in (intakeJson as any));
    console.log("INTAKE SUBMIT MARKER", INTAKE_BUILD_MARKER, {
      caseId: newCase.id,
      caseNumber,
      hasClient,
      intakeJsonTopKeys: intakeJson ? Object.keys(intakeJson as any) : null,
      clientKeys: hasClient ? Object.keys((intakeJson as any).client ?? {}) : null,
      identityEmail: (intakeJson as any)?.client?.email ?? null
    });
    if (!hasClient) {
      setSubmitError("Intake submission blocked: missing client identity payload. Please return to Identity step.");
      throw new Error("Intake insert blocked: intake_json.client missing");
    }
    // INTAKE FINALIZE: must include intake_json.client identity + set client_id (STEP 0)
    console.log("INTAKE SUBMIT PATH HIT", { intake_json: intakeJson });
    const { data: intakeData, error: intakeErr } = await supabaseInsert('rc_client_intakes', {
      case_id: newCase.id,
      intake_json: intakeJson,
      intake_status: 'submitted_pending_attorney',
      intake_submitted_at: submittedAt,
      attorney_confirm_deadline_at: attorneyConfirmDeadlineAt,
    });
    if (intakeErr) {
      setSubmitStage("error");
      setSubmitError("Submission failed. Please try again.");
      setSubmitErrorDetail("Supabase error: " + (intakeErr?.message || String(intakeErr)));
      console.error("Error recording intake completion:", intakeErr);
      return;
    }
    setSubmitDiag((prev) => ({ ...prev, intakeWriteOk: true }));
    const intakeInsertId = (Array.isArray(intakeData) ? intakeData[0] : intakeData)?.id;
    console.log('IntakeWizard: rc_client_intakes ok, id:', intakeInsertId);
    try {
      const consentSessionId = sessionStorage.getItem("rcms_consent_session_id");
      if (consentSessionId && newCase.id) {
        const updateData: any = { case_id: newCase.id, client_intake_id: intakeInsertId || null };
        const { error: consentLinkError } = await supabaseUpdate('rc_client_consents', `session_id=eq.${consentSessionId}`, updateData);
        if (consentLinkError?.message?.includes('column') && consentLinkError?.message?.includes('case_id')) {
          await supabaseUpdate('rc_client_consents', `session_id=eq.${consentSessionId}`, { client_intake_id: intakeInsertId || null });
        }
      }
    } catch (e) {
      console.error('Error linking consent to case:', e);
    }
    
    // Create initial client_checkin from intake 4Ps & SDOH for baseline tracking (authenticated users only)
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { error: checkinError } = await supabaseInsert("rc_client_checkins", {
          case_id: newCase.id,
          client_id: userData.user.id,
          pain_scale: 5,
          depression_scale: 0,
          anxiety_scale: 0,
          p_physical: Math.floor(fourPs.physical) || 1,
          p_psychological: Math.floor(fourPs.psychological) || 1,
          p_psychosocial: Math.floor(fourPs.psychosocial) || 1,
          p_purpose: Math.floor(fourPs.professional) || 1,
          sdoh_housing: sdoh.housing || 3,
          sdoh_food: sdoh.food || 3,
          sdoh_transport: sdoh.transport || 3,
          sdoh_insurance: sdoh.insuranceGap || 3,
          sdoh_financial: sdoh.financial || 3,
          sdoh_employment: sdoh.employment || 3,
          sdoh_social_support: sdoh.social_support || 3,
          sdoh_safety: sdoh.safety || 3,
          sdoh_healthcare_access: sdoh.healthcare_access || 3,
          sdoh_income_range: sdoh.income_range || null,
          note: "Baseline from intake assessment"
        } as any);
        
        if (checkinError) {
          console.error("Error creating baseline check-in:", checkinError);
        }

        // Save medications from intake to rc_client_medications table
        // Use clientId from rc_clients table, not auth user ID
        const allMeds = [
          ...preInjuryMeds.filter(m => m.brandName.trim() || m.genericName.trim()).map(med => ({
            case_id: newCase.id,
            client_id: clientId || userData.user.id, // Use rc_clients.id if available
            medication_name: med.brandName || med.genericName,
            dosage: med.dose || null,
            frequency: med.frequency || null,
            prescribing_doctor: med.prescriber || null,
            start_date: med.startDate || null,
            side_effects: med.notes || null,
            purpose: med.purpose || null, // Add purpose field
            prn: med.frequency?.toLowerCase().includes('prn') || med.frequency?.toLowerCase().includes('as needed') || false, // Determine PRN from frequency
            injury_timing: 'pre-injury',
            is_active: true,
          })),
          ...postInjuryMeds.filter(m => m.brandName.trim() || m.genericName.trim()).map(med => ({
            case_id: newCase.id,
            client_id: clientId || userData.user.id, // Use rc_clients.id if available
            medication_name: med.brandName || med.genericName,
            dosage: med.dose || null,
            frequency: med.frequency || null,
            prescribing_doctor: med.prescriber || null,
            start_date: med.startDate || null,
            side_effects: med.notes || null,
            purpose: med.purpose || null, // Add purpose field
            prn: med.frequency?.toLowerCase().includes('prn') || med.frequency?.toLowerCase().includes('as needed') || false, // Determine PRN from frequency
            injury_timing: 'post-injury',
            is_active: true,
          })),
        ];

        if (allMeds.length > 0) {
          // Insert medications one by one since supabaseInsert handles single objects
          for (const med of allMeds) {
            const { error: medsError } = await supabaseInsert("rc_client_medications", med);
            if (medsError) {
              console.error("Error saving medication:", medsError);
            }
          }
        }

        // Save treatments from intake to client_treatments table
        const allTreatments = [
          ...preInjuryTreatments.filter(t => t.provider.trim() || t.type.trim()).map(treatment => ({
            case_id: newCase.id,
            client_id: userData.user.id,
            treatment_name: `${treatment.type}${treatment.provider ? ' - ' + treatment.provider : ''}`,
            provider: treatment.provider || null,
            frequency: treatment.frequency || null,
            start_date: treatment.startDate || null,
            notes: treatment.notes || null,
            injury_timing: 'pre_injury',
            is_active: true,
          })),
          ...postInjuryTreatments.filter(t => t.provider.trim() || t.type.trim()).map(treatment => ({
            case_id: newCase.id,
            client_id: userData.user.id,
            treatment_name: `${treatment.type}${treatment.provider ? ' - ' + treatment.provider : ''}`,
            provider: treatment.provider || null,
            frequency: treatment.frequency || null,
            start_date: treatment.startDate || null,
            notes: treatment.notes || null,
            injury_timing: 'post_injury',
            is_active: true,
          })),
        ];

        if (allTreatments.length > 0) {
          const { error: treatmentsError } = await supabase
            .from("client_treatments")
            .insert(allTreatments);
          
          if (treatmentsError) {
            console.error("Error saving treatments:", treatmentsError);
          }
        }

        // Save allergies if provided
        if (medAllergies && medAllergies.length > 0) {
          const allergiesData = medAllergies.filter(a => a.medication.trim()).map(allergy => ({
            case_id: newCase.id,
            client_id: userData.user.id,
            allergen_name: allergy.medication,
            reaction: allergy.reaction || null,
            severity: allergy.severity || null,
            notes: null,
            reported_date: new Date().toISOString().split('T')[0],
            is_active: true,
          }));

          if (allergiesData.length > 0) {
            const { error: allergiesError } = await supabase
              .from("client_allergies")
              .insert(allergiesData);
            
            if (allergiesError) {
              console.error("Error saving allergies:", allergiesError);
            }
          }
        }

        // Process sensitive experiences and create safety alerts
        const sensitiveFlags = analyzeSensitiveExperiences(sensitiveExperiences);
        
        if (sensitiveFlags.length > 0) {
          // Create case alerts for RN CM
          const alertsData = sensitiveFlags.map(flag => ({
            case_id: newCase.id,
            alert_type: flag.alertType,
            message: flag.message,
            severity: flag.severity,
            disclosure_scope: flag.disclosureScope,
            created_by: userData.user.id,
            metadata: {
              notification_priority: flag.notificationPriority,
              flag_level: flag.level,
              flag_color: flag.color,
              consent_attorney: sensitiveExperiences.consentAttorney,
              consent_provider: sensitiveExperiences.consentProvider,
              additional_details: sensitiveExperiences.additionalDetails || null,
              section_skipped: sensitiveExperiences.sectionSkipped || false,
            }
          }));

          // Insert alerts one by one since supabaseInsert handles single objects
          for (const alert of alertsData) {
            const { error: alertsError } = await supabaseInsert("case_alerts", alert);
            if (alertsError) {
              console.error("Error creating safety alert:", alertsError);
            }
          }

          // Update SDOH flags in cases table
          const sdohUpdates = buildSdohUpdates(sensitiveFlags);
          
          if (Object.keys(sdohUpdates).length > 0) {
            // Merge with existing SDOH data
            const updatedSdoh = {
              ...newCase.sdoh,
              sensitive_experiences_flags: sdohUpdates,
              sensitive_experiences_detected_at: new Date().toISOString()
            };

            const { error: sdohError } = await supabaseUpdate(
              "rc_cases",
              `id=eq.${newCase.id}`,
              { sdoh: updatedSdoh }
            );
            
            if (sdohError) {
              console.error("Error updating SDOH flags:", sdohError);
            }
          }
        }

      }
    } catch (error) {
      console.error("Error creating baseline check-in:", error);
    }
    
    toast({
      title: "Intake Submitted Successfully",
      description: `Case ${caseNumber} created. Your intake is now pending attorney review.`,
    });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await audit({
        action: 'intake_submitted',
        actorRole: 'client',
        actorId: user?.id || 'anonymous',
        caseId: newCase.id,
        meta: { intake_id: intakeInsertId, attorney_code: attorneyCode }
      });
    } catch (e) {
      console.error('Failed to audit intake submission:', e);
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await createAutoNote({
        caseId: newCase.id,
        noteType: 'intake',
        title: 'Intake Submitted',
        content: generateIntakeNote(client.fullName || 'Client', client.rcmsId || '', attorneyCode || ''),
        createdBy: user?.id || 'system',
        createdByRole: 'client',
        visibility: 'all',
      });
    } catch (e) {
      console.error('Failed to create intake note:', e);
    }
    
    try { await deleteDraft(); } catch (e) { console.error('Failed to delete draft:', e); }
    sessionStorage.removeItem("rcms_consent_session_id");
    sessionStorage.removeItem("rcms_consents_completed");
    sessionStorage.setItem('rcms_intake_submitted', 'true');
    sessionStorage.setItem("rcms_intake_status", "submitted_pending_attorney");
    sessionStorage.setItem("rcms_intake_submitted_at", new Date().toISOString());
    sessionStorage.removeItem("rcms_intake_form_data");

    setSubmitStage("success");
    setSubmitSuccess(true);
    } catch (e) {
      const err = e as { message?: string; code?: string };
      if (isRcClientsAuthBindingError(e)) {
        setSubmitStage("error");
        setSubmitError(getRcClientsBindingUserMessage());
        setSubmitErrorDetail(getRcClientsBindingDiagnosticDetail(e));
      } else if (err?.message === "Intake insert blocked: intake_json.client missing") {
        setSubmitStage("error");
        setSubmitError("Intake submission blocked: missing client identity payload. Please return to Identity step.");
        setSubmitErrorDetail("Reason: intake_json.client missing");
      } else {
        const safeErrorString = (err?.message || String(e)) + (err?.code ? ` [${err.code}]` : '');
        setSubmitStage("error");
        setSubmitError("Submission failed. Please try again.");
        setSubmitErrorDetail(safeErrorString);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const generatePDFSummary = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(15, 42, 106); // Navy
    doc.text("Reconcile C.A.R.E. Intake Summary", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: "center" });
    
    let yPos = 45;
    
    // Client Information
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Client Information", 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.text(`RCMS ID: ${client.rcmsId}`, 20, yPos);
    yPos += 6;
    doc.text(`DOB: ${client.dobMasked}`, 20, yPos);
    yPos += 6;
    doc.text(`Attorney: ${attorneyCode || "N/A"}`, 20, yPos);
    yPos += 12;
    
    // Incident Details
    doc.setFontSize(14);
    doc.text("Incident Details", 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.text(`Type: ${intake.incidentType}`, 20, yPos);
    yPos += 6;
    doc.text(`Date: ${fmtDate(intake.incidentDate)}`, 20, yPos);
    yPos += 6;
    doc.text(`Initial Treatment: ${intake.initialTreatment}`, 20, yPos);
    yPos += 6;
    doc.text(`Injuries: ${intake.injuries.join(", ") || "None specified"}`, 20, yPos);
    yPos += 12;
    
    // Assessment Snapshot
    doc.setFontSize(14);
    doc.text("Assessment Snapshot", 20, yPos);
    yPos += 10;
    
    const allValues = [
      fourPs.physical, fourPs.psychological, fourPs.psychosocial, fourPs.professional,
      typeof sdoh.housing === 'number' ? sdoh.housing : 3,
      typeof sdoh.transport === 'number' ? sdoh.transport : 3,
      typeof sdoh.food === 'number' ? sdoh.food : 3,
      typeof sdoh.insuranceGap === 'number' ? sdoh.insuranceGap : 3,
      typeof sdoh.financial === 'number' ? sdoh.financial : 3,
      typeof sdoh.employment === 'number' ? sdoh.employment : 3,
      typeof sdoh.social_support === 'number' ? sdoh.social_support : 3,
      typeof sdoh.safety === 'number' ? sdoh.safety : 3,
      typeof sdoh.healthcare_access === 'number' ? sdoh.healthcare_access : 3
    ];
    const avgScore = Math.floor(allValues.reduce((a, b) => a + b, 0) / allValues.length);
    const severity = parseFloat(avgScore) >= 4.5 ? 'Stable' :
                     parseFloat(avgScore) >= 3.5 ? 'Mild' :
                     parseFloat(avgScore) >= 2.5 ? 'Moderate' : 'Critical';
    
    doc.setFontSize(10);
    doc.text(`Overall Score: ${avgScore} (${severity})`, 20, yPos);
    yPos += 6;
    doc.text(`Physical: ${fourPs.physical} | Psychological: ${fourPs.psychological} | Psychosocial: ${fourPs.psychosocial} | Professional: ${fourPs.professional}`, 20, yPos);
    yPos += 12;
    
    // Medications
    if (preInjuryMeds.length > 0 || postInjuryMeds.length > 0) {
      doc.setFontSize(14);
      doc.text("Medications", 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      if (preInjuryMeds.length > 0) {
        doc.text("Pre-Injury:", 20, yPos);
        yPos += 6;
        preInjuryMeds.forEach(med => {
          const medName = med.brandName || med.genericName;
          if (medName && medName.trim()) {
            doc.text(`  • ${medName}${med.dose ? ` (${med.dose})` : ''}`, 25, yPos);
            yPos += 5;
          }
        });
      }
      if (postInjuryMeds.length > 0) {
        yPos += 3;
        doc.text("Post-Injury:", 20, yPos);
        yPos += 6;
        postInjuryMeds.forEach(med => {
          const medName = med.brandName || med.genericName;
          if (medName && medName.trim()) {
            doc.text(`  • ${medName}${med.dose ? ` (${med.dose})` : ''}`, 25, yPos);
            yPos += 5;
          }
        });
      }
      yPos += 8;
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.text("This is a summary of your intake submission. Keep this for your records.", pageWidth / 2, footerY, { align: "center" });
    doc.text("CONFIDENTIAL - HIPAA Protected Information", pageWidth / 2, footerY + 5, { align: "center" });
    
    // Save the PDF
    doc.save(`Reconcile-CARE-Intake-Summary-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [step]);

  // Dev-only tripwire: log formData structure when entering Step 3 (no PHI)
  useEffect(() => {
    if (step === 3 && import.meta.env.DEV) {
      console.log("[Step3] formData snapshot", {
        keys: Object.keys(formData || {}),
        hasSdoh: !!formData?.sdoh,
        hasFourPs: !!formData?.fourPs,
        hasClinicalContext: !!formData?.clinicalContext,
        hasOverlayContextFlags: !!formData?.overlayContextFlags,
      });
    }
  }, [step, formData]);

  // Autosave functionality
  const { loadDraft, deleteDraft, saveNow } = useAutosave({
    formData,
    step,
    enabled: !showWelcome,
    debounceMs: 3000,
  });

  // Also save to intake session when formData or step changes
  useEffect(() => {
    if (showWelcome) return;
    
    const intakeSessionId = sessionStorage.getItem("rcms_intake_session_id");
    if (!intakeSessionId) return;

    const timer = setTimeout(async () => {
      try {
        await updateIntakeSession(intakeSessionId, {
          currentStep: step,
          formData: { ...formData, step },
        });
      } catch (error) {
        console.error('Failed to save to intake session:', error);
      }
    }, 3000); // Debounce same as autosave

    return () => clearTimeout(timer);
  }, [formData, step, showWelcome]);

  // Clear old draft if starting fresh intake with new attorney
  useEffect(() => {
    const urlAttorneyId = searchParams.get('attorney_id');
    const storedAttorneyId = sessionStorage.getItem('rcms_current_attorney_id');
    const intakeSubmitted = sessionStorage.getItem('rcms_intake_submitted');
    
    // Only clear if:
    // 1. Previous intake was submitted, OR
    // 2. There IS a stored attorney AND it's different from URL
    // Don't clear on first visit (when storedAttorneyId is null)
    if (intakeSubmitted === 'true' || (storedAttorneyId && urlAttorneyId && urlAttorneyId !== storedAttorneyId)) {
      // Preserve client identity — these must survive across the wizard
      const preserveKeys = [
        'rcms_client_first_name',
        'rcms_client_last_name',
        'rcms_client_email',
        'rcms_intake_session_id',
        'rcms_intake_id',
        'rcms_resume_token',
        'rcms_intake_created_at',
        'rcms_date_of_injury',
        'rcms_consents_completed'
      ];
      const preserved: Record<string, string> = {};
      for (const key of preserveKeys) {
        const val = sessionStorage.getItem(key);
        if (val) preserved[key] = val;
      }

      sessionStorage.clear();

      // Restore preserved values
      for (const [key, val] of Object.entries(preserved)) {
        sessionStorage.setItem(key, val);
      }

      // Set new attorney ID
      if (urlAttorneyId) {
        sessionStorage.setItem('rcms_current_attorney_id', urlAttorneyId);
      }
      
      // Delete drafts directly from database and reload
      (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('intake_drafts')
              .delete()
              .eq('owner_user_id', user.id);
          }
        } catch (e) {
          console.error('Failed to delete drafts:', e);
        }
        sessionStorage.setItem('rcms_clear_form', 'true');
        window.location.reload();
      })();
      return;
    } else if (urlAttorneyId && !storedAttorneyId) {
      // First visit - just set the attorney ID, no reload needed
      sessionStorage.setItem('rcms_current_attorney_id', urlAttorneyId);
    }
  }, [searchParams]);

  // Reset form state when flagged for clearing
  useEffect(() => {
    const needsClear = sessionStorage.getItem('rcms_clear_form');
    if (needsClear === 'true') {
      sessionStorage.removeItem('rcms_clear_form');
      // Reset all form state to defaults
      setClient({
        fullName: "",
        dobMasked: "",
        rcmsId: "",
        phone: "",
        email: "",
        preferredLanguage: "English",
        preferredContact: "phone",
      });
      setIntake({
        incidentType: "MVA",
        incidentDate: "",
        initialTreatment: "",
        injuries: [],
      });
      setFourPs({ physical: 3, psychological: 3, psychosocial: 3, professional: 3 });
      setSdoh({
        housing: 3,
        food: 3,
        transportation: 3,
        utilities: 3,
        safety: 3,
        financial: 3,
        employment: 3,
        education: 3,
        socialSupport: 3,
        communityContext: 3,
      });
      setConsent({ signed: false, restrictedAccess: false });
      setStep(0);
    }
  }, []);

  // DO NOT generate intake ID here - it should already be created in ClientConsent before reaching IntakeWizard
  // This useEffect is intentionally disabled to prevent ID generation after consents
  // The INT- ID is set from sessionStorage in the loadIntakeSession useEffect above

  // Inactivity detection
  const { isInactive, dismissInactivity } = useInactivityDetection({
    enabled: !showWelcome,
    timeoutMs: 15 * 60 * 1000, // 15 minutes
  });

  // Save & Exit: persist to DB, sessionStorage, toast, navigate to Index
  const handleSaveAndExit = async () => {
    const sessionId = sessionStorage.getItem("rcms_intake_session_id");
    if (!sessionId) {
      toast({ title: "Error", description: "No intake session. Please start from the beginning.", variant: "destructive" });
      return;
    }
    try {
      await updateIntakeSession(sessionId, {
        formData: { ...formData, step },
        currentStep: step,
      });
      sessionStorage.setItem("rcms_intake_form_data", JSON.stringify({ ...formData, step }));
      sessionStorage.setItem("rcms_intake_step", String(step));
      toast({ title: "Saved", description: SAVE_AND_EXIT_RESUME });
      navigate("/");
    } catch (e: any) {
      toast({ title: "Failed to save", description: e?.message || "Please try again.", variant: "destructive" });
    }
  };

  // Normalize legacy 0-100 fourPs values to 1-5 scale
  const normalizeFourPs = (fp: FourPs): FourPs => {
    const to15 = (v: number) => {
      if (v >= 1 && v <= 5) return Math.max(1, Math.min(5, Math.round(v)));
      // Legacy 0-4 -> map to 1-5 (0->1, 1->2, 2->3, 3->4, 4->5)
      if (v <= 4) return Math.max(1, Math.min(5, Math.round(v) + 1));
      // Legacy 0-100 -> map to 1-5
      return Math.max(1, Math.min(5, Math.round((v / 25) + 1)));
    };
    return {
      physical: to15(fp.physical as number),
      psychological: to15(fp.psychological as number),
      psychosocial: to15(fp.psychosocial as number),
      professional: to15(fp.professional as number),
    };
  };

  // Load draft on mount and set intake started time
  useEffect(() => {
    async function loadSavedDraft() {
      // Don't load draft if we're about to clear
      const urlAttorneyId = new URLSearchParams(window.location.search).get('attorney_id');
      const storedAttorneyId = sessionStorage.getItem('rcms_current_attorney_id');
      const intakeSubmitted = sessionStorage.getItem('rcms_intake_submitted');
      
      // Only skip loading if:
      // 1. Previous intake was submitted, OR
      // 2. There IS a stored attorney AND it's different from URL
      // Don't skip on first visit (when storedAttorneyId is null)
      if (intakeSubmitted === 'true' || (storedAttorneyId && urlAttorneyId && urlAttorneyId !== storedAttorneyId)) {
        // Skip loading - form will be cleared
        if (!intakeStartedAt) {
          setIntakeStartedAt(new Date());
        }
        return;
      }
      
      const draft = await loadDraft();
      
      // Set intake started time from draft or now
      if (!intakeStartedAt) {
        if (draft?.createdAt) {
          setIntakeStartedAt(new Date(draft.createdAt));
        } else {
          setIntakeStartedAt(new Date());
        }
      }
      
      if (draft && draft.formData) {
      const data = draft.formData as any;
        if (data.client) setClient(data.client);
        if (data.consent) setConsent(data.consent);
        if (data.intake) setIntake(data.intake);
        if (data.fourPs) setFourPs(normalizeFourPs(data.fourPs));
        if (data.sdoh) setSdoh(data.sdoh);
        if (data.medsBlock) setMedsBlock(data.medsBlock);
        if (data.medications) setMedications(data.medications);
        if (data.preInjuryMeds) setPreInjuryMeds(data.preInjuryMeds);
        if (data.postInjuryMeds) setPostInjuryMeds(data.postInjuryMeds);
        if (data.preInjuryTreatments) setPreInjuryTreatments(data.preInjuryTreatments);
        if (data.postInjuryTreatments) setPostInjuryTreatments(data.postInjuryTreatments);
        if (data.medAllergies) setMedAllergies(data.medAllergies);
        if (data.mentalHealth) setMentalHealth(data.mentalHealth);
        if (data.hasMeds) setHasMeds(data.hasMeds);
        if (data.incidentNarrative) setIncidentNarrative(data.incidentNarrative);
        if (data.incidentNarrativeExtra) setIncidentNarrativeExtra(data.incidentNarrativeExtra);
        if (data.physicalPreDiagnoses) setPhysicalPreDiagnoses(data.physicalPreDiagnoses);
        if (data.physicalPreNotes) setPhysicalPreNotes(data.physicalPreNotes);
        if (data.physicalPreOtherText != null) setPhysicalPreOtherText(data.physicalPreOtherText);
        if (data.physicalPostDiagnoses) setPhysicalPostDiagnoses(data.physicalPostDiagnoses);
        if (data.physicalPostNotes) setPhysicalPostNotes(data.physicalPostNotes);
        if (data.physicalPostOtherText != null) setPhysicalPostOtherText(data.physicalPostOtherText);
        if (data.bhPreDiagnoses) setBhPreDiagnoses(data.bhPreDiagnoses);
        if (data.bhPreOtherText != null) setBhPreOtherText(data.bhPreOtherText);
        if (data.bhPostDiagnoses) setBhPostDiagnoses(data.bhPostDiagnoses);
        if (data.bhPostOtherText != null) setBhPostOtherText(data.bhPostOtherText);
        if (data.bhNotes) setBhNotes(data.bhNotes);
        if (data.bhPreMeds) setBhPreMeds(data.bhPreMeds);
        if (data.bhPostMeds) setBhPostMeds(data.bhPostMeds);
        if (data.clinicalContext) setClinicalContext({ age_ranges: data.clinicalContext.age_ranges || [] });
        if (data.overlayContextFlags) setOverlayContextFlags(data.overlayContextFlags);
        if (data.overlay_answers && typeof data.overlay_answers === "object" && !Array.isArray(data.overlay_answers)) setOverlayAnswers(data.overlay_answers);
        if (typeof data.sensitiveTag === 'boolean') setSensitiveTag(data.sensitiveTag);
        if (typeof data.step === 'number') setStep(data.step);

        toast({
          title: "Draft Loaded",
          description: `Resuming from ${new Date(draft.updatedAt).toLocaleString()}`,
        });
      }
    }
    loadSavedDraft();
  }, []);

  // Update client window expiration check every second
  useEffect(() => {
    if (!intakeStartedAt) return;

    const checkExpiration = () => {
      const deadline = new Date(intakeStartedAt.getTime() + CLIENT_INTAKE_WINDOW_HOURS * 60 * 60 * 1000);
      const now = new Date();
      setClientWindowExpired(now >= deadline);
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 1000);

    return () => clearInterval(interval);
  }, [intakeStartedAt]);

  // Update client countdown every second
  useEffect(() => {
    if (!intakeStartedAt) return;
    
    const updateCountdown = () => {
      const deadline = new Date(intakeStartedAt.getTime() + CLIENT_INTAKE_WINDOW_HOURS * 60 * 60 * 1000);
      const remaining = deadline.getTime() - Date.now();
      setClientMsRemaining(remaining);
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [intakeStartedAt]);

  // Monitor mental health responses for risk flagging
  useEffect(() => {
    if (mentalHealth.selfHarm === 'yes' || mentalHealth.selfHarm === 'unsure') {
      // Create urgent task for RN follow-up
      const flagRisk = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Save to sensitive disclosures if we have a case ID
          if (createdCaseId) {
            await saveMentalHealthScreening({
              caseId: createdCaseId,
              itemCode: 'self_harm',
              response: mentalHealth.selfHarm as 'yes' | 'no' | 'unsure',
            });
          }

          // Create alert in database
          const { error } = await supabaseInsert('case_alerts', {
            case_id: createdCaseId || null, // Will be associated when case is created
            alert_type: 'mental_health_crisis',
            severity: 'high',
            message: 'Client indicated potential self-harm during intake. Immediate RN follow-up required.',
            created_by: user.id,
            disclosure_scope: 'internal',
            metadata: {
              response: mentalHealth.selfHarm,
              consent_attorney: consent.scope.shareWithAttorney,
            },
          });

          if (error) throw error;

          toast({
            title: "Response Flagged",
            description: "Your response has been flagged for immediate RN Care Manager attention. If you're in danger, call 911 or 988 now.",
            variant: "destructive",
          });
        } catch (error) {
          console.error('Failed to flag risk:', error);
        }
      };
      flagRisk();
    }
  }, [mentalHealth.selfHarm, createdCaseId]);

  // Block render until attorney guard is resolved (hard gate, no partial render)
  if (attorneyGuardOk === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-black">Verifying your session...</div>
      </div>
    );
  }

  // Post-submit success: show confirmation and hide countdown (Banner returns null when rcms_intake_status is set)
  if (submitStage === "success") {
    return (
      <div className="min-h-screen bg-gray-50">
        <IntakeCountdownBanner onExpired={setCountdownExpired} />
        <div className="max-w-4xl mx-auto py-8 px-4">
          <Card className="p-6 border-border">
            <h3 className="text-lg font-semibold text-black mb-4">Intake Submitted</h3>
            <p className="text-black mb-2">Your intake has been submitted and is pending attorney review.</p>
            <p className="text-sm text-black mb-4">You can check your status anytime using Resume / Check Status.</p>
            {client.rcmsId && (
              <p className="text-sm text-black mb-4">Intake ID: <span className="font-mono">{client.rcmsId}</span></p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate("/resume-intake")}>Go to Resume / Check Status</Button>
              <Button variant="outline" onClick={() => navigate("/")}>Return to Home</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <IntakeCountdownBanner onExpired={setCountdownExpired} />
      {!showWelcome && (
        <IntakeSaveBar 
          formData={formData} 
          onSaveExit={handleSaveAndExit}
          intNumber={client.rcmsId}
          clientEmail={(() => {
            // Get client email from sessionStorage or intake session
            const intakeSessionId = sessionStorage.getItem("rcms_intake_session_id");
            if (intakeSessionId) {
              // Try to get from sessionStorage first (set during IntakeIdentity)
              const storedEmail = sessionStorage.getItem("rcms_client_email");
              if (storedEmail) return storedEmail;
              
              // Fallback: query from intake session
              // This will be async, so we'll handle it in the component
            }
            return undefined;
          })()}
        />
      )}
      <div className="max-w-4xl mx-auto py-8 px-4">
        {showWelcome ? (
          <IntakeWelcome
            client={client}
            consent={consent}
            sensitiveTag={sensitiveTag}
            onClientChange={setClient}
            onConsentChange={setConsent}
            onSensitiveChange={setSensitiveTag}
            onContinue={() => setShowWelcome(false)}
          />
        ) : (
          <>
            <CaraGate onAskCara={() => setShowCaraModal(true)} />
            
            <div className="mb-8">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-black">Client Intake Wizard</h1>
                  <p className="text-black mt-1">Complete the intake process step by step</p>
                </div>
                {intakeStartedAt && (
                  <div className="text-right">
                    <div className="text-sm text-black mb-1">Time Remaining</div>
                    <div className={`text-lg font-mono font-bold ${clientWindowExpired ? 'text-destructive' : 'text-primary'}`}>
                      {(() => {
                        if (clientMsRemaining <= 0) {
                          return "EXPIRED";
                        }
                        const days = Math.floor(clientMsRemaining / (1000 * 60 * 60 * 24));
                        const hours = Math.floor((clientMsRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const minutes = Math.floor((clientMsRemaining % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((clientMsRemaining % (1000 * 60)) / 1000);
                        return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                      })()}
                    </div>
                  </div>
                )}
              </div>
              {clientWindowExpired && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{INTAKE_WINDOW_EXPIRED}</AlertDescription>
                </Alert>
              )}
              {searchParams.get("resume") === "true" && !clientWindowExpired && (
                <Alert className="mt-4 bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    {RESUME_IN_PROGRESS}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Stepper
              step={step}
              setStep={setStep}
              labels={["Incident", "Medical", "Mental Health", "4Ps + SDOH", "Review"]}
            />
            
            {/* Progress Bar */}
            <div className="mt-4">
              <IntakeProgressBar percent={progressPercent} />
            </div>

        {/* Step 0: Incident Details (previously Step 1) */}
        {step === 0 && (
          <Card className="p-6 border-border">
            <h3 className="text-lg font-semibold text-black mb-4">Incident Details</h3>
            
            {/* Attorney Display (read-only, selected in ClientConsent or loaded from session) */}
            {(selectedAttorneyId || attorneyCode) && (
              <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
                <h4 className="text-sm font-semibold mb-2">Attorney</h4>
                <p className="text-sm text-black">
                  {selectedAttorneyId && Array.isArray(availableAttorneys) && availableAttorneys.length > 0
                    ? (() => {
                        const found = availableAttorneys.find(a => a.attorney_id === selectedAttorneyId);
                        const displayName = found?.attorney_name
                          || attorneyName
                          || (attorneyCode ? `Attorney Code: ${attorneyCode}` : 'Not selected');
                        return found
                          ? `${found.attorney_name}${found.attorney_code ? ' (' + found.attorney_code + ')' : ''}`
                          : displayName;
                      })()
                    : attorneyCode
                    ? `Attorney Code: ${attorneyCode}`
                    : attorneyName || 'Not selected'}
                </p>
              </div>
            )}

            {/* Show Intake ID right after attorney */}
            {client.rcmsId && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                <h4 className="text-lg font-semibold text-blue-900 mb-2">📝 Your Intake ID</h4>
                <p className="text-3xl font-mono font-bold text-blue-900 mb-3">{client.rcmsId}</p>
                <div className="bg-amber-50 border border-amber-300 rounded p-3">
                  <p className="text-sm text-amber-900 font-medium">
                    ⚠️ IMPORTANT: Write this number down or save it in a safe place. You will need it to check the status of your case.
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              <LabeledSelect
                label="Incident Type"
                value={intake.incidentType}
                onChange={(v) => setIntake((x) => ({ ...x, incidentType: v as IncidentType }))}
                options={["MVA", "WorkComp", "Other"]}
              />
              <LabeledInput
                label="Incident Date"
                type="date"
                value={intake.incidentDate}
                onChange={(v) => setIntake((x) => ({ ...x, incidentDate: v }))}
              />
              <LabeledSelect
                label="Initial Treatment"
                value={intake.initialTreatment}
                onChange={(v) =>
                  setIntake((x) => ({ ...x, initialTreatment: v as InitialTreatment }))
                }
                options={["ED", "UrgentCare", "PCP", "Chiro", "None"]}
              />
            </div>

            {/* Incident Narrative */}
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Tell Us What Happened</h4>
                  <p className="text-sm text-black">
                    Describe the incident in your own words. Include important details like what happened, where, and any immediate effects you experienced.
                  </p>
                </div>
              </div>

              <LabeledTextarea
                label="What Happened?"
                value={incidentNarrative}
                onChange={setIncidentNarrative}
                placeholder="Please describe what happened during the incident in your own words. Include details about the circumstances, what you were doing, any injuries sustained, and how you felt immediately after..."
                maxLength={10000}
                rows={8}
              />

              {incidentNarrative.length > 9000 && (
                <LabeledTextarea
                  label="Additional Details (Optional)"
                  value={incidentNarrativeExtra}
                  onChange={setIncidentNarrativeExtra}
                  placeholder="If you need to provide more details, use this space to continue your description..."
                  maxLength={5000}
                  rows={6}
                />
              )}
            </div>

            {!requiredIncidentOk && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Incident type & date are required.</AlertDescription>
              </Alert>
            )}
            <div className="mt-6">
              <Button 
                onClick={() => setStep(1)}
                disabled={!requiredIncidentOk}
                className="w-full sm:w-auto"
              >
                Continue to Medical History
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 1: Medical History (previously Step 2) */}
        {step === 1 && (
          <div className="space-y-8">
            {/* Allergies Section */}
            <IntakeMedicationAllergies
              allergies={medAllergies}
              onChange={setMedAllergies}
            />

            {/* Pre-Injury Section */}
            <div className="border-4 border-primary/30 rounded-lg p-6 space-y-6 bg-card/50">
              <h3 className="text-xl font-bold text-black border-b-2 border-primary pb-2">
                PRE-INJURY / CHRONIC CONDITIONS
              </h3>
              
              <IntakePhysicalPreDiagnosisSelector
                selectedDiagnoses={physicalPreDiagnoses}
                additionalNotes={physicalPreNotes}
                otherText={physicalPreOtherText}
                onDiagnosesChange={setPhysicalPreDiagnoses}
                onNotesChange={setPhysicalPreNotes}
                onOtherChange={setPhysicalPreOtherText}
              />

              <IntakePreInjuryMedications
                medications={preInjuryMeds}
                onChange={setPreInjuryMeds}
              />

              <IntakePreInjuryTreatments
                treatments={preInjuryTreatments}
                onChange={setPreInjuryTreatments}
              />
            </div>

            {/* Post-Injury Section */}
            <div className="border-4 border-destructive/30 rounded-lg p-6 space-y-6 bg-card/50">
              <h3 className="text-xl font-bold text-black border-b-2 border-destructive pb-2">
                POST-INJURY / ACCIDENT-RELATED
              </h3>
              
              <IntakePhysicalPostDiagnosisSelector
                selectedDiagnoses={physicalPostDiagnoses}
                additionalNotes={physicalPostNotes}
                otherText={physicalPostOtherText}
                onDiagnosesChange={setPhysicalPostDiagnoses}
                onNotesChange={setPhysicalPostNotes}
                onOtherChange={setPhysicalPostOtherText}
              />

              <IntakePostInjuryMedications
                medications={postInjuryMeds}
                onChange={setPostInjuryMeds}
              />

              <IntakePostInjuryTreatments
                treatments={postInjuryTreatments}
                onChange={setPostInjuryTreatments}
              />
            </div>

            <FileUploadZone
              onFilesUploaded={(files) => setUploadedFiles(prev => [...prev, ...files])}
              draftId={draftId || undefined}
            />
            
            <div className="mt-6">
              <Button 
                onClick={() => setStep(2)}
                className="w-full sm:w-auto"
                disabled={
                  (physicalPreDiagnoses.includes("Other") && !(physicalPreOtherText || "").trim()) ||
                  (physicalPostDiagnoses.includes("Other") && !(physicalPostOtherText || "").trim())
                }
              >
                Continue to Behavioral Health
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Mental Health & Well-Being (previously Step 3) */}
        {step === 2 && (
          <div className="space-y-8">
            {/* Mental Health Screening Section */}
            <Card className="p-6 border-border">
              <h3 className="text-lg font-semibold text-black mb-4">
                Mental Health & Well-Being Check-In
              </h3>
              
              {(mentalHealth.selfHarm === 'yes' || mentalHealth.selfHarm === 'unsure') && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>We've flagged your response for immediate RN Care Manager attention.</strong>
                    <br />
                    If you're in danger, please call <strong>911</strong> or <strong>988</strong> (Suicide & Crisis Lifeline) now.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-6">
                <div>
                  <Label className="mb-3 block">
                    In the past 2 weeks, have you felt down, depressed, or hopeless?
                  </Label>
                  <RadioGroup value={mentalHealth.depression} onValueChange={(v) => setMentalHealth(prev => ({ ...prev, depression: v }))}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="dep-yes" />
                      <Label htmlFor="dep-yes" className="cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="dep-no" />
                      <Label htmlFor="dep-no" className="cursor-pointer">No</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="unsure" id="dep-unsure" />
                      <Label htmlFor="dep-unsure" className="cursor-pointer">Not sure</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="mb-3 block">
                    Have you had thoughts about harming yourself?
                  </Label>
                  <RadioGroup value={mentalHealth.selfHarm} onValueChange={(v) => setMentalHealth(prev => ({ ...prev, selfHarm: v }))}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="harm-yes" />
                      <Label htmlFor="harm-yes" className="cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="harm-no" />
                      <Label htmlFor="harm-no" className="cursor-pointer">No</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="unsure" id="harm-unsure" />
                      <Label htmlFor="harm-unsure" className="cursor-pointer">Not sure</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="mb-3 block">
                    In the past 2 weeks, have you felt nervous, anxious, or on edge?
                  </Label>
                  <RadioGroup value={mentalHealth.anxiety} onValueChange={(v) => setMentalHealth(prev => ({ ...prev, anxiety: v }))}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="anx-yes" />
                      <Label htmlFor="anx-yes" className="cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="anx-no" />
                      <Label htmlFor="anx-no" className="cursor-pointer">No</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="unsure" id="anx-unsure" />
                      <Label htmlFor="anx-unsure" className="cursor-pointer">Not sure</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-accent rounded-lg">
                  <Checkbox
                    id="want-help"
                    checked={mentalHealth.wantHelp}
                    onCheckedChange={(checked) => setMentalHealth(prev => ({ ...prev, wantHelp: checked as boolean }))}
                  />
                  <Label htmlFor="want-help" className="cursor-pointer">
                    Would you like RN Care Management to assist with mental health resources?
                  </Label>
                </div>
              </div>
            </Card>

            {/* Sensitive or Personal Experiences Section */}
            <IntakeSensitiveExperiences
              data={sensitiveExperiences}
              onChange={setSensitiveExperiences}
              caseId={createdCaseId || undefined}
              onProgressChange={setSensitiveProgress}
            />

            {/* Pre-Accident BH Section */}
            <div className="border-4 border-primary/30 rounded-lg p-6 space-y-6 bg-card/50">
              <h3 className="text-xl font-bold text-black border-b-2 border-primary pb-2">
                PRE-ACCIDENT BEHAVIORAL HEALTH
              </h3>
              
              <IntakeBehavioralHealthDiagnosisSelector
                selectedPreDiagnoses={bhPreDiagnoses}
                selectedPostDiagnoses={[]}
                additionalNotes=""
                onPreDiagnosesChange={setBhPreDiagnoses}
                onPostDiagnosesChange={() => {}}
                onNotesChange={() => {}}
                showOnlyPre={true}
                preOtherText={bhPreOtherText}
                onPreOtherChange={setBhPreOtherText}
              />

              <IntakeBehavioralHealthMedications
                preMedications={bhPreMeds}
                postMedications={[]}
                onPreChange={setBhPreMeds}
                onPostChange={() => {}}
                showOnlyPre={true}
              />
            </div>

            {/* Post-Accident BH Section */}
            <div className="border-4 border-destructive/30 rounded-lg p-6 space-y-6 bg-card/50">
              <h3 className="text-xl font-bold text-black border-b-2 border-destructive pb-2">
                POST-ACCIDENT BEHAVIORAL HEALTH
              </h3>
              
              <IntakeBehavioralHealthDiagnosisSelector
                selectedPreDiagnoses={[]}
                selectedPostDiagnoses={bhPostDiagnoses}
                additionalNotes={bhNotes}
                onPreDiagnosesChange={() => {}}
                onPostDiagnosesChange={setBhPostDiagnoses}
                onNotesChange={setBhNotes}
                showOnlyPost={true}
                postOtherText={bhPostOtherText}
                onPostOtherChange={setBhPostOtherText}
              />

              <IntakeBehavioralHealthMedications
                preMedications={[]}
                postMedications={bhPostMeds}
                onPreChange={() => {}}
                onPostChange={setBhPostMeds}
                showOnlyPost={true}
              />
            </div>

            <div className="mt-6">
              <Button 
                onClick={() => setStep(3)}
                className="w-full sm:w-auto"
                disabled={
                  (bhPreDiagnoses.includes("Other") && !(bhPreOtherText || "").trim()) ||
                  (bhPostDiagnoses.includes("Other") && !(bhPostOtherText || "").trim())
                }
              >
                Continue to 4Ps & SDOH
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: 4Ps & SDOH (previously Step 4) */}
        {step === 3 && (
          <Card className="p-6 border-border">
            <h3 className="text-lg font-semibold text-black mb-4 text-center">
              Optional 4Ps & SDOH
            </h3>
            
            {/* Scoring Directions */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3 mb-6">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Info className="h-4 w-4" />
                How to Score the 4Ps & SDOH
              </h4>
              <p className="text-sm text-black">
                Each category measures <strong>distress or impairment</strong>, not wellness. How to Use this scale to rate your impairment:
              </p>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-2 items-start">
                  <span className="font-semibold">1</span>
                  <span className="text-black">Extremely difficult - Can't do normal daily things without help</span>

                  <span className="font-semibold">2</span>
                  <span className="text-black">Really hard most days - Struggle with regular tasks and activities</span>

                  <span className="font-semibold">3</span>
                  <span className="text-black">Pretty difficult at times - Have to push through to get things done</span>

                  <span className="font-semibold">4</span>
                  <span className="text-black">A little tricky sometimes - Mostly able to do what I need to</span>

                  <span className="font-semibold">5</span>
                  <span className="text-black">Doing just fine - No problems with my daily activities</span>
                </div>
              </div>
            </div>

            {/* Context (helps your RN Care Manager tailor your plan) — drives overlay defaults */}
            <Card className="p-6 border-border mb-6">
              <h4 className="font-semibold text-black mb-1">Context (helps your RN Care Manager tailor your plan)</h4>
              <p className="text-sm text-black mb-4">Optional. These answers help us consider factors that may impact your care and recovery.</p>
              <div className="grid gap-6 sm:grid-cols-1">
                <div>
                  <Label className="mb-2 block text-sm font-medium">Age range</Label>
                  <Select
                    value={(() => {
                      const arr = clinicalContext?.age_ranges;
                      const raw = (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === "string") ? arr[0] : "__skip__";
                      return ["__skip__", "0-2", "3-12", "13-17", "18-24", "25-59", "60+"].includes(raw) ? raw : "__skip__";
                    })()}
                    onValueChange={(v) => setClinicalContext((prev) => ({ ...(prev && typeof prev === "object" ? prev : {}), age_ranges: (v && v !== "__skip__") ? [v] : [] }))}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue placeholder="Select one (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__skip__">None / Skip</SelectItem>
                      <SelectItem value="0-2">0–2</SelectItem>
                      <SelectItem value="3-12">3–12</SelectItem>
                      <SelectItem value="13-17">13–17</SelectItem>
                      <SelectItem value="18-24">18–24</SelectItem>
                      <SelectItem value="25-59">25–59</SelectItem>
                      <SelectItem value="60+">60+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label className="text-sm font-medium">Are you currently a student?</Label>
                  </div>
                  <Switch
                    checked={overlayContextFlags?.is_student ?? false}
                    onCheckedChange={(c) => setOverlayContextFlags((p) => ({ ...(p || {}), is_student: c }))}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label className="text-sm font-medium">Do you have caregiving responsibilities for a child or dependent?</Label>
                    <p className="text-xs text-black mt-1">This helps us consider recovery impact on family responsibilities.</p>
                  </div>
                  <Switch
                    checked={overlayContextFlags?.has_dependents ?? false}
                    onCheckedChange={(c) => setOverlayContextFlags((p) => ({ ...(p || {}), has_dependents: c }))}
                  />
                </div>
              </div>
            </Card>

            <TooltipProvider>
              <div className="grid gap-6 sm:grid-cols-2 mb-6">
                {(["physical", "psychological", "psychosocial", "professional"] as const).map(
                  (k) => {
                    const labels = {
                      physical: "Physical (pain, fatigue, sleep, mobility)",
                      psychological: "Psychological (mood, focus, stress, coping)",
                      psychosocial: "Psychosocial (relationships, finances, transportation, support)",
                      professional: "Professional (job, school, or home-based role)"
                    };
                    
                    const tooltips = {
                      physical: "Physical relates to your body's comfort and energy level. This includes (but is not limited to) pain, fatigue, sleep quality, and mobility.",
                      psychological: "Psychological reflects your emotional and mental wellbeing. This includes (but is not limited to) mood, focus, stress level, and coping ability.",
                      psychosocial: "Psychosocial covers your social and environmental stability. This includes (but is not limited to) relationships, finances, transportation, and support systems.",
                      professional: "Professional relates to your main occupational role — including your job, school responsibilities, or home-based duties for stay-at-home parents or spouses. This includes (but is not limited to) satisfaction, stress, workload, and burnout risk in that environment."
                    };
                    
                    const scoreLabels: Record<number, string> = {
                      1: "Extremely difficult - Can't do normal daily things without help",
                      2: "Really hard most days - Struggle with regular tasks and activities",
                      3: "Pretty difficult at times - Have to push through to get things done",
                      4: "A little tricky sometimes - Mostly able to do what I need to",
                      5: "Doing just fine - No problems with my daily activities"
                    };
                    const raw4p = (fourPs && typeof fourPs === "object") ? (fourPs as Record<string, unknown>)[k] : undefined;
                    const num4p = (typeof raw4p === "number" && raw4p >= 1 && raw4p <= 5) ? Math.floor(raw4p) : 3;
                    
                     return (
                      <div key={k}>
                        <div className="flex items-center gap-2 mb-2">
                          <Label className="text-sm font-medium">
                            {labels[k]}: {num4p}
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-4 h-4 text-black cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-sm">{tooltips[k]}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Slider
                          value={[num4p]}
                          onValueChange={([value]) =>
                            setFourPs((p) => ({ ...(p || {}), [k]: Math.floor(value) }))
                          }
                          min={1}
                          max={5}
                          step={1}
                          className="w-full"
                        />
                        <p className="text-xs text-black mt-2 italic">
                          {scoreLabels[num4p]}
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            </TooltipProvider>

            {/* SDOH Domains with 1-5 Scale */}
            <div className="space-y-6">
              <h4 className="font-semibold text-black">Social Drivers of Health (SDOH)</h4>
              <p className="text-sm text-black italic p-3 bg-muted/30 rounded-md border border-border/50">
                Answers to these questions are strictly voluntary and are only used to help determine if we can help provide access and information to resources you may be eligible for and benefit from.
              </p>
              
              {[
                { key: 'housing', label: 'Housing Stability' },
                { key: 'food', label: 'Food Security' },
                { key: 'transport', label: 'Transportation' },
                { key: 'insuranceGap', label: 'Insurance Coverage' },
                { key: 'financial', label: 'Financial Resources' },
                { key: 'employment', label: 'Employment Status' },
                { key: 'social_support', label: 'Social Support Network' },
                { key: 'safety', label: 'Safety & Security' },
                { key: 'healthcare_access', label: 'Healthcare Access' },
              ].map(({ key, label }) => {
                const v = (sdoh && typeof sdoh === "object") ? (sdoh as Record<string, unknown>)[key] : undefined;
                const numSdoh = (typeof v === "number" && v >= 1 && v <= 5) ? Math.floor(v) : 3;
                return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{label}</Label>
                    <span className="text-sm font-semibold text-primary">
                      {numSdoh}/5
                    </span>
                  </div>
                  <Slider
                    value={[numSdoh]}
                    onValueChange={([value]) => handleSDOHChange(key, Math.floor(value))}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-black italic">
                    {scoreLabels[numSdoh]}
                  </p>
                </div>
              ); })}

              {/* Income Range with Poverty Flagging */}
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="income-range" className="text-sm font-medium">
                  Household Income Range (optional)
                </Label>
                <select
                  id="income-range"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={(() => {
                    const raw = (sdoh && typeof sdoh === "object") ? (sdoh as Record<string, unknown>).income_range : undefined;
                    const s = typeof raw === "string" ? raw : "";
                    const valid = ["", "Under $15,000", "$15,000 - $29,999", "$30,000 - $49,999", "$50,000 - $74,999", "$75,000 - $99,999", "$100,000+"];
                    return valid.includes(s) ? s : "";
                  })()}
                  onChange={(e) => handleIncomeChange(e.target.value)}
                >
                  <option value="">Prefer not to say</option>
                  <option value="Under $15,000">Under $15,000</option>
                  <option value="$15,000 - $29,999">$15,000 - $29,999</option>
                  <option value="$30,000 - $49,999">$30,000 - $49,999</option>
                  <option value="$50,000 - $74,999">$50,000 - $74,999</option>
                  <option value="$75,000 - $99,999">$75,000 - $99,999</option>
                  <option value="$100,000+">$100,000+</option>
                </select>
                <p className="text-xs text-black">
                  This helps us identify resources you may be eligible for
                </p>
              </div>
            </div>

            {/* Overlay Questions (Client Block 3) — capture only, no branching */}
            <Card className="p-6 border-border mt-6">
              <OverlayQuestionsSection
                questions={OVERLAY_QUESTIONS.filter((q) => q.placement === "intake_wizard")}
                answers={overlayAnswers ?? {}}
                onChange={(key, value) => setOverlayAnswers((p) => ({ ...(p || {}), [key]: value }))}
              />
            </Card>

            <div className="mt-6">
              <Button
                onClick={() => setStep(4)}
                className="w-full sm:w-auto"
              >
                Continue to Review
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <Card className="p-6 border-border">
            <h3 className="text-lg font-semibold text-black mb-4">Review & Submit</h3>
            {submitSuccess && (
              <div className="space-y-4">
                {/* Client name at top, then RCMS Case ID */}
                {(() => {
                  const displayName = [client.firstName, client.lastName].filter(Boolean).join(" ") || [sessionStorage.getItem("rcms_client_first_name"), sessionStorage.getItem("rcms_client_last_name")].filter(Boolean).join(" ") || "";
                  return displayName ? (
                    <p className="text-xl font-bold text-black mb-2">{displayName}</p>
                  ) : null;
                })()}
                <div className="p-4 rounded-lg bg-green-50 border-2 border-green-200">
                  <h4 className="font-semibold text-green-900">Intake submitted successfully.</h4>
                  <p className="text-sm text-green-800 mt-2">
                    Your Intake ID (INT#): <span className="font-mono font-bold">{client.rcmsId || "—"}</span>
                  </p>
                  <p className="text-sm text-green-800 mt-1">Your intake is now pending attorney review. You can expect to be contacted within 24–48 hours.</p>
                </div>
                {/* What happens next — CARE-style: bg-green-100 border-green-300 text-black */}
                <div className="p-4 rounded-lg bg-green-100 border-2 border-green-300 space-y-4 text-black">
                  <h4 className="font-semibold text-black">What happens next</h4>
                  <div className="text-sm text-black space-y-3">
                    <p>Your intake has been submitted successfully.</p>
                    <p>Here&apos;s what happens next:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Your attorney will review the information you provided.</li>
                      <li>A registered nurse care manager may contact you by phone or email to ask follow-up questions and begin developing your care plan.</li>
                      <li>Please respond as promptly as possible if contacted, as delays can create gaps in care coordination.</li>
                    </ul>
                    <p className="font-semibold pt-1">Checking your case status:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>You can check the status of your case at any time using the INT# you received.</li>
                      <li>From your portal, you may also view updates and send messages to your attorney.</li>
                    </ul>
                    <p className="font-semibold pt-1">Important:</p>
                    <p>This platform supports care coordination and case review. It does not provide medical advice. If you have urgent medical concerns, contact emergency services or your healthcare provider.</p>
                  </div>
                </div>
                <Button onClick={() => navigate("/client-portal")}>Go to Client Portal</Button>
              </div>
            )}
            {submitError && !submitSuccess && (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium">{submitError}</p>
                    {submitErrorDetail && <p className="text-sm mt-1 opacity-90">{submitErrorDetail}</p>}
                  </AlertDescription>
                </Alert>
                <Button
                  type="button"
                  onClick={() => {
                    setSubmitClicks((n) => n + 1);
                    setSubmitStage("clicked");
                    submit();
                  }}
                  disabled={submitting}
                >
                  {submitting ? "Submitting…" : "Try again"}
                </Button>
              </div>
            )}
            {!submitSuccess && !submitError && (
              <>
            {sensitiveTag && <RestrictedBanner />}

            {/* Unable to reach (overlay.unable_to_reach_reason) — neutral banner when client selected a reason */}
            {(() => {
              const val = (overlayAnswers ?? {})["overlay.unable_to_reach_reason"];
              const s = typeof val === "string" ? val : "";
              if (!s || s === "__none__") return null;
              const label = UNABLE_TO_REACH_LABELS[s] ?? s;
              return (
                <Alert className="mb-6 bg-muted/50 border-border">
                  <Info className="h-4 w-4 text-black" />
                  <AlertDescription>{formatUnableToReachBanner(label)}</AlertDescription>
                </Alert>
              );
            })()}

            {/* Crisis Resources Banner */}
            <Alert className="mb-6 bg-destructive/10 border-destructive/30">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <AlertDescription className="text-sm">
                <strong className="font-bold">In Case of Emergency:</strong> If you are experiencing a medical or mental health crisis, please call <strong>911</strong> or the National Suicide Prevention Lifeline at <strong className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />988</strong> immediately. Do not wait for your RN Care Manager to contact you.
              </AlertDescription>
            </Alert>

            {/* Completion Checklist */}
            <div className="mb-6">
              <IntakeCompletionChecklist
                hasPersonalInfo={!!(client.rcmsId && client.dobMasked)}
                hasIncidentDetails={!!(intake.incidentDate && intake.incidentType && intake.injuries.length > 0)}
                hasAssessment={fourPs.physical !== 3 || fourPs.psychological !== 3 || fourPs.psychosocial !== 3 || fourPs.professional !== 3}
                hasMedications={preInjuryMeds.length > 0 || postInjuryMeds.length > 0}
                hasConsent={consent.signed}
              />
            </div>

            {/* Assessment Snapshot Explainer */}
            <AssessmentSnapshotExplainer 
              onUpdateSnapshot={() => setStep(3)}
              onAskCara={() => setShowCaraModal(true)}
              showUpdateButton={false}
            />

            {/* Snapshot Summary */}
            <div className="mt-6 p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border-2 border-primary/20">
              <h4 className="text-xl font-bold mb-6 text-black">Assessment Snapshot</h4>

              {/* 4Ps Section */}
              <div className="mb-6">
                <h5 className="text-sm font-extrabold mb-3 text-black">4Ps of Wellness</h5>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Physical', value: fourPs.physical },
                    { label: 'Psychological', value: fourPs.psychological },
                    { label: 'Psychosocial', value: fourPs.psychosocial },
                    { label: 'Professional', value: fourPs.professional }
                  ].map(({ label, value }) => {
                    const bgColor = value === 5 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                   value === 4 ? 'bg-emerald-100 border-emerald-300 text-emerald-900' :
                                   value === 3 ? 'bg-amber-50 border-amber-300 text-amber-800' :
                                   value === 2 ? 'bg-red-50 border-red-300 text-red-800' :
                                   'bg-red-100 border-red-400 text-red-900';
                    return (
                      <div key={label} className={`rounded-full px-4 py-2 border-2 font-extrabold ${bgColor}`}>
                        <span className="opacity-80 font-bold">{label}:</span> {value}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SDOH Section */}
              <div className="mb-6">
                <h5 className="text-sm font-extrabold mb-3 text-black">Social Drivers of Health</h5>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Housing', value: sdoh.housing },
                    { label: 'Food', value: sdoh.food },
                    { label: 'Transport', value: sdoh.transport },
                    { label: 'Insurance', value: sdoh.insuranceGap },
                    { label: 'Financial', value: sdoh.financial },
                    { label: 'Employment', value: sdoh.employment },
                    { label: 'Support', value: sdoh.social_support },
                    { label: 'Safety', value: sdoh.safety },
                    { label: 'Access', value: sdoh.healthcare_access }
                  ].map(({ label, value }) => {
                    const v = value ?? 3;
                    const bgColor = v === 5 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                   v === 4 ? 'bg-emerald-100 border-emerald-300 text-emerald-900' :
                                   v === 3 ? 'bg-amber-50 border-amber-300 text-amber-800' :
                                   v === 2 ? 'bg-red-50 border-red-300 text-red-800' :
                                   'bg-red-100 border-red-400 text-red-900';
                    return (
                      <div key={label} className={`rounded-full px-4 py-2 border-2 font-extrabold ${bgColor}`}>
                        <span className="opacity-80 font-bold">{label}:</span> {v}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Clinical Context (if any) */}
              {((clinicalContext?.age_ranges?.length ?? 0) > 0 || overlayContextFlags?.is_student || overlayContextFlags?.has_dependents) && (
                <div className="mb-6">
                  <h5 className="text-sm font-extrabold mb-3 text-black">Context</h5>
                  <div className="flex flex-wrap gap-2">
                    {(clinicalContext?.age_ranges || []).map((a) => (
                      <span key={a} className="rounded-full px-3 py-1 border border-primary/30 bg-primary/5 text-sm">Age: {a}</span>
                    ))}
                    {overlayContextFlags?.is_student && <span className="rounded-full px-3 py-1 border border-primary/30 bg-primary/5 text-sm">Student</span>}
                    {overlayContextFlags?.has_dependents && <span className="rounded-full px-3 py-1 border border-primary/30 bg-primary/5 text-sm">Caregiving / dependents</span>}
                  </div>
                </div>
              )}

              {/* Case Health Meter */}
              <div className="mb-2">
                <h5 className="text-sm font-extrabold mb-3 text-black">Overall Health Indicator (1–5)</h5>
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative h-3 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min(100, (((() => {
                          const allValues = [
                            fourPs.physical, fourPs.psychological, fourPs.psychosocial, fourPs.professional,
                            typeof sdoh.housing === 'number' ? sdoh.housing : 3,
                            typeof sdoh.food === 'number' ? sdoh.food : 3,
                            typeof sdoh.transport === 'number' ? sdoh.transport : 3,
                            typeof sdoh.insuranceGap === 'number' ? sdoh.insuranceGap : 3,
                            typeof sdoh.financial === 'number' ? sdoh.financial : 3,
                            typeof sdoh.employment === 'number' ? sdoh.employment : 3,
                            typeof sdoh.social_support === 'number' ? sdoh.social_support : 3,
                            typeof sdoh.safety === 'number' ? sdoh.safety : 3,
                            typeof sdoh.healthcare_access === 'number' ? sdoh.healthcare_access : 3
                          ];
                          const sum = allValues.reduce((a, b) => a + b, 0);
                          return sum / allValues.length;
                        })() - 1) / 4) * 100)}%`,
                        background: 'linear-gradient(90deg, #c62828, #b09837, #18a05f)'
                      }}
                    />
                  </div>
                  <div className="text-2xl font-black min-w-[64px] text-right text-black">
                    {(() => {
                      const allValues = [
                        fourPs.physical, fourPs.psychological, fourPs.psychosocial, fourPs.professional,
                        typeof sdoh.housing === 'number' ? sdoh.housing : 3,
                        typeof sdoh.food === 'number' ? sdoh.food : 3,
                        typeof sdoh.transport === 'number' ? sdoh.transport : 3,
                        typeof sdoh.insuranceGap === 'number' ? sdoh.insuranceGap : 3,
                        typeof sdoh.financial === 'number' ? sdoh.financial : 3,
                        typeof sdoh.employment === 'number' ? sdoh.employment : 3,
                        typeof sdoh.social_support === 'number' ? sdoh.social_support : 3,
                        typeof sdoh.safety === 'number' ? sdoh.safety : 3,
                        typeof sdoh.healthcare_access === 'number' ? sdoh.healthcare_access : 3
                      ];
                      const sum = allValues.reduce((a, b) => a + b, 0);
                      return Math.floor(sum / allValues.length);
                    })()}
                  </div>
                </div>
                <p className="text-xs text-black mt-2">
                  5 Stable · 4 Mild · 3 Moderate · 1–2 Critical
                </p>
              </div>
            </div>

            {/* Case Summary - Final Review: client name at top above RCMS ID */}
            <div className="mt-8 p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-lg border-2 border-border">
              <h4 className="text-lg font-bold mb-4 text-black">Case Summary</h4>
              <div className="space-y-3 text-sm">
                <div className="flex py-2 border-b border-border">
                  <span className="font-medium w-40">Client:</span>
                  <span className="text-black font-semibold">
                    {sessionStorage.getItem("rcms_client_first_name") || ""} {sessionStorage.getItem("rcms_client_last_name") || ""}
                  </span>
                </div>
                <div className="flex py-2 border-b border-border">
                  <span className="font-medium w-40">RCMS ID:</span>
                  <span className="select-none text-black" title="PHI block">
                    {client.rcmsId || 'Generating...'}
                  </span>
                </div>
                <div className="flex py-2 border-b border-border">
                  <span className="font-medium w-40">Attorney:</span>
                  <span className="text-black">
                    {attorneyDisplayName !== null ? attorneyDisplayName : (attorneyName || "—")}
                  </span>
                </div>
                <div className="flex py-2 border-b border-border">
                  <span className="font-medium w-40">Incident:</span>
                  <span className="text-black">
                    {intake.incidentType} on {fmtDate(intake.incidentDate)}
                  </span>
                </div>
                <div className="flex py-2 border-b border-border">
                  <span className="font-medium w-40">Initial treatment:</span>
                  <span className="text-black">{intake.initialTreatment}</span>
                </div>
                <div className="flex py-2 border-b border-border">
                  <span className="font-medium w-40">Injuries:</span>
                  <span className="text-black">
                    {intake.injuries.join(", ") || "—"}
                  </span>
                </div>
                <div className="flex py-2 border-b border-border">
                  <span className="font-medium w-40">Assessment Score:</span>
                  <span className="text-black font-semibold">
                    {(() => {
                      const allValues = [
                        fourPs.physical, fourPs.psychological, fourPs.psychosocial, fourPs.professional,
                        typeof sdoh.housing === 'number' ? sdoh.housing : 3,
                        typeof sdoh.transport === 'number' ? sdoh.transport : 3,
                        typeof sdoh.food === 'number' ? sdoh.food : 3,
                        typeof sdoh.insuranceGap === 'number' ? sdoh.insuranceGap : 3,
                        typeof sdoh.financial === 'number' ? sdoh.financial : 3,
                        typeof sdoh.employment === 'number' ? sdoh.employment : 3,
                        typeof sdoh.social_support === 'number' ? sdoh.social_support : 3,
                        typeof sdoh.safety === 'number' ? sdoh.safety : 3,
                        typeof sdoh.healthcare_access === 'number' ? sdoh.healthcare_access : 3
                      ];
                      const sum = allValues.reduce((a, b) => a + b, 0);
                      const score = Math.floor(sum / allValues.length);
                      return `${score} — ${
                        score >= 5 ? 'Stable' :
                        score >= 4 ? 'Mild' :
                        score >= 3 ? 'Moderate' : 'Critical'
                      }`;
                    })()}
                  </span>
                </div>
                <div className="flex py-2 border-b border-border">
                  <span className="font-medium w-40">Consent:</span>
                  <span className="text-black">
                    {consent.signed ? "Signed" : "Not signed"}
                    {consent.signed && consent.signedAt && ` @ ${fmtDate(consent.signedAt)}`}
                  </span>
                </div>
              </div>

              {/* What happens next — CARE-style: green background in Case Summary */}
              <div className="mt-6 p-4 rounded-lg border-2 border-green-300 bg-green-100 space-y-3">
                <h4 className="font-semibold text-green-900">What happens next</h4>
                <div className="text-sm text-green-800 space-y-3">
                  <p>Your intake has been submitted successfully.</p>
                  <p>Here&apos;s what happens next:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Your attorney will review the information you provided.</li>
                    <li>A registered nurse care manager may contact you by phone or email to ask follow-up questions and begin developing your care plan.</li>
                    <li>Please respond as promptly as possible if contacted, as delays can create gaps in care coordination.</li>
                  </ul>
                  <p className="font-semibold pt-1 text-green-800">Checking your case status:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>You can check the status of your case at any time using the INT# you received.</li>
                    <li>From your portal, you may also view updates and send messages to your attorney.</li>
                  </ul>
                  <p className="font-semibold pt-1 text-green-800">Important:</p>
                  <p>This platform supports care coordination and case review. It does not provide medical advice. If you have urgent medical concerns, contact emergency services or your healthcare provider.</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-900">
                  <p className="font-semibold mb-2">📝 Save Your Intake ID</p>
                  <p className="mb-2">
                    Your Intake ID is: <span className="font-mono font-bold">{client.rcmsId || 'Generating...'}</span>
                  </p>
                  <p>
                    You can check your status anytime at{' '}
                    <a href="/check-status" className="underline font-medium">Check Intake Status</a>
                  </p>
                </AlertDescription>
              </Alert>
            </div>

            {/* Editable Information Note */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-sm text-black mb-1">Need to Update Information Later?</h5>
                  <p className="text-sm text-black leading-relaxed">
                    You can update your medications, treatments, allergies, and wellness check-ins anytime through your Client Portal. Your baseline assessment will remain unchanged, but you'll be able to track your progress over time.
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Reassurance */}
            <div className="mt-6 p-4 bg-secondary/10 border border-secondary/30 rounded-lg">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-secondary-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-sm text-black mb-1">Your Privacy is Protected</h5>
                  <p className="text-sm text-black leading-relaxed">
                    All information you provide is securely encrypted and HIPAA-compliant. Your personal health information is protected and will only be shared with your authorized care team members.
                  </p>
                </div>
              </div>
            </div>

            {((physicalPreDiagnoses.includes("Other") && !(physicalPreOtherText || "").trim()) ||
              (physicalPostDiagnoses.includes("Other") && !(physicalPostOtherText || "").trim()) ||
              (bhPreDiagnoses.includes("Other") && !(bhPreOtherText || "").trim()) ||
              (bhPostDiagnoses.includes("Other") && !(bhPostOtherText || "").trim())) && (
              <Alert variant="destructive" className="mt-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please complete the &apos;Other&apos; condition description before submitting. Go back to <strong>Medical History</strong> (Pre-injury or Post-injury) or <strong>Behavioral Health</strong> (Pre-accident or Post-accident) to describe your condition.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 mt-6">
              <Button
                type="button"
                onClick={() => {
                  setSubmitClicks((n) => n + 1);
                  setSubmitStage("clicked");
                  submit();
                }}
                aria-label="Submit intake"
                disabled={
                  submitting ||
                  (physicalPreDiagnoses.includes("Other") && !(physicalPreOtherText || "").trim()) ||
                  (physicalPostDiagnoses.includes("Other") && !(physicalPostOtherText || "").trim()) ||
                  (bhPreDiagnoses.includes("Other") && !(bhPreOtherText || "").trim()) ||
                  (bhPostDiagnoses.includes("Other") && !(bhPostOtherText || "").trim())
                }
              >
                {submitting ? "Submitting…" : "Submit Intake"}
              </Button>
              <Button 
                variant="outline" 
                onClick={generatePDFSummary}
                aria-label="Save PDF summary"
              >
                <Download className="w-4 h-4 mr-2" />
                Save PDF Summary
              </Button>
              <Button variant="secondary" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button variant="outline" onClick={() => setStep(0)}>
                Back to beginning
              </Button>
            </div>
          </>
            )}
          </Card>
        )}

            <WizardNav 
              step={step} 
              setStep={setStep} 
              last={4}
              canAdvance={
                (step === 0 ? requiredIncidentOk :
                step === 1 ? true :
                step === 2 ? (sensitiveProgress ? !sensitiveProgress.blockNavigation : true) :
                true) && !countdownExpired
              }
              blockReason={
                countdownExpired
                  ? INTAKE_WINDOW_EXPIRED
                  : step === 0 && !requiredIncidentOk
                  ? "Incident type and date are required."
                  : step === 2 && sensitiveProgress?.blockNavigation 
                  ? "Please complete consent choices in the Sensitive Experiences section"
                  : undefined
              }
            />

            <InactivityModal
              isOpen={isInactive}
              onContinue={dismissInactivity}
              onSaveExit={handleSaveAndExit}
            />
          </>
        )}
      </div>
      <CaraFloatingButton />
    </div>
  );
}
