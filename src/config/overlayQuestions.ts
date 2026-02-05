// src/config/overlayQuestions.ts
// Client Block 3: Overlay question definitions (INPUTS ONLY).
// No RN logic, scoring, or branching. Stable keys; labels may change.

export type OverlayQuestionType =
  | "text"
  | "textarea"
  | "radio"
  | "checkbox"
  | "select"
  | "number"
  | "date";

export type OverlayQuestion = {
  key: string;
  label: string;
  type: OverlayQuestionType;
  helpText?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  placement?: "intake_wizard" | "care_plan_builder";
};

export const OVERLAY_QUESTIONS: OverlayQuestion[] = [
  {
    key: "overlay.unable_to_reach_reason",
    label: "If we were unable to reach you recently, what was the main reason?",
    type: "select",
    helpText: "Optional. Helps us improve how we contact you.",
    options: [
      { value: "__none__", label: "Not applicable / Prefer not to say" },
      { value: "wrong_number", label: "Wrong or changed phone number" },
      { value: "no_answer", label: "Missed calls / busy" },
      { value: "email_better", label: "Prefer email contact" },
      { value: "timing", label: "Inconvenient timing" },
      { value: "other", label: "Other" },
    ],
    placement: "care_plan_builder",
  },
  {
    key: "overlay.communication_preference",
    label: "How do you prefer we contact you for follow-ups?",
    type: "radio",
    options: [
      { value: "phone", label: "Phone" },
      { value: "email", label: "Email" },
      { value: "text", label: "Text" },
      { value: "any", label: "Any is fine" },
    ],
    placement: "intake_wizard",
  },
  {
    key: "overlay.transportation_barrier",
    label: "Do you have any transportation barriers for appointments?",
    type: "radio",
    options: [
      { value: "no", label: "No" },
      { value: "yes_driving", label: "Yes — limited driving" },
      { value: "yes_rides", label: "Yes — need rides" },
      { value: "yes_other", label: "Yes — other" },
    ],
    placement: "intake_wizard",
  },
  {
    key: "overlay.housing_insecurity",
    label: "Is your housing situation stable right now?",
    type: "radio",
    options: [
      { value: "yes_stable", label: "Yes, stable" },
      { value: "some_concern", label: "Some concern" },
      { value: "unstable", label: "Unstable or at risk" },
      { value: "prefer_not", label: "Prefer not to say" },
    ],
    placement: "intake_wizard",
  },
  {
    key: "overlay.other_notes",
    label: "Anything else you want your care team to know?",
    type: "textarea",
    helpText: "Optional. General notes, preferences, or barriers.",
    placement: "intake_wizard",
  },
];
