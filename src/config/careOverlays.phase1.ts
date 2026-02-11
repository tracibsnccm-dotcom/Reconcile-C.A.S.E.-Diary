/**
 * Phase 1 Care Overlays (Lenses) - Source of Truth
 * 
 * Canonical overlay definitions for V3 Care Plan assembly.
 * Each overlay provides guidance organized by P1-P4 pillars.
 * Pediatric overlays use "Pedagogical" for P4 instead of "Professional".
 */

export type CareOverlayPhase1 = {
  id: string;
  title: string;
  appliesTo: string; // human readable
  isPediatric?: boolean;
  p4LabelOverride?: "Pedagogical" | "Professional";
  guidanceByP: {
    P1: string[];
    P2: string[];
    P3: string[];
    P4: string[];
  };
  notes?: string[];
};

export const CARE_OVERLAYS_PHASE_1: CareOverlayPhase1[] = [
  {
    id: "geriatric-60-plus",
    title: "60+ Overlay (Geriatric Precision)",
    appliesTo: "Adults 60+",
    guidanceByP: {
      P1: [
        "Functional Capacity & Safety: Daily Activities (ADLs/IADLs), Fall Risk Screening, Gait/Mobility status.",
        "Polypharmacy & Risk Review: Review of all medications; screen for high-risk meds (e.g., BEERS Criteria).",
        "Stage modification example bullet (keep as note or P1 guidance): Stage 2 modified: instability + mobility deficit (e.g., 2+ falls/month) OR polypharmacy (5+ meds) with documented high-risk interaction."
      ],
      P2: [
        "Cognitive & Behavioral Health: screen for delirium, depression, and signs of dementia."
      ],
      P3: [
        "Client Goals & Preferences ('What Matters' goals like maintaining independence)."
      ],
      P4: [
        "Client Goals & Preferences ('What Matters' goals like maintaining independence)."
      ]
    }
  },
  {
    id: "caregiver-dependent",
    title: "Symmetrical Family Assessment Model (Caregiver/Dependent Overlay)",
    appliesTo: "Caregivers with dependents",
    guidanceByP: {
      P1: [
        "Functional Risk to Dependents: is condition severe enough to impact ability to provide basic physical supervision/care?"
      ],
      P2: [
        "Safety/Neglect Risk to Dependents: does mental/emotional status pose risk of emotional/physical neglect?"
      ],
      P3: [
        "Structural/Economic Stability for Dependents: do housing/income/financial strain jeopardize stability/safety of family unit?"
      ],
      P4: [
        "Advocacy and Resource Burden: do caregiving responsibilities create conflict jeopardizing recovery/work/treatment adherence?"
      ]
    },
    notes: [
      "Principle of Symmetrical Risk: child pillar score cannot be higher than caregiver pillar score.",
      "Adult stage definitions expand to include dependent risk, lowering score to reflect functional crisis severity."
    ]
  },
  {
    id: "student-18-24",
    title: "Student Lens (Ages 18–24)",
    appliesTo: "Ages 18–24",
    guidanceByP: {
      P1: [
        "Health fragility can directly disrupt attendance/engagement (missed classes during acute illness)."
      ],
      P2: [
        "Acute stress can affect grades, motivation, functioning; recognize 'struggling student' patterns."
      ],
      P3: [
        "Housing/food insecurity, isolation, campus support engagement are primary drivers."
      ],
      P4: [
        "Academic/professional path stability, debt/aid sufficiency, career outlook, risk of dropping out are key drivers."
      ]
    }
  },
  {
    id: "adolescent-13-17",
    title: "Adolescent Lens (Ages 13–17)",
    appliesTo: "Ages 13–17",
    isPediatric: true,
    p4LabelOverride: "Pedagogical",
    guidanceByP: {
      P1: [
        "Verify immunization record; assess medication adherence barriers; screen for substance use."
      ],
      P2: [
        "PHQ-9/GAD-7; refer to trauma-informed therapy as appropriate."
      ],
      P3: [
        "Assess social media use/peer pressure; evaluate family support/conflict."
      ],
      P4: [
        "Contact school social worker/guidance; confirm IEP accommodations efficacy; discuss vocational/college plans."
      ]
    }
  },
  {
    id: "child-3-12",
    title: "Child Lens (Ages 3–12)",
    appliesTo: "Ages 3–12",
    isPediatric: true,
    p4LabelOverride: "Pedagogical",
    guidanceByP: {
      P1: [
        "Verify immunization; refer OT/PT/Speech for functional/developmental deficits."
      ],
      P2: [
        "Screen caregivers for parenting stress; confirm early intervention/behavioral health referrals in progress."
      ],
      P3: [
        "Mandatory reporting if abuse/neglect suspected; assess bullying at school/daycare."
      ],
      P4: [
        "N/A by developmental stage; role is growth/learning captured in other domains."
      ]
    }
  },
  {
    id: "infant-toddler-0-2",
    title: "Infant/Toddler Lens (Ages 0–2)",
    appliesTo: "Ages 0–2",
    isPediatric: true,
    p4LabelOverride: "Pedagogical",
    guidanceByP: {
      P1: [
        "Verify immunization; refer pediatric dietician; verify WIC/SNAP enrollment."
      ],
      P2: [
        "Observe caregiver–infant interaction; refer infant mental health/dyadic therapy."
      ],
      P3: [
        "Connect to home visiting/respite; assess for basic needs."
      ],
      P4: [
        "N/A by developmental stage; role is attachment/sensorimotor development captured in P1/P2."
      ]
    }
  },
  {
    id: "gender-specific-adults",
    title: "Gender-Specific Health Considerations for Adults (18+)",
    appliesTo: "Adults 18+",
    guidanceByP: {
      P1: [
        "Female-assigned: Cervical/breast screening adherence; bone/vitamin D review.",
        "Male-assigned: Testicular/prostate guidance; vascular health for high-risk behaviors."
      ],
      P2: [
        "Female-assigned: Perinatal/postpartum mood; domestic violence screening.",
        "Male-assigned: Targeted substance use screening; barriers to emotional expression."
      ],
      P3: [
        "Female-assigned: Role strain as primary caregiver; access to women's health resources.",
        "Male-assigned: Social isolation/community connectedness; paternity leave/family support policies."
      ],
      P4: [
        "Female-assigned: Financial impacts of caregiver leave; gender-based pay inequity; career disruption.",
        "Male-assigned: Workplace stress linked to breadwinner expectations; hazardous occupational exposures."
      ]
    }
  }
];
