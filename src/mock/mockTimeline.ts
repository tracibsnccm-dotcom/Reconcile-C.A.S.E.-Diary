// src/mock/mockTimeline.ts

import {
  CaseTimelineEvent,
  CaseCommunicationEntry,
  TenVsSnapshot,
} from "../domain/caseTimeline";

export const mockTimelineEvents: CaseTimelineEvent[] = [
  {
    id: "evt-001",
    caseId: "case-001",
    category: "CLINICAL",
    summary: "Initial RN intake completed",
    details:
      "RN performed full 4Ps + 10-Vs intake. SDOH barriers identified (transportation, financial strain).",
    actorRole: "RN",
    actorName: "RN Johnson",
    createdAt: "2025-01-12T09:15:00Z",
    isCritical: false,
    fourPsSummary: "Pain 6/10, function limited with prolonged standing.",
    tenVsSnapshot: {
      v1PainSignal: 2,
      v2FunctionalLoss: 1,
      v3VitalityReserve: 1,
      v4VigilanceRisk: 1,
      v5VarianceFromBaseline: 1,
      v6VelocityOfChange: 1,
      v7VolumeOfUtilization: 0,
      v8ValueAlignment: 1,
      v9ValidationStrength: 1,
      v10ViabilityTrajectory: 1,
    } as TenVsSnapshot,
    tags: ["intake", "clinical", "4Ps", "10-Vs"],
  },
  {
    id: "evt-002",
    caseId: "case-001",
    category: "SYSTEM",
    summary: "Provider documents uploaded",
    details: "MRI and PT referral were added to clinical record.",
    actorRole: "SYSTEM",
    createdAt: "2025-01-14T10:30:00Z",
    tenVsDelta: {
      v7VolumeOfUtilization: 1, // more utilization
      v9ValidationStrength: 1,  // additional objective support
    },
    tags: ["upload", "imaging", "pt-referral"],
  },
  {
    id: "evt-003",
    caseId: "case-001",
    category: "LEGAL",
    summary: "Attorney requested status update",
    details:
      "Attorney requested RN summary of clinical stability and restrictions prior to negotiation conference.",
    actorRole: "ATTORNEY",
    actorName: "A. Smith",
    createdAt: "2025-01-15T14:20:00Z",
    tenVsDelta: {
      v8ValueAlignment: 1, // case is moving toward aligned expectations
    },
    tags: ["attorney", "status", "negotiation"],
  },
  {
    id: "evt-004",
    caseId: "case-001",
    category: "CLINICAL",
    summary: "RN flagged high-risk SDOH",
    details:
      "Transportation and financial strain affecting PT attendance; risk for lost to follow-up.",
    actorRole: "RN",
    actorName: "RN Johnson",
    createdAt: "2025-01-16T08:45:00Z",
    isCritical: true,
    requiresAudit: true,
    auditStatus: "FLAGGED",
    tenVsDelta: {
      v4VigilanceRisk: 2,          // big jump in risk
      v6VelocityOfChange: 1,       // trajectory worsening
      v10ViabilityTrajectory: -1,  // case viability slipping
    },
    tags: ["sdoh", "critical", "audit"],
  },
];

export const mockCommunicationEntries: CaseCommunicationEntry[] = [
  {
    id: "comm-001",
    caseId: "case-001",
    channel: "PHONE",
    direction: "OUTBOUND",
    subject: "RN follow-up call after intake",
    bodyPreview:
      "Reviewed home safety, pain trends, and upcoming PT schedule. Client verbalized understanding.",
    participants: ["RN Johnson", "Client"],
    confidentiality: "STANDARD",
    createdAt: "2025-01-17T11:00:00Z",
    createdByRole: "RN",
    followUpStatus: "CLOSED",
  },
  {
    id: "comm-002",
    caseId: "case-001",
    channel: "EMAIL",
    direction: "INBOUND",
    subject: "Attorney inquiry re: PT compliance",
    bodyPreview:
      "Can you provide last 6 weeks of PT attendance and any missed visits related to transportation?",
    participants: ["Attorney Smith", "RN Johnson"],
    confidentiality: "PRIVILEGED",
    isLegalHold: true,
    createdAt: "2025-01-17T13:32:00Z",
    createdByRole: "ATTORNEY",
    followUpStatus: "OPEN",
    followUpOwnerName: "RN Johnson",
    followUpDueAt: "2025-01-20T00:00:00Z",
    attachmentsCount: 2,
  },
];
