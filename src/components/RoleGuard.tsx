/**
 * RoleGuard Component
 * 
 * Protects routes by checking if the authenticated user has the required role.
 * Redirects to home with error message if role doesn't match.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface RoleGuardProps {
  requiredRole: string; // e.g., 'attorney', 'client', 'provider'
  children: React.ReactNode;
  redirectTo?: string; // Default: '/'
  showError?: boolean; // Show error message before redirect
}

export function RoleGuard({ 
  requiredRole, 
  children, 
  redirectTo = '/',
  showError = true 
}: RoleGuardProps) {
  const { user, authLoading, roles, primaryRole } = useAuth();
  const [localRoles, setLocalRoles] = useState<string[]>([]);
  const [rolesFetched, setRolesFetched] = useState(false);
  const [waitTimeoutExpired, setWaitTimeoutExpired] = useState(false);
  const navigate = useNavigate();
  
  // Use local roles if available, otherwise use context roles
  const effectiveRoles = localRoles.length > 0 ? localRoles : roles;
  const effectivePrimaryRole = localRoles.length > 0 ? localRoles[0] : primaryRole;

  console.log(`RoleGuard[${requiredRole}]: Starting role check`);
  console.log(`RoleGuard[${requiredRole}]: authLoading:`, authLoading);
  console.log(`RoleGuard[${requiredRole}]: User:`, user);
  console.log(`RoleGuard[${requiredRole}]: Roles array:`, roles);
  console.log(`RoleGuard[${requiredRole}]: Local roles:`, localRoles);
  console.log(`RoleGuard[${requiredRole}]: Effective roles:`, effectiveRoles);
  console.log(`RoleGuard[${requiredRole}]: PrimaryRole:`, primaryRole);
  console.log(`RoleGuard[${requiredRole}]: Effective PrimaryRole:`, effectivePrimaryRole);
  console.log(`RoleGuard[${requiredRole}]: Required role (lowercase):`, requiredRole.toLowerCase());
  console.log(`RoleGuard[${requiredRole}]: Required role (uppercase):`, requiredRole.toUpperCase());
  
  // Show detailed comparison
  if (effectiveRoles && effectiveRoles.length > 0) {
    console.log(`RoleGuard[${requiredRole}]: Comparing roles array:`, effectiveRoles.map(r => ({
      original: r,
      uppercase: r.toUpperCase(),
      matches: r.toUpperCase() === requiredRole.toUpperCase()
    })));
  }
  if (effectivePrimaryRole) {
    console.log(`RoleGuard[${requiredRole}]: Comparing primaryRole:`, {
      original: effectivePrimaryRole,
      uppercase: effectivePrimaryRole.toUpperCase(),
      requiredUppercase: requiredRole.toUpperCase(),
      matches: effectivePrimaryRole.toUpperCase() === requiredRole.toUpperCase()
    });
  }
  
  // Fallback: Fetch roles directly if they're empty after auth completes
  useEffect(() => {
    const fetchRolesFallback = async () => {
      // Only fetch if auth is done, user exists, roles are empty, and we haven't fetched yet
      if (!authLoading && user?.id && roles.length === 0 && !rolesFetched) {
        console.log(`RoleGuard[${requiredRole}]: Roles empty, fetching directly as fallback`);
        console.log('RoleGuard fallback: Fetching role for user.id:', user.id);
        setRolesFetched(true);
        try {
          const { data, error } = await supabase
            .from('rc_users')
            .select('role')
            .eq('auth_user_id', user.id)
            .maybeSingle();
          
          console.log('RoleGuard fallback: Query result - data:', data, 'error:', error);
          console.log('RoleGuard fallback: Query details - table: rc_users, column: auth_user_id, value:', user.id);
          
          if (error) {
            console.error(`RoleGuard[${requiredRole}]: Error fetching roles:`, error);
            console.error('RoleGuard fallback: Error details:', {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code
            });
            return;
          }
          
          if (data?.role) {
            // Map role to app format (same as in supabaseAuth)
            const roleMap: Record<string, string> = {
              'attorney': 'ATTORNEY',
              'rn_cm': 'RN_CM',
              'rn': 'RN_CM',
              'provider': 'PROVIDER',
              'client': 'CLIENT',
              'supervisor': 'RN_CM_SUPERVISOR',
            };
            const appRole = roleMap[data.role.toLowerCase()] || data.role.toUpperCase();
            console.log(`RoleGuard[${requiredRole}]: Fetched role:`, appRole);
            console.log('RoleGuard fallback: Role mapping - raw:', data.role, 'mapped:', appRole);
            setLocalRoles([appRole]);
          } else {
            console.warn('RoleGuard fallback: Data found but no role field:', data);
            console.warn('RoleGuard fallback: Full data object:', JSON.stringify(data, null, 2));
          }
        } catch (error) {
          console.error(`RoleGuard[${requiredRole}]: Exception fetching roles:`, error);
        }
      }
    };
    
    void fetchRolesFallback();
  }, [authLoading, user?.id, roles.length, rolesFetched, requiredRole]);

  useEffect(() => {
    console.log(`RoleGuard[${requiredRole}]: useEffect triggered - authLoading:`, authLoading, 'user:', !!user, 'roles:', roles, 'localRoles:', localRoles, 'primaryRole:', primaryRole);
    
    // Wait for auth to load
    if (authLoading) {
      console.log(`RoleGuard[${requiredRole}]: Still loading auth, waiting...`);
      return;
    }

    // If not authenticated, redirect to access page
    if (!user) {
      console.log(`RoleGuard[${requiredRole}]: No user, redirecting to /access`);
      navigate('/access', { replace: true });
      return;
    }

    // If roles are empty, wait briefly then proceed anyway (don't block forever)
    if (effectiveRoles.length === 0 && !effectivePrimaryRole && !waitTimeoutExpired) {
      console.log(`RoleGuard[${requiredRole}]: Roles not loaded yet, waiting briefly...`);
      // Wait up to 2 seconds for roles to load
      const timeout = setTimeout(() => {
        console.log(`RoleGuard[${requiredRole}]: Timeout reached, proceeding without roles (may deny access)`);
        setWaitTimeoutExpired(true);
      }, 2000);
      return () => clearTimeout(timeout);
    }

    // Check if user has the required role
    // Note: roles come from supabaseAuth as uppercase (e.g., 'ATTORNEY'), 
    // but requiredRole is lowercase (e.g., 'attorney')
    // We compare case-insensitively
    const requiredUpper = requiredRole.toUpperCase();
    console.log(`RoleGuard[${requiredRole}]: Comparing against required role (uppercase):`, requiredUpper);
    
    const rolesMatch = effectiveRoles.some(role => {
      const roleUpper = role.toUpperCase();
      const matches = roleUpper === requiredUpper;
      console.log(`RoleGuard[${requiredRole}]: Checking role "${role}" (${roleUpper}) === "${requiredRole}" (${requiredUpper}):`, matches);
      return matches;
    });
    
    const primaryRoleMatch = effectivePrimaryRole ? (() => {
      const primaryUpper = effectivePrimaryRole.toUpperCase();
      const matches = primaryUpper === requiredUpper;
      console.log(`RoleGuard[${requiredRole}]: Checking primaryRole "${effectivePrimaryRole}" (${primaryUpper}) === "${requiredRole}" (${requiredUpper}):`, matches);
      return matches;
    })() : false;
    
    const hasRole = rolesMatch || primaryRoleMatch;

    console.log(`RoleGuard[${requiredRole}]: Final role check result:`, {
      rolesMatch,
      primaryRoleMatch,
      hasRole,
      rolesArray: effectiveRoles,
      primaryRole: effectivePrimaryRole,
      requiredRole,
      requiredUpper
    });

    if (!hasRole) {
      console.log(`RoleGuard[${requiredRole}]: Access denied - redirecting to`, redirectTo);
      console.log(`RoleGuard[${requiredRole}]: DEBUG - roles array:`, JSON.stringify(roles));
      console.log(`RoleGuard[${requiredRole}]: DEBUG - primaryRole:`, primaryRole);
      console.log(`RoleGuard[${requiredRole}]: DEBUG - requiredRole:`, requiredRole);
      // Show error briefly, then redirect
      if (showError) {
        // Store error message in sessionStorage for display on redirect page
        sessionStorage.setItem(
          'roleError',
          `Access denied: This page requires ${requiredRole} role. Your current role: ${effectivePrimaryRole || 'unknown'}. Roles array: ${JSON.stringify(effectiveRoles)}`
        );
      }
      navigate(redirectTo, { replace: true });
    } else {
      console.log(`RoleGuard[${requiredRole}]: Access granted - user has required role`);
    }
  }, [user, authLoading, roles, localRoles, effectiveRoles, effectivePrimaryRole, primaryRole, requiredRole, navigate, redirectTo, showError, waitTimeoutExpired]);

  // Show loading state
  if (authLoading) {
    console.log(`=== RoleGuard[${requiredRole}]: Returning Loading state ===`);
    console.log(`RoleGuard[${requiredRole}]: Rendering loading state`);
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading...</div>
    );
  }

  // Show error if not authenticated
  if (!user) {
    console.log(`RoleGuard[${requiredRole}]: Rendering no user error`);
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please sign in to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check role (same logic as in useEffect)
  const rolesMatch = effectiveRoles.some(role => {
    const roleUpper = role.toUpperCase();
    const requiredUpper = requiredRole.toUpperCase();
    const matches = roleUpper === requiredUpper;
    console.log(`RoleGuard[${requiredRole}]: Render - Checking role "${role}" (${roleUpper}) === "${requiredRole}" (${requiredUpper}):`, matches);
    return matches;
  });
  
  const primaryRoleMatch = effectivePrimaryRole ? (() => {
    const primaryUpper = effectivePrimaryRole.toUpperCase();
    const requiredUpper = requiredRole.toUpperCase();
    const matches = primaryUpper === requiredUpper;
    console.log(`RoleGuard[${requiredRole}]: Render - Checking primaryRole "${effectivePrimaryRole}" (${primaryUpper}) === "${requiredRole}" (${requiredUpper}):`, matches);
    return matches;
  })() : false;
  
  const hasRole = rolesMatch || primaryRoleMatch;

  console.log(`RoleGuard[${requiredRole}]: Render check - hasRole:`, hasRole, {
    rolesMatch,
    primaryRoleMatch,
    rolesArray: effectiveRoles,
    primaryRole: effectivePrimaryRole
  });

  if (!hasRole) {
    console.log(`RoleGuard[${requiredRole}]: Rendering access denied`);
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied: This page requires {requiredRole} role. Your current role: {effectivePrimaryRole || 'unknown'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // User has correct role, render children
  console.log(`=== RoleGuard[${requiredRole}]: Rendering children (AttorneyConsole content) ===`);
  console.log(`RoleGuard[${requiredRole}]: Rendering children`);
  return <>{children}</>;
}
