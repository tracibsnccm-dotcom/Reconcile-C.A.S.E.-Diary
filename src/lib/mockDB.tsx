// src/lib/mockDB.ts

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

/**
 * Basic types for the mock database
 */

export type RAGStatus = "Red" | "Amber" | "Green" | "Unknown";

export interface ClientProfile {
  id: string;
  name: string;

  // 4Ps / general profile
  age?: number | null;
  gender?: string | null;

  // Student Lens flags
  isStudent?: boolean;
  studentStatus?: "student" | "not_student" | "unknown";
  tags?: string[];

  // Case status / severity
  caseStatus?: "Active" | "Closed" | "On Hold";
  severityLevel?: number;

  // Viability / Vitality / RAG (10-Vs summary)
  viabilityScore?: number | null;
  viabilityStatus?: string;
  vitalityScore?: number | null;
  ragStatus?: RAGStatus;

  // Assignments
  assignedRnId?: string | null;
  assignedAttorneyId?: string | null;

  // Follow-up dates
  lastFollowupDate?: string | null;
  nextFollowupDue?: string | null;

  // Free-form notes
  notes?: string;
}

export interface CaseFlag {
  id: string;
  label: string;
  type: "Clinical" | "SDOH" | "Legal" | "Behavioral" | "Other";
  severity: "Low" | "Moderate" | "High" | "Critical";
  status: "Open" | "Closed";
  createdAt: string;
}

export interface CaseTask {
  id: string;
  title: string;
  type:
    | "RN Follow-Up"
    | "Provider Outreach"
    | "Education"
    | "Admin"
    | "Attorney Call"
    | "Other";
  status: "Open" | "Completed";
  due_date: string | null;
}

export interface CaseRecord {
  id: string;
  shortId: string;
  client: ClientProfile;
  flags: CaseFlag[];
  tasks: CaseTask[];
}

/**
 * Mock cases — 5 archetypes.
 * CASE-001 is intentionally marked as a STUDENT for the Student Lens.
 */

