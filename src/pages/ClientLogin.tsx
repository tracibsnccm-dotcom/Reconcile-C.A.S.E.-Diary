// ClientLogin — case number + PIN via client-sign-in edge function. (Ported from C.A.R.E., C.A.S.E. theme)

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CASE_BRAND } from "@/constants/brand";
import { ACCOUNT_LOCKED_SUFFIX } from "@/config/clientMessaging";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lock } from "lucide-react";

export default function ClientLogin() {
  const [caseNumber, setCaseNumber] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLockedUntil(null);

    const trimmedCaseNumber = caseNumber.trim().toUpperCase();
    const trimmedPin = pin.trim();

    if (!trimmedCaseNumber || !trimmedPin) {
      setError("Please enter both case number and PIN");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/client-sign-in`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseNumber: trimmedCaseNumber,
            pin: trimmedPin,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (result.locked_until) {
          const lockTime = new Date(result.locked_until);
          setLockedUntil(lockTime);
          setError(`Account locked until ${lockTime.toLocaleTimeString()}`);
        } else if (result.attempts_remaining !== undefined) {
          setError(`Invalid PIN. ${result.attempts_remaining} attempts remaining.`);
        } else {
          setError(result.error || "Login failed");
        }
        setLoading(false);
        return;
      }

      sessionStorage.setItem("client_case_id", result.case_id);
      sessionStorage.setItem("client_case_number", result.case_number);
      sessionStorage.setItem("client_name", result.client_name || "");

      console.log("ClientLogin: Login successful, redirecting to portal");
      navigate("/client-portal", { replace: true });
    } catch (err: unknown) {
      console.error("Client login error:", err);
      setError(err instanceof Error ? err.message : "An error occurred during login. Please try again.");
      setLoading(false);
    }
  }

  const WRAPPER_CLASS = "min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white font-sans flex items-center justify-center px-6 py-10";
  const CARD_CLASS = "bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg max-w-md w-full";

  return (
    <div className={WRAPPER_CLASS}>
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-white">
          Client Portal Login
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Enter your case number and PIN to access your {CASE_BRAND.diaryName}.
        </p>

        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Case Number
              </label>
              <input
                type="text"
                required
                placeholder="01-260108-01F"
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-orange-500 font-mono uppercase"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value.toUpperCase())}
                disabled={loading}
              />
              <p className="mt-1 text-xs text-slate-500">
                Format: XX-YYMMDD-XXL (e.g., 01-260108-01F)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                PIN
              </label>
              <input
                type="password"
                required
                placeholder="1234"
                maxLength={4}
                pattern="[0-9]{4}"
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-orange-500 font-mono text-center text-lg tracking-widest"
                value={pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setPin(value);
                }}
                disabled={loading}
              />
              <p className="mt-1 text-xs text-slate-500">
                4-digit PIN provided by your attorney
              </p>
            </div>

            {error && (
              <Alert variant={lockedUntil ? "destructive" : "default"} className="bg-red-900/20 border-red-700">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {lockedUntil && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-700">
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Account locked until {lockedUntil.toLocaleString()}. {ACCOUNT_LOCKED_SUFFIX}
                </AlertDescription>
              </Alert>
            )}

            <button
              type="submit"
              disabled={loading || !!lockedUntil}
              className="w-full py-3 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Verifying..." : "Access My Portal"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700 space-y-2">
            <p className="text-xs text-center text-slate-500">
              New client?{" "}
              <Link to="/intake" className="text-orange-500 hover:underline font-medium">
                Start intake
              </Link>
            </p>
            <p className="text-xs text-center text-slate-500">
              Resume saved intake?{" "}
              <Link to="/intake/resume" className="text-orange-500 hover:underline font-medium">
                Resume intake
              </Link>
            </p>
            <p className="text-xs text-center text-slate-500">
              Are you an attorney?{" "}
              <Link to="/attorney-login" className="text-orange-500 hover:underline font-medium">
                Login here
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-500 text-center">
          By accessing your portal, you agree to {CASE_BRAND.company}&apos;s Minimum Necessary Data Policy and Terms.
        </p>
      </div>
    </div>
  );
}
