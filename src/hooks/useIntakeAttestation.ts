import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface IntakeAttestationStatus {
  needsAttestation: boolean;
  isExpired: boolean;
  isLoading: boolean;
  intakeId: string | null;
  intakeSubmittedAt: string | null;
  attorneyConfirmDeadlineAt: string | null;
}

/**
 * Hook to check if an intake requires attorney attestation for a given case
 */
export function useIntakeAttestation(caseId: string | undefined): IntakeAttestationStatus {
  const [status, setStatus] = useState<IntakeAttestationStatus>({
    needsAttestation: false,
    isExpired: false,
    isLoading: true,
    intakeId: null,
    intakeSubmittedAt: null,
    attorneyConfirmDeadlineAt: null,
  });

  useEffect(() => {
    if (!caseId) {
      setStatus({
        needsAttestation: false,
        isExpired: false,
        isLoading: false,
        intakeId: null,
        intakeSubmittedAt: null,
        attorneyConfirmDeadlineAt: null,
      });
      return;
    }

    async function checkAttestation() {
      try {
        // Check for pending intake that needs attestation
        const { data, error } = await supabase
          .from('rc_client_intakes')
          .select(`
            id,
            intake_submitted_at,
            attorney_confirm_deadline_at,
            attorney_attested_at,
            intake_status
          `)
          .eq('case_id', caseId)
          .in('intake_status', ['submitted_pending_attorney', 'expired_deleted'])
          .maybeSingle();

        if (error) {
          console.error('Error checking intake attestation:', error);
          setStatus({
            needsAttestation: false,
            isExpired: false,
            isLoading: false,
            intakeId: null,
            intakeSubmittedAt: null,
            attorneyConfirmDeadlineAt: null,
          });
          return;
        }

        if (!data) {
          // No pending intake found - access allowed
          setStatus({
            needsAttestation: false,
            isExpired: false,
            isLoading: false,
            intakeId: null,
            intakeSubmittedAt: null,
            attorneyConfirmDeadlineAt: null,
          });
          return;
        }

        // Check if expired
        const isExpired = 
          data.intake_status === 'expired_deleted' ||
          (data.attorney_confirm_deadline_at &&
           new Date(data.attorney_confirm_deadline_at).getTime() < Date.now());

        // Check if needs attestation (pending and not attested)
        const needsAttestation =
          data.intake_status === 'submitted_pending_attorney' &&
          !data.attorney_attested_at &&
          !isExpired;

        setStatus({
          needsAttestation,
          isExpired,
          isLoading: false,
          intakeId: data.id,
          intakeSubmittedAt: data.intake_submitted_at,
          attorneyConfirmDeadlineAt: data.attorney_confirm_deadline_at,
        });
      } catch (err) {
        console.error('Error in attestation check:', err);
        setStatus({
          needsAttestation: false,
          isExpired: false,
          isLoading: false,
          intakeId: null,
          intakeSubmittedAt: null,
          attorneyConfirmDeadlineAt: null,
        });
      }
    }

    checkAttestation();
  }, [caseId]);

  return status;
}