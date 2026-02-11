// src/screens/rn/OverlaySelectionScreen.tsx
// Step 3 of RN Care Plan Workflow - Select applicable condition overlays
// UPDATED: Added Transgender/Gender-Diverse overlay with FTM/MTF subtypes
// Uses authenticated supabaseGet + supabase client for plan-scoped overlays (draft plan.id).

import React, { useEffect, useState } from "react";
import { RN_VIEW_ONLY_TOOLTIP } from "@/components/rn/RNCaseStateBadge";
import { supabase } from "@/integrations/supabase/client";
import { supabaseGet } from "@/lib/supabaseRest";

// Overlay definitions
type OverlayType = 
  | "geriatric_60_plus"
  | "caregiver_dependent"
  | "student_18_24"
  | "adolescent_13_17"
  | "child_3_12"
  | "infant_toddler_0_2"
  | "gender_female"
  | "gender_male"
  | "transgender_gender_diverse";

type TransgenderSubtype = "FTM" | "MTF" | "Non-binary" | "Other" | "";

interface FocusAreaGroup {
  title: string;
  domain?: string;
  items: string[];
}

interface OverlayOption {
  id: OverlayType;
  name: string;
  ageRange?: string;
  description: string;
  category: "age" | "gender" | "role" | "identity";
  focusAreas: string[];
  focusAreaGroups?: FocusAreaGroup[];
  hasSubtypes?: boolean;
  corePrinciple?: string;
}

const OVERLAY_OPTIONS: OverlayOption[] = [
  {
    id: "geriatric_60_plus",
    name: "60+ Geriatric Overlay",
    ageRange: "60+",
    category: "age",
    description: "Integrates critical focus areas for clients aged 60 and over including fall risk, polypharmacy, and cognitive screening.",
    focusAreas: [
      "Functional Capacity & Safety (ADLs/IADLs, Fall Risk, Gait/Mobility)",
      "Polypharmacy & Risk Review (BEERS Criteria)",
      "Cognitive & Behavioral Health (Delirium, Depression, Dementia screening)",
      "Client Goals & Preferences ('What Matters' goals)"
    ]
  },
  {
    id: "student_18_24",
    name: "Student Lens",
    ageRange: "18-24",
    category: "age",
    description: "Tailored framework for assessing unique drivers of health in a student population.",
    focusAreas: [
      "Academic engagement and performance",
      "Financial aid and tuition coverage",
      "Campus community and social support",
      "Career path clarity and student debt"
    ]
  },
  {
    id: "adolescent_13_17",
    name: "Adolescent Lens",
    ageRange: "13-17",
    category: "age",
    description: "Framework for adolescent health including identity, peer influence, and academic engagement.",
    focusAreas: [
      "Health Maintenance & Risk Behaviors (immunizations, substance use)",
      "Identity, Coping, Emotional Regulation (PHQ-9/GAD-7)",
      "Peer Influence & Family Dynamics",
      "Academic Engagement & Future Goals (IEP review)"
    ]
  },
  {
    id: "child_3_12",
    name: "Child Lens",
    ageRange: "3-12",
    category: "age",
    description: "Framework for child health focusing on developmental milestones, behavioral health, and family support.",
    focusAreas: [
      "Developmental Milestones (OT/PT/Speech referrals)",
      "Affect Regulation, Trauma, Behavioral Health",
      "Family Support & Neglect (CPS if needed)",
      "Bullying assessment"
    ]
  },
  {
    id: "infant_toddler_0_2",
    name: "Infant/Toddler Lens",
    ageRange: "0-2",
    category: "age",
    description: "Framework for infant/toddler health focusing on growth, attachment, and caregiver support.",
    focusAreas: [
      "Growth & Health Maintenance (WIC/SNAP enrollment)",
      "Attachment & Responsiveness (caregiver-infant interaction)",
      "Caregiver Support & Basic Needs",
      "Home visiting programs and respite care"
    ]
  },
  {
    id: "caregiver_dependent",
    name: "Caregiver/Dependent Overlay",
    category: "role",
    description: "Symmetrical Family Assessment Model - ensures dependent risk is factored into adult's score and vice versa.",
    focusAreas: [
      "Physical capacity to provide care for dependents",
      "Mental/emotional status impact on dependents",
      "Housing/income impact on family unit",
      "Caregiving vs. recovery conflict assessment",
      "SYMMETRICAL RISK: Child's score cannot exceed caregiver's score"
    ]
  },
  {
    id: "gender_female",
    name: "Gender-Specific: Female",
    ageRange: "18+",
    category: "gender",
    description: "Health considerations for female-assigned adults highlighting biological and social factors.",
    focusAreas: [
      "Cervical/breast cancer screening adherence",
      "Bone/Vitamin D review",
      "Perinatal/Postpartum Mood Screening",
      "Domestic Violence Screening",
      "Caregiver role strain assessment"
    ]
  },
  {
    id: "gender_male",
    name: "Gender-Specific: Male",
    ageRange: "18+",
    category: "gender",
    description: "Health considerations for male-assigned adults highlighting biological and social factors.",
    focusAreas: [
      "Testicular/prostate health guidance",
      "Vascular health for high-risk behaviors",
      "Targeted Substance Use Screening",
      "Barriers to emotional expression",
      "Social isolation assessment"
    ]
  },
  {
    id: "transgender_gender_diverse",
    name: "Transgender Health & Context Overlay",
    category: "identity",
    description: "Integrates critical, evidence-based focus areas for transgender and gender-diverse clients. Acknowledges how gender transition—social, medical, and legal—intersects with and influences risk and stability across all domains.",
    corePrinciple: "Care must be client-led and affirming. Always use the client's chosen name and pronouns. Instability in any 4P pillar can be profoundly exacerbated by gender dysphoria, social stigma, and barriers to affirming care. Conversely, achieving milestones in transition is a powerful stabilizing factor.",
    hasSubtypes: true,
    focusAreas: [], // Using focusAreaGroups instead for this overlay
  }
];

