// src/domain/caseTimeline.ts

// --- 10-Vs model -------------------------------------------------------------

// Simple 0–3 scale for each V (0 = stable, 3 = severe/critical)
export interface TenVsSnapshot {
  v1PainSignal: number;       // Pain / symptom intensity
  v2FunctionalLoss: number;   // ADLs / function impact
  v3VitalityReserve: number;  // Energy / resilience
  v4VigilanceRisk: number;    // Safety / risk / red flags
  v5VarianceFromBaseline: number;
  v6VelocityOfChange: number;
  v7VolumeOfUtilization: number;
  v8ValueAlignment: number;
  v9ValidationStrength: number;
  v10ViabilityTrajectory: number;
}

// --- Timeline event & comm models ------------------------------------------

export type CaseEventCategory =
  | "CLINICAL"
  | "LEGAL"
  | "WORKLOAD"
  | "SYSTEM"
  | "COMMUNICATION"
  | "OTHER";

export interface FourPsProfile {
  p1Physical?: boolean;       // Physical / pain / function
  p2Psychological?: boolean;  // Psychological / emotional
  p3Psychosocial?: boolean;   // Psychosocial / SDOH / environment
  p4Professional?: boolean;   // Work / professional / economic
}

export interface CaseTimelineEvent {
  id: string;
  caseId: string;
  category: CaseEventCategory;

  summary: string;
  details?: string;

  actorRole: "RN" | "ATTORNEY" | "CLIENT" | "PROVIDER" | "SYSTEM";
  actorName?: string;

  createdAt: string; // ISO timestamp

  isCritical?: boolean;
  isLegalLocked?: boolean;

  requiresAudit?: boolean;
  auditStatus?: "PENDING" | "CLEARED" | "FLAGGED";

  fourPsSummary?: string;

  /**
   * Optional snapshot of the 10-Vs at this moment (e.g., after major RN review).
   * If present, the 10-Vs engine treats this as a full refresh.
   */
  tenVsSnapshot?: TenVsSnapshot;

  /**
   * Optional delta / adjustment this event makes to the running 10-Vs picture.
   * Example: PT no-show could bump Velocity/Vigilance up by +1.
   */
  tenVsDelta?: Partial<TenVsSnapshot>;

  /**
   * Free-form tags (e.g., "sdoh", "pt-no-show", "legal-lock") that the engine
   * can optionally use for heuristics.
   */
  tags?: string[];

  /**
   * 4Ps profile for this event (Physical, Psychological, Psychosocial, Professional).
   */
  fourPsProfile?: FourPsProfile;

  /**
   * Safety / abuse / suicidality signals. These should be rare but heavily weighted.
   */
  abuseRisk?: boolean;
  suicideRisk?: boolean;
}

export type CommunicationChannel =
  | "PHONE"
  | "EMAIL"
  | "PORTAL_MESSAGE"
  | "TEXT"
  | "VIDEO_VISIT"
  | "IN_PERSON";

export type CommunicationDirection = "INBOUND" | "OUTBOUND" | "INTERNAL";

export type CommunicationConfidentiality =
  | "STANDARD"
  | "SENSITIVE"
  | "PRIVILEGED";

export interface CaseCommunicationEntry {
  id: string;
  caseId: string;

  channel: CommunicationChannel;
  direction: CommunicationDirection;

  subject: string;
  bodyPreview?: string;
  participants: string[];

  confidentiality: CommunicationConfidentiality;

  createdAt: string;
  createdByRole: "RN" | "ATTORNEY" | "CLIENT" | "PROVIDER" | "SYSTEM";
  createdByName?: string;

  isLegalHold?: boolean;

  followUpStatus: "OPEN" | "CLOSED";
  followUpOwnerName?: string;
  followUpDueAt?: string;

  attachmentsCount?: number;
}

