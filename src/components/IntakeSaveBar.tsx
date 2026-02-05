import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface IntakeSaveBarProps {
  formData: any;
  onSaveExit?: () => void;
  intNumber?: string;
  clientEmail?: string;
}

export const IntakeSaveBar = ({ formData, onSaveExit }: IntakeSaveBarProps) => {
  const [lastSaved, setLastSaved] = useState<string>('—');
  const [expiresIn, setExpiresIn] = useState<string>('—');
  const [urgencyClass, setUrgencyClass] = useState('');
  const [showUrgency, setShowUrgency] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string>('');

  const TTL_DAYS = 7;

  const formatTime = (iso: string) => {
    const ms = new Date(iso).getTime() - Date.now();
    const clamped = Math.max(0, ms);
    const d = Math.floor(clamped / 86400000);
    const h = Math.floor((clamped % 86400000) / 3600000);
    const min = Math.floor((clamped % 3600000) / 60000);
    return { ms: clamped, d, h, min };
  };

  const updateExpiry = () => {
    if (!expiresAt) return;
    const { ms, d, h, min } = formatTime(expiresAt);
    const timeStr = `${d}d ${h}h ${min}m`;
    setExpiresIn(`Expires in: ${timeStr}`);

    if (ms <= 24 * 3600000) {
      setUrgencyClass('text-destructive font-bold');
      setShowUrgency(true);
    } else if (ms <= 72 * 3600000) {
      setUrgencyClass('text-yellow-600 font-semibold');
      setShowUrgency(false);
    } else {
      setUrgencyClass('text-green-600');
      setShowUrgency(false);
    }
  };

  const initializeDraft = async () => {
    // TODO: Re-enable when edge function CORS is fixed
    // MVP: Skip edge function call due to CORS issues
    console.log('Draft initialization skipped - edge function disabled for MVP');
    return;

    // Original code below (commented out for MVP)
    /*
    const stored = localStorage.getItem('rcms_intake_draft');
    let id = stored;

    if (!id) {
      // Start new draft
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/intake-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'start', step: 1 }),
      });

      if (response.ok) {
        const result = await response.json();
        id = result.draft_id;
        setDraftId(id);
        setExpiresAt(result.expires_at || new Date(Date.now() + TTL_DAYS * 86400000).toISOString());
        setResumeUrl(result.resume_url || '');
        localStorage.setItem('rcms_intake_draft', id!);
        if (result.resume_url) {
          localStorage.setItem('rcms_resume_url', result.resume_url);
        }
      }
    } else {
      // Load existing draft
      setDraftId(id);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/intake-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'status', draft_id: id }),
      });

      if (response.ok) {
        const result = await response.json();
        setExpiresAt(result.expires_at || new Date(Date.now() + TTL_DAYS * 86400000).toISOString());
        setResumeUrl(result.resume_url || '');
        if (result.updated_at) {
          setLastSaved(`Last saved: ${new Date(result.updated_at).toLocaleString()}`);
        }
        if (result.resume_url) {
          localStorage.setItem('rcms_resume_url', result.resume_url);
        }
      }
    }
    */
  };

  const saveDraft = async (showToast = false) => {
    // TODO: Re-enable when edge function CORS is fixed
    // MVP: Skip edge function call due to CORS issues
    console.log('Draft save skipped - edge function disabled for MVP');
    return;

    // Original code below (commented out for MVP)
    /*
    if (!draftId) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/intake-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save',
          draft_id: draftId,
          step: 1,
          data: formData,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setLastSaved(`Last saved: ${new Date(result.updated_at || Date.now()).toLocaleString()}`);
        if (showToast) {
          toast.success('Progress saved');
        }
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
    */
  };

  const [saving, setSaving] = useState(false);

  const handleExit = async () => {
    setSaving(true);
    try {
      await (onSaveExit?.() ?? Promise.resolve());
    } finally {
      setSaving(false);
    }
  };

  const copyResumeLink = async () => {
    if (resumeUrl) {
      try {
        await navigator.clipboard.writeText(resumeUrl);
        toast.success('Resume link copied');
      } catch {
        toast.error('Failed to copy link');
      }
    }
  };

  useEffect(() => {
    initializeDraft();
  }, []);

  useEffect(() => {
    if (expiresAt) {
      localStorage.setItem('rcms_expiry_iso', expiresAt);
      updateExpiry();
      const interval = setInterval(updateExpiry, 60000);
      return () => clearInterval(interval);
    }
  }, [expiresAt]);

  useEffect(() => {
    const autoSave = setInterval(() => saveDraft(), 20000);
    return () => clearInterval(autoSave);
  }, [draftId, formData]);

  return (
    <>
      <div className="sticky top-0 z-50 bg-background border-b flex justify-between items-center gap-3 px-3 py-2.5">
        <div className="text-sm">
          <strong>We save your progress automatically.</strong>{' '}
          <span className="text-black">{lastSaved}</span> ·{' '}
          <span className={urgencyClass}>{expiresIn}</span>
        </div>
        <div className="flex gap-2">
          {resumeUrl && (
            <Button variant="outline" size="sm" onClick={copyResumeLink}>
              Copy resume link
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExit} disabled={saving}>
            {saving ? 'Saving…' : 'Save & Exit'}
          </Button>
        </div>
      </div>
      {showUrgency && (
        <div className="bg-destructive/10 border-y border-destructive/20 text-destructive px-3 py-2 font-bold text-sm">
          ⏰ Your intake will be deleted in{' '}
          <strong>
            {expiresAt && `${formatTime(expiresAt).d}d ${formatTime(expiresAt).h}h`}
          </strong>
          . Please finish or Save & Exit.
        </div>
      )}
    </>
  );
};