// FTM-specific focus areas
const FTM_FOCUS_AREAS: FocusAreaGroup[] = [
  {
    title: "Hormone & Surgical Care",
    domain: "P1: Physical",
    items: [
      "Monitor for polycythemia, lipid changes, liver function",
      "Assess binding-related skin/rib issues",
      "Surgical aftercare education (e.g., top surgery) and complication screening"
    ]
  },
  {
    title: "Preventive Health",
    domain: "P1: Physical",
    items: [
      "Cervical/breast screening based on retained anatomy and time on testosterone",
      "Prostate cancer awareness discussion",
      "Bone density review if risk factors present"
    ]
  },
  {
    title: "Gender Dysphoria & Affirming Care",
    domain: "P2: Psychological",
    items: [
      "Screen for dysphoria triggers and functional impact",
      "Assess for co-occurring depression/anxiety",
      "CRITICAL: Differentiate dysphoria from other mental health conditions",
      "Validate gender identity"
    ]
  },
  {
    title: "Safety & Social Transition",
    domain: "P3: Psychosocial",
    items: [
      "Assess safety in housing, work, and public spaces",
      "Evaluate strength of social support and LGBTQ+ community connection",
      "Screen for discrimination, misgendering, or violence"
    ]
  },
  {
    title: "Advocacy & Access",
    domain: "P4: Professional",
    items: [
      "Assess workplace discrimination regarding name/pronouns",
      "Review legal documentation update status (name, gender marker)",
      "Evaluate financial/insurance burden for transition-related care"
    ]
  },
  {
    title: "Additional FTM Considerations",
    items: [
      "Medication interactions between testosterone and common medications (SSRIs, antipsychotics)",
      "Sexual & reproductive health: contraception needs (testosterone is not birth control), fertility preservation",
      "Voice health: monitor for vocal fatigue during testosterone-induced voice changes",
      "Minority stress: assess chronic stress from discrimination, rejection, violence; screen for trauma"
    ]
  }
];

