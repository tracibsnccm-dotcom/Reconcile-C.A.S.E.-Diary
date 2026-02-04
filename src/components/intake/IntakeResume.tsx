import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const WRAPPER_CLASS =
  "min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white font-sans";
const CARD_CLASS = "bg-slate-800 border border-slate-700 rounded-xl p-8 max-w-md mx-auto";
const INPUT_CLASS =
  "w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500";
const BTN =
  "w-full py-3 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors";

export function IntakeResume() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Please enter your email");
      return;
    }
    if (!supabase) {
      toast.error("Database not configured");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("rc_client_intake_sessions")
      .select("resume_token")
      .eq("email", trimmed)
      .eq("intake_status", "draft")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setLoading(false);
    if (error) {
      toast.error("Could not look up draft: " + error.message);
      return;
    }
    if (!data?.resume_token) {
      toast.error("No draft intake found for this email");
      return;
    }
    navigate(`/intake?resume=${encodeURIComponent(data.resume_token)}`);
  };

  return (
    <div className={WRAPPER_CLASS}>
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className={CARD_CLASS}>
          <h1 className="text-xl font-bold text-white mb-2">Resume Intake</h1>
          <p className="text-slate-400 text-sm mb-6">
            Enter the email you used when you started your intake to continue where you left off.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email"
                className={INPUT_CLASS}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                disabled={loading}
              />
            </div>
            <button type="submit" disabled={loading} className={BTN}>
              {loading ? "Looking up…" : "Resume intake"}
            </button>
          </form>
          <p className="mt-6 text-center">
            <Link to="/intake" className="text-orange-500 hover:underline text-sm">
              Start a new intake instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
