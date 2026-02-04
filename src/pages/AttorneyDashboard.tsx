import React, { useEffect, useState } from "react";
import { useAuth } from "@/auth/supabaseAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CASE_BRAND } from "@/constants/brand";

interface PendingIntake {
  id: string;
  intakeId: string;
  caseId: string;
  clientName: string;
  submittedAt: string;
}

export default function AttorneyDashboard() {
  const { user, signOut, role } = useAuth();
  const navigate = useNavigate();
  const [pendingIntakes, setPendingIntakes] = useState<PendingIntake[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role !== "attorney" || !user || !supabase) {
      setLoading(false);
      return;
    }

    (async () => {
      // 1. Get attorney's rc_users record (auth_user_id, role ilike 'attorney')
      const { data: attorneyRow, error: attorneyErr } = await supabase
        .from("rc_users")
        .select("id")
        .eq("auth_user_id", user.id)
        .ilike("role", "attorney")
        .maybeSingle();

      if (attorneyErr || !attorneyRow) {
        setLoading(false);
        return;
      }

      // 2. Query rc_client_intake_sessions where:
      //    - intake_status in ('submitted', 'submitted_pending_attorney')
      //    - case's attorney_id matches attorney's rc_users.id
      const { data: sessions, error } = await supabase
        .from("rc_client_intake_sessions")
        .select(`
          resume_token,
          intake_id,
          case_id,
          first_name,
          last_name,
          updated_at,
          form_data
        `)
        .in("intake_status", ["submitted", "submitted_pending_attorney"])
        .not("case_id", "is", null);

      if (error) {
        setLoading(false);
        return;
      }

      if (!sessions?.length) {
        setPendingIntakes([]);
        setLoading(false);
        return;
      }

      // 3. Filter by cases where attorney_id matches
      const caseIds = Array.from(new Set(sessions.map((s) => s.case_id).filter(Boolean))) as string[];
      const { data: cases } = await supabase
        .from("rc_cases")
        .select("id, attorney_id")
        .in("id", caseIds)
        .eq("case_status", "intake_pending");

      const attorneyCaseIds = new Set(
        (cases || []).filter((c) => c.attorney_id === attorneyRow.id).map((c) => c.id)
      );

      const filtered = sessions
        .filter((s) => s.case_id && attorneyCaseIds.has(s.case_id))
        .map((s) => {
          const fd = s.form_data as { personal?: { firstName?: string; lastName?: string } } | null;
          const firstName = fd?.personal?.firstName ?? s.first_name ?? "";
          const lastName = fd?.personal?.lastName ?? s.last_name ?? "";
          const clientName = [firstName, lastName].filter(Boolean).join(" ") || "Unknown";
          return {
            id: s.resume_token ?? s.case_id ?? "",
            intakeId: s.intake_id ?? "",
            caseId: s.case_id ?? "",
            clientName,
            submittedAt: s.updated_at ?? "",
          };
        });

      setPendingIntakes(filtered);
      setLoading(false);
    })();
  }, [user, role]);

  if (role !== "attorney" || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center max-w-md">
          <p className="text-slate-300 mb-4">Please log in to access the attorney dashboard.</p>
          <button
            onClick={() => navigate("/attorney-login")}
            className="px-6 py-2.5 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (iso: string) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-orange-500">Attorney Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">{user.email}</p>
          </div>
          <button
            onClick={async () => {
              await signOut();
              navigate("/");
            }}
            className="px-4 py-2 rounded-lg bg-red-600/80 text-white hover:bg-red-600 text-sm"
          >
            Sign Out
          </button>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">{CASE_BRAND.platformName}</h2>
            <p className="text-slate-400 text-sm mt-1">Pending client intakes requiring attestation</p>
          </div>

          <div className="p-6">
            {loading ? (
              <p className="text-slate-400 text-center py-8">Loading pending intakes…</p>
            ) : pendingIntakes.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                No pending intakes. New client submissions will appear here.
              </p>
            ) : (
              <ul className="space-y-4">
                {pendingIntakes.map((intake) => (
                  <li
                    key={intake.id}
                    className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                  >
                    <div>
                      <p className="font-medium text-white">{intake.clientName}</p>
                      <p className="text-orange-500 font-mono text-sm mt-0.5">{intake.intakeId}</p>
                      <p className="text-slate-400 text-xs mt-1">
                        Submitted {formatDate(intake.submittedAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/attorney/review/${intake.id}`)}
                      className="px-4 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 shrink-0"
                    >
                      Review & Confirm
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