// MTF-specific focus areas
const MTF_FOCUS_AREAS: FocusAreaGroup[] = [
  {
    title: "Hormone & Surgical Care",
    domain: "P1: Physical",
    items: [
      "Monitor for venous thromboembolism (VTE) risk, prolactin levels, liver function",
      "Surgical aftercare education (e.g., vaginoplasty) and complication screening"
    ]
  },
  {
    title: "Preventive Health",
    domain: "P1: Physical",
    items: [
      "Prostate/testicular screening based on retained anatomy",
      "Breast cancer awareness post-hormone therapy",
      "Bone density review"
    ]
  },
  {
    title: "Gender Dysphoria & Affirming Care",
    domain: "P2: Psychological",
    items: [
      "Screen for dysphoria triggers (e.g., voice, facial hair)",
      "Assess for co-occurring depression/anxiety",
      "CRITICAL: Differentiate dysphoria from other mental health conditions",
      "Validate gender identity"
    ]
  },
  {
    title: "Safety & Social Transition",
    domain: "P3: Psychosocial",
    items: [
      "Assess safety, particularly risk of anti-trans violence",
      "Evaluate social support and familial acceptance",
      "Screen for discrimination and rejection"
    ]
  },
  {
    title: "Advocacy & Access",
    domain: "P4: Professional",
    items: [
      "Assess workplace discrimination, especially in appearance-based roles",
      "Review legal documentation update status",
      "Evaluate financial burden for care (hair removal, surgeries)"
    ]
  },
  {
    title: "Additional MTF Considerations",
    items: [
      "Medication interactions between estrogen/anti-androgens and other medications",
      "Sexual & reproductive health: fertility preservation options prior to hormone therapy",
      "Voice & communication: assess vocal strain and dysphoria; refer to voice therapy as needed",
      "Economic vulnerability: trans women, particularly of color, face high rates of housing instability and employment discrimination; assess survival needs"
    ]
  }
];

// Universal considerations for all transgender clients
const UNIVERSAL_TRANS_CONSIDERATIONS: string[] = [
  "Intersectionality: Recognize how race, disability, immigration status, and socioeconomic factors compound stigma and barriers to care",
  "Chronic Disease Risk: Hormone therapy can influence cardiovascular and metabolic health; implement baseline and periodic screening for diabetes, hypertension, lipid disorders",
  "Body Image & Transition Expectations: Explore expectations around medical transition; identify distress related to access or outcomes",
  "Eating Disorders & Body Modification: Be aware of elevated risks for restrictive eating or unsafe body modification practices",
  "Relationship & Family Dynamics: Evaluate impact of transition on partners, parenting roles, and family support systems",
  "Insurance & Legal Navigation: Assist with coverage appeals for denied care; support legal document updates across multiple systems",
  "Digital Safety & Community: Discuss online safety and importance of connection to affirming communities as protective factor against isolation"
];

interface SelectedOverlay {
  overlayType: OverlayType;
  overlaySubtype?: TransgenderSubtype;
  autoApplied: boolean;
  manuallySelected: boolean;
  notes: string;
}

interface OverlaySelectionScreenProps { readOnly?: boolean; onMarkDirty?: () => void; }

