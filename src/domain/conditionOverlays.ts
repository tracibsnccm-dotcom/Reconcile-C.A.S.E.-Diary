// src/domain/conditionOverlays.ts
// ============================================================================
// RECONCILE C.A.R.E. - CONDITION OVERLAYS (LENSES)
// ============================================================================
// 
// COPYRIGHT © 2024-2025 Nurses as Entrepreneurs / Traci B. SNCCM
// This is proprietary intellectual property. All rights reserved.
//
// VERSION: 1.0.0
// LAST UPDATED: January 13, 2026
// 
// These "lenses" ensure the 4Ps assessment is calibrated to the specific 
// risk factors of different demographics and conditions.
// ============================================================================

import { FourPsPillar, StabilityScore } from "./carePlanLogicEngine";

// ============================================================================
// TYPES
// ============================================================================

export type OverlayType = 
  | "geriatric_60_plus"
  | "caregiver_dependent"
  | "student_18_24"
  | "adolescent_13_17"
  | "child_3_12"
  | "infant_toddler_0_2"
  | "gender_female"
  | "gender_male";

export interface OverlayDefinition {
  id: OverlayType;
  name: string;
  ageRange?: string;
  description: string;
  focusAreas: OverlayFocusArea[];
  stageModifications?: StageModification[];
  screeningItems?: ScreeningItem[];
  specialPrinciples?: string[];
}

export interface OverlayFocusArea {
  area: string;
  primaryDomain: FourPsPillar;
  screeningPoints: string[];
}

export interface StageModification {
  pillar: FourPsPillar;
  stage: StabilityScore;
  originalDefinition: string;
  modifiedDefinition: string;
  triggers: string[];
}

export interface ScreeningItem {
  pillar: FourPsPillar;
  question: string;
  assessmentAction: string;
}

// ============================================================================
// 1. THE 60+ OVERLAY: GERIATRIC PRECISION
// ============================================================================

export const GERIATRIC_60_PLUS_OVERLAY: OverlayDefinition = {
  id: "geriatric_60_plus",
  name: "60+ Overlay: Geriatric Precision",
  ageRange: "60+",
  description: "Integrates critical, evidence-based focus areas for clients aged 60 and over.",
  
  focusAreas: [
    {
      area: "Functional Capacity & Safety",
      primaryDomain: "P1",
      screeningPoints: [
        "Daily Activities (ADLs/IADLs)",
        "Fall Risk Screening",
        "Gait/Mobility status"
      ]
    },
    {
      area: "Polypharmacy & Risk Review",
      primaryDomain: "P1",
      screeningPoints: [
        "Review of all medications",
        "Screening for high-risk medications (e.g., BEERS Criteria)"
      ]
    },
    {
      area: "Cognitive & Behavioral Health",
      primaryDomain: "P2",
      screeningPoints: [
        "Mandatory screening for Delirium",
        "Screening for Depression",
        "Signs of Dementia"
      ]
    },
    {
      area: "Client Goals & Preferences",
      primaryDomain: "P3", // Also P4
      screeningPoints: [
        "Elicits the client's personal 'What Matters' goals",
        "Example: 'maintain independence'"
      ]
    }
  ],
  
  stageModifications: [
    {
      pillar: "P1",
      stage: 2,
      originalDefinition: "Health is unstable with frequent crises or urgent care needs.",
      modifiedDefinition: "Health is unstable, AND: Active Mobility deficit (e.g., history of two or more falls in the last month) OR the presence of Polypharmacy (5+ medications) with documented high-risk drug interaction.",
      triggers: [
        "Two or more falls in last month",
        "Polypharmacy (5+ medications)",
        "High-risk drug interaction documented"
      ]
    }
  ]
};

// ============================================================================
// 2. SYMMETRICAL FAMILY ASSESSMENT MODEL (Caregiver/Dependent Overlay)
// ============================================================================

