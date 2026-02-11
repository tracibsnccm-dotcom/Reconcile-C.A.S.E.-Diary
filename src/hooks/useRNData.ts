import { useState, useEffect } from "react";
import { useAuth } from "@/auth/supabaseAuth";
import { supabaseGet } from '@/lib/supabaseRest';

export interface RNAssignment {
  id: string;
  case_id: string;
  assigned_at: string;
  status: string;
  notes: string | null;
}

export interface RNAssessment {
  id: string;
  case_id: string;
  assessment_type: string;
  status: string;
  due_date: string | null;
  requires_followup: boolean;
  followup_reason: string | null;
  followup_due_date: string | null;
}

export interface RNDiaryEntry {
  id: string;
  case_id: string | null;
  entry_type: string;
  title: string;
  description: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  status: string;
  location: string | null;
  metadata: any;
}

export function useRNAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<RNAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAssignments = async () => {
      setLoading(true);
      const { data, error } = await supabaseGet<RNAssignment[]>(
        'rc_case_assignments',
        `select=*&user_id=eq.${user.id}&status=eq.active&order=assigned_at.desc`
      );

      if (!error && data) {
        setAssignments(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    };

    fetchAssignments();
  }, [user]);

  return { assignments, loading };
}

export function useRNAssessments() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<RNAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAssessments = async () => {
      setLoading(true);
      const { data, error } = await supabaseGet<RNAssessment[]>(
        'rn_assessments',
        `select=*&rn_id=eq.${user.id}&order=due_date.asc`
      );

      if (!error && data) {
        setAssessments(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    };

    fetchAssessments();
  }, [user]);

  const pending = assessments.filter((a) => a.status === "pending");
  const requireFollowup = assessments.filter((a) => a.requires_followup && a.status !== "completed");

  return { assessments, pending, requireFollowup, loading };
}

export function useRNDiary() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<RNDiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchEntries = async () => {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabaseGet<RNDiaryEntry[]>(
        'rn_diary_entries',
        `select=*&rn_id=eq.${user.id}&scheduled_date=gte.${today}&order=scheduled_date.asc,scheduled_time.asc`
      );

      if (!error && data) {
        setEntries(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    };

    fetchEntries();
  }, [user]);

  return { entries, loading };
}

// Supervisor version - can see all RN diary entries
export function useSupervisorDiary() {
  const [entries, setEntries] = useState<RNDiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabaseGet<RNDiaryEntry[]>(
        'rn_diary_entries',
        `select=*&scheduled_date=gte.${today}&order=scheduled_date.asc,scheduled_time.asc`
      );

      if (!error && data) {
        setEntries(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    };

    fetchEntries();
  }, []);

  return { entries, loading };
}
