/**
 * MVP Routing Configuration
 * 
 * MVP Entry Route: "/" → Index (Lovable landing page)
 * MVP Attorney Route: "/attorney-portal" → AttorneyLanding component
 * RN Dashboard: "/rn/dashboard" → RNPortalLanding (rich dashboard); /rn-console redirects to /rn/dashboard
 * MVP Client Route: "/client-portal" → ClientPortal component (direct mount)
 * /demo Guard: VITE_ENABLE_DEMO env var (default: disabled)
 * 
 * Summary:
 * - "/" routes to MVP landing page (Index component)
 * - "/rn/dashboard" routes to RN dashboard (RNPortalLanding); /rn, /rn-console, and /rn-portal-landing redirect to /rn/dashboard
 *   - Uses Lovable RN components directly (no ChatGPT demo shell)
 *   - Full dashboard with stats, to-do lists, case health, and all features
 * - Attorney: /attorney/dashboard, /attorney/pending-intakes (explicit); /attorney and /attorney/* redirect to /attorney/dashboard; /attorney-console→/attorney/dashboard; /attorney-portal unchanged; Communication lives only in case views
 * - "/client-portal" routes to MVP client portal (ClientPortal component)
 *   - ClientPortal uses Supabase-backed APIs (no demo/mock data)
 *   - ClientCheckins writes directly to rc_client_checkins and case_alerts tables
 * - "/demo" is blocked unless VITE_ENABLE_DEMO === "true"
 * - Demo features are quarantined, not improved
 */

// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";

import DemoHub from "./pages/DemoHub.tsx";
import Index from "./pages/Index";
import ClientPortal from "./pages/ClientPortal";
import ClientIntakeForm from "./pages/ClientIntakeForm";
import IntakeWizard from "./pages/IntakeWizard";
import AttorneyLanding from "./pages/AttorneyLanding";
import AttorneyPendingIntakesPage from "./pages/AttorneyPendingIntakesPage";
import AttorneyPendingIntakeShell from "./pages/AttorneyPendingIntakeShell";
import AttorneyCasesPage from "./pages/AttorneyCasesPage";
import AttorneyBilling from "./pages/AttorneyBilling";
import AttorneySearchPage from "./pages/AttorneySearchPage";
import AttorneyCalendarPage from "./pages/AttorneyCalendarPage";
import AttorneyNotesPage from "./pages/AttorneyNotesPage";
import AttorneyPrivateNotesPage from "./pages/AttorneyPrivateNotesPage";
import AttorneyRNCoordinationPage from "./pages/AttorneyRNCoordinationPage";
import DocumentHub from "./pages/DocumentHub";
import Providers from "./pages/Providers";
import Reports from "./pages/Reports";
import AttorneyLogin from "./pages/AttorneyLogin";
import RNLogin from "./pages/RNLogin";
import RNPortalLogin from "./pages/RNPortalLogin";
import ClientLogin from "./pages/ClientLogin";
import ClientConsent from "./pages/ClientConsent";
import IntakeIdentity from "./pages/IntakeIdentity";
import ClientPortalSimple from "./pages/ClientPortalSimple";
import Access from "./pages/Access";
import RNPortalLanding from "./pages/RNPortalLanding";
import RNDashboard from "./pages/RNDashboard";
import RNSupervisor from "./pages/RNSupervisor";
import RNWorkQueuePage from "./pages/RNWorkQueuePage";
import TenVsBuilder from "./components/rn/TenVsBuilder";
import CarePlanWorkflow from "./components/rn/CarePlanWorkflow";
import RNCaseRequestsPage from "./pages/rn/RNCaseRequestsPage";
import CheckIntakeStatus from "./pages/CheckIntakeStatus";
import ResumeIntake from "./pages/ResumeIntake";
import CaseDetail from "@/pages/CaseDetail";
import AttorneyCaseDocumentsPage from "@/pages/AttorneyCaseDocumentsPage";
import AttorneyCarePlanListPage from "@/pages/AttorneyCarePlanListPage";
import AttorneyCarePlanView from "@/screens/attorney/AttorneyCarePlanView";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ScrollToTopOnRouteChange } from "./components/common/ScrollToTopOnRouteChange";
import StagingBadge from "./components/StagingBadge";
import { AuthProvider } from "./auth/supabaseAuth";
import { AppProvider, useApp } from "./context/AppContext";
import { RequireAuth } from "./components/RequireAuth";

