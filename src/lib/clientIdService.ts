import { supabase } from "@/integrations/supabase/client";

export type ClientType = 'D' | 'R' | 'I';
export type ClientStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'CONVERTED';

export interface GenerateClientIdParams {
  attorneyCode?: string;
  type: ClientType;
}

export interface ConvertToAttorneyCaseParams {
  internalCaseId: string;
  attorneyCode: string;
}

export class ClientIdService {
  /**
   * Generate a new client ID based on attorney and type
   * Format: {CODE}-{NUMBER}-{TYPE}
   * Example: SMI-00015-D or INT-00001-I
   */
  static async generateClientId(params: GenerateClientIdParams): Promise<{ success: boolean; clientId?: string; error?: string }> {
    try {
      const { attorneyCode, type } = params;
      
      // For internal/organic leads, use "INT" as the code
      const code = type === 'I' ? 'INT' : (attorneyCode?.toUpperCase() || 'INT');
      
      // Call the database function to generate ID
      const { data, error } = await supabase.rpc('generate_client_id', {
        p_attorney_code: code,
        p_client_type: type
      });
      
      if (error) {
        console.error('Error generating client ID:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true, clientId: data };
    } catch (error) {
      console.error('Exception generating client ID:', error);
      return { success: false, error: 'Failed to generate client ID' };
    }
  }
  
  /**
   * Convert an internal lead to an attorney case
   * Updates original case to CONVERTED status and generates new attorney case ID
   */
  static async convertToAttorneyCase(params: ConvertToAttorneyCaseParams): Promise<{ success: boolean; newClientId?: string; error?: string }> {
    try {
      const { internalCaseId, attorneyCode } = params;
      
      // Call the database function to convert
      const { data, error } = await supabase.rpc('convert_to_attorney_case', {
        p_internal_case_id: internalCaseId,
        p_attorney_code: attorneyCode.toUpperCase()
      });
      
      if (error) {
        console.error('Error converting to attorney case:', error);
        return { success: false, error: error.message };
      }
      
      if (data && typeof data === 'object' && 'success' in data) {
        return data as { success: boolean; newClientId?: string; error?: string };
      }
      
      return { success: false, error: 'Invalid response from conversion' };
    } catch (error) {
      console.error('Exception converting to attorney case:', error);
      return { success: false, error: 'Failed to convert case' };
    }
  }
  
  /**
   * Update a case with client ID tracking fields
   */
  static async updateCaseClientInfo(caseId: string, clientNumber: string, attorneyCode: string, clientType: ClientType): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('cases')
        .update({
          client_number: clientNumber,
          attorney_code: attorneyCode,
          client_type: clientType
        })
        .eq('id', caseId);
      
      if (error) {
        console.error('Error updating case client info:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Exception updating case client info:', error);
      return { success: false, error: 'Failed to update case info' };
    }
  }
  
  /**
   * Mark an intake as completed when fully submitted
   */
  static async markIntakeCompleted(caseId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('cases')
        .update({
          status: 'COMPLETED'
        })
        .eq('id', caseId);
      
      if (error) {
        console.error('Error marking intake as completed:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Exception marking intake as completed:', error);
      return { success: false, error: 'Failed to mark intake as completed' };
    }
  }
  
  /**
   * Purge abandoned internal intakes (7+ days old, IN_PROGRESS status)
   * This should be called via a scheduled job
   */
  static async purgeAbandonedIntakes(): Promise<{ success: boolean; purgedCount?: number; error?: string }> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Find ONLY abandoned intakes that are incomplete (IN_PROGRESS)
      const { data: abandonedCases, error: selectError } = await supabase
        .from('cases')
        .select('id, client_number')
        .eq('status', 'IN_PROGRESS')
        .eq('client_type', 'I')
        .lt('created_at', sevenDaysAgo.toISOString());
      
      if (selectError) {
        console.error('Error finding abandoned intakes:', selectError);
        return { success: false, error: selectError.message };
      }
      
      if (!abandonedCases || abandonedCases.length === 0) {
        return { success: true, purgedCount: 0 };
      }
      
      // Delete only the incomplete records
      const { error: deleteError } = await supabase
        .from('cases')
        .delete()
        .in('id', abandonedCases.map(c => c.id));
      
      if (deleteError) {
        console.error('Error purging abandoned intakes:', deleteError);
        return { success: false, error: deleteError.message };
      }
      
      const purgedIds = abandonedCases.map(c => c.client_number || c.id).join(', ');
      console.log(`Purged ${abandonedCases.length} abandoned intake(s): ${purgedIds}`);
      return { success: true, purgedCount: abandonedCases.length };
    } catch (error) {
      console.error('Exception purging abandoned intakes:', error);
      return { success: false, error: 'Failed to purge abandoned intakes' };
    }
  }
}
