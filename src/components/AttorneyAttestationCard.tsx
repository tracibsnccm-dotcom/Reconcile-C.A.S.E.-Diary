import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Shield, CheckCircle2 } from 'lucide-react';
import { COMPLIANCE_COPY, formatHMS } from '@/constants/compliance';
import { toast } from 'sonner';
import { useAuth } from '@/auth/supabaseAuth';
import { supabaseGet, supabaseUpdate } from '@/lib/supabaseRest';
import { audit } from '@/lib/supabaseOperations';
import { createAutoNote, generateAttestationNote } from '@/lib/autoNotes';
import { sendCaseCredentialsEmail } from '@/lib/emailService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function generateCaseNumber(attorneyCode: string, sequenceToday: number): string {
  const today = new Date();
  const yy = today.getFullYear().toString().slice(-2);
  const mm = (today.getMonth() + 1).toString().padStart(2, '0');
  const dd = today.getDate().toString().padStart(2, '0');
  const seq = sequenceToday.toString().padStart(2, '0');
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const randomLetter = letters[Math.floor(Math.random() * letters.length)];
  return `${attorneyCode}-${yy}${mm}${dd}-${seq}${randomLetter}`;
}

function generatePIN(): string {
  const excluded = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321'];
  let pin: string;
  do {
    pin = Math.floor(1000 + Math.random() * 9000).toString();
  } while (excluded.includes(pin));
  return pin;
}

type ViewState = 'loading' | 'pending' | 'confirmed' | 'declined' | 'expired';

interface ConfirmationData {
  caseNumber: string;
  clientPin: string;
  confirmedAt: string;
}

interface AttorneyAttestationCardProps {
  intakeId: string;
  caseId: string;
  intakeSubmittedAt: string;
  attorneyConfirmDeadlineAt: string;
  attorneyAttestedAt?: string | null;
  intakeJson?: any;
  onAttestationComplete: () => void;
  onAttested?: (attestedAt: string, updatedIntakeJson: any) => void;
  onResolved?: (resolution: "CONFIRMED" | "DECLINED", timestamp: string, updatedIntakeJson: any) => void;
  resolved?: null | "CONFIRMED" | "DECLINED";
}