export const mockCases: CaseRecord[] = [
  // CASE 1 — Student, mild–moderate clinical severity, stable viability
  {
    id: "CASE-001",
    shortId: "C-001",
    client: {
      id: "C-001",
      name: "Jane Doe",
      age: 20,
      gender: "F",

      // 🔹 Student Lens – this is the key mock client
      isStudent: true,
      studentStatus: "student",
      tags: ["student", "college", "young_adult"],

      caseStatus: "Active",
      severityLevel: 1,
      viabilityScore: 8.5,
      viabilityStatus: "Low Risk / Stable",
      vitalityScore: 8.8,
      ragStatus: "Green",

      assignedRnId: "RN-01",
      assignedAttorneyId: "AT-01",
      lastFollowupDate: null,
      nextFollowupDue: null,
      notes: "College student with musculoskeletal pain, part-time work.",
    },
    flags: [
      {
        id: "F-001-1",
        label: "Pain flare with exam stress",
        type: "Clinical",
        severity: "Moderate",
        status: "Open",
        createdAt: "2025-10-30T09:15:00Z",
      },
    ],
    tasks: [
      {
        id: "T-001-1",
        title: "RN follow-up re: pain self-management during finals",
        type: "RN Follow-Up",
        status: "Open",
        due_date: "2025-11-20T15:00:00Z",
      },
      {
        id: "T-001-2",
        title: "Send student-friendly 4Ps education packet via portal",
        type: "Education",
        status: "Open",
        due_date: "2025-11-19T12:00:00Z",
      },
    ],
  },

  // CASE 2 — SDOH barrier, transportation and cost of meds
  {
    id: "CASE-002",
    shortId: "C-002",
    client: {
      id: "C-002",
      name: "Michael Brown",
      age: 47,
      gender: "M",

      isStudent: false,
      studentStatus: "not_student",
      tags: ["sdoh_barrier"],

      caseStatus: "Active",
      severityLevel: 2,
      viabilityScore: 6.2,
      viabilityStatus: "Moderate Risk with SDOH barrier",
      vitalityScore: 6.8,
      ragStatus: "Amber",

      assignedRnId: "RN-01",
      assignedAttorneyId: "AT-01",
      lastFollowupDate: "2025-10-28T14:00:00Z",
      nextFollowupDue: "2025-11-18T14:00:00Z",
      notes: "Transportation barriers to PT, difficulty paying for meds.",
    },
    flags: [
      {
        id: "F-002-1",
        label: "SDOH: Transportation barrier to PT (High - SDOH)",
        type: "SDOH",
        severity: "High",
        status: "Open",
        createdAt: "2025-10-20T16:30:00Z",
      },
    ],
    tasks: [
      {
        id: "T-002-1",
        title: "RN call to explore ride options / community transport",
        type: "RN Follow-Up",
        status: "Open",
        due_date: "2025-11-19T16:00:00Z",
      },
    ],
  },

  // CASE 3 — Limited engagement, at risk for lost to follow-up
  {
    id: "CASE-003",
    shortId: "C-003",
    client: {
      id: "C-003",
      name: "Carla Nguyen",
      age: 39,
      gender: "F",

      isStudent: false,
      studentStatus: "not_student",
      tags: ["limited_engagement"],

      caseStatus: "Active",
      severityLevel: 2,
      viabilityScore: 5.9,
      viabilityStatus: "Financial strain / risk for lost to follow-up",
      vitalityScore: 5.8,
      ragStatus: "Amber",

      assignedRnId: "RN-01",
      assignedAttorneyId: "AT-02",
      lastFollowupDate: "2025-10-25T10:30:00Z",
      nextFollowupDue: "2025-11-15T10:30:00Z",
      notes: "Missed last appointment; reports financial strain.",
    },
    flags: [
      {
        id: "F-003-1",
        label: "Limited engagement / missed follow-up",
        type: "Behavioral",
        severity: "High",
        status: "Open",
        createdAt: "2025-10-26T13:45:00Z",
      },
      {
        id: "F-003-2",
        label: "Financial strain impacting treatment adherence",
        type: "SDOH",
        severity: "Moderate",
        status: "Open",
        createdAt: "2025-10-26T13:46:00Z",
      },
    ],
    tasks: [
      {
        id: "T-003-1",
        title: "RN call to re-engage; discuss options for financial support",
        type: "RN Follow-Up",
        status: "Open",
        due_date: "2025-11-18T11:00:00Z",
      },
      {
        id: "T-003-2",
        title: "Send education on importance of consistent PT / meds",
        type: "Education",
        status: "Completed",
        due_date: "2025-10-29T09:00:00Z",
      },
    ],
  },

  // CASE 4 — Higher clinical complexity, multiple providers
  {
    id: "CASE-004",
    shortId: "C-004",
    client: {
      id: "C-004",
      name: "Robert King",
      age: 61,
      gender: "M",

      isStudent: false,
      studentStatus: "not_student",
      tags: ["complex", "multi_provider"],

      caseStatus: "Active",
      severityLevel: 3,
      viabilityScore: 4.9,
      viabilityStatus: "Higher clinical complexity",
      vitalityScore: 5.1,
      ragStatus: "Amber",

      assignedRnId: "RN-02",
      assignedAttorneyId: "AT-01",
      lastFollowupDate: "2025-10-20T09:30:00Z",
      nextFollowupDue: "2025-11-10T09:30:00Z",
      notes: "Multiple comorbidities, multiple specialists involved.",
    },
    flags: [
      {
        id: "F-004-1",
        label: "Polypharmacy – needs close medication reconciliation",
        type: "Clinical",
        severity: "High",
        status: "Open",
        createdAt: "2025-10-19T11:00:00Z",
      },
    ],
    tasks: [
      {
        id: "T-004-1",
        title: "RN medication reconciliation with updated med list",
        type: "RN Follow-Up",
        status: "Open",
        due_date: "2025-11-17T13:00:00Z",
      },
      {
        id: "T-004-2",
        title: "Share updated med list with PCP and ortho",
        type: "Provider Outreach",
        status: "Open",
        due_date: "2025-11-19T14:00:00Z",
      },
    ],
  },

  // CASE 5 — Behavioral health / suicidal ideation flag
  {
    id: "CASE-005",
    shortId: "C-005",
    client: {
      id: "C-005",
      name: "Angela Rivera",
      age: 33,
      gender: "F",

      isStudent: false,
      studentStatus: "not_student",
      tags: ["behavioral_health", "suicidal_risk"],

      caseStatus: "Active",
      severityLevel: 3,
      viabilityScore: 4.3,
      viabilityStatus: "Psychological risk / active BH needs",
      vitalityScore: 4.0,
      ragStatus: "Red",

      assignedRnId: "RN-02",
      assignedAttorneyId: "AT-02",
      lastFollowupDate: "2025-10-27T16:00:00Z",
      nextFollowupDue: "2025-11-07T16:00:00Z",
      notes: "Recent suicidal ideation; BH referral pending.",
    },
    flags: [
      {
        id: "F-005-1",
        label: "Recent suicidal ideation – safety plan required",
        type: "Behavioral",
        severity: "Critical",
        status: "Open",
        createdAt: "2025-10-27T15:45:00Z",
      },
      {
        id: "F-005-2",
        label: "High-risk flag – legal lock-down eligible",
        type: "Legal",
        severity: "High",
        status: "Open",
        createdAt: "2025-10-27T15:46:00Z",
      },
    ],
    tasks: [
      {
        id: "T-005-1",
        title: "Confirm safety plan and BH appointment",
        type: "RN Follow-Up",
        status: "Open",
        due_date: "2025-11-05T10:00:00Z",
      },
      {
        id: "T-005-2",
        title: "Alert attorney to BH risk and legal lock-down options",
        type: "Attorney Call",
        status: "Open",
        due_date: "2025-11-06T11:00:00Z",
      },
    ],
  },
];

/**
 * Context + Provider
 */

export interface MockDBContextValue {
  cases: CaseRecord[];
  activeCase: CaseRecord | null;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  setCases: Dispatch<SetStateAction<CaseRecord[]>>;
}

const MockDBContext = createContext<MockDBContextValue | undefined>(undefined);

export const MockDBProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [cases, setCases] = useState<CaseRecord[]>(mockCases);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const activeCase = cases[activeIndex] ?? null;

  const value: MockDBContextValue = {
    cases,
    activeCase,
    activeIndex,
    setActiveIndex,
    setCases,
  };

  return (
    <MockDBContext.Provider value={value}>{children}</MockDBContext.Provider>
  );
};

export const useMockDB = (): MockDBContextValue => {
  const ctx = useContext(MockDBContext);
  if (!ctx) {
    throw new Error("useMockDB must be used within a MockDBProvider");
  }
  return ctx;
};
