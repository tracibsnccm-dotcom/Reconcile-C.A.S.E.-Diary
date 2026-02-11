// src/domain/reconcileDomain.ts
// Reconcile C.A.R.E. — Domain Dictionary (single source of truth)
//
// This file defines the core clinical/operational vocab so we don't
// re-invent labels or frameworks in each component.
//
// Canonical 4Ps, 10-Vs, crisis categories, urgency levels,
// and common RN contact/routing options.

// -------------------------------
// 4Ps — Canonical
// -------------------------------

export const FOUR_PS = [
  "Physical",
  "Psychological",
  "Psychosocial",
  "Professional",
] as const;

export type FourP = (typeof FOUR_PS)[number];

// -------------------------------
// 10-Vs — High-level list
// (These names can be refined, but they all live here.)
// -------------------------------

// Instead of defining labels here, we IMPORT the official 10-Vs
export type { TenV } from "./tenVs";
export { TEN_VS_ORDERED, TEN_VS_DICTIONARY } from "./tenVs";


// -------------------------------
// Crisis Categories
// (Must stay aligned with crisisCategory.ts usage.)
// -------------------------------

export const CRISIS_CATEGORY_OPTIONS = [
  {
    key: "behavioral_suicide",
    label: "Behavioral / Suicide / Self-harm",
  },
  {
    key: "medical",
    label: "Medical Emergency",
  },
  {
    key: "violence_assault",
    label: "Violence / Assault / Safety",
  },
  {
    key: "other",
    label: "Other / Unsure",
  },
] as const;

export type CrisisCategoryCode =
  (typeof CRISIS_CATEGORY_OPTIONS)[number]["key"];

// -------------------------------
// Urgency Levels (Buddy → System)
// -------------------------------

export const URGENCY_LEVELS = ["low", "moderate", "high"] as const;

export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

// -------------------------------
// RN Contact Types & Focus
// (Used in RN Follow-Up form etc.)
// -------------------------------

export const CONTACT_TYPES = [
  "Phone – Outbound",
  "Phone – Inbound",
  "Video Visit",
  "Portal Message",
  "In-Person",
  "Other",
] as const;

export type ContactType = (typeof CONTACT_TYPES)[number];

export const CONTACT_FOCUS_OPTIONS = [
  "Routine Follow-Up",
  "New Symptom",
  "Medication Issue",
  "Return to Work / Function",
  "Provider Coordination",
  "Benefits / Financial",
] as const;

export type ContactFocus = (typeof CONTACT_FOCUS_OPTIONS)[number];

// -------------------------------
// RN Follow-Up Timeframes & Routing
// -------------------------------

export const FOLLOW_UP_TIMEFRAMES = [
  "1–3 days",
  "1 week",
  "2 weeks",
  "1 month",
  "As needed / PRN",
] as const;

export type FollowUpTimeframe = (typeof FOLLOW_UP_TIMEFRAMES)[number];

export const ROUTING_OPTIONS = [
  "None",
  "Notify Attorney",
  "Notify Provider",
  "Notify Internal Supervisor",
] as const;

export type RoutingOption = (typeof ROUTING_OPTIONS)[number];