import "./index.css";

// Guard component for /demo route
const DemoRouteGuard: React.FC = () => {
  const demoEnabled = import.meta.env.VITE_ENABLE_DEMO === "true";
  
  if (!demoEnabled) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        <div style={{
          textAlign: "center",
          padding: "2rem",
        }}>
          <h1 style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: "0.5rem",
          }}>
            Demo disabled (MVP build)
          </h1>
          <p style={{
            fontSize: "0.9rem",
            color: "#64748b",
          }}>
            Demo features are not available in this build.
          </p>
        </div>
      </div>
    );
  }
  
  return <DemoHub />;
};

/** When an attorney hits /cases/:caseId, redirect to /attorney/cases/:caseId. RN and client portals are unchanged. */
function CasesRouteWithAttorneyRedirect() {
  const { caseId } = useParams();
  const { role } = useApp();
  const { pathname } = useLocation();
  const n = (role || '').toLowerCase();
  const isAttorney = n === 'attorney' || n === 'super_user' || n === 'super_admin';
  if (pathname.startsWith("/cases/") && isAttorney && caseId) {
    return <Navigate to={`/attorney/cases/${caseId}`} replace />;
  }
  return <CaseDetail />;
}

/** Redirect /attorney/care-plan/:planId → /attorney/care-plans/:planId for backward compatibility. */
function CarePlanLegacyRedirect() {
  const { planId } = useParams();
  return <Navigate to={planId ? `/attorney/care-plans/${planId}` : "/attorney/care-plans"} replace />;
}

function Root() {
  // Use React Router's useLocation hook to get reactive pathname updates
  const location = useLocation();
  const pathname = location.pathname || "/";
  const hash = typeof window !== "undefined" ? window.location.hash || "" : "";
  
  try {

    // Check if this is a /demo route
    const isDemoRoute =
      pathname === "/demo" ||
      pathname.startsWith("/demo/") ||
      hash === "#/demo" ||
      hash.startsWith("#/demo/");

    // /demo routes go through guard (default: disabled)
    if (isDemoRoute) {
      return <DemoRouteGuard />;
    }

    // MVP: "/" routes to Lovable landing page (Index component)
    // This is the MVP entry point - the landing page with portal access
    if (pathname === "/" || (!pathname || pathname === "/")) {
      return <Index />;
    }

    // MVP Intake: "/intake" routes to IntakeWizard component (legacy route, redirects to /client-intake)
    // Explicit route for intake wizard
    if (pathname === "/intake" || pathname.startsWith("/intake")) {
      // Redirect legacy /intake to /client-intake
      if (typeof window !== "undefined") {
        window.location.replace("/client-intake");
        return null;
      }
      return <IntakeWizard />;
    }

    // MVP Client Intake: "/client-intake" routes to IntakeWizard component
    // This route is now handled by React Router as a public route (outside AuthProvider)
    // No longer handled here - moved to Routes structure above

    // MVP Client Portal: "/client-portal" routes to ClientPortalSimple component
    // This route is now handled by React Router as a public route (outside AuthProvider)
    // ClientPortalSimple uses public fetch functions and reads case_id from sessionStorage
    // No longer handled here - moved to Routes structure above

    // MVP Attorney Login: "/attorney-login" routes to AttorneyLogin component
    // Separate login flow for attorneys (NOT through /auth)
    if (pathname === "/attorney-login" || pathname.startsWith("/attorney-login")) {
      return <AttorneyLogin />;
    }

    // MVP RN Login: "/rn-login" routes to RNPortalLogin component
    // Separate private login flow for RN users (NOT through /auth)
    if (pathname === "/rn-login" || pathname.startsWith("/rn-login")) {
      return <RNPortalLogin />;
    }

    // MVP Client Login: "/client-login" routes to ClientLogin component
    // Separate login flow for clients using case_number + PIN
    if (pathname === "/client-login" || pathname.startsWith("/client-login")) {
      return <ClientLogin />;
    }

    // MVP Attorney: /attorney/dashboard, /attorney/pending-intakes, /attorney-console
    // are handled by explicit Routes. /attorney-portal remains here (UNCHANGED). Communication only in case views.

    // MVP Attorney Portal: "/attorney-portal" routes to AttorneyLanding component
    // Check more specific route first
    if (pathname === "/attorney-portal" || pathname.startsWith("/attorney-portal")) {
      return (
        <RequireAuth>
          <AttorneyLanding />
        </RequireAuth>
      );
    }

    // Legacy /rn-console and /rn-portal-landing are handled by explicit Routes that redirect to /rn/dashboard

    // Sign-in/Access route: "/auth" routes to Access component (sign-in page)
    // Also support "/access" for backward compatibility
    if (pathname === "/auth" || pathname.startsWith("/auth")) {
      return <Access />;
    }

    // Legacy /access route (backward compatibility)
    if (pathname === "/access" || pathname.startsWith("/access")) {
      return <Access />;
    }

    // Handle /go route (from Access.tsx redirect)
    if (pathname === "/go") {
      // Redirect to landing page for MVP (role-based redirects can be added later)
      if (typeof window !== "undefined") {
        window.location.replace("/");
        return null;
      }
    }

    // All other routes go to landing page
    return <Index />;
  } catch (error) {
    // Catch any routing errors and log them
    console.error("[Root] Routing error:", error);
    // Fallback to landing page
    return <Index />;
  }
}

