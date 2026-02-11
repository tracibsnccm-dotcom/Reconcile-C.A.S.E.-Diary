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

// Scale labels for 4Ps (1=Struggling, 5=Thriving)
const SCALE_LABELS = {
  1: "Struggling",
  2: "Challenged",
  3: "Managing",
  4: "Improving",
  5: "Thriving"
};

// 4Ps descriptions per source of truth
const FOUR_PS = {
  physical: {
    label: "Physical",
    code: "P1",
    description: "How is your body feeling? Pain, mobility, energy, sleep."
  },
  psychological: {
    label: "Psychological", 
    code: "P2",
    description: "How is your mental/emotional state? Mood, anxiety, stress, coping."
  },
  psychosocial: {
    label: "Psychosocial",
    code: "P3", 
    description: "How is your support system? Family, friends, resources, barriers."
  },
  professional: {
    label: "Professional",
    code: "P4",
    description: "How is your ability to work/function? Daily activities, productivity, goals."
  }
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
  
  // Step 1: Allergies
  const [hasAllergies, setHasAllergies] = useState<string>("");
  const [allergies, setAllergies] = useState<AllergyEntry[]>([]);
  const [allergiesAttested, setAllergiesAttested] = useState(false);
  
  // Step 2: Medication Reconciliation
  const [preInjuryMeds, setPreInjuryMeds] = useState<MedicationEntry[]>([]);
  const [postInjuryMeds, setPostInjuryMeds] = useState<MedicationEntry[]>([]);
  const [medsAttested, setMedsAttested] = useState(false);
  
  // Step 3: Wellness Check-in
  const [physical, setPhysical] = useState(3);
  const [psychological, setPsychological] = useState(3);
  const [psychosocial, setPsychosocial] = useState(3);
  const [professional, setProfessional] = useState(3);
  const [painLevel, setPainLevel] = useState(5);
  const [notes, setNotes] = useState("");

  // Vital Signs
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
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setLastCheckin(new Date(data[0].created_at));
        }
      }
    } catch (err) {
      console.error("Error loading last check-in:", err);
    }
  }

  const addAllergy = () => {
    setAllergies([...allergies, { 
      id: crypto.randomUUID(), 
      medication: '', 
      reaction: '', 
      severity: 'mild' 
    }]);
  };

  const removeAllergy = (id: string) => {
    setAllergies(allergies.filter(a => a.id !== id));
  };

  const updateAllergy = (id: string, field: keyof AllergyEntry, value: string) => {
    setAllergies(allergies.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const addPreInjuryMed = () => {
    setPreInjuryMeds([...preInjuryMeds, { 
      id: crypto.randomUUID(), 
      brandName: '', 
      genericName: '', 
      dose: '', 
      frequency: '', 
      prnDescription: '',
      prnTimeFrequency: '',
      route: '', 
      purpose: '', 
      prescriber: '', 
      startDate: '', 
      endDate: '', 
      pharmacy: '', 
      notes: '' 
    }]);
  };

  const removePreInjuryMed = (id: string) => {
    setPreInjuryMeds(preInjuryMeds.filter(m => m.id !== id));
  };

  const updatePreInjuryMed = (id: string, field: keyof MedicationEntry, value: string) => {
    setPreInjuryMeds(preInjuryMeds.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const addPostInjuryMed = () => {
    setPostInjuryMeds([...postInjuryMeds, { 
      id: crypto.randomUUID(), 
      brandName: '', 
      genericName: '', 
      dose: '', 
      frequency: '', 
      prnDescription: '',
      prnTimeFrequency: '',
      route: '', 
      purpose: '', 
      prescriber: '', 
      startDate: '', 
      endDate: '', 
      pharmacy: '', 
      notes: '' 
    }]);
  };

  const removePostInjuryMed = (id: string) => {
    setPostInjuryMeds(postInjuryMeds.filter(m => m.id !== id));
  };

  const updatePostInjuryMed = (id: string, field: keyof MedicationEntry, value: string) => {
    setPostInjuryMeds(postInjuryMeds.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const canProceedStep1 = () => {
    if (hasAllergies === "") return false;
    if (hasAllergies === "yes" && allergies.length === 0) return false;
    return allergiesAttested;
  };

  const canProceedStep2 = () => {
    return medsAttested;
  };

  const canProceedStep3 = () => {
    return true; // Wellness check-in is always optional
  };

  // Calculate BMI
  const calculateBMI = () => {
    const weightNum = parseFloat(weight);
    const feetNum = parseFloat(heightFeet);
    const inchesNum = parseFloat(heightInches);
    
    if (!weightNum || !feetNum || !inchesNum) {
      return null;
    }
    
    const totalInches = feetNum * 12 + inchesNum;
    if (totalInches <= 0) return null;
    
    const bmi = (weightNum * 703) / (totalInches * totalInches);
    return bmi;
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Underweight", color: "bg-blue-100 text-blue-800" };
    if (bmi < 25.0) return { label: "Normal", color: "bg-green-100 text-green-800" };
    if (bmi < 30.0) return { label: "Overweight", color: "bg-amber-100 text-amber-800" };
    if (bmi < 35.0) return { label: "Obese (Class 1)", color: "bg-orange-100 text-orange-800" };
    if (bmi < 40.0) return { label: "Obese (Class 2)", color: "bg-red-100 text-red-800" };
    return { label: "Morbidly Obese (Class 3)", color: "bg-red-200 text-red-900" };
  };

  // Blood Sugar Status
  const getBloodSugarStatus = (value: string, hasDiabetes: boolean) => {
    if (bloodSugarNotApplicable) return null;
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    
    // Critical Low
    if (num < 70) {
      return {
        category: "CRITICAL LOW",
        color: "bg-red-100 text-red-800 border-red-300",
        isCritical: true,
        message: "LOW BLOOD SUGAR - Immediately take a sugar or glucose source (juice, candy, glucose tablets). Contact your PCP or call 911 if you are alone or feel faint."
      };
    }
    
    // Critical High
    if (num >= 400) {
      return {
        category: "CRITICAL HIGH",
        color: "bg-red-100 text-red-800 border-red-300",
        isCritical: true,
        message: "CRITICAL HIGH - If insulin is required, please take now. Contact your PCP for further instructions. If you feel unwell, confused, or are concerned, call 911 or seek emergency help immediately."
      };
    }
    
    // Normal
    if (num >= 70 && num <= 99) {
      return {
        category: "Normal",
        color: "bg-green-100 text-green-800 border-green-300",
        isCritical: false,
        message: "Your fasting blood sugar is in the normal range."
      };
    }
    
    // Pre-diabetic
    if (num >= 100 && num <= 125) {
      return {
        category: "Pre-diabetic Range",
        color: "bg-amber-100 text-amber-800 border-amber-300",
        isCritical: false,
        message: "This is in the pre-diabetic range. Monitor regularly and discuss with your healthcare provider."
      };
    }
    
    // Diabetic range
    if (num >= 126 && num <= 399) {
      return {
        category: "Diabetic Range",
        color: "bg-orange-100 text-orange-800 border-orange-300",
        isCritical: false,
        message: "Follow your diabetes treatment plan. Contact your healthcare provider if readings are consistently in this range."
      };
    }
    
    return null;
  };

  // A1C Status
  const getA1CStatus = (value: string) => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    
    if (num < 5.7) {
      return {
        category: "Normal",
        color: "bg-green-100 text-green-800 border-green-300",
        message: "Your A1C is in the normal range."
      };
    }
    
    if (num >= 5.7 && num <= 6.4) {
      return {
        category: "Pre-diabetic",
        color: "bg-amber-100 text-amber-800 border-amber-300",
        message: "This indicates pre-diabetes. Discuss with your healthcare provider."
      };
    }
    
    if (num >= 6.5 && num <= 7.0) {
      return {
        category: "Diabetic - Well Controlled",
        color: "bg-orange-100 text-orange-800 border-orange-300",
        message: "Diabetic range. This is generally a good target for most diabetics."
      };
    }
    
    if (num > 7.0 && num <= 8.0) {
      return {
        category: "Diabetic - Moderate Control",
        color: "bg-orange-100 text-orange-800 border-orange-300",
        message: "Discuss with your healthcare provider about improving control."
      };
    }
    
    if (num > 8.0) {
      return {
        category: "Diabetic - Needs Improvement",
        color: "bg-red-100 text-red-800 border-red-300",
        message: "Your A1C is elevated. Please follow up with your healthcare provider."
      };
    }
    
    return null;
  };

  // Blood Pressure Status
  const getBloodPressureStatus = (systolic: string, diastolic: string) => {
    if (!systolic || !diastolic) return null;
    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);
    if (isNaN(sys) || isNaN(dia)) return null;
    
    // Hypertensive crisis (180+ OR 120+)
    if (sys >= 180 || dia >= 120) {
      return {
        color: "bg-red-100 text-red-800 border-red-300",
        message: "HYPERTENSIVE CRISIS - Seek emergency care immediately if you have any symptoms:\n- Chest pain\n- Shortness of breath\n- Back pain\n- Numbness or weakness\n- Change in vision\n- Difficulty speaking\n\nRemember FAST for stroke warning signs:\nF - Face drooping: Is one side of your face drooping or numb?\nA - Arm weakness: Is one arm weak or numb?\nS - Speech difficulty: Is your speech slurred or hard to understand?\nT - Time to call 911: If you have ANY of these symptoms, call 911 immediately!\n\nIf you have NO symptoms, call your healthcare professional immediately.",
        isCritical: true,
        isHypertensiveCrisis: true
      };
    }
    
    // Critical high (170-179 OR 100-119)
    if ((sys >= 170 && sys < 180) || (dia >= 100 && dia < 120)) {
      return {
        color: "bg-red-100 text-red-800 border-red-300",
        message: "CRITICAL HIGH - Contact your MD/PCP immediately or call 911 if you are alone.",
        isCritical: true,
        isHypertensiveCrisis: false
      };
    }
    
    // High Stage 2 (140-169 OR 90-99)
    if ((sys >= 140 && sys <= 169) || (dia >= 90 && dia <= 99)) {
      return {
        color: "bg-orange-100 text-orange-800 border-orange-300",
        message: "High (Stage 2) - Contact your MD",
        isCritical: false,
        isHypertensiveCrisis: false
      };
    }
    
    // High Stage 1 (130-139 OR 80-89)
    if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) {
      return {
        color: "bg-amber-100 text-amber-800 border-amber-300",
        message: "High (Stage 1) - Follow up with your MD",
        isCritical: false,
        isHypertensiveCrisis: false
      };
    }
    
    // Elevated (121-129/<80)
    if (sys >= 121 && sys <= 129 && dia < 80) {
      return {
        color: "bg-amber-100 text-amber-800 border-amber-300",
        message: "Elevated - Monitor",
        isCritical: false,
        isHypertensiveCrisis: false
      };
    }
    
    // Normal (90-120/60-80)
    if (sys >= 90 && sys <= 120 && dia >= 60 && dia <= 80) {
      return {
        color: "bg-green-100 text-green-800 border-green-300",
        message: "Normal",
        isCritical: false,
        isHypertensiveCrisis: false
      };
    }
    
    // Low (<90/<60)
    if (sys < 90 && dia < 60) {
      return {
        color: "bg-blue-100 text-blue-800 border-blue-300",
        message: "Low (Hypotension) - Contact your PCP if symptomatic",
        isCritical: false,
        isHypertensiveCrisis: false
      };
    }
    
    return null;
  };

  // Heart Rate Status
  const getHeartRateStatus = (value: string) => {
    if (!value) return null;
    const num = parseInt(value);
    if (isNaN(num)) return null;
    
    if (num < 60) {
      return {
        color: "bg-blue-100 text-blue-800 border-blue-300",
        message: "Low (Bradycardia) - Contact your PCP if symptomatic"
      };
    }
    if (num <= 100) {
      return {
        color: "bg-green-100 text-green-800 border-green-300",
        message: "Normal"
      };
    }
    if (num <= 120) {
      return {
        color: "bg-amber-100 text-amber-800 border-amber-300",
        message: "Elevated - Monitor"
      };
    }
    return {
      color: "bg-red-100 text-red-800 border-red-300",
      message: "High (Tachycardia) - Contact your MD"
    };
  };

  // Temperature Status
  const getTemperatureStatus = (value: string) => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    
    if (num < 97) {
      return {
        color: "bg-blue-100 text-blue-800 border-blue-300",
        message: "Low - Contact your PCP if symptomatic"
      };
    }
    if (num <= 99) {
      return {
        color: "bg-green-100 text-green-800 border-green-300",
        message: "Normal"
      };
    }
    if (num <= 100.4) {
      return {
        color: "bg-amber-100 text-amber-800 border-amber-300",
        message: "Elevated - Monitor closely"
      };
    }
    return {
      color: "bg-red-100 text-red-800 border-red-300",
      message: "Fever - Contact your treating MD"
    };
  };

  // Oxygen Saturation Status
  const getOxygenSaturationStatus = (value: string) => {
    if (!value) return null;
    const num = parseInt(value);
    if (isNaN(num)) return null;
    
    if (num >= 95 && num <= 100) {
      return {
        color: "bg-green-100 text-green-800 border-green-300",
        message: "Normal"
      };
    }
    if (num >= 90 && num <= 94) {
      return {
        color: "bg-amber-100 text-amber-800 border-amber-300",
        message: "Low - Monitor closely, contact MD if persistent"
      };
    }
    return {
      color: "bg-red-100 text-red-800 border-red-300",
      message: "Critical - Seek immediate medical attention"
    };
  };

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Prepare medication review data
      const medicationReviewData = {
        preInjuryMeds: preInjuryMeds.filter(m => m.brandName.trim() || m.genericName.trim()),
        postInjuryMeds: postInjuryMeds.filter(m => m.brandName.trim() || m.genericName.trim()),
        medsAttested: medsAttested
      };
      
      // Prepare allergy data
      const medicationAllergies = allergies
        .filter(a => a.medication.trim())
        .map(a => ({
          medication: a.medication,
          reaction: a.reaction,
          severity: a.severity
        }));
      
      // FIRST: Save medication reconciliation data
      const reconData = {
        case_id: caseId,
        has_allergies: hasAllergies === "yes",
        medication_allergies: medicationAllergies.length > 0 ? JSON.stringify(medicationAllergies) : null,
        food_allergies: null, // Not collected in current form
        allergy_reactions: allergies.length > 0 ? JSON.stringify(allergies) : null,
        allergy_attested_at: allergiesAttested ? new Date().toISOString() : null,
        med_review_data: JSON.stringify(medicationReviewData),
        additional_comments: notes || null,
        med_attested_at: medsAttested ? new Date().toISOString() : null
      };

      console.log("Saving reconciliation data:", reconData);

      const reconResponse = await fetch(
        `${supabaseUrl}/rest/v1/rc_med_reconciliations`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(reconData)
        }
      );

      console.log("Reconciliation response status:", reconResponse.status);
      const reconText = await reconResponse.text();
      console.log("Reconciliation response:", reconText);

      if (!reconResponse.ok) {
        console.error("Failed to save reconciliation:", reconText);
        throw new Error(reconText || 'Failed to save medication reconciliation');
      }

      const reconResult = JSON.parse(reconText);
      const reconId = reconResult[0]?.id;
      
      // Create auto-note for medication reconciliation
      if (medsAttested) {
        try {
          await createAutoNote({
            caseId: caseId,
            noteType: 'medication',
            title: 'Medication Reconciliation',
            content: 'Client completed medication reconciliation',
            triggerEvent: 'med_reconciliation',
            visibleToClient: true,
            visibleToRN: true,
            visibleToAttorney: false
          });
        } catch (err) {
          console.error("Failed to create auto-note for medication reconciliation:", err);
        }
      }
      
      // Save medications to rc_medications table
      if (preInjuryMeds.length > 0 || postInjuryMeds.length > 0) {
        const allMeds = [
          ...preInjuryMeds.filter(m => m.brandName.trim() || m.genericName.trim()).map(med => ({
            case_id: caseId,
            medication_name: med.brandName || med.genericName,
            dosage: med.dose || null,
            frequency: med.frequency || null,
            prescribing_doctor: med.prescriber || null,
            start_date: med.startDate || null,
            end_date: med.endDate || null,
            reason_for_taking: med.purpose || null,
            pharmacy: med.pharmacy || null,
            notes: med.notes || null,
            injury_related: false,
            is_active: true,
          })),
          ...postInjuryMeds.filter(m => m.brandName.trim() || m.genericName.trim()).map(med => ({
            case_id: caseId,
            medication_name: med.brandName || med.genericName,
            dosage: med.dose || null,
            frequency: med.frequency || null,
            prescribing_doctor: med.prescriber || null,
            start_date: med.startDate || null,
            end_date: med.endDate || null,
            reason_for_taking: med.purpose || null,
            pharmacy: med.pharmacy || null,
            notes: med.notes || null,
            injury_related: true,
            is_active: true,
          })),
        ];

        if (allMeds.length > 0) {
          const medsResponse = await fetch(
            `${supabaseUrl}/rest/v1/rc_medications`,
            {
              method: 'POST',
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              },
              body: JSON.stringify(allMeds)
            }
          );

          if (!medsResponse.ok) {
            const errorText = await medsResponse.text();
            console.error('Failed to save medications:', errorText);
            // Don't throw - continue with check-in save
          }
        }
      }
      
      // Calculate BMI if height and weight are provided
      const bmi = calculateBMI();
      const totalInches = heightFeet && heightInches 
        ? parseFloat(heightFeet) * 12 + parseFloat(heightInches) 
        : null;
      
      // THEN: Save wellness check-in with vital signs
      console.log("Saving check-in with reconciliation ID:", reconId);
      
      const checkinData: any = {
        case_id: caseId,
        pain_scale: painLevel,
        p_physical: (physical - 1) * 25,
        p_psychological: (psychological - 1) * 25,
        p_psychosocial: (psychosocial - 1) * 25,
        p_professional: (professional - 1) * 25,
        note: notes || null,
        // Vital signs
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
        bmi: bmi,
      };
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rc_client_checkins`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(checkinData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to save check-in');
      }
      
      setSubmitted(true);
      setLastCheckin(new Date());
      toast.success("Wellness check-in saved!");
      
      // Create auto-note for wellness check-in
      try {
        await createAutoNote({
          caseId: caseId,
          noteType: 'wellness',
          title: 'Wellness Check-in Completed',
          content: 'Client completed wellness check-in',
          triggerEvent: 'wellness_checkin',
          visibleToClient: true,
          visibleToRN: true,
          visibleToAttorney: false
        });
      } catch (err) {
        console.error("Failed to create auto-note for wellness check-in:", err);
      }
      
      // Reset form after 3 seconds
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
      
    } catch (err: any) {
      console.error("Check-in error:", err);
      setError(err.message || "Failed to save check-in");
      toast.error("Failed to save check-in");
    } finally {
      setIsSubmitting(false);
    }
  }

  function ScoreSlider({ 
    label, 
    code, 
    description, 
    value, 
    onChange 
  }: { 
    label: string; 
    code: string; 
    description: string; 
    value: number; 
    onChange: (v: number) => void;
  }) {
    return (
      <div 
        className="space-y-3 p-4 border border-teal-300 rounded-lg"
        style={{ backgroundColor: '#4fb9af' }}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded">{code}</span>
              <span className="text-white font-medium">{label}</span>
            </div>
            <p className="text-white/80 text-sm mt-1">{description}</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-white">{value}</span>
            <p className="text-xs text-white/80">{SCALE_LABELS[value as keyof typeof SCALE_LABELS]}</p>
          </div>
        </div>
        <Slider
          value={[value]}
          onValueChange={(v) => onChange(v[0])}
          min={1}
          max={5}
          step={1}
          className="mt-2"
        />
        <div className="flex justify-between text-xs text-white/70">
          <span>1 - Struggling</span>
          <span>5 - Thriving</span>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">Check-in Complete!</h3>
          <p className="text-slate-500">Thank you for sharing how you're feeling today.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {lastCheckin && (
        <Alert className="bg-amber-500 border-amber-600">
          <AlertDescription className="text-white">
            Last check-in: {lastCheckin.toLocaleDateString()} at {lastCheckin.toLocaleTimeString()}
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500" />
            Wellness Check-in
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <div className={`flex-1 h-2 rounded-full ${currentStep >= 1 ? 'bg-amber-500' : 'bg-white/30'}`} />
            <div className={`flex-1 h-2 rounded-full ${currentStep >= 2 ? 'bg-amber-500' : 'bg-white/30'}`} />
            <div className={`flex-1 h-2 rounded-full ${currentStep >= 3 ? 'bg-amber-500' : 'bg-white/30'}`} />
          </div>
          <p className="text-white/80 text-sm mt-2">
            Step {currentStep} of 3: {
              currentStep === 1 ? "Allergies" :
              currentStep === 2 ? "Medication Reconciliation" :
              "Wellness Check-in"
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Allergies */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="bg-white/20 border border-white/30 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Medication Allergies & Sensitivities</h4>
                    <p className="text-white/80 text-sm">
                      This information is critical for your safety. Please list any medications you are allergic to or have had negative reactions with.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white font-medium">Do you have any medication allergies or sensitivities?</Label>
                    <RadioGroup value={hasAllergies} onValueChange={setHasAllergies}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="allergies-no" />
                        <Label htmlFor="allergies-no" className="text-white cursor-pointer font-normal">No</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="allergies-yes" />
                        <Label htmlFor="allergies-yes" className="text-white cursor-pointer font-normal">Yes</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {hasAllergies === "yes" && (
                    <div className="space-y-3">
                      {allergies.map((allergy) => (
                        <div key={allergy.id} className="bg-white/10 border border-white/20 rounded-lg p-3 space-y-2 relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 h-6 w-6 p-0 text-white hover:bg-white/20"
                            onClick={() => removeAllergy(allergy.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div>
                              <Label className="text-white text-sm">Medication/Substance*</Label>
                              <Input
                                value={allergy.medication}
                                onChange={(e) => updateAllergy(allergy.id, 'medication', e.target.value)}
                                placeholder="e.g., Penicillin"
                                className="bg-white border-slate-200"
                              />
                            </div>
                            <div>
                              <Label className="text-white text-sm">Reaction</Label>
                              <Input
                                value={allergy.reaction}
                                onChange={(e) => updateAllergy(allergy.id, 'reaction', e.target.value)}
                                placeholder="e.g., Hives, swelling"
                                className="bg-white border-slate-200"
                              />
                            </div>
                            <div>
                              <Label className="text-white text-sm">Severity</Label>
                              <select
                                value={allergy.severity}
                                onChange={(e) => updateAllergy(allergy.id, 'severity', e.target.value)}
                                className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                              >
                                <option value="mild">Mild</option>
                                <option value="moderate">Moderate</option>
                                <option value="severe">Severe</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addAllergy}
                        className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Allergy
                      </Button>
                    </div>
                  )}

                  <div className="flex items-start space-x-2 pt-2">
                    <Checkbox
                      id="allergies-attest"
                      checked={allergiesAttested}
                      onCheckedChange={(checked) => setAllergiesAttested(checked === true)}
                      className="mt-1"
                    />
                    <Label htmlFor="allergies-attest" className="text-white text-sm cursor-pointer">
                      I attest that the allergy information provided above is accurate and complete to the best of my knowledge.
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Medication Reconciliation */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="bg-white/20 border border-white/30 rounded-lg p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <Activity className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Medication Reconciliation</h4>
                    <p className="text-white/80 text-sm">
                      Please list all medications you are currently taking or have taken related to your injury.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h5 className="text-white font-medium mb-2">Pre-Injury Medications</h5>
                    <p className="text-white/80 text-sm mb-3">Medications you were taking before the incident occurred.</p>
                    {preInjuryMeds.map((med) => (
                      <div key={med.id} className="bg-white/10 border border-white/20 rounded-lg p-3 space-y-2 mb-2 relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 p-0 text-white hover:bg-white/20"
                          onClick={() => removePreInjuryMed(med.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <Label className="text-white text-sm">Brand Name</Label>
                            <Input
                              value={med.brandName}
                              onChange={(e) => updatePreInjuryMed(med.id, 'brandName', e.target.value)}
                              className="bg-white border-slate-200"
                            />
                          </div>
                          <div>
                            <Label className="text-white text-sm">Generic Name</Label>
                            <Input
                              value={med.genericName}
                              onChange={(e) => updatePreInjuryMed(med.id, 'genericName', e.target.value)}
                              className="bg-white border-slate-200"
                            />
                          </div>
                          <div>
                            <Label className="text-white text-sm">Dose</Label>
                            <Input
                              value={med.dose}
                              onChange={(e) => updatePreInjuryMed(med.id, 'dose', e.target.value)}
                              placeholder="e.g., 200mg"
                              className="bg-white border-slate-200"
                            />
                          </div>
                          <div>
                            <Label className="text-white text-sm">Frequency</Label>
                            <Select 
                              value={med.frequency} 
                              onValueChange={(v) => updatePreInjuryMed(med.id, 'frequency', v)}
                            >
                              <SelectTrigger className="bg-white border-slate-200 text-slate-800">
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Once daily">Once daily</SelectItem>
                                <SelectItem value="Twice daily">Twice daily</SelectItem>
                                <SelectItem value="Three times daily">Three times daily</SelectItem>
                                <SelectItem value="Four times daily">Four times daily</SelectItem>
                                <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
                                <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                                <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
                                <SelectItem value="Every 12 hours">Every 12 hours</SelectItem>
                                <SelectItem value="Once weekly">Once weekly</SelectItem>
                                <SelectItem value="As needed (PRN)">As needed (PRN)</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {med.frequency === "As needed (PRN)" && (
                          <div className="space-y-2">
                            <div>
                              <Label className="text-white text-sm">How often can you take this medication?</Label>
                              <Select
                                value={med.prnTimeFrequency || ''}
                                onValueChange={(v) => updatePreInjuryMed(med.id, 'prnTimeFrequency', v)}
                              >
                                <SelectTrigger className="bg-white border-slate-200 text-slate-800">
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Every 2 hours">Every 2 hours</SelectItem>
                                  <SelectItem value="Every 3 hours">Every 3 hours</SelectItem>
                                  <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
                                  <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                                  <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
                                  <SelectItem value="Every 12 hours">Every 12 hours</SelectItem>
                                  <SelectItem value="Once daily maximum">Once daily maximum</SelectItem>
                                  <SelectItem value="As directed">As directed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-white text-sm">What do you take this medication for?</Label>
                              <Input
                                value={med.prnDescription || ''}
                                onChange={(e) => updatePreInjuryMed(med.id, 'prnDescription', e.target.value)}
                                placeholder="e.g., breakthrough pain, anxiety, sleep, nausea"
                                className="bg-white border-slate-200"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPreInjuryMed}
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Pre-Injury Medication
                    </Button>
                  </div>

                  <div>
                    <h5 className="text-white font-medium mb-2">Post-Injury Medications</h5>
                    <p className="text-white/80 text-sm mb-3">Medications prescribed or started after the incident.</p>
                    {postInjuryMeds.map((med) => (
                      <div key={med.id} className="bg-white/10 border border-white/20 rounded-lg p-3 space-y-2 mb-2 relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 p-0 text-white hover:bg-white/20"
                          onClick={() => removePostInjuryMed(med.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <Label className="text-white text-sm">Brand Name</Label>
                            <Input
                              value={med.brandName}
                              onChange={(e) => updatePostInjuryMed(med.id, 'brandName', e.target.value)}
                              className="bg-white border-slate-200"
                            />
                          </div>
                          <div>
                            <Label className="text-white text-sm">Generic Name</Label>
                            <Input
                              value={med.genericName}
                              onChange={(e) => updatePostInjuryMed(med.id, 'genericName', e.target.value)}
                              className="bg-white border-slate-200"
                            />
                          </div>
                          <div>
                            <Label className="text-white text-sm">Dose</Label>
                            <Input
                              value={med.dose}
                              onChange={(e) => updatePostInjuryMed(med.id, 'dose', e.target.value)}
                              placeholder="e.g., 200mg"
                              className="bg-white border-slate-200"
                            />
                          </div>
                          <div>
                            <Label className="text-white text-sm">Frequency</Label>
                            <Select 
                              value={med.frequency} 
                              onValueChange={(v) => updatePostInjuryMed(med.id, 'frequency', v)}
                            >
                              <SelectTrigger className="bg-white border-slate-200 text-slate-800">
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Once daily">Once daily</SelectItem>
                                <SelectItem value="Twice daily">Twice daily</SelectItem>
                                <SelectItem value="Three times daily">Three times daily</SelectItem>
                                <SelectItem value="Four times daily">Four times daily</SelectItem>
                                <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
                                <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                                <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
                                <SelectItem value="Every 12 hours">Every 12 hours</SelectItem>
                                <SelectItem value="Once weekly">Once weekly</SelectItem>
                                <SelectItem value="As needed (PRN)">As needed (PRN)</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {med.frequency === "As needed (PRN)" && (
                          <div className="space-y-2">
                            <div>
                              <Label className="text-white text-sm">How often can you take this medication?</Label>
                              <Select
                                value={med.prnTimeFrequency || ''}
                                onValueChange={(v) => updatePostInjuryMed(med.id, 'prnTimeFrequency', v)}
                              >
                                <SelectTrigger className="bg-white border-slate-200 text-slate-800">
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Every 2 hours">Every 2 hours</SelectItem>
                                  <SelectItem value="Every 3 hours">Every 3 hours</SelectItem>
                                  <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
                                  <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                                  <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
                                  <SelectItem value="Every 12 hours">Every 12 hours</SelectItem>
                                  <SelectItem value="Once daily maximum">Once daily maximum</SelectItem>
                                  <SelectItem value="As directed">As directed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-white text-sm">What do you take this medication for?</Label>
                              <Input
                                value={med.prnDescription || ''}
                                onChange={(e) => updatePostInjuryMed(med.id, 'prnDescription', e.target.value)}
                                placeholder="e.g., breakthrough pain, anxiety, sleep, nausea"
                                className="bg-white border-slate-200"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPostInjuryMed}
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Post-Injury Medication
                    </Button>
                  </div>

                  <div className="flex items-start space-x-2 pt-2">
                    <Checkbox
                      id="meds-attest"
                      checked={medsAttested}
                      onCheckedChange={(checked) => setMedsAttested(checked === true)}
                      className="mt-1"
                    />
                    <Label htmlFor="meds-attest" className="text-white text-sm cursor-pointer">
                      I attest that the medication information provided above is accurate and complete to the best of my knowledge.
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Wellness Check-in */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="text-white/80 text-sm mb-4">
                Rate how you're feeling in each area (1 = Struggling, 5 = Thriving)
              </p>
              
          <ScoreSlider
            label={FOUR_PS.physical.label}
            code={FOUR_PS.physical.code}
            description={FOUR_PS.physical.description}
            value={physical}
            onChange={setPhysical}
          />
          
          <ScoreSlider
            label={FOUR_PS.psychological.label}
            code={FOUR_PS.psychological.code}
            description={FOUR_PS.psychological.description}
            value={psychological}
            onChange={setPsychological}
          />
          
          <ScoreSlider
            label={FOUR_PS.psychosocial.label}
            code={FOUR_PS.psychosocial.code}
            description={FOUR_PS.psychosocial.description}
            value={psychosocial}
            onChange={setPsychosocial}
          />
          
          <ScoreSlider
            label={FOUR_PS.professional.label}
            code={FOUR_PS.professional.code}
            description={FOUR_PS.professional.description}
            value={professional}
            onChange={setProfessional}
          />

          <div 
            className="space-y-3 p-4 border border-teal-300 rounded-lg"
            style={{ backgroundColor: '#4fb9af' }}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-white font-medium">Pain Level</span>
                <p className="text-white/80 text-sm mt-1">How would you rate your pain today?</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-white">{painLevel}</span>
                <p className="text-xs text-white/80">
                  {painLevel === 1 ? "Extreme Pain" : 
                   painLevel === 2 ? "Severe Pain" : 
                   painLevel === 3 ? "Moderate Pain" : 
                   painLevel === 4 ? "Mild Pain" : "No Pain"}
                </p>
              </div>
            </div>
            <Slider
              value={[painLevel]}
              onValueChange={(v) => setPainLevel(v[0])}
              min={1}
              max={5}
              step={1}
            />
            <div className="flex justify-between text-xs text-white/70">
              <span>1 - Extreme Pain</span>
              <span>5 - No Pain</span>
            </div>
          </div>

              {/* Vital Signs Section */}
              <div className="bg-white/20 border border-white/30 rounded-lg p-4 space-y-4">
                <h4 className="font-semibold text-white mb-2">Vital Signs (Optional)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Blood Pressure */}
          <div className="space-y-2">
                    <Label className="text-white text-sm">Blood Pressure</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={bloodPressureSystolic}
                        onChange={(e) => setBloodPressureSystolic(e.target.value)}
                        placeholder="120"
                        className="bg-white border-slate-200 text-slate-800"
                      />
                      <span className="text-white">/</span>
                      <Input
                        type="number"
                        value={bloodPressureDiastolic}
                        onChange={(e) => setBloodPressureDiastolic(e.target.value)}
                        placeholder="80"
                        className="bg-white border-slate-200 text-slate-800"
                      />
                      <span className="text-white text-sm">mmHg</span>
                    </div>
                    {getBloodPressureStatus(bloodPressureSystolic, bloodPressureDiastolic) && (() => {
                      const status = getBloodPressureStatus(bloodPressureSystolic, bloodPressureDiastolic)!;
                      if (status.isHypertensiveCrisis) {
                        return (
                          <Alert className="bg-red-100 border-red-300">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <AlertDescription className="text-red-800 text-sm space-y-3">
                              <p className="font-semibold">HYPERTENSIVE CRISIS - Seek emergency care immediately if you have any symptoms:</p>
                              <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Chest pain</li>
                                <li>Shortness of breath</li>
                                <li>Back pain</li>
                                <li>Numbness or weakness</li>
                                <li>Change in vision</li>
                                <li>Difficulty speaking</li>
                              </ul>
                              <div>
                                <p className="font-semibold mb-2">Remember FAST for stroke warning signs:</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                  <li><strong>F</strong> - Face drooping: Is one side of your face drooping or numb?</li>
                                  <li><strong>A</strong> - Arm weakness: Is one arm weak or numb?</li>
                                  <li><strong>S</strong> - Speech difficulty: Is your speech slurred or hard to understand?</li>
                                  <li><strong>T</strong> - Time to call 911: If you have ANY of these symptoms, call 911 immediately!</li>
                                </ul>
                              </div>
                              <p className="font-medium">If you have NO symptoms, call your healthcare professional immediately.</p>
                              <p className="text-xs italic mt-2">*Crisis symptoms: chest pain, shortness of breath, back pain, numbness, weakness, change in vision, difficulty speaking. Remember FAST for stroke: Face drooping, Arm weakness, Speech difficulty, Time to call 911.</p>
                            </AlertDescription>
                          </Alert>
                        );
                      }
                      return (
                        <>
                          <Alert className={`${status.color} border`}>
                            <AlertDescription className="text-sm">{status.message}</AlertDescription>
                          </Alert>
                          {status.isCritical && !status.isHypertensiveCrisis && (
                            <Alert className="bg-red-50 border-red-300">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <AlertDescription className="text-red-800 text-sm">
                                <p className="font-semibold mb-2">Watch for signs of stroke (FAST):</p>
                                <ul className="list-disc list-inside space-y-1">
                                  <li><strong>F</strong> - Face drooping: Is one side of the face drooping or numb?</li>
                                  <li><strong>A</strong> - Arm weakness: Is one arm weak or numb?</li>
                                  <li><strong>S</strong> - Speech difficulty: Is speech slurred or hard to understand?</li>
                                  <li><strong>T</strong> - Time to call 911: If any symptoms, call 911 immediately.</li>
                                </ul>
                              </AlertDescription>
                            </Alert>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Heart Rate */}
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Heart Rate</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={heartRate}
                        onChange={(e) => setHeartRate(e.target.value)}
                        placeholder="72"
                        className="bg-white border-slate-200 text-slate-800"
                      />
                      <span className="text-white text-sm">bpm</span>
                    </div>
                    {getHeartRateStatus(heartRate) && (
                      <Alert className={`${getHeartRateStatus(heartRate)!.color} border`}>
                        <AlertDescription className="text-sm">{getHeartRateStatus(heartRate)!.message}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Oxygen Saturation */}
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Oxygen Saturation (SpO2)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={oxygenSaturation}
                        onChange={(e) => setOxygenSaturation(e.target.value)}
                        placeholder="98"
                        className="bg-white border-slate-200 text-slate-800"
                      />
                      <span className="text-white text-sm">%</span>
                    </div>
                    <p className="text-white/70 text-xs">Normal is 95-100%</p>
                    {getOxygenSaturationStatus(oxygenSaturation) && (
                      <Alert className={`${getOxygenSaturationStatus(oxygenSaturation)!.color} border`}>
                        <AlertDescription className="text-sm">{getOxygenSaturationStatus(oxygenSaturation)!.message}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Temperature */}
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Temperature</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                        placeholder="98.6"
                        className="bg-white border-slate-200 text-slate-800"
                      />
                      <span className="text-white text-sm">°F</span>
                    </div>
                    {getTemperatureStatus(temperature) && (
                      <Alert className={`${getTemperatureStatus(temperature)!.color} border`}>
                        <AlertDescription className="text-sm">{getTemperatureStatus(temperature)!.message}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Blood Sugar */}
                  <div className="space-y-2">
                    <div className="space-y-2">
                      <Label className="text-white text-sm">Do you have diabetes or pre-diabetes?</Label>
                      <RadioGroup
                        value={diabetesStatus}
                        onValueChange={(value) => setDiabetesStatus(value as "yes" | "no" | "not_sure" | "")}
                        className="flex flex-row gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="diabetes-yes" />
                          <Label htmlFor="diabetes-yes" className="text-white text-sm cursor-pointer">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="diabetes-no" />
                          <Label htmlFor="diabetes-no" className="text-white text-sm cursor-pointer">No</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="not_sure" id="diabetes-not-sure" />
                          <Label htmlFor="diabetes-not-sure" className="text-white text-sm cursor-pointer">Not Sure</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="blood-sugar-na"
                        checked={bloodSugarNotApplicable}
                        onCheckedChange={(checked) => {
                          setBloodSugarNotApplicable(checked === true);
                          if (checked) setBloodSugar("");
                        }}
                      />
                      <Label htmlFor="blood-sugar-na" className="text-white text-sm cursor-pointer">
                        Blood sugar monitoring not applicable to me
                      </Label>
                    </div>
                    {!bloodSugarNotApplicable && (
                      <>
                        <div>
                          <Label className="text-white text-sm">Blood Sugar</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={bloodSugar}
                              onChange={(e) => setBloodSugar(e.target.value)}
                              placeholder="100"
                              className="bg-white border-slate-200 text-slate-800"
                            />
                            <span className="text-white text-sm">mg/dL</span>
                          </div>
                        </div>
                        {getBloodSugarStatus(bloodSugar, diabetesStatus === "yes") && (() => {
                          const status = getBloodSugarStatus(bloodSugar, diabetesStatus === "yes")!;
                          return (
                            <Alert className={`${status.color} border`}>
                              <AlertDescription className="text-sm">{status.message}</AlertDescription>
                            </Alert>
                          );
                        })()}
                        {(diabetesStatus === "yes" || diabetesStatus === "not_sure") && !bloodSugarNotApplicable && (
                          <div className="mt-3">
                            <Label className="text-white text-sm">Most Recent A1C (%)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={a1c}
                              onChange={(e) => setA1c(e.target.value)}
                              placeholder="e.g., 6.5"
                              className="bg-white border-slate-200 text-slate-800"
                            />
                            <p className="text-white/70 text-xs mt-1">Your A1C from your last lab test (if known)</p>
                            {getA1CStatus(a1c) && (
                              <Alert className={`${getA1CStatus(a1c)!.color} border mt-2`}>
                                <AlertDescription className="text-sm">{getA1CStatus(a1c)!.message}</AlertDescription>
                              </Alert>
                            )}
                          </div>
                        )}
                        <details className="mt-3">
                          <summary className="text-white/80 text-sm cursor-pointer hover:text-white flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            Understanding Your Blood Sugar Numbers (American Diabetes Association)
                          </summary>
                          <div className="mt-2 bg-white rounded-lg p-3 text-sm">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="border-b">
                                  <th className="py-1 text-slate-700">Category</th>
                                  <th className="py-1 text-slate-700">Fasting (mg/dL)</th>
                                  <th className="py-1 text-slate-700">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="bg-red-200">
                                  <td className="py-1 font-medium text-red-900">Critical Low</td>
                                  <td className="py-1 text-red-900">Below 70</td>
                                  <td className="py-1 text-red-900">Take glucose, call PCP/911</td>
                                </tr>
                                <tr className="bg-green-100">
                                  <td className="py-1 font-medium text-green-900">Normal</td>
                                  <td className="py-1 text-green-900">70-99</td>
                                  <td className="py-1 text-green-900">Maintain healthy lifestyle</td>
                                </tr>
                                <tr className="bg-amber-100">
                                  <td className="py-1 font-medium text-amber-900">Pre-diabetic</td>
                                  <td className="py-1 text-amber-900">100-125</td>
                                  <td className="py-1 text-amber-900">Monitor, discuss with provider</td>
                                </tr>
                                <tr className="bg-orange-100">
                                  <td className="py-1 font-medium text-orange-900">Diabetic</td>
                                  <td className="py-1 text-orange-900">126-399</td>
                                  <td className="py-1 text-orange-900">Follow treatment plan</td>
                                </tr>
                                <tr className="bg-red-200">
                                  <td className="py-1 font-medium text-red-900">Critical High</td>
                                  <td className="py-1 text-red-900">400+</td>
                                  <td className="py-1 text-red-900">Take insulin if needed, call PCP/911</td>
                                </tr>
                              </tbody>
                            </table>
                            <div className="mt-4 pt-4 border-t">
                              <p className="font-semibold text-slate-800 mb-2">A1C Levels (Average Blood Sugar Over 2-3 Months):</p>
                              <table className="w-full text-left">
                                <thead>
                                  <tr className="border-b">
                                    <th className="py-1 text-slate-700">Category</th>
                                    <th className="py-1 text-slate-700">A1C (%)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="bg-green-100">
                                    <td className="py-1 font-medium text-green-900">Normal</td>
                                    <td className="py-1 text-green-900">Below 5.7%</td>
                                  </tr>
                                  <tr className="bg-amber-100">
                                    <td className="py-1 font-medium text-amber-900">Pre-diabetic</td>
                                    <td className="py-1 text-amber-900">5.7% - 6.4%</td>
                                  </tr>
                                  <tr className="bg-orange-100">
                                    <td className="py-1 font-medium text-orange-900">Diabetic</td>
                                    <td className="py-1 text-orange-900">6.5% or higher</td>
                                  </tr>
                                  <tr className="bg-blue-50">
                                    <td className="py-1 font-medium text-blue-900">Well Controlled Diabetic</td>
                                    <td className="py-1 text-blue-900">Under 7.0% (Target for most diabetics)</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </details>
                      </>
                    )}
                  </div>

                  {/* Height */}
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Height</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={heightFeet}
                        onChange={(e) => setHeightFeet(e.target.value)}
                        placeholder="5"
                        className="bg-white border-slate-200 text-slate-800"
                      />
                      <span className="text-white text-sm">ft</span>
                      <Input
                        type="number"
                        value={heightInches}
                        onChange={(e) => setHeightInches(e.target.value)}
                        placeholder="8"
                        className="bg-white border-slate-200 text-slate-800"
                      />
                      <span className="text-white text-sm">in</span>
                    </div>
                  </div>

                  {/* Weight */}
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Weight</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.1"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="150"
                        className="bg-white border-slate-200 text-slate-800"
                      />
                      <span className="text-white text-sm">lbs</span>
                    </div>
                  </div>
                </div>

                {/* BMI Display */}
                {calculateBMI() && (
                  <div className="mt-4">
                    {(() => {
                      const bmi = calculateBMI()!;
                      const category = getBMICategory(bmi);
                      return (
                        <div className={`inline-block px-4 py-2 rounded-lg ${category.color}`}>
                          <span className="font-semibold">BMI: {bmi.toFixed(1)} - {category.label}</span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

          <div className="space-y-2">
                <Label className="text-white">Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else you'd like to share about how you're feeling today?"
              className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400"
              rows={3}
            />
          </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-white/20">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            {currentStep < 3 ? (
              <Button
                onClick={() => {
                  if (currentStep === 1 && canProceedStep1()) {
                    setCurrentStep(2);
                  } else if (currentStep === 2 && canProceedStep2()) {
                    setCurrentStep(3);
                  }
                }}
                disabled={
                  (currentStep === 1 && !canProceedStep1()) ||
                  (currentStep === 2 && !canProceedStep2())
                }
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
                className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Check-in
              </>
            )}
          </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
