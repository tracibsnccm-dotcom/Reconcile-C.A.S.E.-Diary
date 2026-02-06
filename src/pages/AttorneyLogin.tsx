import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { resolveAttorneyByAuthUserId } from "@/lib/attorneyResolver";
import { CASE_BRAND } from "@/constants/brand";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function AttorneyLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      });
      if (authError) throw authError;
      if (!authData?.user) throw new Error("Login failed: No user returned");
      const authUserId = authData.user.id;
      if (!authUserId) {
        await supabase.auth.signOut();
        throw new Error("Login failed: No auth user id. Please contact your administrator.");
      }
      const res = await resolveAttorneyByAuthUserId(authUserId);
      if (!res.ok) {
        await supabase.auth.signOut();
        throw new Error(res.error);
      }
      if (res.row.full_name) {
        sessionStorage.setItem("attorneyName", res.row.full_name);
      }
      navigate("/attorney/dashboard", { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed.";
      if (msg.includes("Attorney record not found") || msg.includes("No Attorney profile")) {
        setError("Attorney directory record not found. Please contact your administrator.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 bg-gradient-to-br from-[#3b6a9b] via-[#4a7fb0] to-[#6aa0cf]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white">Attorney Portal Login</h1>
          <p className="mt-2 text-sm text-white/90">{CASE_BRAND.platformName} — Case Management</p>
        </div>
        <div className="rounded-2xl border border-white/20 bg-white p-6 shadow-lg">
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-900 font-medium">Login requires Email + Password.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Email</label>
              <input
                type="email"
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-orange-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Password</label>
              <input
                type="password"
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-orange-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-gray-600 hover:text-gray-900 underline">
              ← Back to Home
            </a>
          </div>
        </div>
        <p className="mt-6 text-xs text-center text-white/80">
          By continuing, you agree to RCMS Minimum Necessary Data Policy and Terms.
        </p>
      </div>
    </div>
  );
}