export const CAREGIVER_DEPENDENT_OVERLAY: OverlayDefinition = {
  id: "caregiver_dependent",
  name: "Symmetrical Family Assessment Model",
  description: "Ensures the risk of dependents is factored into the adult's instability score and the adult's instability is factored into the child's score.",
  
  focusAreas: [],
  
  screeningItems: [
    {
      pillar: "P1",
      question: "Is the client's physical condition severe enough to impact their ability to provide basic physical supervision/care for dependents?",
      assessmentAction: "Assess functional capacity for caregiving duties"
    },
    {
      pillar: "P2",
      question: "Does the client's current mental/emotional status pose a risk of emotional or physical neglect to dependents?",
      assessmentAction: "Screen for safety/neglect risk to dependents"
    },
    {
      pillar: "P3",
      question: "Does the client's housing, income, or financial strain jeopardize the stability/safety of the entire family unit?",
      assessmentAction: "Assess structural/economic stability for dependents"
    },
    {
      pillar: "P4",
      question: "Do caregiving responsibilities for dependents create a direct conflict that jeopardizes the client's own recovery, work, or treatment adherence?",
      assessmentAction: "Assess advocacy and resource burden"
    }
  ],
  
  specialPrinciples: [
    "PRINCIPLE OF SYMMETRICAL RISK - For a Child (Dependent): The child's initial stability score in each P can be no higher than the Caregiver's corresponding pillar score. This reflects the viability of their care environment.",
    "PRINCIPLE OF SYMMETRICAL RISK - For an Adult (Caregiver): The adult's Stability Stage definitions are expanded to include dependent risk, automatically lowering the score to reflect the functional severity of their crisis."
  ]
};

// ============================================================================
// 3. THE STUDENT LENS (Ages 18-24)
// ============================================================================

