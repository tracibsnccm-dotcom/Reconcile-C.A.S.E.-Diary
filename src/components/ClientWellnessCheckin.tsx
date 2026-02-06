import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Activity, CheckCircle, Loader2, ArrowLeft, ArrowRight, Plus, X, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import { createAutoNote } from "@/lib/autoNotes";

interface WellnessCheckinProps {
  caseId: string;
}

const SCALE_LABELS = {
  1: "Struggling",
  2: "Challenged",
  3: "Managing",
  4: "Improving",
  5: "Thriving"
};

const FOUR_PS = {
  physical: { label: "Physical", code: "P1", description: "How is your body feeling? Pain, mobility, energy, sleep." },
  psychological: { label: "Psychological", code: "P2", description: "How is your mental/emotional state? Mood, anxiety, stress, coping." },
  psychosocial: { label: "Psychosocial", code: "P3", description: "How is your support system? Family, friends, resources, barriers." },
  professional: { label: "Professional", code: "P4", description: "How is your ability to work/function? Daily activities, productivity, goals." }
};

interface AllergyEntry {
  id: string;
  medication: string;
  reaction: string;
  severity: string;
}

interface MedicationEntry {
  id: string;
  brandName: string;
  genericName: string;
  dose: string;
  frequency: string;
  prnDescription?: string;
  prnTimeFrequency?: string;
  route: string;
  purpose: string;
  prescriber: string;
  startDate: string;
  endDate: string;
  pharmacy: string;
  notes: string;
}

