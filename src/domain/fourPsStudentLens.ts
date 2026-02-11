// src/domain/fourPsStudentLens.ts

// Shared stability stages for the 4Ps model
export type StabilityStage = 1 | 2 | 3 | 4 | 5;

export interface StudentLensRow {
  pillar: "P1" | "P2" | "P3" | "P4";
  stage: StabilityStage;
  stageLabel: string; // e.g. "Crisis/Survival Mode"
  generalDescription: string;
  studentDescription: string;
}

// Full Student Lens table derived from your 4Ps Appendix A
// (college / young adult lens, age ~18–24)
export const STUDENT_LENS_ROWS: StudentLensRow[] = [
  // P1 – Physical Wellness (Student Lens)
  {
    pillar: "P1",
    stage: 5,
    stageLabel: "Optimal / Fulfillment",
    generalDescription:
      "Peak physical health, no significant limitations, proactive with prevention.",
    studentDescription:
      "Healthy, energetic, maintains good sleep, diet, and exercise. Keeps up with vaccines and screenings; practices safer sex consistently."
  },
  {
    pillar: "P1",
    stage: 4,
    stageLabel: "Sustainable / Growth",
    generalDescription:
      "Stable health; chronic conditions, if present, are well-controlled.",
    studentDescription:
      "Chronic issues like asthma or migraines are managed; has a regular provider and generally stays current with preventive and sexual health care."
  },
  {
    pillar: "P1",
    stage: 3,
    stageLabel: "Managed / Maintenance",
    generalDescription:
      "Health is fragile and needs active management; symptoms interfere at times.",
    studentDescription:
      "Illness or chronic condition causes missed class or activities. Sleep, nutrition, or risky behaviors (like unprotected sex) are slipping, but they still seek care."
  },
  {
    pillar: "P1",
    stage: 2,
    stageLabel: "Emergent Instability",
    generalDescription:
      "Unstable health with frequent crises or urgent care needs.",
    studentDescription:
      "Conditions like eating disorders or untreated infections are worsening. ER or urgent visits are common; pregnancy or STI issues create major stress."
  },
  {
    pillar: "P1",
    stage: 1,
    stageLabel: "Crisis / Survival Mode",
    generalDescription:
      "Critical illness or injury; basic health needs are not sustainable.",
    studentDescription:
      "Life-threatening illness or injury, medical leave, or severe neglect of care. Unable to safely continue school without intensive support."
  },

  // P2 – Psychological Wellness (Student Lens)
  {
    pillar: "P2",
    stage: 5,
    stageLabel: "Optimal / Fulfillment",
    generalDescription:
      "Strong mental health, effective coping, and high emotional resilience.",
    studentDescription:
      "Handles academic and social stress well, has healthy outlets and support, and does not rely on substances to cope."
  },
  {
    pillar: "P2",
    stage: 4,
    stageLabel: "Sustainable / Growth",
    generalDescription:
      "Mental health conditions are present but well-managed with minimal impact.",
    studentDescription:
      "Conditions like anxiety or ADHD are stable with therapy or medication. Functioning is good at school and socially; substance use is limited and not a main coping tool."
  },
  {
    pillar: "P2",
    stage: 3,
    stageLabel: "Managed / Maintenance",
    generalDescription:
      "Symptoms flare at times and can interfere with daily functioning.",
    studentDescription:
      "\"Struggling student\" pattern: stress, mood shifts, homesickness or grief affecting grades and motivation. May use alcohol or drugs to ease anxiety and feels guilty about it."
  },
  {
    pillar: "P2",
    stage: 2,
    stageLabel: "Emergent Instability",
    generalDescription:
      "Severe symptoms, frequent crises, and difficulty managing responsibilities.",
    studentDescription:
      "\"Student in crisis\": major depression, panic attacks, or early psychosis that blocks class participation. Substance use is escalating and risky."
  },
  {
    pillar: "P2",
    stage: 1,
    stageLabel: "Crisis / Survival Mode",
    generalDescription:
      "Extreme distress, danger to self or others, or inability to access care.",
    studentDescription:
      "\"Student at acute risk\": non-functional, suicidal, violent, or in substance-induced psychosis. Needs immediate, intensive intervention to stay safe."
  },

  // P3 – Psychosocial Wellness (Student Lens)
  {
    pillar: "P3",
    stage: 5,
    stageLabel: "Optimal / Fulfillment",
    generalDescription:
      "Safe, stable environment and strong sense of belonging.",
    studentDescription:
      "Safe housing, strong campus community ties, and reliable friendships and/or a supportive relationship."
  },
  {
    pillar: "P3",
    stage: 4,
    stageLabel: "Sustainable / Growth",
    generalDescription:
      "Stable social supports and environment; basic needs are met.",
    studentDescription:
      "Stable dorm/apartment, consistent food access, supportive peers and family. Typical stress is present but manageable."
  },
  {
    pillar: "P3",
    stage: 3,
    stageLabel: "Managed / Maintenance",
    generalDescription:
      "Environment and relationships are intact but strained or fragile.",
    studentDescription:
      "Social isolation, conflict in friend group or relationship, or a tense living situation with roommates. Still functioning, but feels disconnected or stretched thin."
  },
  {
    pillar: "P3",
    stage: 2,
    stageLabel: "Emergent Instability",
    generalDescription:
      "Active hardships around housing, food, safety, or belonging.",
    studentDescription:
      "Couch-surfing, food insecurity, bullying, harassment, or clear marginalization. Very limited or unreliable support network."
  },
  {
    pillar: "P3",
    stage: 1,
    stageLabel: "Crisis / Survival Mode",
    generalDescription:
      "Dangerous or severely deprived environment with high trauma risk.",
    studentDescription:
      "Homeless or in unsafe housing. Severe food insecurity. Survivor of assault or ongoing abuse. Day-to-day environment is actively harmful."
  },

  // P4 – Professional Wellness (Student Lens)
  {
    pillar: "P4",
    stage: 5,
    stageLabel: "Optimal / Fulfillment",
    generalDescription:
      "High meaning and stability in vocation or academic path.",
    studentDescription:
      "\"Thriving scholar\": engaged, performing at a high level, possibly mentoring or leading. Funding is secure, allowing focus on learning."
  },
  {
    pillar: "P4",
    stage: 4,
    stageLabel: "Sustainable / Growth",
    generalDescription:
      "Solid path with room to grow; financial stress is manageable.",
    studentDescription:
      "\"Secure student\": satisfied with major, feels hopeful about career. Tuition and living costs are covered without constant crisis."
  },
  {
    pillar: "P4",
    stage: 3,
    stageLabel: "Managed / Maintenance",
    generalDescription:
      "In transition or under strain; some stability, some risk.",
    studentDescription:
      "\"Struggling student\": heavy academic load, major doubts, or work hours that undermine study time. Debt or financial pressure is present but not yet catastrophic."
  },
  {
    pillar: "P4",
    stage: 2,
    stageLabel: "Emergent Instability",
    generalDescription:
      "Significant threats to financial or vocational stability.",
    studentDescription:
      "\"At-risk student\": financial aid is not enough, risking housing or food. Poor fit or failing major, actively thinking about dropping out."
  },
  {
    pillar: "P4",
    stage: 1,
    stageLabel: "Crisis / Survival Mode",
    generalDescription:
      "No viable path forward; severe financial or vocational crisis.",
    studentDescription:
      "\"Student in crisis\": has dropped out or is on the edge of doing so. Cannot sustain education due to finances or life barriers and feels hopeless about the future."
  }
];
