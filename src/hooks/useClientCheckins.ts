import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";

export interface ClientCheckin {
  id: string;
  case_id: string;
  client_id: string;
  pain_scale: number;
  depression_scale: number | null;
  anxiety_scale: number | null;
  note: string | null;
  p_physical: number;
  p_psychological: number;
  p_psychosocial: number;
  p_purpose: number;
  created_at: string;
  created_by_role: string;
}

export interface CheckinTrend {
  bucket: string;
  pain_avg: number;
  depression_avg: number;
  anxiety_avg: number;
  physical_avg: number;
  psychological_avg: number;
  psychosocial_avg: number;
  purpose_avg: number;
  n: number;
}

export function useClientCheckins(caseId?: string) {
  const [checkins, setCheckins] = useState<ClientCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!caseId || !user || !/^[0-9a-fA-F-]{36}$/.test(caseId)) {
      setLoading(false);
      return;
    }

    fetchCheckins();

    const channel = supabase
      .channel('client_checkins_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_checkins',
          filter: `case_id=eq.${caseId}`,
        },
        () => {
          fetchCheckins();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId, user]);

  async function fetchCheckins() {
    try {
      // Skip fetch if caseId is missing or not a UUID
      if (!caseId || !/^[0-9a-fA-F-]{36}$/.test(caseId)) {
        setCheckins([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('client_checkins')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCheckins(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return { checkins, loading, error, refetch: fetchCheckins };
}

export async function fetchCheckinTrends(
  caseId: string,
  period: 'day' | 'week' | 'month',
  rangeDays: number
): Promise<CheckinTrend[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - rangeDays);

  const { data, error } = await supabase.rpc('get_checkin_trends', {
    p_case_id: caseId,
    p_period: period,
    p_start_date: startDate.toISOString(),
    p_end_date: endDate.toISOString(),
  });

  if (error) throw error;
  return data || [];
}
