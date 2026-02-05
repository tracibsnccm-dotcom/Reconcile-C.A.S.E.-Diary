import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/auth/supabaseAuth";
import { Toaster } from "sonner";
import Index from "@/pages/Index";
import ClientLogin from "@/pages/ClientLogin";
import AttorneyLogin from "@/pages/AttorneyLogin";
import ClientPortal from "@/pages/ClientPortal";
import AttorneyDashboard from "@/pages/AttorneyDashboard";
import AttorneyPendingIntakes from "@/pages/AttorneyPendingIntakes";
import { AttestationReview } from "@/components/attorney/AttestationReview";
import IntakeWizard from "@/pages/IntakeWizard";
import ClientConsent from "@/pages/ClientConsent";
import IntakeIdentity from "@/pages/IntakeIdentity";
import ResumeIntake from "@/pages/ResumeIntake";
import ProviderLogin from "@/pages/ProviderLogin";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/client-consent" element={<ClientConsent />} />
          <Route path="/intake-identity" element={<IntakeIdentity />} />
          <Route path="/intake" element={<IntakeWizard />} />
          <Route path="/client-intake" element={<IntakeWizard />} />
          <Route path="/resume-intake" element={<ResumeIntake />} />
          <Route path="/client-login" element={<ClientLogin />} />
          <Route path="/client" element={<ClientPortal />} />
          <Route path="/client-portal" element={<ClientPortal />} />
          <Route path="/attorney-login" element={<AttorneyLogin />} />
          <Route path="/provider-login" element={<ProviderLogin />} />
          <Route path="/attorney" element={<Navigate to="/attorney/dashboard" replace />} />
          <Route path="/attorney/dashboard" element={<AttorneyDashboard />} />
          <Route path="/attorney/pending-intakes" element={<AttorneyPendingIntakes />} />
          <Route path="/attorney/review/:intakeId" element={<AttestationReview />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
