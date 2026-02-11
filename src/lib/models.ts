// src/lib/models.ts

// Core client model
export interface VoiceView {
  voice: string; // client’s own words
  view: string;  // how they see themselves / desired course
}

export interface Client {
  id: string;
  name: string;

  // Care management participation
  cmDeclined?: boolean;

  // Viability / 4Ps / V-Vs
  viabilityScore?: number | null;
  viabilityStatus?: string | null; // e.g. "High Viability", "Borderline", etc.

  voiceView?: VoiceView | null;

  // Optional structured fields for future expansion
  fourPs?: any;
  sdoh?: any;

  // Follow-up tracking
  lastFollowupDate?: string | null;
  nextFollowupDue?: string | null;
}

// Flags: safety, SDOH, required items, etc.
export type FlagSeverity = "Low" | "Moderate" | "High" | "Critical";
export type FlagStatus = "Open" | "Closed";

export interface Flag {
  id: string;
  type?: string; // e.g. "Pain", "Meds", "SDOH"
  label: string;
  description?: string;
  severity: FlagSeverity;
  status: FlagStatus;
  createdAt?: string;
  resolvedAt?: string | null;
}

// Tasks: follow-ups, audits, outreach, etc.
export type TaskStatus = "Open" | "Completed" | "Cancelled";

export interface Task {
  task_id: string;
  type: string; // e.g. "FollowUp", "Audit", "Education"
  title: string;
  due_date?: string | null;
  status: TaskStatus;
  created_at?: string;
  assigned_to?: string | null;
}

// ICD-10 & Injury selection for Medical Necessity Review Driver
export interface ICD10Code {
  code: string;
  label: string;
  category: string; // e.g. "MVA", "Sprain/Strain", etc.
}

export interface InjurySelection {
  id: string;           // internal id
  templateId: string;   // which injury template (e.g. "mva", "sprain_strain")
  label: string;        // human readable (e.g. "Whiplash", "Lumbar Strain")
  icd10Code?: string;   // selected ICD-10 code
  primary: boolean;     // true = primary injury
}

// App-wide state (in-memory for now)
export interface AppState {
  client: Client;
  flags: Flag[];
  tasks: Task[];
  injuries?: InjurySelection[];
}
