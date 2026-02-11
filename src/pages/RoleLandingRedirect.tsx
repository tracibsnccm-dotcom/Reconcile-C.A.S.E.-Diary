import { useAuth } from "../auth/supabaseAuth";
import { Navigate } from "react-router-dom";

export default function RoleLandingRedirect() {
  const { user, loading, roles } = useAuth();
  
  // Wait for auth to fully load before making routing decisions
  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/access" replace />;

  // Use roles from auth context (fetched from rc_users table)
  const r = new Set((roles || []).map(x => x.toUpperCase()));

  // Priority 1: Clinical Management roles (Supervisor/Manager/Director) - redirect to management portal
  if (r.has("RN_CM_SUPERVISOR") || r.has("RN_CM_MANAGER") || r.has("RN_CM_DIRECTOR")) {
    return <Navigate to="/clinical-management-portal" replace />;
  }
  
  // Priority 2: RN and Clinical Management roles (including legacy RN_CCM alias)
  if (r.has("RN_CM") || r.has("RN_CCM") || r.has("RCMS_CLINICAL_MGMT") || r.has("COMPLIANCE")) {
    return <Navigate to="/rn/dashboard" replace />;
  }
  
  // Priority 3: Provider role
  if (r.has("PROVIDER")) {
    return <Navigate to="/provider-portal" replace />;
  }
  
  // Priority 4: Attorney and Staff roles
  if (r.has("ATTORNEY") || r.has("STAFF")) {
    return <Navigate to="/attorney-portal" replace />;
  }
  
  // Priority 5: External clinical staff get same portal as RN CM
  if (r.has("CLINICAL_STAFF_EXTERNAL")) {
    return <Navigate to="/rn/dashboard" replace />;
  }
  
  // Default: Client portal
  return <Navigate to="/client-portal" replace />;
}
