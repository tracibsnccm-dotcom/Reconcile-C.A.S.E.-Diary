import { supabase } from "@/integrations/supabase/client";

export interface AttorneySLA {
  id: string;
  attorney_code: string;
  response_time_hours: number;
  auto_accept: boolean;
  fee_amount?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Service for managing attorney service level agreements
 */
export class AttorneySLAService {
  /**
   * Get SLA configuration for an attorney
   */
  static async getAttorneySLA(attorneyCode: string): Promise<{ success: boolean; sla?: AttorneySLA; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('attorney_sla')
        .select('*')
        .eq('attorney_code', attorneyCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching attorney SLA:', error);
        return { success: false, error: error.message };
      }

      return { success: true, sla: (data as any) || undefined };
    } catch (error) {
      console.error('Exception fetching attorney SLA:', error);
      return { success: false, error: 'Failed to fetch SLA' };
    }
  }

  /**
   * Create or update attorney SLA
   */
  static async upsertAttorneySLA(sla: Partial<AttorneySLA>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('attorney_sla')
        .upsert({
          attorney_code: sla.attorney_code?.toUpperCase(),
          response_time_hours: sla.response_time_hours || 24,
          auto_accept: sla.auto_accept || false,
          fee_amount: sla.fee_amount,
          is_active: sla.is_active !== undefined ? sla.is_active : true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'attorney_code'
        });

      if (error) {
        console.error('Error upserting attorney SLA:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception upserting attorney SLA:', error);
      return { success: false, error: 'Failed to save SLA' };
    }
  }

  /**
   * Check if assignment offer has expired (default 24 hours)
   */
  static async isOfferExpired(offerId: string): Promise<boolean> {
    try {
      const { data: offer } = await supabase
        .from('assignment_offers')
        .select('offered_at, expires_at')
        .eq('id', offerId)
        .single();

      if (!offer) return true;

      const expiryTime = new Date(offer.expires_at);
      return new Date() > expiryTime;
    } catch (error) {
      console.error('Exception checking offer expiry:', error);
      return false;
    }
  }

  /**
   * Get all active attorney SLAs
   */
  static async getAllActiveSLAs(): Promise<{ success: boolean; slas?: AttorneySLA[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('attorney_sla')
        .select('*')
        .eq('is_active', true)
        .order('attorney_code');

      if (error) {
        console.error('Error fetching SLAs:', error);
        return { success: false, error: error.message };
      }

      return { success: true, slas: (data as any) || [] };
    } catch (error) {
      console.error('Exception fetching SLAs:', error);
      return { success: false, error: 'Failed to fetch SLAs' };
    }
  }
}
