import { supabase } from "@/integrations/supabase/client";

export interface PotentialDuplicate {
  id: string;
  client_number?: string;
  status?: string;
  created_at: string;
  matchReason: string;
}

/**
 * Service to detect potential duplicate clients during intake
 */
export class DuplicateDetectionService {
  /**
   * Find potential duplicate clients based on email, phone, and name
   */
  static async findPotentialDuplicates(
    email?: string,
    phone?: string,
    firstName?: string,
    lastName?: string
  ): Promise<{ success: boolean; matches?: PotentialDuplicate[]; error?: string }> {
    try {
      if (!email && !phone && (!firstName || !lastName)) {
        return { success: true, matches: [] };
      }

      // Query for potential matches in completed or converted cases
      const { data: cases, error } = await supabase
        .from('cases')
        .select('id, client_number, status, created_at, consent')
        .in('status', ['COMPLETED', 'Converted to Attorney'])
        .limit(10);

      if (error) {
        console.error('Error finding duplicates:', error);
        return { success: false, error: error.message };
      }

      // Filter matches based on criteria
      const matches: PotentialDuplicate[] = [];
      
      cases?.forEach(caseData => {
        const consent = caseData.consent as any;
        let matchReason = '';

        if (email && consent?.email?.toLowerCase() === email.toLowerCase()) {
          matchReason = 'Same email address';
        } else if (
          firstName && lastName &&
          consent?.firstName?.toLowerCase() === firstName.toLowerCase() &&
          consent?.lastName?.toLowerCase() === lastName.toLowerCase()
        ) {
          matchReason = 'Same first and last name';
        }

        if (matchReason) {
          matches.push({
            id: caseData.id,
            client_number: caseData.client_number || undefined,
            status: caseData.status || undefined,
            created_at: caseData.created_at || '',
            matchReason
          });
        }
      });

      return { success: true, matches };
    } catch (error) {
      console.error('Exception finding duplicates:', error);
      return { success: false, error: 'Failed to check for duplicates' };
    }
  }

  /**
   * Check for duplicates before creating a new intake
   */
  static async checkBeforeIntake(formData: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<{ hasDuplicates: boolean; matches?: PotentialDuplicate[] }> {
    const result = await this.findPotentialDuplicates(
      formData.email,
      formData.phone,
      formData.firstName,
      formData.lastName
    );

    if (!result.success) {
      return { hasDuplicates: false };
    }

    return {
      hasDuplicates: (result.matches?.length || 0) > 0,
      matches: result.matches
    };
  }
}