export const STUDENT_18_24_OVERLAY: OverlayDefinition = {
  id: "student_18_24",
  name: "Student Lens",
  ageRange: "18-24",
  description: "A tailored framework for assessing the unique drivers of health in a student population.",
  
  focusAreas: [
    {
      area: "Academic/Professional Path",
      primaryDomain: "P4",
      screeningPoints: [
        "Academic engagement and performance",
        "Financial aid and tuition coverage",
        "Career path clarity",
        "Student debt burden"
      ]
    }
  ],
  
  stageModifications: [
    // P1 Physical - Student
    {
      pillar: "P1",
      stage: 5,
      originalDefinition: "Peak physical health, no significant limitations.",
      modifiedDefinition: "Peak physical health and resilience. Excels in healthy habits.",
      triggers: []
    },
    {
      pillar: "P1",
      stage: 4,
      originalDefinition: "Stable health; chronic conditions well-controlled.",
      modifiedDefinition: "Stable health. Chronic conditions well-controlled.",
      triggers: []
    },
    {
      pillar: "P1",
      stage: 3,
      originalDefinition: "Health is fragile and needs active management.",
      modifiedDefinition: "Health is fragile. Acute illness causes missed classes.",
      triggers: ["Missed classes due to illness"]
    },
    {
      pillar: "P1",
      stage: 2,
      originalDefinition: "Unstable health with frequent crises.",
      modifiedDefinition: "Health is unstable. Chronic condition severely exacerbated.",
      triggers: ["Severe exacerbation of chronic condition"]
    },
    {
      pillar: "P1",
      stage: 1,
      originalDefinition: "Critical illness or injury.",
      modifiedDefinition: "Critical, life-threatening illness requiring medical leave.",
      triggers: ["Medical leave required"]
    },
    
    // P2 Psychological - Student
    {
      pillar: "P2",
      stage: 5,
      originalDefinition: "Strong mental health, effective coping.",
      modifiedDefinition: "Strong mental well-being. Thrives emotionally. Manages stress effectively.",
      triggers: []
    },
    {
      pillar: "P2",
      stage: 4,
      originalDefinition: "Mental health conditions present but well-managed.",
      modifiedDefinition: "Diagnosed condition is well-controlled with minimal impact.",
      triggers: []
    },
    {
      pillar: "P2",
      stage: 3,
      originalDefinition: "Symptoms flare at times.",
      modifiedDefinition: "'The Struggling Student.' Acute stress affects grades and motivation.",
      triggers: ["Stress affecting grades", "Declining motivation"]
    },
    {
      pillar: "P2",
      stage: 2,
      originalDefinition: "Severe symptoms, frequent crises.",
      modifiedDefinition: "'The Student in Crisis.' Severe depressive episode making coursework impossible.",
      triggers: ["Severe depression", "Unable to complete coursework"]
    },
    {
      pillar: "P2",
      stage: 1,
      originalDefinition: "Extreme distress, danger to self or others.",
      modifiedDefinition: "'The Student at Acute Risk.' Non-functional, a danger to self/others.",
      triggers: ["Danger to self", "Danger to others", "Non-functional"]
    },
    
    // P3 Psychosocial - Student
    {
      pillar: "P3",
      stage: 5,
      originalDefinition: "Safe, stable environment and strong belonging.",
      modifiedDefinition: "Safe, stable housing. Deeply involved in a supportive campus community.",
      triggers: []
    },
    {
      pillar: "P3",
      stage: 4,
      originalDefinition: "Stable social supports and environment.",
      modifiedDefinition: "Stable environment. Satisfied with relationships.",
      triggers: []
    },
    {
      pillar: "P3",
      stage: 3,
      originalDefinition: "Environment and relationships intact but strained.",
      modifiedDefinition: "Environment is stable but strained. Socially isolated.",
      triggers: ["Social isolation", "Strained relationships"]
    },
    {
      pillar: "P3",
      stage: 2,
      originalDefinition: "Active hardships around housing, food, safety.",
      modifiedDefinition: "Active hardships. Active housing/food insecurity. Profoundly isolated.",
      triggers: ["Housing insecurity", "Food insecurity", "Profound isolation"]
    },
    {
      pillar: "P3",
      stage: 1,
      originalDefinition: "Dangerous or severely deprived environment.",
      modifiedDefinition: "Environment is dangerous or non-existent. Homelessness.",
      triggers: ["Homelessness", "Dangerous environment"]
    },
    
    // P4 Professional - Student
    {
      pillar: "P4",
      stage: 5,
      originalDefinition: "High meaning and stability in vocation.",
      modifiedDefinition: "'The Thriving Scholar.' Academically thriving, education is deeply purposeful. Funding and career path are secure.",
      triggers: []
    },
    {
      pillar: "P4",
      stage: 4,
      originalDefinition: "Solid path with room to grow.",
      modifiedDefinition: "'The Secure Student.' Satisfied with academic path. Tuition and living costs covered without overwhelming stress. Clear, positive career outlook.",
      triggers: []
    },
    {
      pillar: "P4",
      stage: 3,
      originalDefinition: "In transition or under strain.",
      modifiedDefinition: "'The Straining Student.' High academic stress, significant debt, uncertainty about major/career path.",
      triggers: ["High academic stress", "Significant debt", "Career uncertainty"]
    },
    {
      pillar: "P4",
      stage: 2,
      originalDefinition: "Significant threats to financial or vocational stability.",
      modifiedDefinition: "'The At-Risk Student.' Insufficient financial aid leading to housing/food insecurity. Academic performance suffering. Actively considering dropping out.",
      triggers: ["Insufficient financial aid", "Considering dropping out"]
    },
    {
      pillar: "P4",
      stage: 1,
      originalDefinition: "No viable path forward.",
      modifiedDefinition: "'The Student in Crisis.' Dropped out or on the verge due to financial/logistical collapse.",
      triggers: ["Dropped out", "Financial collapse", "Logistical collapse"]
    }
  ]
};

// ============================================================================
// 4. PEDIATRIC FRAMEWORKS
// ============================================================================

// 4a. Adolescent Lens (Ages 13-17)
export const ADOLESCENT_13_17_OVERLAY: OverlayDefinition = {
  id: "adolescent_13_17",
  name: "Adolescent Lens",
  ageRange: "13-17",
  description: "Framework for assessing adolescent health drivers including identity, peer influence, and academic engagement.",
  
  focusAreas: [
    {
      area: "Health Maintenance & Risk Behaviors",
      primaryDomain: "P1",
      screeningPoints: [
        "Verify Immunization Record",
        "Assess barriers to medication adherence",
        "Screen for substance use"
      ]
    },
    {
      area: "Identity, Coping, Emotional Regulation",
      primaryDomain: "P2",
      screeningPoints: [
        "Complete PHQ-9/GAD-7",
        "Refer to specialty trauma-informed therapy"
      ]
    },
    {
      area: "Peer Influence & Family Dynamics",
      primaryDomain: "P3",
      screeningPoints: [
        "Assess social media use and peer pressure",
        "Evaluate family support structure and conflict"
      ]
    },
    {
      area: "Academic Engagement & Future Goals",
      primaryDomain: "P4",
      screeningPoints: [
        "Contact the school social worker/guidance counselor",
        "Review and confirm the efficacy of IEP accommodations",
        "Discuss vocational interests or college plans"
      ]
    }
  ]
};

