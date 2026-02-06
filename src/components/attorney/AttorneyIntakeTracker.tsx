// AttorneyIntakeTracker — list of intakes awaiting attorney review; links to /attorney/review/:resume_token. (Ported from C.A.R.E., no RN.)

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Clock, Eye } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { getAttorneyCaseStageLabel } from "@/lib/attorneyCaseStageLabels";
import { useAuth } from "@/auth/supabaseAuth";
import { supabaseGet } from "@/lib/supabaseRest";

interface IntakeRow {
  intake_id: string;
  case_id: string;
  int_number: string | null;
  case_number?: string | null;
  client: string;
  stage: string;
  last_activity_iso: string;
  expires_iso: string;
  attorney_attested_at: string | null;
  attorney_confirm_deadline_at: string | null;
  intake_status?: string;
  case_status?: string;
  resume_token: string | null;
}

function getClientDisplayName(input: any): string {
  const c = input?.case ?? input ?? {};
  const first = c.client_first_name ?? c.first_name ?? c.client?.first_name;
  const last = c.client_last_name ?? c.last_name ?? c.client?.last_name;
  const full = c.client_name ?? c.client_full_name ?? c.client?.name;
  const intakeJson = input?.intake_json ?? c.intake_json ?? input?.intake?.intake_json;
  const identity = intakeJson?.identity ?? intakeJson?.client_identity;
  const intakeFirst = identity?.first_name ?? identity?.client_first_name;
  const intakeLast = identity?.last_name ?? identity?.client_last_name;
  const fromParts = [first, last].filter(Boolean).join(" ").trim();
  if (fromParts) return fromParts;
  if (typeof full === "string" && full.trim()) return full.trim();
  const fromIntake = [intakeFirst, intakeLast].filter(Boolean).join(" ").trim();
  if (fromIntake) return fromIntake;
  return "Client";
}

