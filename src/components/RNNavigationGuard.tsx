import { ReactNode, useState } from "react";
import { useEmergencyAlertGuard } from "@/hooks/useEmergencyAlertGuard";
import { EmergencyAlertBlocker } from "./EmergencyAlertBlocker";

interface NavigationGuardContext {
  handleNavigation: (e: React.MouseEvent, callback?: () => void) => boolean;
  hasIncompleteAlerts: boolean;
}

interface RNNavigationGuardProps {
  children: ReactNode | ((context: NavigationGuardContext) => ReactNode);
  allowedPaths?: string[]; // Paths that are always allowed even with incomplete alerts
}

export function RNNavigationGuard({ children, allowedPaths = [] }: RNNavigationGuardProps) {
  const { hasIncompleteAlerts, attemptCount, recordAttempt } = useEmergencyAlertGuard();
  const [showBlocker, setShowBlocker] = useState(false);

  const handleNavigation = (e: React.MouseEvent, callback?: () => void): boolean => {
    // Check if this navigation is to an allowed path
    const target = e.currentTarget as HTMLElement;
    const href = target.getAttribute("href") || "";
    
    const isAllowed = allowedPaths.some(path => href.includes(path));

    if (hasIncompleteAlerts && !isAllowed) {
      e.preventDefault();
      e.stopPropagation();
      setShowBlocker(true);
      recordAttempt();
      return false;
    }

    if (callback) {
      callback();
    }
    return true;
  };

  // Clone children and add click handler
  const guardedChildren = typeof children === "function" 
    ? children({ handleNavigation, hasIncompleteAlerts })
    : children;

  return (
    <>
      {guardedChildren}
      <EmergencyAlertBlocker
        open={showBlocker}
        onClose={() => setShowBlocker(false)}
        attemptCount={attemptCount}
      />
    </>
  );
}