export function ClientWellnessCheckin({ caseId }: WellnessCheckinProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckin, setLastCheckin] = useState<Date | null>(null);
  const [hasAllergies, setHasAllergies] = useState<string>("");
  const [allergies, setAllergies] = useState<AllergyEntry[]>([]);
  const [allergiesAttested, setAllergiesAttested] = useState(false);
  const [preInjuryMeds, setPreInjuryMeds] = useState<MedicationEntry[]>([]);
  const [postInjuryMeds, setPostInjuryMeds] = useState<MedicationEntry[]>([]);
  const [medsAttested, setMedsAttested] = useState(false);
  const [physical, setPhysical] = useState(3);
  const [psychological, setPsychological] = useState(3);
  const [psychosocial, setPsychosocial] = useState(3);
  const [professional, setProfessional] = useState(3);
  const [painLevel, setPainLevel] = useState(5);
  const [notes, setNotes] = useState("");
  const [bloodPressureSystolic, setBloodPressureSystolic] = useState("");
  const [bloodPressureDiastolic, setBloodPressureDiastolic] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [oxygenSaturation, setOxygenSaturation] = useState("");
  const [temperature, setTemperature] = useState("");
  const [diabetesStatus, setDiabetesStatus] = useState<"yes" | "no" | "not_sure" | "">("");
  const [bloodSugar, setBloodSugar] = useState("");
  const [a1c, setA1c] = useState("");
  const [bloodSugarNotApplicable, setBloodSugarNotApplicable] = useState(false);
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [weight, setWeight] = useState("");

  useEffect(() => {
    loadLastCheckin();
  }, [caseId]);

  async function loadLastCheckin() {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_client_checkins?case_id=eq.${caseId}&order=created_at.desc&limit=1`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
      );
      if (response.ok) {
        const data = await response.json();
        if (data?.length > 0) setLastCheckin(new Date(data[0].created_at));
      }
    } catch (err) {
      console.error("Error loading last check-in:", err);
    }
  }

  const addAllergy = () => setAllergies([...allergies, { id: crypto.randomUUID(), medication: '', reaction: '', severity: 'mild' }]);
  const removeAllergy = (id: string) => setAllergies(allergies.filter(a => a.id !== id));
  const updateAllergy = (id: string, field: keyof AllergyEntry, value: string) =>
    setAllergies(allergies.map(a => a.id === id ? { ...a, [field]: value } : a));

  const addPreInjuryMed = () => setPreInjuryMeds([...preInjuryMeds, {
    id: crypto.randomUUID(), brandName: '', genericName: '', dose: '', frequency: '', prnDescription: '', prnTimeFrequency: '', route: '', purpose: '', prescriber: '', startDate: '', endDate: '', pharmacy: '', notes: ''
  }]);
  const removePreInjuryMed = (id: string) => setPreInjuryMeds(preInjuryMeds.filter(m => m.id !== id));
  const updatePreInjuryMed = (id: string, field: keyof MedicationEntry, value: string) =>
    setPreInjuryMeds(preInjuryMeds.map(m => m.id === id ? { ...m, [field]: value } : m));

  const addPostInjuryMed = () => setPostInjuryMeds([...postInjuryMeds, {
    id: crypto.randomUUID(), brandName: '', genericName: '', dose: '', frequency: '', prnDescription: '', prnTimeFrequency: '', route: '', purpose: '', prescriber: '', startDate: '', endDate: '', pharmacy: '', notes: ''
  }]);
  const removePostInjuryMed = (id: string) => setPostInjuryMeds(postInjuryMeds.filter(m => m.id !== id));
  const updatePostInjuryMed = (id: string, field: keyof MedicationEntry, value: string) =>
    setPostInjuryMeds(postInjuryMeds.map(m => m.id === id ? { ...m, [field]: value } : m));

  const canProceedStep1 = () => {
    if (hasAllergies === "") return false;
    if (hasAllergies === "yes" && allergies.length === 0) return false;
    return allergiesAttested;
  };
  const canProceedStep2 = () => medsAttested;
  const canProceedStep3 = () => true;

  const calculateBMI = () => {
    const weightNum = parseFloat(weight);
    const feetNum = parseFloat(heightFeet);
    const inchesNum = parseFloat(heightInches);
    if (!weightNum || !feetNum || !inchesNum) return null;
    const totalInches = feetNum * 12 + inchesNum;
    if (totalInches <= 0) return null;
    return (weightNum * 703) / (totalInches * totalInches);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Underweight", color: "bg-blue-100 text-blue-800" };
    if (bmi < 25.0) return { label: "Normal", color: "bg-green-100 text-green-800" };
    if (bmi < 30.0) return { label: "Overweight", color: "bg-amber-100 text-amber-800" };
    if (bmi < 35.0) return { label: "Obese (Class 1)", color: "bg-orange-100 text-orange-800" };
    if (bmi < 40.0) return { label: "Obese (Class 2)", color: "bg-red-100 text-red-800" };
    return { label: "Morbidly Obese (Class 3)", color: "bg-red-200 text-red-900" };
  };

  const getBloodPressureStatus = (systolic: string, diastolic: string) => {
    if (!systolic || !diastolic) return null;
    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);
    if (isNaN(sys) || isNaN(dia)) return null;
    if (sys >= 180 || dia >= 120) return { color: "bg-red-100 text-red-800 border-red-300", message: "HYPERTENSIVE CRISIS - Seek emergency care.", isCritical: true, isHypertensiveCrisis: true };
    if ((sys >= 170 && sys < 180) || (dia >= 100 && dia < 120)) return { color: "bg-red-100 text-red-800 border-red-300", message: "CRITICAL HIGH - Contact your MD/PCP.", isCritical: true, isHypertensiveCrisis: false };
    if ((sys >= 140 && sys <= 169) || (dia >= 90 && dia <= 99)) return { color: "bg-orange-100 text-orange-800 border-orange-300", message: "High (Stage 2)", isCritical: false, isHypertensiveCrisis: false };
    if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) return { color: "bg-amber-100 text-amber-800 border-amber-300", message: "High (Stage 1)", isCritical: false, isHypertensiveCrisis: false };
    if (sys >= 90 && sys <= 120 && dia >= 60 && dia <= 80) return { color: "bg-green-100 text-green-800 border-green-300", message: "Normal", isCritical: false, isHypertensiveCrisis: false };
    if (sys < 90 && dia < 60) return { color: "bg-blue-100 text-blue-800 border-blue-300", message: "Low (Hypotension)", isCritical: false, isHypertensiveCrisis: false };
    return null;
  };

  const getHeartRateStatus = (value: string) => {
    if (!value) return null;
    const num = parseInt(value);
    if (isNaN(num)) return null;
    if (num < 60) return { color: "bg-blue-100 text-blue-800 border-blue-300", message: "Low (Bradycardia)" };
    if (num <= 100) return { color: "bg-green-100 text-green-800 border-green-300", message: "Normal" };
    if (num <= 120) return { color: "bg-amber-100 text-amber-800 border-amber-300", message: "Elevated" };
    return { color: "bg-red-100 text-red-800 border-red-300", message: "High (Tachycardia)" };
  };

  const getTemperatureStatus = (value: string) => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    if (num < 97) return { color: "bg-blue-100 text-blue-800 border-blue-300", message: "Low" };
    if (num <= 99) return { color: "bg-green-100 text-green-800 border-green-300", message: "Normal" };
    if (num <= 100.4) return { color: "bg-amber-100 text-amber-800 border-amber-300", message: "Elevated" };
    return { color: "bg-red-100 text-red-800 border-red-300", message: "Fever" };
  };

  const getOxygenSaturationStatus = (value: string) => {
    if (!value) return null;
    const num = parseInt(value);
    if (isNaN(num)) return null;
    if (num >= 95 && num <= 100) return { color: "bg-green-100 text-green-800 border-green-300", message: "Normal" };
    if (num >= 90 && num <= 94) return { color: "bg-amber-100 text-amber-800 border-amber-300", message: "Low" };
    return { color: "bg-red-100 text-red-800 border-red-300", message: "Critical" };
  };

  const getBloodSugarStatus = (value: string) => {
    if (bloodSugarNotApplicable || !value) return null;
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    if (num < 70) return { category: "CRITICAL LOW", color: "bg-red-100 text-red-800 border-red-300", isCritical: true, message: "LOW BLOOD SUGAR - Take glucose, contact PCP/911 if needed." };
    if (num >= 400) return { category: "CRITICAL HIGH", color: "bg-red-100 text-red-800 border-red-300", isCritical: true, message: "CRITICAL HIGH - Contact PCP/911 if unwell." };
    if (num >= 70 && num <= 99) return { category: "Normal", color: "bg-green-100 text-green-800 border-green-300", isCritical: false, message: "Normal range." };
    if (num >= 100 && num <= 125) return { category: "Pre-diabetic", color: "bg-amber-100 text-amber-800 border-amber-300", isCritical: false, message: "Pre-diabetic range. Discuss with provider." };
    if (num >= 126 && num <= 399) return { category: "Diabetic", color: "bg-orange-100 text-orange-800 border-orange-300", isCritical: false, message: "Follow your diabetes plan." };
    return null;
  };

  const getA1CStatus = (value: string) => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    if (num < 5.7) return { category: "Normal", color: "bg-green-100 text-green-800 border-green-300", message: "Normal." };
    if (num >= 5.7 && num <= 6.4) return { category: "Pre-diabetic", color: "bg-amber-100 text-amber-800 border-amber-300", message: "Pre-diabetes." };
    if (num >= 6.5 && num <= 7.0) return { category: "Well Controlled", color: "bg-orange-100 text-orange-800 border-orange-300", message: "Good target for most diabetics." };
    if (num > 7.0) return { category: "Needs Improvement", color: "bg-red-100 text-red-800 border-red-300", message: "Follow up with provider." };
    return null;
  };

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const medicationReviewData = {
        preInjuryMeds: preInjuryMeds.filter(m => m.brandName.trim() || m.genericName.trim()),
        postInjuryMeds: postInjuryMeds.filter(m => m.brandName.trim() || m.genericName.trim()),
        medsAttested
      };
      const medicationAllergies = allergies.filter(a => a.medication.trim()).map(a => ({ medication: a.medication, reaction: a.reaction, severity: a.severity }));
      const reconData = {
        case_id: caseId,
        has_allergies: hasAllergies === "yes",
        medication_allergies: medicationAllergies.length > 0 ? JSON.stringify(medicationAllergies) : null,
        food_allergies: null,
        allergy_reactions: allergies.length > 0 ? JSON.stringify(allergies) : null,
        allergy_attested_at: allergiesAttested ? new Date().toISOString() : null,
        med_review_data: JSON.stringify(medicationReviewData),
        additional_comments: notes || null,
        med_attested_at: medsAttested ? new Date().toISOString() : null
      };
      const reconResponse = await fetch(`${supabaseUrl}/rest/v1/rc_med_reconciliations`, {
        method: 'POST',
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify(reconData)
      });
      if (!reconResponse.ok) throw new Error(await reconResponse.text() || 'Failed to save medication reconciliation');
      const reconResult = await reconResponse.json();
      const reconId = reconResult[0]?.id;
      if (medsAttested) {
        try {
          await createAutoNote({ caseId, noteType: 'medication', title: 'Medication Reconciliation', content: 'Client completed medication reconciliation', triggerEvent: 'med_reconciliation', visibleToClient: true, visibleToRN: true, visibleToAttorney: false });
        } catch (_) {}
      }
      if (preInjuryMeds.length > 0 || postInjuryMeds.length > 0) {
        const allMeds = [
          ...preInjuryMeds.filter(m => m.brandName.trim() || m.genericName.trim()).map(med => ({
            case_id: caseId, medication_name: med.brandName || med.genericName, dosage: med.dose || null, frequency: med.frequency || null, prescribing_doctor: med.prescriber || null,
            start_date: med.startDate || null, end_date: med.endDate || null, reason_for_taking: med.purpose || null, pharmacy: med.pharmacy || null, notes: med.notes || null, injury_related: false, is_active: true,
          })),
          ...postInjuryMeds.filter(m => m.brandName.trim() || m.genericName.trim()).map(med => ({
            case_id: caseId, medication_name: med.brandName || med.genericName, dosage: med.dose || null, frequency: med.frequency || null, prescribing_doctor: med.prescriber || null,
            start_date: med.startDate || null, end_date: med.endDate || null, reason_for_taking: med.purpose || null, pharmacy: med.pharmacy || null, notes: med.notes || null, injury_related: true, is_active: true,
          }))
        ];
        if (allMeds.length > 0) {
          await fetch(`${supabaseUrl}/rest/v1/rc_medications`, {
            method: 'POST',
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
            body: JSON.stringify(allMeds)
          });
        }
      }
      const bmi = calculateBMI();
      const totalInches = heightFeet && heightInches ? parseFloat(heightFeet) * 12 + parseFloat(heightInches) : null;
      const checkinData: Record<string, unknown> = {
        case_id: caseId,
        pain_scale: painLevel,
        p_physical: (physical - 1) * 25,
        p_psychological: (psychological - 1) * 25,
        p_psychosocial: (psychosocial - 1) * 25,
        p_professional: (professional - 1) * 25,
        note: notes || null,
        blood_pressure_systolic: bloodPressureSystolic ? parseInt(bloodPressureSystolic) : null,
        blood_pressure_diastolic: bloodPressureDiastolic ? parseInt(bloodPressureDiastolic) : null,
        heart_rate: heartRate ? parseInt(heartRate) : null,
        oxygen_saturation: oxygenSaturation ? parseInt(oxygenSaturation) : null,
        temperature: temperature ? parseFloat(temperature) : null,
        blood_sugar: bloodSugar ? parseFloat(bloodSugar) : null,
        a1c: a1c ? parseFloat(a1c) : null,
        height_feet: heightFeet ? parseInt(heightFeet) : null,
        height_inches: heightInches ? parseInt(heightInches) : null,
        height_total_inches: totalInches,
        weight_lbs: weight ? parseFloat(weight) : null,
        bmi: bmi ?? undefined,
      };
      const response = await fetch(`${supabaseUrl}/rest/v1/rc_client_checkins`, {
        method: 'POST',
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify(checkinData)
      });
      if (!response.ok) throw new Error(await response.text() || 'Failed to save check-in');
      setSubmitted(true);
      setLastCheckin(new Date());
      toast.success("Wellness check-in saved!");
      try {
        await createAutoNote({ caseId, noteType: 'wellness', title: 'Wellness Check-in Completed', content: 'Client completed wellness check-in', triggerEvent: 'wellness_checkin', visibleToClient: true, visibleToRN: true, visibleToAttorney: false });
      } catch (_) {}
      setTimeout(() => {
        setSubmitted(false);
        setCurrentStep(1);
        setHasAllergies("");
        setAllergies([]);
        setAllergiesAttested(false);
        setPreInjuryMeds([]);
        setPostInjuryMeds([]);
        setMedsAttested(false);
        setNotes("");
        setPhysical(3);
        setPsychological(3);
        setPsychosocial(3);
        setProfessional(3);
        setPainLevel(5);
        setBloodPressureSystolic("");
        setBloodPressureDiastolic("");
        setHeartRate("");
        setOxygenSaturation("");
        setTemperature("");
        setBloodSugar("");
        setA1c("");
        setHeightFeet("");
        setHeightInches("");
        setWeight("");
      }, 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save check-in";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function ScoreSlider({ label, code, description, value, onChange }: { label: string; code: string; description: string; value: number; onChange: (v: number) => void }) {
    return (
      <div className="space-y-3 p-4 border border-slate-300 rounded-lg bg-white shadow">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">{code}</span>
              <span className="text-gray-800 font-medium">{label}</span>
            </div>
            <p className="text-gray-600 text-sm mt-1">{description}</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-gray-800">{value}</span>
            <p className="text-xs text-gray-600">{SCALE_LABELS[value as keyof typeof SCALE_LABELS]}</p>
          </div>
        </div>
        <Slider value={[value]} onValueChange={(v) => onChange(v[0])} min={1} max={5} step={1} className="mt-2" />
        <div className="flex justify-between text-xs text-gray-500">
          <span>1 - Struggling</span>
          <span>5 - Thriving</span>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <Card className="bg-white shadow-lg">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Check-in Complete!</h3>
          <p className="text-gray-600">Thank you for sharing how you're feeling today.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {lastCheckin && (
        <Alert className="bg-orange-100 border-orange-300">
          <AlertDescription className="text-gray-800">
            Last check-in: {lastCheckin.toLocaleDateString()} at {lastCheckin.toLocaleTimeString()}
          </AlertDescription>
        </Alert>
      )}
      <Card className="bg-white shadow-lg border border-slate-200">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-500" />
            Wellness Check-in
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <div className={`flex-1 h-2 rounded-full ${currentStep >= 1 ? 'bg-orange-500' : 'bg-slate-200'}`} />
            <div className={`flex-1 h-2 rounded-full ${currentStep >= 2 ? 'bg-orange-500' : 'bg-slate-200'}`} />
            <div className={`flex-1 h-2 rounded-full ${currentStep >= 3 ? 'bg-orange-500' : 'bg-slate-200'}`} />
          </div>
          <p className="text-gray-600 text-sm mt-2">
            Step {currentStep} of 3: {currentStep === 1 ? "Allergies" : currentStep === 2 ? "Medication Reconciliation" : "Wellness Check-in"}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Medication Allergies & Sensitivities</h4>
                    <p className="text-gray-600 text-sm">List any medications you are allergic to or have had negative reactions with.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-800 font-medium">Do you have any medication allergies or sensitivities?</Label>
                    <RadioGroup value={hasAllergies} onValueChange={setHasAllergies}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="allergies-no" />
                        <Label htmlFor="allergies-no" className="cursor-pointer font-normal">No</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="allergies-yes" />
                        <Label htmlFor="allergies-yes" className="cursor-pointer font-normal">Yes</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  {hasAllergies === "yes" && (
                    <div className="space-y-3">
                      {allergies.map((allergy) => (
                        <div key={allergy.id} className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 relative">
                          <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0 text-gray-500 hover:bg-slate-100" onClick={() => removeAllergy(allergy.id)}>
                            <X className="w-4 h-4" />
                          </Button>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div>
                              <Label className="text-sm">Medication/Substance*</Label>
                              <Input value={allergy.medication} onChange={(e) => updateAllergy(allergy.id, 'medication', e.target.value)} placeholder="e.g., Penicillin" className="bg-white" />
                            </div>
                            <div>
                              <Label className="text-sm">Reaction</Label>
                              <Input value={allergy.reaction} onChange={(e) => updateAllergy(allergy.id, 'reaction', e.target.value)} placeholder="e.g., Hives" className="bg-white" />
                            </div>
                            <div>
                              <Label className="text-sm">Severity</Label>
                              <select value={allergy.severity} onChange={(e) => updateAllergy(allergy.id, 'severity', e.target.value)} className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                                <option value="mild">Mild</option>
                                <option value="moderate">Moderate</option>
                                <option value="severe">Severe</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={addAllergy} className="border-slate-300 text-gray-700 hover:bg-slate-50">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Allergy
                      </Button>
                    </div>
                  )}
                  <div className="flex items-start space-x-2 pt-2">
                    <Checkbox id="allergies-attest" checked={allergiesAttested} onCheckedChange={(c) => setAllergiesAttested(c === true)} className="mt-1" />
                    <Label htmlFor="allergies-attest" className="text-sm cursor-pointer">I attest that the allergy information above is accurate and complete.</Label>
                  </div>
                </div>
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                <h4 className="font-semibold text-gray-800">Medication Reconciliation</h4>
                <p className="text-gray-600 text-sm">List all medications you are currently taking or have taken related to your injury.</p>
                <div>
                  <h5 className="text-gray-800 font-medium mb-2">Pre-Injury Medications</h5>
                  {preInjuryMeds.map((med) => (
                    <div key={med.id} className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 mb-2 relative">
                      <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0 text-gray-500" onClick={() => removePreInjuryMed(med.id)}><X className="w-4 h-4" /></Button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div><Label className="text-sm">Brand Name</Label><Input value={med.brandName} onChange={(e) => updatePreInjuryMed(med.id, 'brandName', e.target.value)} className="bg-white" /></div>
                        <div><Label className="text-sm">Generic Name</Label><Input value={med.genericName} onChange={(e) => updatePreInjuryMed(med.id, 'genericName', e.target.value)} className="bg-white" /></div>
                        <div><Label className="text-sm">Dose</Label><Input value={med.dose} onChange={(e) => updatePreInjuryMed(med.id, 'dose', e.target.value)} placeholder="e.g., 200mg" className="bg-white" /></div>
                        <div>
                          <Label className="text-sm">Frequency</Label>
                          <Select value={med.frequency} onValueChange={(v) => updatePreInjuryMed(med.id, 'frequency', v)}>
                            <SelectTrigger className="bg-white"><SelectValue placeholder="Select frequency" /></SelectTrigger>
                            <SelectContent>
                              {["Once daily", "Twice daily", "Three times daily", "Four times daily", "Every 4 hours", "Every 6 hours", "Every 8 hours", "Every 12 hours", "Once weekly", "As needed (PRN)", "Other"].map((f) => (
                                <SelectItem key={f} value={f}>{f}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addPreInjuryMed} className="border-slate-300 text-gray-700"><Plus className="w-4 h-4 mr-2" />Add Pre-Injury Medication</Button>
                </div>
                <div>
                  <h5 className="text-gray-800 font-medium mb-2">Post-Injury Medications</h5>
                  {postInjuryMeds.map((med) => (
                    <div key={med.id} className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 mb-2 relative">
                      <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0 text-gray-500" onClick={() => removePostInjuryMed(med.id)}><X className="w-4 h-4" /></Button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div><Label className="text-sm">Brand Name</Label><Input value={med.brandName} onChange={(e) => updatePostInjuryMed(med.id, 'brandName', e.target.value)} className="bg-white" /></div>
                        <div><Label className="text-sm">Generic Name</Label><Input value={med.genericName} onChange={(e) => updatePostInjuryMed(med.id, 'genericName', e.target.value)} className="bg-white" /></div>
                        <div><Label className="text-sm">Dose</Label><Input value={med.dose} onChange={(e) => updatePostInjuryMed(med.id, 'dose', e.target.value)} placeholder="e.g., 200mg" className="bg-white" /></div>
                        <div>
                          <Label className="text-sm">Frequency</Label>
                          <Select value={med.frequency} onValueChange={(v) => updatePostInjuryMed(med.id, 'frequency', v)}>
                            <SelectTrigger className="bg-white"><SelectValue placeholder="Select frequency" /></SelectTrigger>
                            <SelectContent>
                              {["Once daily", "Twice daily", "Three times daily", "As needed (PRN)", "Other"].map((f) => (
                                <SelectItem key={f} value={f}>{f}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addPostInjuryMed} className="border-slate-300 text-gray-700"><Plus className="w-4 h-4 mr-2" />Add Post-Injury Medication</Button>
                </div>
                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox id="meds-attest" checked={medsAttested} onCheckedChange={(c) => setMedsAttested(c === true)} className="mt-1" />
                  <Label htmlFor="meds-attest" className="text-sm cursor-pointer">I attest that the medication information above is accurate and complete.</Label>
                </div>
              </div>
            </div>
          )}
          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm mb-4">Rate how you're feeling in each area (1 = Struggling, 5 = Thriving)</p>
              {(["physical", "psychological", "psychosocial", "professional"] as const).map((key) => (
                <ScoreSlider key={key} label={FOUR_PS[key].label} code={FOUR_PS[key].code} description={FOUR_PS[key].description} value={key === "physical" ? physical : key === "psychological" ? psychological : key === "psychosocial" ? psychosocial : professional} onChange={key === "physical" ? setPhysical : key === "psychological" ? setPsychological : key === "psychosocial" ? setPsychosocial : setProfessional} />
              ))}
              <div className="space-y-3 p-4 border border-slate-300 rounded-lg bg-white shadow">
                <div className="flex justify-between items-start">
                  <div><span className="text-gray-800 font-medium">Pain Level</span><p className="text-gray-600 text-sm mt-1">How would you rate your pain today?</p></div>
                  <div className="text-right"><span className="text-2xl font-bold text-gray-800">{painLevel}</span></div>
                </div>
                <Slider value={[painLevel]} onValueChange={(v) => setPainLevel(v[0])} min={1} max={5} step={1} />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                <h4 className="font-semibold text-gray-800">Vital Signs (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Blood Pressure</Label>
                    <div className="flex items-center gap-2">
                      <Input type="number" value={bloodPressureSystolic} onChange={(e) => setBloodPressureSystolic(e.target.value)} placeholder="120" className="bg-white" />
                      <span>/</span>
                      <Input type="number" value={bloodPressureDiastolic} onChange={(e) => setBloodPressureDiastolic(e.target.value)} placeholder="80" className="bg-white" />
                      <span className="text-sm">mmHg</span>
                    </div>
                    {getBloodPressureStatus(bloodPressureSystolic, bloodPressureDiastolic) && (
                      <Alert className={`${getBloodPressureStatus(bloodPressureSystolic, bloodPressureDiastolic)!.color} border`}>
                        <AlertDescription>{getBloodPressureStatus(bloodPressureSystolic, bloodPressureDiastolic)!.message}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Heart Rate (bpm)</Label>
                    <Input type="number" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} placeholder="72" className="bg-white" />
                    {getHeartRateStatus(heartRate) && <Alert className={`${getHeartRateStatus(heartRate)!.color} border`}><AlertDescription>{getHeartRateStatus(heartRate)!.message}</AlertDescription></Alert>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Oxygen Saturation (%)</Label>
                    <Input type="number" value={oxygenSaturation} onChange={(e) => setOxygenSaturation(e.target.value)} placeholder="98" className="bg-white" />
                    {getOxygenSaturationStatus(oxygenSaturation) && <Alert className={`${getOxygenSaturationStatus(oxygenSaturation)!.color} border`}><AlertDescription>{getOxygenSaturationStatus(oxygenSaturation)!.message}</AlertDescription></Alert>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Temperature (°F)</Label>
                    <Input type="number" step="0.1" value={temperature} onChange={(e) => setTemperature(e.target.value)} placeholder="98.6" className="bg-white" />
                    {getTemperatureStatus(temperature) && <Alert className={`${getTemperatureStatus(temperature)!.color} border`}><AlertDescription>{getTemperatureStatus(temperature)!.message}</AlertDescription></Alert>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Blood Sugar (mg/dL)</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="blood-sugar-na" checked={bloodSugarNotApplicable} onCheckedChange={(c) => { setBloodSugarNotApplicable(c === true); if (c) setBloodSugar(""); }} />
                      <Label htmlFor="blood-sugar-na" className="text-sm cursor-pointer">Not applicable</Label>
                    </div>
                    {!bloodSugarNotApplicable && (
                      <>
                        <Input type="number" value={bloodSugar} onChange={(e) => setBloodSugar(e.target.value)} placeholder="100" className="bg-white" />
                        {getBloodSugarStatus(bloodSugar) && <Alert className={`${getBloodSugarStatus(bloodSugar)!.color} border`}><AlertDescription>{getBloodSugarStatus(bloodSugar)!.message}</AlertDescription></Alert>}
                        {(diabetesStatus === "yes" || diabetesStatus === "not_sure") && (
                          <div className="mt-2">
                            <Label className="text-sm">A1C (%)</Label>
                            <Input type="number" step="0.1" value={a1c} onChange={(e) => setA1c(e.target.value)} placeholder="e.g., 6.5" className="bg-white" />
                            {getA1CStatus(a1c) && <Alert className={`${getA1CStatus(a1c)!.color} border mt-2`}><AlertDescription>{getA1CStatus(a1c)!.message}</AlertDescription></Alert>}
                          </div>
                        )}
                        <RadioGroup value={diabetesStatus} onValueChange={(v) => setDiabetesStatus(v as "yes" | "no" | "not_sure" | "")} className="flex gap-4 mt-2">
                          <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="dm-yes" /><Label htmlFor="dm-yes" className="cursor-pointer text-sm">Yes</Label></div>
                          <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="dm-no" /><Label htmlFor="dm-no" className="cursor-pointer text-sm">No</Label></div>
                          <div className="flex items-center space-x-2"><RadioGroupItem value="not_sure" id="dm-ns" /><Label htmlFor="dm-ns" className="cursor-pointer text-sm">Not Sure</Label></div>
                        </RadioGroup>
                      </>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Height (ft / in)</Label>
                    <div className="flex items-center gap-2">
                      <Input type="number" value={heightFeet} onChange={(e) => setHeightFeet(e.target.value)} placeholder="5" className="bg-white" />
                      <span>ft</span>
                      <Input type="number" value={heightInches} onChange={(e) => setHeightInches(e.target.value)} placeholder="8" className="bg-white" />
                      <span>in</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Weight (lbs)</Label>
                    <Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="150" className="bg-white" />
                  </div>
                </div>
                {calculateBMI() && (
                  <div className="mt-4">
                    {(() => {
                      const bmi = calculateBMI()!;
                      const cat = getBMICategory(bmi);
                      return <div className={`inline-block px-4 py-2 rounded-lg ${cat.color}`}><span className="font-semibold">BMI: {bmi.toFixed(1)} - {cat.label}</span></div>;
                    })()}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-gray-800">Notes (optional)</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything else you'd like to share?" className="bg-white" rows={3} />
              </div>
            </div>
          )}
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={() => setCurrentStep(Math.max(1, currentStep - 1))} disabled={currentStep === 1}>Previous</Button>
            {currentStep < 3 ? (
              <Button onClick={() => { if (currentStep === 1 && canProceedStep1()) setCurrentStep(2); else if (currentStep === 2 && canProceedStep2()) setCurrentStep(3); }} disabled={(currentStep === 1 && !canProceedStep1()) || (currentStep === 2 && !canProceedStep2())} className="bg-orange-500 hover:bg-orange-600 text-white">Next</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-orange-500 hover:bg-orange-600 text-white">
                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><CheckCircle className="w-4 h-4 mr-2" />Submit Check-in</>}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
