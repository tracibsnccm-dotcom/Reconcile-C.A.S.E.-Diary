// src/SignIn.tsx
import React, { useState } from "react";
import { useAuth } from "./auth/supabaseAuth";
import ClientHome from "./client/ClientHome";
import RNConsole from "./rn/RNConsole";
import AttorneyConsole from "./attorney/AttorneyConsole";

type ViewMode = "CLIENT" | "RN" | "ATTORNEY";

const SignIn: React.FC = () => {
  const { user, loading, signInWithEmail, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("CLIENT");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    setStatusMessage(null);

    try {
      await signInWithEmail(email);
      setStatusMessage("Check your email for a secure sign-in link.");
    } catch (err) {
      console.error("Error sending sign-in email:", err);
      setStatusMessage("We could not send the sign-in email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="rounded-xl border bg-white px-6 py-4 shadow-sm text-sm text-gray-700">
          Loading…
        </div>
      </div>
    );
  }

  // If no user, show email sign-in screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-full max-w-md rounded-xl border bg-white px-6 py-5 shadow-sm space-y-4">
          <header className="space-y-1">
            <h1 className="text-lg font-semibold">
              Sign in to Reconcile C.A.R.E.
            </h1>
            <p className="text-xs text-gray-600">
              Enter your email to receive a secure sign-in link. This helps us
              keep your information protected.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1 text-sm">
              <label className="block font-medium" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 text-white py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Sending link…" : "Send sign-in link"}
            </button>
          </form>

          {statusMessage && (
            <p className="text-xs text-gray-700">{statusMessage}</p>
          )}

          <p className="text-[11px] text-gray-500">
            By signing in, you confirm that you are authorized to view this
            information. Clients, RNs, and attorneys may have different views
            based on their role.
          </p>
        </div>
      </div>
    );
  }

  // If user exists, show portal with switchable views
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-3">
          <div className="space-y-0.5">
            <div className="text-sm font-semibold">
              Reconcile C.A.R.E. Portal
            </div>
            <div className="text-[11px] text-gray-500">
              Signed in as <span className="font-medium">{user.email}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full border bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600">
              Prototype role switcher
            </div>
            <button
              type="button"
              onClick={signOut}
              className="text-[11px] px-3 py-1 rounded-lg border bg-white hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* View mode switcher (Client vs RN vs Attorney) */}
        <div className="mx-auto max-w-5xl px-4 pb-3">
          <div className="inline-flex rounded-full border bg-gray-50 p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("CLIENT")}
              className={`px-3 py-1 rounded-full ${
                viewMode === "CLIENT"
                  ? "bg-white border border-gray-300 text-gray-900"
                  : "text-gray-500"
              }`}
            >
              Client View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("RN")}
              className={`px-3 py-1 rounded-full ${
                viewMode === "RN"
                  ? "bg-white border border-gray-300 text-gray-900"
                  : "text-gray-500"
              }`}
            >
              RN Console (Prototype)
            </button>
            <button
              type="button"
              onClick={() => setViewMode("ATTORNEY")}
              className={`px-3 py-1 rounded-full ${
                viewMode === "ATTORNEY"
                  ? "bg-white border border-gray-300 text-gray-900"
                  : "text-gray-500"
              }`}
            >
              Attorney Console (Prototype)
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        {viewMode === "CLIENT" && <ClientHome />}
        {viewMode === "RN" && <RNConsole />}
        {viewMode === "ATTORNEY" && <AttorneyConsole />}
      </main>
    </div>
  );
};

export default SignIn;

