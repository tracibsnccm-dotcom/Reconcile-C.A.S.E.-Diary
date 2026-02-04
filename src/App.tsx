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
import { IntakeWizard } from "@/components/intake/IntakeWizard";
import ResumeIntake from "@/pages/ResumeIntake";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/client-login" element={<ClientLogin />} />
          <Route path="/attorney-login" element={<AttorneyLogin />} />
          <Route path="/client" element={<ClientPortal />} />
          <Route path="/client-portal" element={<ClientPortal />} />
          <Route path="/intake" element={<IntakeWizard />} />
          <Route path="/intake/resume" element={<ResumeIntake />} />
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
