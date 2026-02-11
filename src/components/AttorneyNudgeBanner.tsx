import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface IntakeStatus {
  intake_complete: boolean;
  last_nudged_iso: string | null;
  expires_iso: string | null;
  resume_url?: string;
}

export const AttorneyNudgeBanner = () => {
  const [visible, setVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [resumeUrl, setResumeUrl] = useState("/intake");

  useEffect(() => {
    checkNudgeStatus();
    const interval = setInterval(checkNudgeStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const ttlLabel = (iso: string | null): string => {
    if (!iso) return '';
    const ms = new Date(iso).getTime() - Date.now();
    if (ms <= 0) return 'expires soon';
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    return days > 0 ? `${days} day${days > 1 ? 's' : ''} ${hours}h remaining` : `${hours} hours remaining`;
  };

  const checkNudgeStatus = async () => {
    try {
      const dismissedUntil = Number(localStorage.getItem('rcms_nudge_dismiss_until') || 0);
      if (Date.now() < dismissedUntil) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/client-intake-status`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) return;

      const data: IntakeStatus = await response.json();

      if (data.intake_complete || !data.last_nudged_iso) {
        setVisible(false);
        return;
      }

      const ttl = ttlLabel(data.expires_iso);
      setTimeRemaining(ttl);
      setResumeUrl(data.resume_url || localStorage.getItem('rcms_resume_url') || '/client-intake');
      setVisible(true);
    } catch (error) {
      console.error('Failed to check nudge status:', error);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('rcms_nudge_dismiss_until', String(Date.now() + 24 * 3600000));
    setVisible(false);
  };

  const handleResume = () => {
    window.location.href = resumeUrl;
  };

  const handleTalkWithCara = () => {
    const caraModal = document.getElementById('cara-intake-modal');
    if (caraModal) {
      caraModal.setAttribute('aria-hidden', 'false');
    }
  };

  if (!visible) return null;

  return (
    <div 
      className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-blue-50 dark:bg-blue-950/20 border-l-4 border-primary rounded-lg p-3 mb-3 shadow-sm animate-in slide-in-from-top-2"
      role="region"
      aria-live="polite"
      aria-label="Intake reminder"
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">👋</span>
        <div>
          <strong className="text-foreground">Your attorney sent a reminder.</strong>
          <div className="text-sm text-muted-foreground mt-1">
            {timeRemaining ? `You can return to your intake anytime — ${timeRemaining}.` : 'You can return to your intake anytime. Your progress is saved.'}
          </div>
        </div>
      </div>
      <div className="flex gap-2 items-center flex-wrap">
        <Button onClick={handleResume} size="sm">
          Resume Intake
        </Button>
        <Button onClick={handleTalkWithCara} variant="outline" size="sm">
          Talk with CARA
        </Button>
        <Button onClick={handleDismiss} variant="ghost" size="sm">
          Dismiss
        </Button>
      </div>
    </div>
  );
};
