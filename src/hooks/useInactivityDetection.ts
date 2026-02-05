import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInactivityDetectionProps {
  timeoutMs?: number;
  onInactive?: () => void;
  enabled?: boolean;
}

export function useInactivityDetection({ 
  timeoutMs = 15 * 60 * 1000, // 15 minutes
  onInactive,
  enabled = true 
}: UseInactivityDetectionProps = {}) {
  const [isInactive, setIsInactive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    
    setIsInactive(false);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setIsInactive(true);
      onInactive?.();
    }, timeoutMs);
  }, [timeoutMs, onInactive, enabled]);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const dismissInactivity = useCallback(() => {
    setIsInactive(false);
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!enabled) return;

    // Activity events to track
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    // Add event listeners with passive option for better performance
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Start the timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [handleActivity, resetTimer, enabled]);

  return {
    isInactive,
    dismissInactivity,
    resetTimer,
  };
}
