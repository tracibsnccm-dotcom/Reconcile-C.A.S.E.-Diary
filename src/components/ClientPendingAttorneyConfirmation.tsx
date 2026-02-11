import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertTriangle, Shield } from 'lucide-react';
import { COMPLIANCE_COPY, formatHMS, COMPLIANCE_COPY as COMPLIANCE } from '@/constants/compliance';
import { useNavigate } from 'react-router-dom';

interface ClientPendingAttorneyConfirmationProps {
  caseId: string;
  attorneyConfirmDeadlineAt: string;
  onExpired?: () => void;
}

export function ClientPendingAttorneyConfirmation({
  caseId,
  attorneyConfirmDeadlineAt,
  onExpired,
}: ClientPendingAttorneyConfirmationProps) {
  const navigate = useNavigate();
  const [msRemaining, setMsRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  // Update countdown every second
  useEffect(() => {
    const updateCountdown = () => {
      const deadline = new Date(attorneyConfirmDeadlineAt).getTime();
      const now = Date.now();
      const remaining = deadline - now;
      
      setMsRemaining(remaining);
      const expired = remaining <= 0;
      setIsExpired(expired);
      
      if (expired && onExpired) {
        onExpired();
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [attorneyConfirmDeadlineAt, onExpired]);

  if (isExpired) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Intake Expired
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription className="whitespace-pre-line">
              {COMPLIANCE_COPY.expiredCopy}
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => navigate('/client-intake')}
            className="w-full"
            variant="default"
          >
            Restart Intake Process
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-600" />
          Pending Attorney Review
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Countdown timer */}
        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
          <Clock className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">
              Time remaining for attorney review:
            </p>
            <p className="text-2xl font-bold font-mono text-primary">
              {formatHMS(msRemaining)}
            </p>
          </div>
        </div>

        {/* Compliance message */}
        <Alert variant="default" className="bg-blue-50 border-blue-500">
          <AlertDescription className="text-blue-900 whitespace-pre-line">
            {COMPLIANCE_COPY.clientPendingAttorneyCopy}
          </AlertDescription>
        </Alert>

        <div className="text-sm text-muted-foreground">
          <p className="font-semibold mb-2">What happens next:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Your attorney will be notified to review your intake</li>
            <li>Once your attorney completes their review, you'll have full access to your client portal</li>
            <li>If your attorney doesn't complete their review within 48 hours, your intake data will be permanently deleted and you'll need to restart</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}