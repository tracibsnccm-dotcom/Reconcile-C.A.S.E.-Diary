import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, CheckCircle2, AlertTriangle, Search } from 'lucide-react';
import { supabaseGet } from '@/lib/supabaseRest';
import { formatHMS } from '@/constants/compliance';
import { CLIENT_INTAKE_STATE_MESSAGES } from '@/lib/clientIntakeState';

type StatusResult = {
  status: 'pending' | 'confirmed' | 'expired' | 'not_found';
  caseNumber?: string;
  clientPin?: string;
  confirmedAt?: string;
  deadlineAt?: string;
  msRemaining?: number;
};

export default function CheckIntakeStatus() {
  const [intakeId, setIntakeId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<StatusResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msRemaining, setMsRemaining] = useState(0);

  // Update countdown for pending status
  useEffect(() => {
    if (result?.status !== 'pending' || !result.msRemaining) {
      setMsRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      if (result.deadlineAt) {
        const remaining = new Date(result.deadlineAt).getTime() - Date.now();
        if (remaining <= 0) {
          setResult(prev => prev ? { ...prev, status: 'expired', msRemaining: 0 } : null);
          setMsRemaining(0);
        } else {
          setMsRemaining(remaining);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [result]);

  const handleCheck = async () => {
    if (!intakeId.trim()) {
      setError('Please enter your Intake ID');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Search for intake by rcmsId in intake_json
      const { data: intakes, error: intakeError } = await supabaseGet(
        'rc_client_intakes',
        `select=id,case_id,intake_status,attorney_attested_at,attorney_confirm_deadline_at,intake_json&intake_json->>rcmsId=eq.${intakeId.trim().toUpperCase()}&limit=1`
      );

      if (intakeError) throw new Error(intakeError.message);

      const intake = Array.isArray(intakes) ? intakes[0] : intakes;

      if (!intake) {
        setResult({ status: 'not_found' });
        return;
      }

      // Check if confirmed
      if (intake.attorney_attested_at) {
        // Get case number and PIN
        const { data: caseData } = await supabaseGet(
          'rc_cases',
          `select=case_number,client_pin&id=eq.${intake.case_id}&is_superseded=eq.false&limit=1`
        );

        const caseInfo = Array.isArray(caseData) ? caseData[0] : caseData;

        setResult({
          status: 'confirmed',
          caseNumber: caseInfo?.case_number,
          clientPin: caseInfo?.client_pin,
          confirmedAt: intake.attorney_attested_at,
        });
        return;
      }

      // Check if expired
      if (intake.attorney_confirm_deadline_at) {
        const deadline = new Date(intake.attorney_confirm_deadline_at).getTime();
        const now = Date.now();

        if (now >= deadline) {
          setResult({
            status: 'expired',
            deadlineAt: intake.attorney_confirm_deadline_at,
          });
          return;
        }

        // Still pending
        const remaining = deadline - now;
        setResult({
          status: 'pending',
          deadlineAt: intake.attorney_confirm_deadline_at,
          msRemaining: remaining,
        });
        setMsRemaining(remaining);
        return;
      }

      // No deadline set - treat as pending
      setResult({ status: 'pending' });
    } catch (err: any) {
      console.error('Error checking intake status:', err);
      setError(err.message || 'Failed to check intake status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Check Intake Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Form */}
          <div className="space-y-4">
            <div>
              <label htmlFor="intake-id" className="text-sm font-medium mb-2 block">
                Enter your Intake ID (INT-YYMMDD-##X format)
              </label>
              <div className="flex gap-2">
                <Input
                  id="intake-id"
                  placeholder="INT-250115-01A"
                  value={intakeId}
                  onChange={(e) => setIntakeId(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCheck();
                    }
                  }}
                  className="flex-1 font-mono"
                />
                <Button onClick={handleCheck} disabled={isLoading}>
                  {isLoading ? 'Checking...' : 'Check Status'}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Not Found */}
              {result.status === 'not_found' && (
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    No intake found with ID: <strong>{intakeId}</strong>
                    <br />
                    Please check your Intake ID and try again.
                  </AlertDescription>
                </Alert>
              )}

              {/* Confirmed */}
              {result.status === 'confirmed' && (
                <Card className="border-green-500 border-2">
                  <CardHeader className="bg-green-50">
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="w-6 h-6" />
                      Intake Confirmed
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <Alert className="bg-green-50 border-green-200">
                      <AlertDescription className="text-green-900">
                        Your intake has been confirmed by your attorney. You can now access your case portal using the credentials below.
                      </AlertDescription>
                    </Alert>

                    {result.caseNumber && (
                      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                        <h3 className="font-bold text-blue-900 mb-3">Your Case Credentials</h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-blue-600 uppercase font-medium mb-1">Case Number</p>
                            <p className="text-xl font-mono font-bold text-blue-900">
                              {result.caseNumber}
                            </p>
                          </div>
                          {result.clientPin && (
                            <div>
                              <p className="text-xs text-blue-600 uppercase font-medium mb-1">PIN</p>
                              <p className="text-xl font-mono font-bold text-blue-900">
                                {result.clientPin}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {result.confirmedAt && (
                      <div className="text-sm text-muted-foreground">
                        Confirmed on: {new Date(result.confirmedAt).toLocaleString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Pending */}
              {result.status === 'pending' && (
                <Card className="border-amber-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-700">
                      <Clock className="w-5 h-5" />
                      {CLIENT_INTAKE_STATE_MESSAGES.SUBMITTED_PENDING_REVIEW.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertDescription className="text-amber-900">
                        {CLIENT_INTAKE_STATE_MESSAGES.SUBMITTED_PENDING_REVIEW.body}
                      </AlertDescription>
                    </Alert>

                    {result.deadlineAt && (
                      <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                        <Clock className="w-5 h-5 text-primary" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-1">
                            Time remaining for attorney review:
                          </p>
                          <p className="text-2xl font-bold font-mono text-primary">
                            {formatHMS(msRemaining || result.msRemaining || 0)}
                          </p>
                        </div>
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground">
                      Once your attorney completes their review, you will receive your case number and PIN.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Expired */}
              {result.status === 'expired' && (
                <Card className="border-red-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="w-5 h-5" />
                      {CLIENT_INTAKE_STATE_MESSAGES.EXPIRED_OR_INVALID.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Alert variant="destructive">
                      <AlertDescription>
                        {CLIENT_INTAKE_STATE_MESSAGES.EXPIRED_OR_INVALID.body}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
