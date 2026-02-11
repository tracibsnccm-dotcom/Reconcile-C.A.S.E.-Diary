/**
 * Hook for attorney local appointments (per-attorney-per-case localStorage).
 * Pass attorneyKey from auth: user?.id ?? user?.email ?? "unknown-attorney".
 */

import { useState, useEffect, useCallback } from "react";
import {
  loadAppointments,
  saveAppointments,
  upsertAppointment,
  deleteAppointment as storageDeleteAppointment,
  type AttorneyAppointment,
  type AppointmentType,
} from "./appointmentsStorage";

function genId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `a-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useAppointments(caseId: string | null, attorneyKey?: string | null) {
  const key = attorneyKey ?? "unknown-attorney";
  const [appointments, setAppointments] = useState<AttorneyAppointment[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!caseId) {
      setAppointments([]);
      setIsReady(true);
      return;
    }
    setAppointments(loadAppointments(caseId, key));
    setIsReady(true);
  }, [caseId, key]);

  const add = useCallback(
    (data: {
      title: string;
      startAt: string;
      endAt: string;
      type: AppointmentType;
      location?: string;
      notes?: string;
    }): AttorneyAppointment | null => {
      if (!caseId || !data.title?.trim()) return null;
      const now = new Date().toISOString();
      const appointment: AttorneyAppointment = {
        id: genId(),
        title: data.title.trim(),
        startAt: data.startAt,
        endAt: data.endAt,
        location: data.location?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
        type: data.type || "Other",
      };
      const next = upsertAppointment(caseId, key, appointment);
      setAppointments(next);
      return appointment;
    },
    [caseId, key]
  );

  const update = useCallback(
    (appointment: AttorneyAppointment): void => {
      if (!caseId) return;
      const updated: AttorneyAppointment = {
        ...appointment,
        updatedAt: new Date().toISOString(),
      };
      const next = upsertAppointment(caseId, key, updated);
      setAppointments(next);
    },
    [caseId, key]
  );

  const remove = useCallback(
    (appointmentId: string): void => {
      if (!caseId) return;
      const next = storageDeleteAppointment(caseId, key, appointmentId);
      setAppointments(next);
    },
    [caseId, key]
  );

  const persist = useCallback(
    (next: AttorneyAppointment[]): void => {
      if (!caseId) return;
      saveAppointments(caseId, key, next);
      setAppointments(next);
    },
    [caseId, key]
  );

  return {
    appointments,
    add,
    update,
    remove,
    saveAppointments: persist,
    isReady,
  };
}
