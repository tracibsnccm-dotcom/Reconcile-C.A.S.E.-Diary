import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RCMS, btn } from "@/constants/brand";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { ACCOUNT_LOCKED_SUFFIX } from "@/config/clientMessaging";

// Public fetch functions for unauthenticated requests (no auth token needed)
async function publicSupabaseGet(table: string, query: string) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    return { data: null, error: new Error(`${response.status}`) };
  }
  
  const data = await response.json();
  return { data, error: null };
}

async function publicSupabaseUpdate(table: string, filter: string, updates: object) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(updates)
  });
  
  if (!response.ok) {
    return { error: new Error(`${response.status}`) };
  }
  
  return { error: null };
}

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
      // Call secure Edge Function for authentication
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/client-sign-in`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            caseNumber: trimmedCaseNumber, 
            pin: trimmedPin 
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
          setError(result.error || 'Login failed');
        }
        setLoading(false);
        return;
      }

      // Success - store session info
      sessionStorage.setItem('client_case_id', result.case_id);
      sessionStorage.setItem('client_case_number', result.case_number);
      sessionStorage.setItem('client_name', result.client_name || '');
      
      console.log('ClientLogin: Login successful, redirecting to portal');
      // Redirect to client portal
      navigate('/client-portal', { replace: true });
    } catch (err: any) {
      console.error('Client login error:', err);
      setError(err.message || 'An error occurred during login. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 bg-gradient-to-br from-[#3b6a9b] via-[#4a7fb0] to-[#6aa0cf]">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-white">
          Client Portal Login
        </h1>
        <p className="mt-2 text-sm text-white/90">
          Enter your case number and PIN to access your portal.
        </p>

        <div className="mt-6 rounded-2xl border border-white/20 bg-white p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Case Number
              </label>
              <input
                type="text"
                required
                placeholder="01-260108-01F"
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-orange-500 font-mono uppercase"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value.toUpperCase())}
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-600">
                Format: XX-YYMMDD-XXL (e.g., 01-260108-01F)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                PIN
              </label>
              <input
                type="password"
                required
                placeholder="1234"
                maxLength={4}
                pattern="[0-9]{4}"
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-orange-500 font-mono text-center text-lg tracking-widest"
                value={pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPin(value);
                }}
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-600">
                4-digit PIN provided by your attorney
              </p>
            </div>

            {error && (
              <Alert variant={lockedUntil ? "destructive" : "default"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {lockedUntil && (
              <Alert variant="destructive">
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Account locked until {lockedUntil.toLocaleString()}.{" "}
                  {ACCOUNT_LOCKED_SUFFIX}
                </AlertDescription>
              </Alert>
            )}

            <button
              type="submit"
              disabled={loading || !!lockedUntil}
              className={`${btn.base} ${btn.lg} text-white w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400`}
            >
              {loading ? "Verifying..." : "Access My Portal"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-center text-gray-600">
              Are you an attorney?{" "}
              <Link to="/attorney-login" className="text-orange-500 hover:underline font-semibold">
                Login here
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-xs text-white/80 text-center">
          By accessing your portal, you agree to RCMS's Minimum Necessary Data Policy and Terms.
        </p>
      </div>
    </div>
  );
}
