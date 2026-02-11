import { supabase } from "@/integrations/supabase/client";

export interface AttorneyPerformance {
  id: string;
  attorney_code: string;
  total_referrals: number;
  accepted: number;
  declined: number;
  avg_response_time_hours?: number;
  conversion_rate?: number;
  last_updated: string;
}

export interface PerformanceMetrics {
  acceptanceRate: number;
  declineRate: number;
  avgResponseTime?: number;
  conversionRate?: number;
  totalCases: number;
}

/**
 * Service for tracking and analyzing attorney performance metrics
 */
export class AttorneyPerformanceService {
  /**
   * Update performance metrics for an attorney
   */
  static async updatePerformanceMetrics(attorneyCode: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('update_attorney_performance', {
        p_attorney_code: attorneyCode.toUpperCase()
      });

      if (error) {
        console.error('Error updating attorney performance:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception updating attorney performance:', error);
      return { success: false, error: 'Failed to update performance' };
    }
  }

  /**
   * Get performance metrics for an attorney
   */
  static async getAttorneyPerformance(
    attorneyCode: string
  ): Promise<{ success: boolean; performance?: AttorneyPerformance; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('attorney_performance')
        .select('*')
        .eq('attorney_code', attorneyCode.toUpperCase())
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching attorney performance:', error);
        return { success: false, error: error.message };
      }

      return { success: true, performance: (data as any) || undefined };
    } catch (error) {
      console.error('Exception fetching attorney performance:', error);
      return { success: false, error: 'Failed to fetch performance' };
    }
  }

  /**
   * Get calculated performance metrics with rates
   */
  static async getPerformanceMetrics(attorneyCode: string): Promise<PerformanceMetrics | null> {
    const result = await this.getAttorneyPerformance(attorneyCode);
    
    if (!result.success || !result.performance) {
      return null;
    }

    const perf = result.performance;
    const totalResponses = perf.accepted + perf.declined;

    return {
      acceptanceRate: totalResponses > 0 ? (perf.accepted / totalResponses) * 100 : 0,
      declineRate: totalResponses > 0 ? (perf.declined / totalResponses) * 100 : 0,
      avgResponseTime: perf.avg_response_time_hours || undefined,
      conversionRate: perf.conversion_rate || undefined,
      totalCases: perf.total_referrals
    };
  }

  /**
   * Get performance rankings for all attorneys
   */
  static async getPerformanceRankings(): Promise<{ success: boolean; rankings?: AttorneyPerformance[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('attorney_performance')
        .select('*')
        .order('accepted', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching performance rankings:', error);
        return { success: false, error: error.message };
      }

      return { success: true, rankings: (data as any) || [] };
    } catch (error) {
      console.error('Exception fetching performance rankings:', error);
      return { success: false, error: 'Failed to fetch rankings' };
    }
  }

  /**
   * Get top performing attorneys by acceptance rate
   */
  static async getTopPerformers(limit: number = 10): Promise<AttorneyPerformance[]> {
    const { data } = await supabase
      .from('attorney_performance')
      .select('*')
      .gte('total_referrals', 5)
      .order('accepted', { ascending: false })
      .limit(limit);

    return (data as any) || [];
  }

  /**
   * Calculate conversion rate for an attorney
   */
  static async calculateConversionRate(attorneyCode: string): Promise<number | null> {
    try {
      const { count: completed } = await supabase
        .from('cases')
        .select('id', { count: 'exact', head: true })
        .eq('attorney_code', attorneyCode.toUpperCase())
        .in('status', ['COMPLETED', 'Settled']);

      const { count: total } = await supabase
        .from('cases')
        .select('id', { count: 'exact', head: true })
        .eq('attorney_code', attorneyCode.toUpperCase())
        .neq('client_type', 'I');

      if (!total || total === 0) return null;

      const rate = ((completed || 0) / total) * 100;

      await supabase
        .from('attorney_performance')
        .update({ conversion_rate: rate })
        .eq('attorney_code', attorneyCode.toUpperCase());

      return rate;
    } catch (error) {
      console.error('Exception calculating conversion rate:', error);
      return null;
    }
  }
}