export function AttorneyAttestationCard({
  intakeId,
  caseId,
  intakeSubmittedAt,
  attorneyConfirmDeadlineAt,
  attorneyAttestedAt,
  intakeJson,
  onAttestationComplete,
  onAttested,
  onResolved,
  resolved,
}: AttorneyAttestationCardProps) {
  const { user } = useAuth();
  
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);
  const [msRemaining, setMsRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);

  useEffect(() => {
    const sessionKey = `attestation_${intakeId}`;
    const stored = sessionStorage.getItem(sessionKey);
    
    if (stored) {
      const data = JSON.parse(stored);
      setConfirmationData(data);
      setViewState('confirmed');
      return;
    }
    
    if (attorneyAttestedAt || resolved === 'CONFIRMED') {
      setViewState('confirmed');
      return;
    }
    
    if (resolved === 'DECLINED') {
      setViewState('declined');
      return;
    }
    
    const deadline = new Date(attorneyConfirmDeadlineAt).getTime();
    if (Date.now() >= deadline) {
      setViewState('expired');
      return;
    }
    
    setViewState('pending');
  }, [intakeId]);

  useEffect(() => {
    if (viewState !== 'pending') return;
    
    const updateCountdown = () => {
      const deadline = new Date(attorneyConfirmDeadlineAt).getTime();
      const remaining = deadline - Date.now();
      
      if (remaining <= 0) {
        setViewState('expired');
        setMsRemaining(0);
      } else {
        setMsRemaining(remaining);
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [viewState, attorneyConfirmDeadlineAt]);

  const handleConfirm = async () => {
    if (!user) {
      toast.error('Not authenticated');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data: rcUsers, error: rcUsersError } = await supabaseGet(
        'rc_users', 
        `select=id,attorney_code&auth_user_id=eq.${user.id}&role=eq.attorney&limit=1`
      );
      
      if (rcUsersError) throw new Error(`Failed to get attorney: ${rcUsersError.message}`);
      
      const rcUser = Array.isArray(rcUsers) ? rcUsers[0] : rcUsers;
      if (!rcUser?.id || !rcUser?.attorney_code) {
        throw new Error('Attorney record not found');
      }
      
      const attorneyId = rcUser.id;
      const attorneyCode = rcUser.attorney_code;
      
      const { data: intakes, error: intakesError } = await supabaseGet(
        'rc_client_intakes', 
        `select=id,case_id,intake_json,attorney_attested_at&id=eq.${intakeId}&limit=1`
      );
      
      if (intakesError) throw new Error(`Failed to get intake: ${intakesError.message}`);
      
      const intake = Array.isArray(intakes) ? intakes[0] : intakes;
      if (!intake?.case_id) throw new Error('Intake not found');
      
      // Confirm is idempotent: we UPDATE rc_cases by id (caseId = selected row) and reuse existing client_pin if present. No INSERT.
      // SELECT the selected rc_cases row by caseId (the table row's case id from View/Attest)
      const { data: caseData, error: caseDataError } = await supabaseGet(
        'rc_cases',
        `select=id,case_number,client_pin,case_status&id=eq.${caseId}&is_superseded=eq.false&limit=1`
      );
      if (caseDataError) throw new Error(`Failed to get case: ${caseDataError.message}`);
      const existingCase = Array.isArray(caseData) ? caseData[0] : caseData;
      const existingCaseNumber = existingCase?.case_number;
      
      // Idempotency: if already confirmed, return existing case_number and PIN without generating new values
      const alreadyConfirmed = !!intake.attorney_attested_at ||
        (!!(existingCase?.client_pin) && existingCase?.case_status === 'attorney_confirmed');
      if (alreadyConfirmed && existingCase?.case_number) {
        const caseNumber = existingCase.case_number;
        const clientPin = existingCase.client_pin ?? '';
        const confirmedAt = intake.attorney_attested_at
          || (typeof intake?.intake_json?.compliance?.attorney_confirmation_receipt?.confirmed_at === 'string'
            ? intake.intake_json.compliance.attorney_confirmation_receipt.confirmed_at : null)
          || new Date().toISOString();
        const confirmation: ConfirmationData = { caseNumber, clientPin, confirmedAt };
        sessionStorage.setItem(`attestation_${intakeId}`, JSON.stringify(confirmation));
        setConfirmationData(confirmation);
        setViewState('confirmed');
        if (onResolved) onResolved('CONFIRMED', confirmedAt, intake.intake_json || {});
        if (onAttested) onAttested(confirmedAt, intake.intake_json || {});
        toast.success('Already confirmed. Displaying existing case number and PIN.');
        setIsSubmitting(false);
        return;
      }
      
      if (!existingCaseNumber) {
        throw new Error('Case number not found - cannot convert INT number to attorney case number');
      }
      
      // Convert INT number to attorney case number by replacing "INT" with attorney code
      // Example: INT-260115-01M -> BG04-260115-01M
      let caseNumber: string;
      if (existingCaseNumber.startsWith('INT-')) {
        caseNumber = existingCaseNumber.replace(/^INT-/, `${attorneyCode}-`);
        console.log('[AttorneyAttestationCard] Converting case number:', { from: existingCaseNumber, to: caseNumber, attorneyCode });
      } else {
        console.warn('[AttorneyAttestationCard] Case number does not start with INT-, using as-is:', existingCaseNumber);
        caseNumber = existingCaseNumber;
      }
      const clientPin = generatePIN();
      const now = new Date().toISOString();
      
      const { error: caseError } = await supabaseUpdate(
        'rc_cases',
        `id=eq.${caseId}`,
        {
          case_number: caseNumber,
          client_pin: clientPin,
          case_status: 'attorney_confirmed',
        }
      );
      
      if (caseError) throw new Error(`Failed to update case: ${caseError.message}`);
      
      const existingJson = intake.intake_json || {};
      const updatedJson = {
        ...existingJson,
        compliance: {
          ...(existingJson.compliance || {}),
          attorney_confirmation_receipt: {
            action: 'CONFIRMED',
            confirmed_at: now,
            confirmed_by: attorneyId,
          }
        },
        attorney_attestation: {
          status: 'confirmed',
          confirmed_at: now,
        }
      };
      
      const { error: intakeError } = await supabaseUpdate(
        'rc_client_intakes',
        `id=eq.${intakeId}`,
        {
          attorney_attested_at: now,
          attorney_attested_by: attorneyId,
          attorney_confirm_deadline_at: null,
          intake_status: 'attorney_confirmed',
          intake_json: updatedJson,
        }
      );
      
      if (intakeError) throw new Error(`Failed to update intake: ${intakeError.message}`);
      
      // SUCCESS - Update UI immediately
      const confirmation: ConfirmationData = {
        caseNumber,
        clientPin,
        confirmedAt: now,
      };
      
      sessionStorage.setItem(`attestation_${intakeId}`, JSON.stringify(confirmation));
      setConfirmationData(confirmation);
      setViewState('confirmed');
      
      if (onResolved) onResolved('CONFIRMED', now, updatedJson);
      if (onAttested) onAttested(now, updatedJson);
      
      toast.success('Case confirmed! Case number and PIN generated.');
      
      // Fire-and-forget: audit, notes, and email (completely non-blocking)
      try {
        setTimeout(() => {
          Promise.resolve().then(async () => {
            audit({
              action: 'attorney_confirmed',
              actorRole: 'attorney',
              actorId: user?.id || '',
              caseId: caseId,
              meta: { intake_id: intakeId, case_number: caseNumber }
            }).catch(() => {});
            
            createAutoNote({
              caseId: caseId,
              noteType: 'attestation',
              title: 'Attorney Confirmed Representation',
              content: 'Attorney confirmed client representation',
              triggerEvent: 'attorney_confirmed',
              visibleToClient: true,
              visibleToRN: true,
              visibleToAttorney: true
            }).catch(() => {});
            
            // Send credentials email to client
            try {
              // Get client email from rc_cases -> rc_clients
              const { data: caseData } = await supabaseGet(
                'rc_cases',
                `select=id,client_id&id=eq.${caseId}&limit=1`
              );
              
              const caseRecord = Array.isArray(caseData) ? caseData[0] : caseData;
              const clientId = caseRecord?.client_id;
              
              if (clientId) {
                // Get client email
                const { data: clientData } = await supabaseGet(
                  'rc_clients',
                  `select=email&id=eq.${clientId}&limit=1`
                );
                
                const client = Array.isArray(clientData) ? clientData[0] : clientData;
                const clientEmail = client?.email;
                
                if (clientEmail) {
                  const clientLoginUrl = `${window.location.origin}/client-login`;
                  await sendCaseCredentialsEmail({
                    to: clientEmail,
                    caseId: caseNumber,
                    clientPin: clientPin,
                    clientLoginUrl: clientLoginUrl,
                  });
                  console.log('Credentials email sent to client');
                } else {
                  console.warn('Client email not found, skipping credentials email');
                }
              } else {
                console.warn('Client ID not found in case, skipping credentials email');
              }
            } catch (emailError) {
              console.error('Error sending credentials email:', emailError);
              // Don't show error to user - email is non-critical
            }
          });
        }, 0);
      } catch (e) {
        // Ignore any errors - UI is already updated
      }
      
    } catch (error: any) {
      console.error('Attestation failed:', error);
      toast.error(error.message || 'Failed to confirm');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!user) return;
    
    setShowDeclineDialog(false);
    setIsSubmitting(true);
    
    try {
      const now = new Date().toISOString();
      
      const { data: intakes } = await supabaseGet(
        'rc_client_intakes', 
        `select=id,intake_json&id=eq.${intakeId}&limit=1`
      );
      
      const intake = Array.isArray(intakes) ? intakes[0] : intakes;
      if (!intake) throw new Error('Intake not found');
      
      const existingJson = intake.intake_json || {};
      const updatedJson = {
        ...existingJson,
        attorney_attestation: {
          status: 'declined',
          declined_at: now,
        }
      };
      
      const { error } = await supabaseUpdate(
        'rc_client_intakes',
        `id=eq.${intakeId}`,
        {
          intake_status: 'attorney_declined_not_client',
          attorney_confirm_deadline_at: null,
          intake_json: updatedJson,
        }
      );
      
      if (error) throw new Error(error.message);
      
      setViewState('declined');
      if (onResolved) onResolved('DECLINED', now, updatedJson);
      toast.info('Marked as not my client');
      
      // Fire-and-forget: audit
      setTimeout(() => {
        audit({
          action: 'attorney_declined',
          actorRole: 'attorney',
          actorId: user?.id || '',
          caseId: caseId,
          meta: { intake_id: intakeId }
        }).catch(e => console.error('Audit failed:', e));
      }, 100);
      
    } catch (error: any) {
      console.error('Decline failed:', error);
      toast.error(error.message || 'Failed to decline');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (viewState === 'loading') {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (viewState === 'confirmed') {
    return (
      <Card className="border-green-500 border-2">
        <CardHeader className="bg-green-50">
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-6 h-6" />
            Attorney Confirmation Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          {confirmationData && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-4">
                🔑 Client Login Credentials
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                Provide these to your client so they can access their portal:
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded border">
                  <p className="text-xs text-blue-600 uppercase font-medium mb-1">Case Number</p>
                  <p className="text-2xl font-mono font-bold text-blue-900">
                    {confirmationData.caseNumber}
                  </p>
                </div>
                <div className="bg-white p-4 rounded border">
                  <p className="text-xs text-blue-600 uppercase font-medium mb-1">PIN</p>
                  <p className="text-2xl font-mono font-bold text-blue-900">
                    {confirmationData.clientPin}
                  </p>
                </div>
              </div>
              <p className="text-sm text-amber-700 mt-4 font-medium">
                ⚠️ The PIN is shown only once. Please record it now.
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge className="bg-green-600">Confirmed</Badge>
            </div>
            {confirmationData?.confirmedAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Confirmed At</span>
                <span className="font-medium">
                  {new Date(confirmationData.confirmedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
          
          <Button 
            onClick={() => {
              sessionStorage.removeItem(`attestation_${intakeId}`);
              onAttestationComplete();
            }}
            className="w-full"
          >
            Back to Intake List
          </Button>
          
        </CardContent>
      </Card>
    );
  }

  if (viewState === 'declined') {
    return (
      <Card className="border-amber-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-5 h-5" />
            Not My Client
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-amber-50 border-amber-200">
            <AlertDescription className="text-amber-900">
              This intake has been marked as not your client. Access is disabled.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (viewState === 'expired') {
    return (
      <Card className="border-red-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            Confirmation Window Expired
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              The 48-hour confirmation window has expired. This intake data has been 
              purged in accordance with HIPAA privacy requirements.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-amber-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-600" />
            Attorney Confirmation Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Clock className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">
                Time remaining to confirm:
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {formatHMS(msRemaining)}
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold">{COMPLIANCE_COPY.attorneyAttestation.title}</h4>
            <div className="text-sm text-muted-foreground space-y-2">
              {COMPLIANCE_COPY.attorneyAttestation.bodyLines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? 'Processing...' : 'Review Intake & Proceed'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              This action advances the case to RN assignment.
            </p>
            
            <Button 
              onClick={() => setShowDeclineDialog(true)}
              disabled={isSubmitting}
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50"
              size="lg"
            >
              Not My Client
            </Button>
          </div>
          
        </CardContent>
      </Card>
      
      <AlertDialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure this is not your client? This will prevent access to this intake.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDecline}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirm - Not My Client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
