/**
 * Utility functions for converting internal leads to attorney cases
 * and managing abandoned intakes
 */

import { ClientIdService } from "./clientIdService";
import { supabase } from "@/integrations/supabase/client";

export interface ConversionResult {
  success: boolean;
  newClientId?: string;
  error?: string;
}

/**
 * Convert an internal/organic lead (INT-XXXXX-I) to an attorney case
 * This marks the original case as converted and generates a new client ID
 */
export async function convertInternalToAttorney(
  internalCaseId: string,
  attorneyCode: string
): Promise<ConversionResult> {
  try {
    // First verify this is an internal case
    const { data: existingCase, error: checkError } = await supabase
      .from('cases')
      .select('client_type, status')
      .eq('id', internalCaseId)
      .single();
    
    if (checkError || !existingCase) {
      return { success: false, error: 'Case not found' };
    }
    
    if (existingCase.client_type !== 'I') {
      return { success: false, error: 'Can only convert internal cases' };
    }
    
    // Use the service to convert
    const result = await ClientIdService.convertToAttorneyCase({
      internalCaseId,
      attorneyCode
    });
    
    return result;
  } catch (error) {
    console.error('Exception during conversion:', error);
    return { success: false, error: 'Conversion failed' };
  }
}

/**
 * Purge abandoned internal intakes older than 7 days
 * Should be called via scheduled job or admin action
 */
export async function purgeAbandonedIntakes() {
  return await ClientIdService.purgeAbandonedIntakes();
}

/**
 * Get statistics about internal leads that need conversion
 */
export async function getConversionStats() {
  try {
    const { data: internalCases, error } = await supabase
      .from('cases')
      .select('id, status, created_at, client_number')
      .eq('client_type', 'I');
    
    if (error) {
      console.error('Error fetching internal cases:', error);
      return { success: false, error: error.message };
    }
    
    const total = internalCases?.length || 0;
    const inProgress = internalCases?.filter(c => c.status === 'IN_PROGRESS').length || 0;
    const completed = internalCases?.filter(c => c.status === 'COMPLETED').length || 0;
    const abandoned = internalCases?.filter(c => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return c.status === 'IN_PROGRESS' && new Date(c.created_at) < sevenDaysAgo;
    }).length || 0;
    
    return {
      success: true,
      stats: {
        total,
        inProgress,
        completed,
        abandoned
      }
    };
  } catch (error) {
    console.error('Exception getting conversion stats:', error);
    return { success: false, error: 'Failed to get stats' };
  }
}