// 4b. Child Lens (Ages 3-12)
export const CHILD_3_12_OVERLAY: OverlayDefinition = {
  id: "child_3_12",
  name: "Child Lens",
  ageRange: "3-12",
  description: "Framework for assessing child health focusing on developmental milestones, behavioral health, and family support.",
  
  focusAreas: [
    {
      area: "Developmental Milestones & Health Maintenance",
      primaryDomain: "P1",
      screeningPoints: [
        "Verify Immunization Record",
        "Refer to OT/PT/Speech for functional or developmental deficits"
      ]
    },
    {
      area: "Affect Regulation, Trauma, Behavioral Health",
      primaryDomain: "P2",
      screeningPoints: [
        "Screen caregivers for parenting stress",
        "Verify early intervention/behavioral health referrals are in progress"
      ]
    },
    {
      area: "Family Support & Neglect",
      primaryDomain: "P3",
      screeningPoints: [
        "Initiate mandatory reporting if abuse/neglect is suspected (CPS)",
        "Assess for bullying at school or daycare"
      ]
    },
    {
      area: "Pedagogical",
      primaryDomain: "P4",
      screeningPoints: [
        "N/A by developmental stage",
        "The child's primary 'role' is growth and learning through play and foundational education, which is captured in the other domains"
      ]
    }
  ]
};

// 4c. Infant/Toddler Lens (Ages 0-2)
export const INFANT_TODDLER_0_2_OVERLAY: OverlayDefinition = {
  id: "infant_toddler_0_2",
  name: "Infant/Toddler Lens",
  ageRange: "0-2",
  description: "Framework for assessing infant/toddler health focusing on growth, attachment, and caregiver support.",
  
  focusAreas: [
    {
      area: "Growth & Health Maintenance",
      primaryDomain: "P1",
      screeningPoints: [
        "Verify Immunization Record",
        "Refer immediately to pediatric dietician",
        "Verify WIC/SNAP enrollment"
      ]
    },
    {
      area: "Attachment & Responsiveness",
      primaryDomain: "P2",
      screeningPoints: [
        "Observe caregiver-infant interaction",
        "Refer family to Infant Mental Health services or dyadic therapy"
      ]
    },
    {
      area: "Caregiver Support & Basic Needs",
      primaryDomain: "P3",
      screeningPoints: [
        "Connect caregivers to home visiting programs and respite care",
        "Assess for basic needs"
      ]
    },
    {
      area: "Pedagogical",
      primaryDomain: "P4",
      screeningPoints: [
        "N/A by developmental stage",
        "The infant's primary 'role' is secure attachment and sensorimotor development, which is fully captured in the Physical and Psychological domains"
      ]
    }
  ]
};

// ============================================================================
// 5. GENDER-SPECIFIC HEALTH CONSIDERATIONS (Adults 18+)
// ============================================================================

export const GENDER_FEMALE_OVERLAY: OverlayDefinition = {
  id: "gender_female",
  name: "Gender-Specific Considerations: Female-Assigned Adults",
  ageRange: "18+",
  description: "Health considerations highlighting how biological sex and gender identity influence health drivers for female-assigned adults.",
  
  focusAreas: [
    {
      area: "Physical Health Screening",
      primaryDomain: "P1",
      screeningPoints: [
        "Verify adherence to cervical/breast cancer screening",
        "Bone/Vitamin D review"
      ]
    },
    {
      area: "Psychological Screening",
      primaryDomain: "P2",
      screeningPoints: [
        "Perinatal/Postpartum Mood Screening",
        "Domestic Violence Screening"
      ]
    },
    {
      area: "Psychosocial Assessment",
      primaryDomain: "P3",
      screeningPoints: [
        "Assess for role strain as a primary caregiver",
        "Evaluate access to women's health resources"
      ]
    },
    {
      area: "Professional Assessment",
      primaryDomain: "P4",
      screeningPoints: [
        "Screen for financial impacts of caregiver leave",
        "Assess for gender-based pay inequity or career disruption"
      ]
    }
  ]
};

