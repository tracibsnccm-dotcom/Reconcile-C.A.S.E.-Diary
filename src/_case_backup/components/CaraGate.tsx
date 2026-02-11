import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

interface CaraGateProps {
  onAskCara?: () => void;
}

export const CaraGate = ({ onAskCara }: CaraGateProps) => {
  const [showTip, setShowTip] = useState(false);

  return (
    <div className="flex items-center justify-between gap-3 my-4 p-3 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-2 relative">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <strong className="text-primary">CARA</strong>
        <span className="text-muted-foreground text-sm">— Your Care Reflection Assistant</span>
        <button
          className="ml-2 w-5 h-5 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold hover:bg-accent/80 transition-colors"
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          onFocus={() => setShowTip(true)}
          onBlur={() => setShowTip(false)}
          aria-label="Privacy Info"
        >
          <HelpCircle className="w-3 h-3" />
        </button>
        {showTip && (
          <div 
            className="absolute left-0 top-full mt-2 bg-popover border rounded-lg shadow-lg p-3 max-w-xs z-10"
            role="tooltip"
          >
            <p className="text-sm mb-2">
              <strong>Privacy:</strong> CARA can explain or simplify terms. You approve everything before saving.
            </p>
            <a 
              href="/hipaa-notice" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              View HIPAA Policy
            </a>
          </div>
        )}
      </div>
      <Button onClick={onAskCara} size="sm">
        ✨ Ask CARA
      </Button>
    </div>
  );
};
