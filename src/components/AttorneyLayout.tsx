/**
 * Simple attorney layout: approved gradient background, top bar with nav, white content area.
 * Reconcile C.A.S.E. — no sidebar; Dashboard, Pending Intakes, Logout.
 */
import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/supabaseAuth";
import { CASE_BRAND } from "@/constants/brand";
import { LayoutDashboard, ClipboardList, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const WRAPPER_CLASS = "min-h-screen bg-gradient-to-br from-[#3b6a9b] via-[#4a7fb0] to-[#6aa0cf] text-white font-sans";

export function AttorneyLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut?.();
    navigate("/attorney-login", { replace: true });
  };

  return (
    <div className={WRAPPER_CLASS}>
      <header className="border-b border-white/20 bg-white/10 px-4 py-3">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link to="/attorney/dashboard" className="font-bold text-lg text-white hover:opacity-90">
              {CASE_BRAND.diaryName}
            </Link>
            <nav className="flex items-center gap-2">
              <Link
                to="/attorney/dashboard"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-white/90 hover:bg-white/20"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                to="/attorney/pending-intakes"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-white/90 hover:bg-white/20"
              >
                <ClipboardList className="w-4 h-4" />
                Pending Intakes
              </Link>
            </nav>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-white hover:bg-white/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