export const GENDER_MALE_OVERLAY: OverlayDefinition = {
  id: "gender_male",
  name: "Gender-Specific Considerations: Male-Assigned Adults",
  ageRange: "18+",
  description: "Health considerations highlighting how biological sex and gender identity influence health drivers for male-assigned adults.",
  
  focusAreas: [
    {
      area: "Physical Health Screening",
      primaryDomain: "P1",
      screeningPoints: [
        "Testicular/prostate health guidance",
        "Vascular health assessment for high-risk behaviors"
      ]
    },
    {
      area: "Psychological Screening",
      primaryDomain: "P2",
      screeningPoints: [
        "Targeted Substance Use Screening",
        "Address common barriers to emotional expression"
      ]
    },
    {
      area: "Psychosocial Assessment",
      primaryDomain: "P3",
      screeningPoints: [
        "Assess for social isolation and community connectedness",
        "Evaluate paternity leave and family support policies"
      ]
    },
    {
      area: "Professional Assessment",
      primaryDomain: "P4",
      screeningPoints: [
        "Screen for workplace stress linked to primary breadwinner expectations",
        "Assess for hazardous occupational exposures"
      ]
    }
  ]
};

// ============================================================================
// OVERLAY REGISTRY - All overlays in one place
// ============================================================================

export const CONDITION_OVERLAYS: Record<OverlayType, OverlayDefinition> = {
  geriatric_60_plus: GERIATRIC_60_PLUS_OVERLAY,
  caregiver_dependent: CAREGIVER_DEPENDENT_OVERLAY,
  student_18_24: STUDENT_18_24_OVERLAY,
  adolescent_13_17: ADOLESCENT_13_17_OVERLAY,
  child_3_12: CHILD_3_12_OVERLAY,
  infant_toddler_0_2: INFANT_TODDLER_0_2_OVERLAY,
  gender_female: GENDER_FEMALE_OVERLAY,
  gender_male: GENDER_MALE_OVERLAY,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get applicable overlays based on client demographics
 */
export function getApplicableOverlays(
  age: number,
  gender?: "female" | "male" | "other",
  hasDependent?: boolean
): OverlayType[] {
  const overlays: OverlayType[] = [];
  
  // Age-based overlays
  if (age >= 60) {
    overlays.push("geriatric_60_plus");
  } else if (age >= 18 && age <= 24) {
    overlays.push("student_18_24");
  } else if (age >= 13 && age <= 17) {
    overlays.push("adolescent_13_17");
  } else if (age >= 3 && age <= 12) {
    overlays.push("child_3_12");
  } else if (age >= 0 && age < 3) {
    overlays.push("infant_toddler_0_2");
  }
  
  // Gender-based overlays (adults only)
  if (age >= 18) {
    if (gender === "female") {
      overlays.push("gender_female");
    } else if (gender === "male") {
      overlays.push("gender_male");
    }
  }
  
  // Caregiver overlay
  if (hasDependent) {
    overlays.push("caregiver_dependent");
  }
  
  return overlays;
}

/**
 * Get all screening items for a given overlay
 */
export function getOverlayScreeningItems(overlayId: OverlayType): ScreeningItem[] {
  const overlay = CONDITION_OVERLAYS[overlayId];
  return overlay?.screeningItems || [];
}

/**
 * Get modified stage definition if overlay applies
 */
export function getModifiedStageDefinition(
  overlayId: OverlayType,
  pillar: FourPsPillar,
  stage: StabilityScore
): StageModification | null {
  const overlay = CONDITION_OVERLAYS[overlayId];
  if (!overlay?.stageModifications) return null;
  
  return overlay.stageModifications.find(
    mod => mod.pillar === pillar && mod.stage === stage
  ) || null;
}
