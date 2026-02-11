// Clears role/profile caches ONLY.
// Does NOT clear auth session, cases, drafts, or clinical data.

export function clearRoleCaches() {
  try {
    // RN-related
    sessionStorage.removeItem("rn_profile");
    sessionStorage.removeItem("staff_profile");
    sessionStorage.removeItem("rn_role");

    // Attorney-related
    sessionStorage.removeItem("attorney_profile");
    sessionStorage.removeItem("attorney_role");

    // Client-related
    sessionStorage.removeItem("client_profile");
    sessionStorage.removeItem("client_role");

    // Generic role hints
    localStorage.removeItem("user_role");
    localStorage.removeItem("role_hint");
  } catch {
    // fail silently — guard must never block login/logout
  }
}
