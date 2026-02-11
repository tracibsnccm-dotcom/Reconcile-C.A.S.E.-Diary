// src/constants/demoCase.ts
import { CaseSummary } from "./reconcileFramework";

/**
 * Demo Case #001 — Attorney-facing sample data
 * This is local-only demo content to prevent an "empty" attorney experience.
 * It uses the same CaseSummary shape the RN modules will eventually publish.
 */
export const DEMO_CASE_SUMMARY: CaseSummary = {
  updatedAt: new Date().toISOString(),

  fourPs: {
    overallScore: 2,
    dimensions: [
      {
        id: "physical",
        score: 2,
        note:
          "Ongoing pain + functional limitation; treatment interrupted by access barriers. Objective care progression is incomplete.",
      },
      {
        id: "psychological",
        score: 3,
        note:
          "Situational anxiety/frustration; sleep disrupted. No evidence of psychosis/mania; coping variable.",
      },
      {
        id: "psychosocial",
        score: 1,
        note:
          "Childcare/transport instability + financial strain disrupting appointments and adherence. Support system inconsistent.",
      },
      {
        id: "professional",
        score: 2,
        note:
          "Work capacity reduced; missed shifts; job demands exceed current tolerance; risk of income disruption.",
      },
    ],
    narrative:
      "DEMO CASE #001 — 4Ps Summary:\n\n"
      + "The client reports persistent pain with reduced functional tolerance and intermittent treatment gaps. "
      + "Psychological factors reflect expected stress response to injury and uncertainty, but not a primary limiting factor at this stage. "
      + "The dominant destabilizer is Psychosocial: transportation loss, childcare complications, and financial pressure have created repeated delays in follow-up care. "
      + "Professional stability is compromised by missed work and difficulty meeting physical demands.\n\n"
      + "Clinical implication for the case: the lowest (most urgent) stability domain is Psychosocial, and care continuity is at risk unless external disruptions are addressed and documented.",
  },

  tenVs: {
    overallScore: 2,
    dimensions: [
      {
        id: "voiceView",
        score: 4,
        note:
          "Client story is coherent and consistent; able to describe symptom pattern, barriers, and goals with reasonable clarity.",
      },
      {
        id: "viability",
        score: 2,
        note:
          "Care plan is conceptually appropriate but not yet sustainable due to missed visits, delayed referrals, and inconsistent access.",
      },
      {
        id: "vision",
        score: 3,
        note:
          "Goals are present (pain control, return to baseline, return to work), but timeline and sequencing require tightening.",
      },
      {
        id: "veracity",
        score: 4,
        note:
          "Reported symptoms align with observed limitations; record appears consistent, though some documentation gaps exist from missed visits.",
      },
      {
        id: "versatility",
        score: 2,
        note:
          "Plan needs alternate routes (telehealth, transport support, expedited scheduling). Current approach breaks when barriers occur.",
      },
      {
        id: "vitality",
        score: 2,
        note:
          "Functional stamina reduced; pain flares with activity; requires pacing and targeted restoration approach.",
      },
      {
        id: "vigilance",
        score: 3,
        note:
          "Follow-through is variable; reminders and structured check-ins are needed to prevent drop-off.",
      },
      {
        id: "verification",
        score: 3,
        note:
          "Some events are verified; still needs tighter record capture (appointments attended/missed, medication response, symptom trend).",
      },
      {
        id: "value",
        score: 4,
        note:
          "Interventions likely to provide benefit, but value depends on continuity; gaps reduce measurable progress and documentation strength.",
      },
      {
        id: "validation",
        score: 4,
        note:
          "Client experience is acknowledged; education and expectation-setting improve engagement and reduce perceived dismissiveness.",
      },
    ],
    narrative:
      "DEMO CASE #001 — 10-Vs Summary:\n\n"
      + "The client’s story is coherent and clinically plausible (Voice/View), and key facts generally align (Veracity). "
      + "The primary issue is viability of the care plan in real life: external barriers are repeatedly disrupting follow-through, which creates gaps in documentation and delays in progression. "
      + "This is not a ‘quick buck’ profile; it is a care access and continuity problem that must be documented and addressed.\n\n"
      + "Care planning priorities: build alternate routes for access (transport solutions/telehealth options), tighten sequencing (Vision), "
      + "increase monitoring cadence (Vigilance), and strengthen record capture (Verification) to preserve medical necessity and continuity.",
  },

  sdoh: {
    overallScore: 1,
    narrative:
      "DEMO CASE #001 — SDOH Summary:\n\n"
      + "External disruptions are the dominant driver of delays: transportation loss, childcare burden, and financial strain are directly interfering with appointment attendance, "
      + "timely follow-up, and medication/treatment adherence.\n\n"
      + "Why this matters: documenting SDOH protects the integrity and credibility of the client by demonstrating that gaps in care were driven by real constraints—not lack of effort, exaggeration, "
      + "or opportunism. This preserves the accuracy of the medical record and explains delayed healing when evaluating damages and settlement value.",
  },

  crisis: {
    severityScore: 3,
  },
};
