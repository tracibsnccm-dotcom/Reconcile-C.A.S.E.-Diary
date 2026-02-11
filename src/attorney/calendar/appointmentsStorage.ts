/**
 * Attorney Appointments — localStorage storage layer
 * Key pattern: rcms:attorneyAppointments:v1:${attorneyKey}:${caseId}
 *
 * All storage access guarded for SSR (typeof window !== "undefined").
 * Safe JSON parsing; never throw.
 */

export type AppointmentType = "Medical" | "Legal" | "Other";

export interface AttorneyAppointment {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  type: AppointmentType;
}

const PREFIX = "rcms:attorneyAppointments:v1";

export function getAppointmentsKey(caseId: string, attorneyKey: string): string {
  return `${PREFIX}:${attorneyKey}:${caseId}`;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (raw == null || raw === "") return fallback;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && Array.isArray((parsed as { appointments?: unknown }).appointments)) {
      return (parsed as { appointments: T }).appointments;
    }
    if (Array.isArray(parsed)) return parsed as T;
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Load appointments for a case. SSR-safe.
 */
export function loadAppointments(caseId: string, attorneyKey: string): AttorneyAppointment[] {
  if (typeof window === "undefined") return [];
  const key = getAppointmentsKey(caseId, attorneyKey);
  const raw = localStorage.getItem(key);
  const parsed = safeParse<AttorneyAppointment[]>(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

/**
 * Persist appointments. SSR-safe.
 */
export function saveAppointments(
  caseId: string,
  attorneyKey: string,
  appointments: AttorneyAppointment[]
): void {
  if (typeof window === "undefined") return;
  const key = getAppointmentsKey(caseId, attorneyKey);
  try {
    localStorage.setItem(key, JSON.stringify({ appointments }));
  } catch (e) {
    console.warn("[appointmentsStorage] saveAppointments failed:", e);
  }
}

/**
 * Upsert an appointment by id; if id not found, append. SSR-safe.
 */
export function upsertAppointment(
  caseId: string,
  attorneyKey: string,
  appointment: AttorneyAppointment
): AttorneyAppointment[] {
  if (typeof window === "undefined") return [];
  const current = loadAppointments(caseId, attorneyKey);
  const idx = current.findIndex((a) => a.id === appointment.id);
  const next =
    idx >= 0
      ? current.map((a, i) => (i === idx ? appointment : a))
      : [...current, appointment];
  saveAppointments(caseId, attorneyKey, next);
  return next;
}

/**
 * Remove an appointment by id. SSR-safe.
 */
export function deleteAppointment(
  caseId: string,
  attorneyKey: string,
  appointmentId: string
): AttorneyAppointment[] {
  if (typeof window === "undefined") return [];
  const current = loadAppointments(caseId, attorneyKey);
  const next = current.filter((a) => a.id !== appointmentId);
  saveAppointments(caseId, attorneyKey, next);
  return next;
}