// Protected routes wrapper - wraps Root component in AuthProvider and AppProvider
function ProtectedRoutes() {
  return (
    <AuthProvider>
      <AppProvider>
        <Root />
      </AppProvider>
    </AuthProvider>
  );
}

// Wrap entire app with BrowserRouter, ErrorBoundary, AuthProvider, and AppProvider
// BrowserRouter provides Router context for useNavigate() and other React Router hooks
// ErrorBoundary catches render errors and prevents blank screens
// AuthProvider provides auth context for useAuth() hook (required by AppProvider)
// AppProvider provides app context for useApp() hook (used by ClientCheckins)
// 
// Public pages (ClientLogin, AttorneyLogin, Access) are rendered OUTSIDE AuthProvider
// using React Router Routes/Route structure to avoid hanging issues with Supabase client initialization
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <StagingBadge />
        <ScrollToTopOnRouteChange />
        <Routes>
          {/* Public routes - no AuthProvider */}
          <Route path="/client-consent" element={<ClientConsent />} />
          <Route path="/intake-identity" element={<IntakeIdentity />} />
          <Route path="/client-intake" element={<IntakeWizard />} />
          <Route path="/resume-intake" element={<ResumeIntake />} />
          <Route path="/client-login" element={<ClientLogin />} />
          <Route path="/client-portal" element={<ClientPortalSimple />} />
          <Route path="/check-status" element={<CheckIntakeStatus />} />
          <Route path="/attorney-login" element={<AttorneyLogin />} />
          {/* Attorney: known /attorney/* pages (must be before /attorney and /attorney/*) */}
          <Route path="/attorney/dashboard" element={
            <AuthProvider>
              <AppProvider>
                <RequireAuth>
                  <AttorneyLanding />
                </RequireAuth>
              </AppProvider>
            </AuthProvider>
          } />
          <Route path="/attorney/pending-intakes" element={
            <AuthProvider>
              <AppProvider>
                <RequireAuth>
                  <AttorneyPendingIntakesPage />
                </RequireAuth>
              </AppProvider>
            </AuthProvider>
          } />
          <Route path="/attorney/intakes/:intakeId" element={
            <AuthProvider>
              <AppProvider>
                <RequireAuth>
                  <AttorneyPendingIntakeShell />
                </RequireAuth>
              </AppProvider>
            </AuthProvider>
          } />
          {/* MUST stay before /attorney/cases/:caseId so /documents is never shadowed */}
          <Route path="/attorney/cases/:caseId/documents" element={
            <AuthProvider>
              <AppProvider>
                <RequireAuth>
                  <AttorneyCaseDocumentsPage />
                </RequireAuth>
              </AppProvider>
            </AuthProvider>
          } />
          <Route path="/attorney/cases/:caseId" element={
            <AuthProvider>
              <AppProvider>
                <RequireAuth>
                  <CaseDetail />
                </RequireAuth>
              </AppProvider>
            </AuthProvider>
          } />
          <Route path="/attorney/cases" element={
            <AuthProvider>
              <AppProvider>
                <RequireAuth>
                  <AttorneyCasesPage />
                </RequireAuth>
              </AppProvider>
            </AuthProvider>
          } />
          <Route path="/attorney/billing" element={
            <AuthProvider>
              <AppProvider>
                <RequireAuth>
                  <AttorneyBilling />
                </RequireAuth>
              </AppProvider>
            </AuthProvider>
          } />
          <Route path="/attorney/search" element={
            <AuthProvider>
              <AppProvider>
                <RequireAuth>
                  <AttorneySearchPage />
                </RequireAuth>
              </AppProvider>
            </AuthProvider>
          } />
          <Route path="/attorney/calendar" element={
            <AuthProvider>
              <AppProvider>
                <RequireAuth>
                  <AttorneyCalendarPage />
                </RequireAuth>
              </AppProvider>
            </AuthProvider>
          } />
          <Route path="/attorney/notes" element={
            <AuthProvider>
              <AppProvider>
                <RequireAuth>
                  <AttorneyNotesPage />
                </RequireAuth>
              </AppProvider>
            </AuthProvider>
          } />
          <Route path="/attorney/private-notes" element={
            <AuthProvider>
              <AppProvider>
                <RequireAuth>
                  <AttorneyPrivateNotesPage />
                </RequireAuth>
              </AppProvider>
            </AuthProvider>
          } />
          <Route path="/attorney/rn-coordination" element={
            <AuthProvider>
              <AppProvider>
                <RequireAuth>
                  <AttorneyRNCoordinationPage />
                </RequireAuth>
              </AppProvider>
            </AuthProvider>
          } />
          <Route path="/attorney/documents" element={
            <AuthProvider>
              <AppProvider>
                <RequireAuth>
                  <DocumentHub />
                </RequireAuth>
              </AppProvider>
            </AuthProvider>
          } />
          <Route path="/attorney/providers" element={
            <AuthProvider>
              <AppProvider>
                <RequireAuth>
                  <Providers />
                </RequireAuth>
              </AppProvider>
            </AuthProvider>
          } />
          <Route path="/attorney/reports" element={
            <AuthProvider>
              <AppProvider>
                <RequireAuth>
                  <Reports />
                </RequireAuth>
              </AppProvider>
            </AuthProvider>
          } />
          <Route path="/attorney/care-plans" element={
            <AuthProvider>
              <AppProvider>
                <RequireAuth>
                  <AttorneyCarePlanListPage />
                </RequireAuth>
              </AppProvider>
            </AuthProvider>
          } />
          <Route path="/attorney/care-plans/:planId" element={
            <AuthProvider>
              <AppProvider>
                <RequireAuth>
                  <AttorneyCarePlanView />
                </RequireAuth>
              </AppProvider>
            </AuthProvider>
          } />
          <Route path="/attorney/care-plan/:planId" element={<CarePlanLegacyRedirect />} />
          <Route path="/attorney/pinned" element={<Navigate to="/attorney/cases?filter=pinned" replace />} />
          {/* Attorney: /attorney and unknown /attorney/* → /attorney/dashboard (replace to prevent back loops) */}
          <Route path="/attorney" element={<Navigate to="/attorney/dashboard" replace />} />
          <Route path="/attorney/*" element={<Navigate to="/attorney/dashboard" replace />} />
          {/* Legacy: /attorney-console → /attorney/dashboard (replace) */}
          <Route path="/attorney-console" element={<Navigate to="/attorney/dashboard" replace />} />
          <Route path="/rn-login" element={<RNPortalLogin />} />
          <Route path="/auth" element={<Access />} />
          <Route path="/access" element={<Access />} />
          
          {/* Case detail route - needs to be explicit for useParams to work. Attorney on /cases/... redirects to /attorney/cases/... */}
          <Route path="/cases/:caseId" element={
            <AuthProvider>
              <AppProvider>
                <CasesRouteWithAttorneyRedirect />
              </AppProvider>
            </AuthProvider>
          } />
          
          {/* RN Dashboard - canonical route (RNPortalLanding: rich dashboard, no case lists) */}
          <Route path="/rn/dashboard" element={
            <AuthProvider>
              <AppProvider>
                <RequireAuth>
                  <RNPortalLanding />
                </RequireAuth>
              </AppProvider>
            </AuthProvider>
          } />
          {/* Legacy: /rn-console and /rn redirect to /rn/dashboard */}
          <Route path="/rn-console" element={<Navigate to="/rn/dashboard" replace />} />
          <Route path="/rn-portal-landing" element={<Navigate to="/rn/dashboard" replace />} />
          <Route path="/rn" element={<Navigate to="/rn/dashboard" replace />} />
          
          {/* RN Supervisor route */}
          <Route path="/rn-supervisor" element={
            <AuthProvider>
              <AppProvider>
                <RequireAuth>
                  <RNSupervisor />
                </RequireAuth>
              </AppProvider>
            </AuthProvider>
          } />
          
          {/* RN Dashboard and 10-Vs Builder routes */}
          <Route path="/rn-dashboard" element={
            <AuthProvider>
              <AppProvider>
                <RNDashboard />
              </AppProvider>
            </AuthProvider>
          } />
          <Route path="/rn/case/:caseId/ten-vs" element={
            <AuthProvider>
              <AppProvider>
                <TenVsBuilder />
              </AppProvider>
            </AuthProvider>
          } />
          <Route path="/rn/case/:caseId/workflow" element={
            <AuthProvider>
              <AppProvider>
                <CarePlanWorkflow />
              </AppProvider>
            </AuthProvider>
          } />
          <Route path="/rn/case/:caseId/4ps" element={
            <AuthProvider>
              <AppProvider>
                <CarePlanWorkflow initialStep="4ps" />
              </AppProvider>
            </AuthProvider>
          } />
          <Route path="/rn/case/:caseId/sdoh" element={
            <AuthProvider>
              <AppProvider>
                <CarePlanWorkflow initialStep="sdoh" />
              </AppProvider>
            </AuthProvider>
          } />
          <Route path="/rn/case/:caseId/overlays" element={
            <AuthProvider>
              <AppProvider>
                <CarePlanWorkflow initialStep="overlays" />
              </AppProvider>
            </AuthProvider>
          } />
          <Route path="/rn/case/:caseId/guidelines" element={
            <AuthProvider>
              <AppProvider>
                <CarePlanWorkflow initialStep="guidelines" />
              </AppProvider>
            </AuthProvider>
          } />
          <Route path="/rn/case/:caseId/finalize" element={
            <AuthProvider>
              <AppProvider>
                <CarePlanWorkflow initialStep="finalize" />
              </AppProvider>
            </AuthProvider>
          } />
          <Route path="/rn/case/:caseId/requests" element={
            <AuthProvider>
              <AppProvider>
                <RequireAuth>
                  <RNCaseRequestsPage />
                </RequireAuth>
              </AppProvider>
            </AuthProvider>
          } />
          
          {/* RN Work Queue - /rn/queue */}
          <Route path="/rn/queue" element={
            <AuthProvider>
              <AppProvider>
                <RequireAuth>
                  <RNWorkQueuePage />
                </RequireAuth>
              </AppProvider>
            </AuthProvider>
          } />
          
          {/* Protected routes - wrapped in AuthProvider */}
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