const OverlaySelectionScreen: React.FC<OverlaySelectionScreenProps> = ({ readOnly = false, onMarkDirty }) => {
  const [selectedOverlays, setSelectedOverlays] = useState<SelectedOverlay[]>([]);
  const [transgenderSubtype, setTransgenderSubtype] = useState<TransgenderSubtype>("");
  const [clientAge, setClientAge] = useState<number | null>(null);
  const [clientGenderIdentity, setClientGenderIdentity] = useState<string>("");
  const [clientSexAtBirth, setClientSexAtBirth] = useState<string>("");
  const [hasDependents, setHasDependents] = useState<boolean>(false);
  const [isStudent, setIsStudent] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [carePlanId, setCarePlanId] = useState<string | null>(null);

  const caseId = typeof window !== 'undefined' ? window.localStorage.getItem("rcms_active_case_id") : null;

  // Load existing selections and client data
  useEffect(() => {
    async function loadData() {
      if (!caseId) {
        setLoading(false);
        setStatus("No active case selected. Please select a case first.");
        return;
      }

      try {
        // Get or create care plan (auth)
        const { data: planResult, error: planErr } = await supabaseGet<unknown[]>(
          "rc_care_plans",
          `case_id=eq.${caseId}&order=created_at.desc&limit=1`
        );
        if (planErr) throw planErr;

        if (planResult && planResult.length > 0) {
          const plan = planResult[0] as { id: string };
          setCarePlanId(plan.id);
          
          // Load existing overlay selections (plan-scoped to current draft)
          const { data: overlayResult, error: overlayErr } = await supabaseGet<unknown[]>(
            "rc_overlay_selections",
            `care_plan_id=eq.${plan.id}`
          );
          if (!overlayErr && overlayResult && overlayResult.length > 0) {
            const rows = overlayResult as { overlay_type: string; overlay_subtype?: string; auto_applied?: boolean; manually_selected?: boolean; application_notes?: string }[];
            setSelectedOverlays(rows.map((o) => ({
              overlayType: o.overlay_type as OverlayType,
              overlaySubtype: (o.overlay_subtype || '') as TransgenderSubtype,
              autoApplied: o.auto_applied ?? false,
              manuallySelected: o.manually_selected ?? false,
              notes: o.application_notes || ''
            })));
            
            const transOverlay = rows.find((o) => o.overlay_type === 'transgender_gender_diverse');
            if (transOverlay?.overlay_subtype) {
              setTransgenderSubtype(transOverlay.overlay_subtype as TransgenderSubtype);
            }
          }
        } else {
          // Create new care plan (auth)
          const { data: newPlan, error: insertErr } = await supabase
            .from('rc_care_plans')
            .insert({ case_id: caseId, plan_type: 'initial', plan_number: 1, status: 'draft' })
            .select('id');
          if (!insertErr && newPlan && Array.isArray(newPlan) && newPlan.length > 0) {
            setCarePlanId((newPlan[0] as { id: string }).id);
          }
        }

        // Get client demographic data (auth)
        const { data: caseResult, error: caseErr } = await supabaseGet<unknown[]>(
          "rc_cases",
          `id=eq.${caseId}&is_superseded=eq.false&select=client_id`
        );
        if (caseErr) throw caseErr;
        if (caseResult && caseResult.length > 0 && (caseResult[0] as { client_id?: string }).client_id) {
          const clientId = (caseResult[0] as { client_id: string }).client_id;
          const { data: clientResult, error: clientErr } = await supabaseGet<unknown[]>(
            "rc_clients",
            `id=eq.${clientId}&select=date_of_birth,gender_identity,sex_at_birth,has_dependents,is_student`
          );
          if (!clientErr && clientResult && clientResult.length > 0) {
            const client = clientResult[0] as { date_of_birth?: string; gender_identity?: string; sex_at_birth?: string; has_dependents?: string; is_student?: string };
            
            if (client.date_of_birth) {
              const dob = new Date(client.date_of_birth);
              const today = new Date();
              const age = Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
              setClientAge(age);
            }
            
            if (client.gender_identity) {
              setClientGenderIdentity(client.gender_identity);
            }
            if (client.sex_at_birth) {
              setClientSexAtBirth(client.sex_at_birth);
            }
            if (client.has_dependents === 'Yes') {
              setHasDependents(true);
            }
            if (client.is_student === 'Yes') {
              setIsStudent(true);
            }
          }
        }

        setStatus("Loaded client data and overlay selections.");
      } catch (error) {
        console.error("Failed to load overlay data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [caseId]);

  // Check if client is transgender/gender-diverse based on their intake
  const isTransgender = clientGenderIdentity.includes('Transgender') || 
                        clientGenderIdentity === 'Non-binary' ||
                        clientGenderIdentity === 'Other';

  // Auto-suggest overlays based on client data
  const getSuggestedOverlays = (): { type: OverlayType; subtype?: TransgenderSubtype }[] => {
    const suggested: { type: OverlayType; subtype?: TransgenderSubtype }[] = [];
    
    // Age-based suggestions
    if (clientAge !== null) {
      if (clientAge >= 60) suggested.push({ type: "geriatric_60_plus" });
      else if (clientAge >= 18 && clientAge <= 24 && isStudent) suggested.push({ type: "student_18_24" });
      else if (clientAge >= 13 && clientAge <= 17) suggested.push({ type: "adolescent_13_17" });
      else if (clientAge >= 3 && clientAge <= 12) suggested.push({ type: "child_3_12" });
      else if (clientAge < 3) suggested.push({ type: "infant_toddler_0_2" });
    }
    
    // Transgender overlay suggestion
    if (isTransgender) {
      let subtype: TransgenderSubtype = "";
      if (clientGenderIdentity === "Transgender Female (MTF)") subtype = "MTF";
      else if (clientGenderIdentity === "Transgender Male (FTM)") subtype = "FTM";
      else if (clientGenderIdentity === "Non-binary") subtype = "Non-binary";
      else subtype = "Other";
      
      suggested.push({ type: "transgender_gender_diverse", subtype });
    }
    
    // Gender-specific overlay (based on sex at birth for biological screenings)
    if (clientSexAtBirth === "Female" && (clientAge === null || clientAge >= 18)) {
      suggested.push({ type: "gender_female" });
    } else if (clientSexAtBirth === "Male" && (clientAge === null || clientAge >= 18)) {
      suggested.push({ type: "gender_male" });
    }
    
    // Caregiver overlay
    if (hasDependents) {
      suggested.push({ type: "caregiver_dependent" });
    }
    
    return suggested;
  };

  const isSelected = (overlayId: OverlayType): boolean => {
    return selectedOverlays.some(s => s.overlayType === overlayId);
  };

  const toggleOverlay = (overlayId: OverlayType) => {
    if (isSelected(overlayId)) {
      setSelectedOverlays(prev => prev.filter(s => s.overlayType !== overlayId));
      if (overlayId === 'transgender_gender_diverse') {
        setTransgenderSubtype("");
      }
    } else {
      const suggested = getSuggestedOverlays();
      const suggestedItem = suggested.find(s => s.type === overlayId);
      
      setSelectedOverlays(prev => [...prev, {
        overlayType: overlayId,
        overlaySubtype: suggestedItem?.subtype || '',
        autoApplied: !!suggestedItem,
        manuallySelected: !suggestedItem,
        notes: ''
      }]);
      
      if (overlayId === 'transgender_gender_diverse' && suggestedItem?.subtype) {
        setTransgenderSubtype(suggestedItem.subtype);
      }
    }
    setStatus(null);
  };

  const updateNotes = (overlayId: OverlayType, notes: string) => {
    onMarkDirty?.();
    setSelectedOverlays(prev => prev.map(s => 
      s.overlayType === overlayId ? { ...s, notes } : s
    ));
  };

  const updateTransgenderSubtype = (subtype: TransgenderSubtype) => {
    onMarkDirty?.();
    setTransgenderSubtype(subtype);
    setSelectedOverlays(prev => prev.map(s => 
      s.overlayType === 'transgender_gender_diverse' ? { ...s, overlaySubtype: subtype } : s
    ));
  };

  const applyAutoSuggestions = () => {
    onMarkDirty?.();
    const suggested = getSuggestedOverlays();
    const newSelections = suggested
      .filter(s => !isSelected(s.type))
      .map(s => ({
        overlayType: s.type,
        overlaySubtype: s.subtype || '',
        autoApplied: true,
        manuallySelected: false,
        notes: ''
      }));
    
    setSelectedOverlays(prev => [...prev, ...newSelections]);
    
    // Set transgender subtype if suggested
    const transSuggestion = suggested.find(s => s.type === 'transgender_gender_diverse');
    if (transSuggestion?.subtype) {
      setTransgenderSubtype(transSuggestion.subtype);
    }
    
    setStatus(`Applied ${newSelections.length} suggested overlay(s).`);
  };

  const handleSave = async () => {
    if (!carePlanId) {
      setStatus("No care plan found. Please try again.");
      return;
    }

    // Validate transgender subtype if transgender overlay is selected
    const transOverlay = selectedOverlays.find(s => s.overlayType === 'transgender_gender_diverse');
    if (transOverlay && !transgenderSubtype) {
      setStatus("⚠️ Please select a gender identity subtype for the Transgender overlay.");
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      const { error: delErr } = await supabase
        .from('rc_overlay_selections')
        .delete()
        .eq('care_plan_id', carePlanId);
      if (delErr) throw delErr;

      if (selectedOverlays.length > 0) {
        const insertData = selectedOverlays.map(s => ({
          care_plan_id: carePlanId,
          overlay_type: s.overlayType,
          overlay_subtype: s.overlayType === 'transgender_gender_diverse' ? transgenderSubtype : null,
          auto_applied: s.autoApplied,
          manually_selected: s.manuallySelected,
          application_notes: s.notes || null,
        }));

        const { error: insErr } = await supabase.from('rc_overlay_selections').insert(insertData);
        if (insErr) throw insErr;
      }

      setStatus(`✓ Saved ${selectedOverlays.length} overlay selection(s) to database.`);
    } catch (error: any) {
      console.error("Failed to save overlay selections:", error);
      setStatus(`Error saving: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const suggestedOverlays = getSuggestedOverlays();

  // Get focus areas for transgender overlay based on subtype
  const getTransgenderFocusAreas = (): FocusAreaGroup[] => {
    if (transgenderSubtype === 'FTM') return FTM_FOCUS_AREAS;
    if (transgenderSubtype === 'MTF') return MTF_FOCUS_AREAS;
    return [];
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading overlay options...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.2rem" }}>
          Condition Overlays (Lenses)
        </h2>
        <p style={{ fontSize: "0.8rem", color: "#64748b", maxWidth: "50rem" }}>
          Select the overlays that apply to this client. Overlays modify the 4Ps assessment criteria 
          and screening requirements based on the client's demographics and circumstances.
          Multiple overlays can be applied and will stack.
        </p>
        {caseId && (
          <p style={{ fontSize: "0.75rem", color: "#0ea5e9", marginTop: "0.25rem" }}>
            Case ID: {caseId}
          </p>
        )}
      </div>

      {/* Client Info Display */}
      <div style={{
        marginBottom: "1rem", padding: "0.75rem", borderRadius: "10px",
        border: "1px solid #e2e8f0", background: "#f8fafc"
      }}>
        <div style={{ fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.85rem" }}>
          Client Demographics (from intake)
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "0.8rem" }}>
          <div>Age: <strong>{clientAge !== null ? `${clientAge} years` : 'Not provided'}</strong></div>
          <div>Gender Identity: <strong>{clientGenderIdentity || 'Not provided'}</strong></div>
          <div>Sex at Birth: <strong>{clientSexAtBirth || 'Not provided'}</strong></div>
          <div>Has Dependents: <strong>{hasDependents ? 'Yes' : 'No'}</strong></div>
          <div>Student: <strong>{isStudent ? 'Yes' : 'No'}</strong></div>
        </div>
        
        {suggestedOverlays.length > 0 && (
          <div style={{ marginTop: "0.75rem" }}>
            <button
              onClick={applyAutoSuggestions}
              disabled={readOnly}
              style={{
                padding: "0.35rem 0.75rem", borderRadius: "6px", border: "1px solid #0ea5e9",
                background: readOnly ? "#f1f5f9" : "#f0f9ff", color: readOnly ? "#94a3b8" : "#0369a1", fontSize: "0.78rem", cursor: readOnly ? "not-allowed" : "pointer"
              }}
            >
              Apply {suggestedOverlays.length} Suggested Overlay(s)
            </button>
            <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "#64748b" }}>
              Based on: {suggestedOverlays.map(s => {
                const opt = OVERLAY_OPTIONS.find(o => o.id === s.type);
                return opt?.name;
              }).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Selected Count */}
      <div style={{
        marginBottom: "1rem", padding: "0.5rem 0.75rem", borderRadius: "8px",
        background: selectedOverlays.length > 0 ? "#dcfce7" : "#f1f5f9",
        border: selectedOverlays.length > 0 ? "1px solid #86efac" : "1px solid #e2e8f0"
      }}>
        <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>
          {selectedOverlays.length} overlay(s) selected
        </span>
        {selectedOverlays.length > 0 && (
          <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", color: "#166534" }}>
            ({selectedOverlays.map(s => OVERLAY_OPTIONS.find(o => o.id === s.overlayType)?.name).join(', ')})
          </span>
        )}
      </div>

      {/* Overlay Options by Category */}
      {["age", "identity", "gender", "role"].map(category => {
        const categoryOverlays = OVERLAY_OPTIONS.filter(o => o.category === category);
        if (categoryOverlays.length === 0) return null;
        
        const categoryTitle = category === "age" ? "Age-Based Overlays" : 
                             category === "identity" ? "Gender Identity Overlays" :
                             category === "gender" ? "Sex-Specific Health Overlays" : 
                             "Role-Based Overlays";
        
        return (
          <div key={category} style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", color: "#374151" }}>
              {categoryTitle}
            </h3>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {categoryOverlays.map(overlay => {
                const selected = isSelected(overlay.id);
                const suggested = suggestedOverlays.some(s => s.type === overlay.id);
                const selection = selectedOverlays.find(s => s.overlayType === overlay.id);
                const isTransOverlay = overlay.id === 'transgender_gender_diverse';
                
                return (
                  <div
                    key={overlay.id}
                    style={{
                      borderRadius: "10px",
                      border: selected ? "2px solid #0ea5e9" : "1px solid #e2e8f0",
                      background: selected ? "#f0f9ff" : "#ffffff",
                      padding: "0.75rem",
                      transition: "all 0.2s"
                    }}
                  >
                    <div 
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer" }}
                      onClick={() => toggleOverlay(overlay.id)}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => {}}
                            style={{ width: "16px", height: "16px" }}
                          />
                          <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{overlay.name}</span>
                          {overlay.ageRange && (
                            <span style={{
                              fontSize: "0.7rem", padding: "0.1rem 0.4rem", borderRadius: "4px",
                              background: "#e0e7ff", color: "#3730a3"
                            }}>
                              {overlay.ageRange}
                            </span>
                          )}
                          {isTransOverlay && (
                            <span style={{
                              fontSize: "0.7rem", padding: "0.1rem 0.4rem", borderRadius: "4px",
                              background: "#fce7f3", color: "#9d174d"
                            }}>
                              🏳️‍⚧️ Gender-Affirming
                            </span>
                          )}
                          {suggested && !selected && (
                            <span style={{
                              fontSize: "0.7rem", padding: "0.1rem 0.4rem", borderRadius: "4px",
                              background: "#fef3c7", color: "#92400e"
                            }}>
                              Suggested
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0.3rem 0 0 1.5rem" }}>
                          {overlay.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Expanded content when selected */}
                    {selected && (
                      <div style={{ marginTop: "0.75rem", marginLeft: "1.5rem" }}>
                        
                        {/* Transgender subtype selector */}
                        {isTransOverlay && (
                          <div style={{ marginBottom: "1rem" }}>
                            {/* Core Principle */}
                            {overlay.corePrinciple && (
                              <div style={{
                                padding: "0.6rem", borderRadius: "6px", marginBottom: "0.75rem",
                                background: "#fdf4ff", border: "1px solid #f0abfc"
                              }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#86198f", marginBottom: "0.25rem" }}>
                                  ⚡ Core Principle
                                </div>
                                <p style={{ fontSize: "0.75rem", color: "#701a75", margin: 0 }}>
                                  {overlay.corePrinciple}
                                </p>
                              </div>
                            )}
                            
                            <div style={{ marginBottom: "0.75rem" }}>
                              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                                Gender Identity Subtype <span style={{ color: "#dc2626" }}>*</span>
                              </label>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                {["FTM", "MTF", "Non-binary", "Other"].map(subtype => (
                                  <button
                                    key={subtype}
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); if (!readOnly) updateTransgenderSubtype(subtype as TransgenderSubtype); }}
                                    disabled={readOnly}
                                    style={{
                                      padding: "0.35rem 0.75rem", borderRadius: "6px",
                                      border: transgenderSubtype === subtype ? "2px solid #9333ea" : "1px solid #d8b4fe",
                                      background: transgenderSubtype === subtype ? "#f3e8ff" : "#ffffff",
                                      color: transgenderSubtype === subtype ? "#7c3aed" : "#6b7280",
                                      fontSize: "0.78rem", cursor: "pointer", fontWeight: transgenderSubtype === subtype ? 600 : 400
                                    }}
                                  >
                                    {subtype === "FTM" ? "Transgender Male (FTM)" :
                                     subtype === "MTF" ? "Transgender Female (MTF)" :
                                     subtype === "Non-binary" ? "Non-binary" : "Other Gender-Diverse"}
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {/* Subtype-specific focus areas */}
                            {(transgenderSubtype === 'FTM' || transgenderSubtype === 'MTF') && (
                              <div style={{ marginTop: "0.75rem" }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>
                                  {transgenderSubtype === 'FTM' ? 'FTM-Specific' : 'MTF-Specific'} Focus Areas:
                                </div>
                                {getTransgenderFocusAreas().map((group, idx) => (
                                  <div key={idx} style={{ marginBottom: "0.5rem" }}>
                                    <div style={{ 
                                      fontSize: "0.73rem", fontWeight: 600, color: "#7c3aed",
                                      display: "flex", alignItems: "center", gap: "0.5rem"
                                    }}>
                                      {group.title}
                                      {group.domain && (
                                        <span style={{ 
                                          fontSize: "0.65rem", padding: "0.1rem 0.3rem", 
                                          borderRadius: "3px", background: "#ede9fe", color: "#5b21b6"
                                        }}>
                                          {group.domain}
                                        </span>
                                      )}
                                    </div>
                                    <ul style={{ margin: "0.2rem 0 0 0", paddingLeft: "1rem", fontSize: "0.72rem", color: "#64748b" }}>
                                      {group.items.map((item, itemIdx) => (
                                        <li key={itemIdx} style={{ marginBottom: "0.15rem" }}>{item}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Universal considerations */}
                            <div style={{ marginTop: "0.75rem" }}>
                              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "0.3rem" }}>
                                Universal Considerations (All Gender Identities):
                              </div>
                              <ul style={{ margin: 0, paddingLeft: "1rem", fontSize: "0.72rem", color: "#64748b" }}>
                                {UNIVERSAL_TRANS_CONSIDERATIONS.map((item, idx) => (
                                  <li key={idx} style={{ marginBottom: "0.15rem" }}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                        
                        {/* Standard focus areas for non-transgender overlays */}
                        {!isTransOverlay && overlay.focusAreas.length > 0 && (
                          <div>
                            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "0.3rem" }}>
                              Focus Areas:
                            </div>
                            <ul style={{ margin: 0, paddingLeft: "1rem", fontSize: "0.75rem", color: "#64748b" }}>
                              {overlay.focusAreas.map((area, idx) => (
                                <li key={idx} style={{ marginBottom: "0.2rem" }}>{area}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Notes for this overlay */}
                        <div style={{ marginTop: "0.5rem" }} onClick={(e) => e.stopPropagation()}>
                          <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.2rem" }}>
                            Application Notes
                          </label>
                          <textarea
                            value={selection?.notes || ''}
                            onChange={(e) => updateNotes(overlay.id, e.target.value)}
                            placeholder="Document why this overlay applies or any special considerations..."
                            rows={2}
                            style={{
                              width: "100%", borderRadius: "6px", border: "1px solid #cbd5e1",
                              padding: "0.35rem", fontSize: "0.78rem", resize: "vertical"
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Save Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
        <button
          onClick={handleSave}
          disabled={saving || readOnly}
          title={readOnly ? RN_VIEW_ONLY_TOOLTIP : undefined}
          style={{
            padding: "0.45rem 1rem", borderRadius: "999px", border: "none",
            background: saving || readOnly ? "#94a3b8" : "#0f2a6a", color: "#ffffff",
            fontSize: "0.8rem", cursor: saving || readOnly ? "not-allowed" : "pointer"
          }}
        >
          {saving ? "Saving..." : "Save Overlay Selections"}
        </button>
        {status && (
          <div style={{
            fontSize: "0.76rem",
            color: status.startsWith("✓") ? "#16a34a" : status.startsWith("Error") || status.startsWith("⚠️") ? "#dc2626" : "#0369a1",
            maxWidth: "60%"
          }}>
            {status}
          </div>
        )}
      </div>

      <div style={{ marginTop: "1rem", fontSize: "0.7rem", color: "#94a3b8", textAlign: "right" }}>
        💾 Data saves to Supabase (rc_overlay_selections table)
        {carePlanId && ` • Care Plan ID: ${carePlanId.slice(0, 8)}...`}
      </div>
    </div>
  );
};

export default OverlaySelectionScreen;
