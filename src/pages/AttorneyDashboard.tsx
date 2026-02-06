import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/auth/supabaseAuth";
import { useLocation, useNavigate, Link } from "react-router-dom";
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
  const location = useLocation();
  const pendingListRef = useRef<HTMLDivElement>(null);
  const [pendingIntakes, setPendingIntakes] = useState<PendingIntake[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<{
    attorneyId: string | null;
    sessionsCount: number;
    casesCount: number;
    attorneyCaseIdsCount: number;
    filteredCount: number;
  } | null>(null);

  useEffect(() => {
    if (role !== "attorney" || !user || !supabase) {
      setLoading(false);
      setDebugInfo(null);
      return;
    }

    (async () => {
      // 1. Get attorney's rc_users record
      const { data: attorneyRow, error: attorneyErr } = await supabase
        .from("rc_users")
        .select("id")
        .eq("auth_user_id", user.id)
        .ilike("role", "attorney")
        .maybeSingle();

      if (attorneyErr || !attorneyRow) {
        console.log("[AttorneyDashboard] attorney query:", { attorneyErr, attorneyRow });
        setLoading(false);
        setDebugInfo(null);
        return;
      }

      const attorneyId = attorneyRow.id;
      // Match C.A.R.E. AttorneyIntakeTracker: rc_cases.attorney_id can be auth_user_id or rc_users.id
      const attorneyMatchId = user.id;

      // 2. Query rc_client_intakes (canonical source, like C.A.R.E.) — no case_status filter
      const { data: intakes, error: intakesError } = await supabase
        .from("rc_client_intakes")
        .select("id, case_id, intake_submitted_at, intake_json")
        .eq("intake_status", "submitted_pending_attorney");

      if (intakesError) {
        console.log("[AttorneyDashboard] intakes error:", intakesError);
        setLoading(false);
        setDebugInfo({
          attorneyId,
          sessionsCount: 0,
          casesCount: 0,
          attorneyCaseIdsCount: 0,
          filteredCount: 0,
        });
        return;
      }

      const intakeList = Array.isArray(intakes) ? intakes : intakes ? [intakes] : [];
      const caseIds = [...new Set(intakeList.map((i: any) => i.case_id).filter(Boolean))];

      // 3. Get rc_cases for attorney filter (no case_status filter — C.A.R.E. doesn't filter by it)
      const { data: cases } = await supabase
        .from("rc_cases")
        .select("id, attorney_id")
        .in("id", caseIds);

      const caseList = Array.isArray(cases) ? cases : cases ? [cases] : [];
      const attorneyCaseIds = new Set(
        caseList
          .filter((c: any) => c.attorney_id === attorneyId || c.attorney_id === attorneyMatchId)
          .map((c: any) => c.id)
      );

      const filteredByAttorney = intakeList.filter((i: any) => attorneyCaseIds.has(i.case_id));
      const sessionMap = new Map<string, { resume_token: string; intake_id: string }>();

      if (caseIds.length > 0) {
        const { data: sessions } = await supabase
          .from("rc_client_intake_sessions")
          .select("case_id, resume_token, intake_id")
          .in("case_id", caseIds);
        (sessions || []).forEach((s: any) => {
          if (s?.case_id && s?.resume_token) {
            sessionMap.set(s.case_id, { resume_token: s.resume_token, intake_id: s.intake_id ?? "" });
          }
        });
      }

      const filtered = filteredByAttorney.map((i: any) => {
        const identity = i.intake_json?.client ?? i.intake_json?.identity ?? {};
        const firstName = identity.first_name ?? identity.firstName ?? "";
        const lastName = identity.last_name ?? identity.lastName ?? "";
        const clientName = [firstName, lastName].filter(Boolean).join(" ") || "Unknown";
        const session = sessionMap.get(i.case_id);
        return {
          id: session?.resume_token ?? i.case_id ?? "",
          intakeId: session?.intake_id ?? i.intake_json?.rcmsId ?? "",
          caseId: i.case_id ?? "",
          clientName,
          submittedAt: i.intake_submitted_at ?? "",
        };
      });

      console.log("[AttorneyDashboard] Found", filtered.length, "pending intakes (from rc_client_intakes)");
      setPendingIntakes(filtered);
      setDebugInfo({
        attorneyId,
        sessionsCount: intakeList.length,
        casesCount: filteredByAttorney.length,
        attorneyCaseIdsCount: filtered.length,
        filteredCount: filtered.length,
      });
      setLoading(false);
    })();
  }, [user, role, location.pathname]);

  if (role !== "attorney" || !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: "linear-gradient(145deg, #3b6a9b 0%, #4a7fb0 40%, #5a90c0 70%, #6aa0cf 100%)",
        }}
      >
        <div className="bg-white rounded-xl p-8 text-center max-w-md shadow-lg border border-slate-200">
          <p className="text-slate-700 mb-4">Please log in to access the attorney dashboard.</p>
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

  const pendingCount = pendingIntakes.length;

  return (
    <div
      className="min-h-screen text-white p-6"
      style={{
        background: "linear-gradient(145deg, #3b6a9b 0%, #4a7fb0 40%, #5a90c0 70%, #6aa0cf 100%)",
      }}
    >
      <div className="max-w-4xl mx-auto">
        {debugInfo && (
          <div className="mb-4 p-3 bg-white/10 rounded-lg text-sm text-white/90 font-mono">
            <div>Querying for attorney_id: {debugInfo.attorneyId ?? "—"}</div>
            <div>Found {debugInfo.sessionsCount} sessions (submitted/pending_attorney) → {debugInfo.casesCount} cases (intake_pending) → {debugInfo.attorneyCaseIdsCount} for this attorney → {debugInfo.filteredCount} intakes shown</div>
          </div>
        )}
        {pendingCount > 0 && (
          <button
            type="button"
            onClick={() => pendingListRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="w-full mb-6 py-3 px-4 rounded-lg text-white font-medium text-center transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#f97316" }}
          >
            You have {pendingCount} new client intake{pendingCount !== 1 ? "s" : ""} awaiting your review
          </button>
        )}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Attorney Dashboard</h1>
            {pendingCount > 0 && (
              <span
                className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: "#f97316" }}
              >
                {pendingCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <p className="text-white/80 text-sm hidden sm:block">{user.email}</p>
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
        </div>

        <div
          ref={pendingListRef}
          className="bg-white rounded-xl overflow-hidden shadow-lg border border-slate-200"
        >
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">{CASE_BRAND.platformName}</h2>
            <p className="text-slate-600 text-sm mt-1">Pending client intakes requiring attestation</p>
            <Link
              to="/attorney/pending-intakes"
              className="mt-3 inline-block text-orange-500 hover:text-orange-600 text-sm font-medium"
            >
              View full intake list →
            </Link>
          </div>

          <div className="p-6">
            {loading ? (
              <p className="text-slate-600 text-center py-8">Loading pending intakes…</p>
            ) : pendingIntakes.length === 0 ? (
              <p className="text-slate-600 text-center py-8">
                No pending intakes. New client submissions will appear here.
              </p>
            ) : (
              <ul className="space-y-4">
                {pendingIntakes.map((intake) => (
                  <li
                    key={intake.id}
                    className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 shadow-sm"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{intake.clientName}</p>
                      <p className="text-orange-500 font-mono text-sm mt-0.5">{intake.intakeId}</p>
                      <p className="text-slate-600 text-xs mt-1">
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