export function AttorneyIntakeTracker({ showHeader = true }: { showHeader?: boolean } = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<IntakeRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [filter, setFilter] = useState<"all" | "lt72" | "lt24">("all");
  const [showHelp, setShowHelp] = useState(false);

  const calculateTTL = (expiresIso: string) => {
    const ms = Math.max(0, new Date(expiresIso).getTime() - Date.now());
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    return { ms, label: `${d}d ${h}h` };
  };

  const getRiskLevel = (expiresIso: string) => {
    const { ms } = calculateTTL(expiresIso);
    if (ms <= 24 * 3600000) return { level: "High", variant: "destructive" as const };
    if (ms <= 72 * 3600000) return { level: "Medium", variant: "default" as const };
    return { level: "Low", variant: "secondary" as const };
  };

  const loadData = async () => {
    console.log("ATTORNEY: loadData START");
    try {
      let attorneyRcUserId: string | null = null;
      const authUserId = user?.id;

      if (scope === "mine" && user && authUserId) {
        try {
          const { data: rcUsers, error: rcUsersError } = await supabaseGet(
            "rc_users",
            `auth_user_id=eq.${authUserId}&role=eq.attorney&select=id`
          );
          if (rcUsersError) throw rcUsersError;
          const rcUser = Array.isArray(rcUsers) ? rcUsers[0] : rcUsers;
          attorneyRcUserId = rcUser?.id ?? authUserId;
        } catch {
          attorneyRcUserId = null;
        }
      }

      let queryString =
        "select=*,rc_cases(id,attorney_id,case_type,case_number,case_status,date_of_injury,rc_clients(first_name,last_name))&intake_status=in.(submitted_pending_attorney,attorney_confirmed,attorney_declined_not_client)&rc_cases.is_superseded=eq.false";
      if (scope === "mine" && attorneyRcUserId) {
        queryString += `&rc_cases.attorney_id=eq.${attorneyRcUserId}`;
      }

      const { data: intakes, error: intakesError } = await supabaseGet("rc_client_intakes", queryString);
      if (intakesError) throw intakesError;
      if (!Array.isArray(intakes)) throw new Error("Expected array");

      const filteredIntakes =
        scope === "mine" && attorneyRcUserId
          ? intakes.filter((intake: any) => {
              const caseData = Array.isArray(intake.rc_cases) ? intake.rc_cases[0] : intake.rc_cases;
              return caseData && (caseData.attorney_id === attorneyRcUserId || caseData.attorney_id === user?.id);
            })
          : intakes;

      const allCaseIds = (filteredIntakes || []).map((i: any) => i.case_id).filter(Boolean);
      const sessionMap = new Map<string, { intake_id: string; resume_token: string }>();
      if (allCaseIds.length > 0) {
        try {
          const { data: sessions } = await supabaseGet(
            "rc_client_intake_sessions",
            `case_id=in.(${allCaseIds.join(",")})&select=case_id,intake_id,resume_token,created_at&order=created_at.desc`
          );
          const sessList = Array.isArray(sessions) ? sessions : [];
          sessList.forEach((s: any) => {
            if (s?.case_id && s?.resume_token && !sessionMap.has(s.case_id)) {
              sessionMap.set(s.case_id, { intake_id: s.intake_id, resume_token: s.resume_token });
            }
          });
        } catch (_) {}
      }

      const transformedRows: IntakeRow[] = (filteredIntakes || []).map((intake: any) => {
        const caseData = Array.isArray(intake.rc_cases) ? intake.rc_cases[0] : intake.rc_cases;
        const clientData = caseData?.rc_clients;
        const clientName = getClientDisplayName({
          case: {
            client_first_name: clientData?.first_name,
            client_last_name: clientData?.last_name,
            client_name: caseData?.client_name,
            client_full_name: caseData?.client_full_name,
            intake_json: intake.intake_json,
          },
          intake_json: intake.intake_json,
        });
        const session = sessionMap.get(intake.case_id);
        const stage = getAttorneyCaseStageLabel({
          attorney_attested_at: intake.attorney_attested_at,
          assigned_rn_id: caseData?.assigned_rn_id ?? null,
          intake_status: intake.intake_status,
          attorney_confirm_deadline_at: intake.attorney_confirm_deadline_at,
        });
        const cn = caseData?.case_number ?? null;
        const origInt = intake.intake_json?.rcmsId ?? session?.intake_id ?? (cn && String(cn).startsWith("INT-") ? cn : null) ?? null;
        return {
          intake_id: intake.id,
          case_id: intake.case_id,
          int_number: origInt,
          case_number: cn,
          client: clientName,
          stage,
          last_activity_iso: intake.intake_submitted_at || new Date().toISOString(),
          expires_iso: intake.attorney_confirm_deadline_at || "",
          attorney_attested_at: intake.attorney_attested_at,
          attorney_confirm_deadline_at: intake.attorney_confirm_deadline_at,
          intake_status: intake.intake_status,
          case_status: caseData?.case_status,
          resume_token: session?.resume_token ?? null,
        };
      });

      console.log("ATTORNEY: loadData rows", transformedRows.length);
      setRows(transformedRows);
    } catch (error) {
      console.error("ATTORNEY: loadData failed", error);
      toast.error("Failed to load intake data");
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [scope]);

  const pendingCount = rows.filter((r) => r.stage === "Intake Submitted — Awaiting Attorney Review").length;
  const filteredRows = rows.filter((row) => {
    const q = searchQuery.toLowerCase().trim();
    if (q && !row.client.toLowerCase().includes(q) && !row.case_id.toLowerCase().includes(q)) return false;
    const { ms } = calculateTTL(row.expires_iso);
    if (filter === "lt72" && ms > 72 * 3600000) return false;
    if (filter === "lt24" && ms > 24 * 3600000) return false;
    return true;
  });

  const CARD_CLASS = "bg-white rounded-lg shadow-lg";

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center gap-2 p-3 bg-white border-l-4 border-orange-500 rounded-lg shadow-lg relative">
          <Clock className="w-5 h-5 text-orange-500" />
          <strong className="text-gray-900">Intakes Submitted — Awaiting Attorney Review:</strong>
          <span className="font-bold text-orange-500">{pendingCount}</span>
          <span className="text-sm text-gray-600">Client intakes ready for your review.</span>
          <button
            type="button"
            className="ml-auto w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold hover:bg-orange-600"
            onMouseEnter={() => setShowHelp(true)}
            onMouseLeave={() => setShowHelp(false)}
          >
            <HelpCircle className="w-3 h-3" />
          </button>
          {showHelp && (
            <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-sm z-10 text-gray-900">
              <p className="text-sm text-gray-700">
                After you confirm, the case proceeds to the AI care plan builder.
              </p>
            </div>
          )}
        </div>
      )}

      <Card className={`${CARD_CLASS} p-0 overflow-hidden`}>
        <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-3 p-4 border-b border-gray-200 bg-gray-50">
          <Input
            placeholder="Search by client/case…"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="w-48 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
          />
          <select
            value={scope}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setScope(e.target.value as "mine" | "all")}
            className="w-32 h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
          >
            <option value="mine">My clients</option>
            <option value="all">All</option>
          </select>
          <select
            value={filter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilter(e.target.value as "all" | "lt72" | "lt24")}
            className="w-32 h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
          >
            <option value="all">All time</option>
            <option value="lt72">Under 72h</option>
            <option value="lt24">Under 24h</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-900">
            <thead className="bg-gray-100 text-gray-900 border-b border-gray-200">
              <tr>
                <th className="p-2">Client</th>
                <th className="p-2">INT#</th>
                <th className="p-2">Case #</th>
                <th className="p-2">Stage</th>
                <th className="p-2">Deadline</th>
                <th className="p-2">Risk</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody className="text-gray-900">
              {filteredRows.map((row) => {
                const isConfirmed = !!row.attorney_attested_at ||
                  row.intake_status === 'attorney_confirmed' ||
                  row.case_status === 'attorney_confirmed';
                const risk = getRiskLevel(row.expires_iso);
                const ttl = calculateTTL(row.expires_iso);
                return (
                  <tr key={row.intake_id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-2 font-medium text-gray-900">{row.client}</td>
                    <td className="p-2 font-mono font-semibold text-black">{row.int_number || "—"}</td>
                    <td className="p-2 font-mono font-semibold text-black">{row.case_number || "—"}</td>
                    <td className="p-2">{row.stage}</td>
                    <td className="p-2">{row.expires_iso ? new Date(row.expires_iso).toLocaleString() : "—"}</td>
                    <td className="p-2">
                      {row.expires_iso && !isConfirmed && (
                          <Badge
                            variant={risk.variant === "destructive" ? "default" : risk.variant === "secondary" ? "outline" : "default"}
                            className={risk.variant === "destructive" ? "bg-red-100 text-red-800 border-red-300" : ""}
                          >
                            {risk.level}
                          </Badge>
                        )}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        {row.resume_token ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                            onClick={() => {
                              console.log("ATTORNEY: Navigate to review", row.resume_token?.slice(0, 8) + "...");
                              navigate(`/attorney/review/${row.resume_token}`);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            {isConfirmed ? "View" : "Review Intake & Proceed"}
                          </Button>
                        ) : (
                          <span className="text-slate-500 text-xs">No review link</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRows.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            <p>No intakes found</p>
            <Card className={`${CARD_CLASS} max-w-xl mx-auto mt-4 border-l-4 border-orange-500 text-left`}>
              <CardHeader>
                <CardTitle className="text-base text-white">What this means</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-400">
                <p>
                  The client has completed their intake. Review the information and confirm whether the case should proceed. After confirmation, the case proceeds to the AI care plan builder.
                </p>
                <p className="text-xs italic text-slate-500">
                  Client view: While under review, the client sees their intake as submitted and awaiting attorney review.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="p-3 border-t border-slate-700/50 text-xs text-slate-500">
          Intakes auto-delete after 7 days if not confirmed. Review and confirm within 48 hours.
        </div>
      </Card>
    </div>
  );
}
