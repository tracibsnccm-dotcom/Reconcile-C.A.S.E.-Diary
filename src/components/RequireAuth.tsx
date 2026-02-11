import { ReactNode } from 'react';
import { useAuth } from '@/auth/supabaseAuth';
import { useApp } from '@/context/AppContext';
import { useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { MFAEnrollment } from '@/components/MFAEnrollment';
import { MFAChallenge } from '@/components/MFAChallenge';

interface RequireAuthProps {
  children: ReactNode;
}

function isStaging() {
  const vercelEnv = import.meta.env.VITE_VERCEL_ENV;
  const stagingFlag = import.meta.env.VITE_STAGING;
  console.log("[MFA DEBUG] VITE_VERCEL_ENV:", vercelEnv);
  console.log("[MFA DEBUG] VITE_STAGING:", stagingFlag);
  console.log("[MFA DEBUG] isStaging result:", vercelEnv === "preview" || stagingFlag === "true");
  return vercelEnv === "preview" || stagingFlag === "true";
}

/**
 * Minimal auth gate wrapper for route-level protection.
 * Blocks unauthenticated access and shows sign-in prompt.
 * Attorneys are redirected to /attorney-login, others to /auth.
 * STAGING-ONLY: blocks non-clients when authority.mustEnrollMFA is true
 *   or when authority.enrollmentKnown is false (Cannot verify MFA status).
 * Does NOT block on rolesLoading - if user exists, allow rendering and let pages handle authorization.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { user, authLoading, rolesLoading, primaryRole } = useAuth();
  const { authority, authorityLoading } = useApp();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-rcms-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Determine redirect based on pathname
    // Attorney routes go to /attorney-login, RN routes go to /rn-login, others go to /auth
    const isAttorneyRoute = location.pathname.includes('attorney');
    const isRNRoute = location.pathname.includes('rn-console') || location.pathname.includes('rn-portal') || location.pathname.includes('rn/dashboard') || location.pathname.includes('rn-supervisor');
    const loginUrl = isAttorneyRoute 
      ? '/attorney-login' 
      : isRNRoute
      ? '/rn-login'
      : '/auth?redirect=/client-portal';

    return (
      <div className="min-h-screen bg-rcms-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Authentication Required</h2>
            </div>
            <p className="text-muted-foreground">
              Please sign in to continue.
            </p>
            <Button
              onClick={() => window.location.assign(loginUrl)}
              className="w-full"
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated - allow rendering even if roles are still loading
  // Pages can handle their own authorization checks. Do NOT apply MFA gate until we know role.
  if (rolesLoading) {
    return (
      <>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <Alert>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Loading user roles...</AlertTitle>
            <AlertDescription className="text-yellow-700">
              User roles are being loaded. Some features may be unavailable until roles are loaded.
            </AlertDescription>
          </Alert>
        </div>
        {children}
      </>
    );
  }

  const isClient = (primaryRole ?? "").toLowerCase() === "client";

  if (isClient) {
    return <>{children}</>;
  }

  if (!isStaging()) {
    return <>{children}</>;
  }

  if (authorityLoading) {
    return (
      <div className="min-h-screen bg-rcms-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (authority && !authority.enrollmentKnown) {
    return (
      <div className="min-h-screen bg-rcms-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Cannot verify MFA status</h2>
            </div>
            <p className="text-muted-foreground">
              We could not verify your multi-factor authentication status. Please try again or contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authority?.mustEnrollMFA === true) {
    return <MFAEnrollment />;
  }

  if (authority?.mustVerifyMFA === true) {
    return <MFAChallenge />;
  }

  return <>{children}</>;
}
