import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Calendar, MessageSquare, Plus, Inbox, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/auth/supabaseAuth";
import { useToast } from "@/hooks/use-toast";
import {
  listCaseRequests,
  createCaseRequest,
  getRequestThread,
  postRequestMessage,
  closeRequest,
  reopenRequest,
  listCaseActivity,
  type CaseRequest,
  type CaseActivity,
  type RequestThread,
} from "@/lib/caseRequestsApi";
import { supabase } from "@/integrations/supabase/client";

const allowUnassignedCaseSelect =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO === "true";
const FALLBACK_CASE_KEY = "rcms_attorney_comm_fallback_case_id";
const LOADING_SLOW_MS = 10000;

interface Case {
  id: string;
  case_number: string | null;
  client_id: string;
  client_name?: string;
}

function mapCase(c: any): Case {
  return {
    id: c.id,
    case_number: c.case_number,
    client_id: c.client_id,
    client_name: c.rc_clients
      ? `${c.rc_clients.first_name || ""} ${c.rc_clients.last_name || ""}`.trim()
      : undefined,
  };
}

function statusLabel(s: string): string {
  return s === "open" ? "Open" : s === "responded" ? "Responded" : "Closed";
}

interface AttorneyCommunicationCenterProps {
  /** When set, run in case-scoped mode: lock to this case, hide case selector, no case fetching. */
  caseId?: string;
  /** When this changes, All Activity is refetched (e.g. after saving a client communication). */
  clientCommRefreshKey?: number;
}

export function AttorneyCommunicationCenter({ caseId, clientCommRefreshKey }: AttorneyCommunicationCenterProps = {}) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"requests" | "all-activity">("requests");
  const [view, setView] = useState<"list" | "thread">("list");
  const [cases, setCases] = useState<Case[]>(() =>
    caseId ? [{ id: caseId, case_number: null, client_id: "", client_name: undefined }] : []
  );
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(caseId ?? null);
  const [requests, setRequests] = useState<CaseRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [thread, setThread] = useState<RequestThread | null>(null);
  const [activity, setActivity] = useState<CaseActivity[]>([]);

  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [composeMessage, setComposeMessage] = useState("");

  const [loading, setLoading] = useState(!caseId);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [requestsSlow, setRequestsSlow] = useState(false);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [threadSlow, setThreadSlow] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activitySlow, setActivitySlow] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const [fallbackCases, setFallbackCases] = useState<Case[]>([]);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const hasTriedRestore = useRef(false);
  const requestsSlowRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const threadSlowRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activitySlowRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When caseId is provided: keep selectedCaseId and cases in sync (e.g. nav from /cases/A to /cases/B)
  useEffect(() => {
    if (caseId) {
      setSelectedCaseId(caseId);
      setCases([{ id: caseId, case_number: null, client_id: "", client_name: undefined }]);
      setLoading(false);
    }
  }, [caseId]);

  // ---- Fetch cases; skip when case-scoped via caseId ----
  const fetchCases = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      // Step 1: Get assigned case IDs from rc_case_assignments
      const { data: assignments, error: assignErr } = await supabase
        .from("rc_case_assignments")
        .select("case_id")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (assignErr) {
        console.error("rc_case_assignments error:", assignErr.message);
        setErrorCode("COMM-FETCH-ERROR");
        setCases([]);
        setLoading(false);
        return;
      }

      const caseIds = (assignments || []).map((a) => a.case_id).filter(Boolean);
      if (caseIds.length === 0) {
        setCases([]);
        setErrorCode(null);
        setLoading(false);
        return;
      }

      // Step 2: Fetch case details with client names
      const { data: casesData, error: casesErr } = await supabase
        .from("rc_cases")
        .select("id, case_number, client_id, rc_clients(first_name, last_name)")
        .in("id", caseIds)
        .eq("is_superseded", false)
        .order("case_number", { ascending: true });

      if (casesErr) {
        // Retry without join if rc_clients join fails
        const { data: fallbackData, error: fallbackErr } = await supabase
          .from("rc_cases")
          .select("id, case_number, client_id")
          .in("id", caseIds)
          .eq("is_superseded", false)
          .order("case_number", { ascending: true });

        if (fallbackErr) {
          console.error("rc_cases error:", fallbackErr.message);
          setErrorCode("COMM-FETCH-ERROR");
          setCases([]);
          setLoading(false);
          return;
        }
        setCases((fallbackData || []).map(mapCase));
      } else {
        setCases((casesData || []).map(mapCase));
      }
      setErrorCode(null);
      try {
        localStorage.removeItem(FALLBACK_CASE_KEY);
      } catch (_) {}
    } catch (e) {
      console.error("AttorneyCommunicationCenter: fetchCases", e);
      setErrorCode("COMM-FETCH-ERROR");
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (caseId) return;
    fetchCases();
  }, [caseId, fetchCases]);

  useEffect(() => {
    if (loading || cases.length > 0 || !allowUnassignedCaseSelect || hasTriedRestore.current) return;
    hasTriedRestore.current = true;
    const stored = typeof window !== "undefined" ? localStorage.getItem(FALLBACK_CASE_KEY) : null;
    if (!stored?.trim()) return;
    (async () => {
      try {
        let { data: arr, error } = await supabase
          .from("rc_cases")
          .select("id, case_number, client_id, rc_clients(first_name, last_name)")
          .eq("id", stored)
          .eq("is_superseded", false);
        if (error) {
          const fallback = await supabase
            .from("rc_cases")
            .select("id, case_number, client_id")
            .eq("id", stored)
            .eq("is_superseded", false);
          if (fallback.error) {
            localStorage.removeItem(FALLBACK_CASE_KEY);
            return;
          }
          arr = fallback.data;
        }
        if (!arr?.length) {
          localStorage.removeItem(FALLBACK_CASE_KEY);
          return;
        }
        const c = mapCase(arr[0]);
        setCases([c]);
        setSelectedCaseId(c.id);
      } catch (_) {
        try {
          localStorage.removeItem(FALLBACK_CASE_KEY);
        } catch (_) {}
      }
    })();
  }, [loading, cases.length]);

  useEffect(() => {
    if (cases.length > 0 || !allowUnassignedCaseSelect) return;
    setFallbackLoading(true);
    (async () => {
      try {
        let { data, error } = await supabase
          .from("rc_cases")
          .select("id, case_number, client_id, rc_clients(first_name, last_name)")
          .eq("is_superseded", false)
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) {
          const fallback = await supabase
            .from("rc_cases")
            .select("id, case_number, client_id")
            .eq("is_superseded", false)
            .order("created_at", { ascending: false })
            .limit(50);
          if (fallback.error) {
            setFallbackCases([]);
          } else {
            setFallbackCases((fallback.data || []).map(mapCase));
          }
        } else {
          setFallbackCases((data || []).map(mapCase));
        }
      } catch (_) {
        setFallbackCases([]);
      } finally {
        setFallbackLoading(false);
      }
    })();
  }, [cases.length]);

  // ---- Fetch requests ----
  const fetchRequests = useCallback(async () => {
    if (!selectedCaseId) {
      setRequests([]);
      setRequestsError(null);
      setRequestsSlow(false);
      if (requestsSlowRef.current) {
        clearTimeout(requestsSlowRef.current);
        requestsSlowRef.current = null;
      }
      return;
    }
    setRequestsLoading(true);
    setRequestsError(null);
    setRequestsSlow(false);
    if (requestsSlowRef.current) {
      clearTimeout(requestsSlowRef.current);
    }
    requestsSlowRef.current = setTimeout(() => setRequestsSlow(true), LOADING_SLOW_MS);
    try {
      const res = await listCaseRequests(selectedCaseId);
      if (res.error) {
        setRequestsError(res.error);
        setRequests([]);
      } else {
        setRequests(res.data ?? []);
        setRequestsError(null);
      }
    } catch (e: any) {
      setRequestsError(e?.message ?? "Failed to load requests");
      setRequests([]);
    } finally {
      setRequestsLoading(false);
      if (requestsSlowRef.current) {
        clearTimeout(requestsSlowRef.current);
        requestsSlowRef.current = null;
      }
    }
  }, [selectedCaseId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // ---- Fetch thread ----
  const fetchThread = useCallback(async (requestId: string) => {
    setThreadLoading(true);
    setThreadError(null);
    setThreadSlow(false);
    if (threadSlowRef.current) clearTimeout(threadSlowRef.current);
    threadSlowRef.current = setTimeout(() => setThreadSlow(true), LOADING_SLOW_MS);
    try {
      const res = await getRequestThread(requestId);
      if (res.error) {
        setThreadError(res.error);
        setThread(null);
      } else {
        setThread(res.data ?? null);
        setThreadError(null);
      }
    } catch (e: any) {
      setThreadError(e?.message ?? "Failed to load thread");
      setThread(null);
    } finally {
      setThreadLoading(false);
      if (threadSlowRef.current) {
        clearTimeout(threadSlowRef.current);
        threadSlowRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (view === "thread" && selectedRequestId) {
      fetchThread(selectedRequestId);
    } else {
      setThread(null);
      setThreadError(null);
    }
  }, [view, selectedRequestId, fetchThread]);

  // ---- Fetch activity ----
  const fetchActivity = useCallback(async () => {
    if (!selectedCaseId) {
      setActivity([]);
      setActivityError(null);
      setActivitySlow(false);
      if (activitySlowRef.current) {
        clearTimeout(activitySlowRef.current);
        activitySlowRef.current = null;
      }
      return;
    }
    setActivityLoading(true);
    setActivityError(null);
    setActivitySlow(false);
    if (activitySlowRef.current) clearTimeout(activitySlowRef.current);
    activitySlowRef.current = setTimeout(() => setActivitySlow(true), LOADING_SLOW_MS);
    try {
      const res = await listCaseActivity(selectedCaseId);
      if (res.error) {
        setActivityError(res.error);
        setActivity([]);
      } else {
        setActivity(res.data ?? []);
        setActivityError(null);
      }
    } catch (e: any) {
      setActivityError(e?.message ?? "Failed to load activity");
      setActivity([]);
    } finally {
      setActivityLoading(false);
      if (activitySlowRef.current) {
        clearTimeout(activitySlowRef.current);
        activitySlowRef.current = null;
      }
    }
  }, [selectedCaseId]);

  useEffect(() => {
    if (activeTab === "all-activity") {
      fetchActivity();
    }
  }, [activeTab, selectedCaseId, fetchActivity, clientCommRefreshKey]);

  // ---- Create request ----
  const createRequest = async () => {
    if (!selectedCaseId || !formTitle.trim() || !formBody.trim() || !user?.id) {
      toast({ title: "Error", description: "Title, message, and sign-in are required.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await createCaseRequest({
        caseId: selectedCaseId,
        title: formTitle.trim(),
        body: formBody.trim(),
        createdByUserId: user.id,
      });
      if (res.error) {
        toast({ title: "Error", description: res.error, variant: "destructive" });
        return;
      }
      setNewRequestOpen(false);
      setFormTitle("");
      setFormBody("");
      toast({ title: "Request created", description: "Your request has been submitted." });
      await fetchRequests();
      if (res.data) {
        setSelectedRequestId(res.data.id);
        setView("thread");
        fetchThread(res.data.id);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Failed to create request", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  // ---- Post message ----
  const postMessage = async () => {
    if (!selectedRequestId || !selectedCaseId || !composeMessage.trim() || !user?.id) {
      toast({ title: "Error", description: "Message and sign-in are required.", variant: "destructive" });
      return;
    }
    if (thread?.request.status === "closed") {
      toast({ title: "Cannot send", description: "This request is closed. Reopen to send another message.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await postRequestMessage({
        requestId: selectedRequestId,
        caseId: selectedCaseId,
        message: composeMessage.trim(),
        senderUserId: user.id,
        senderRole: "attorney",
      });
      if (res.error) {
        toast({ title: "Error", description: res.error, variant: "destructive" });
        return;
      }
      setComposeMessage("");
      toast({ title: "Message sent", description: "Your message has been posted." });
      fetchThread(selectedRequestId);
      fetchRequests();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Failed to post message", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  // ---- Close / Reopen ----
  const handleClose = async () => {
    if (!selectedRequestId) return;
    setSending(true);
    try {
      const res = await closeRequest(selectedRequestId);
      if (res.error) {
        toast({ title: "Error", description: res.error, variant: "destructive" });
        return;
      }
      toast({ title: "Request closed" });
      fetchThread(selectedRequestId);
      fetchRequests();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Failed to close", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleReopen = async () => {
    if (!selectedRequestId) return;
    setSending(true);
    try {
      const res = await reopenRequest(selectedRequestId);
      if (res.error) {
        toast({ title: "Error", description: res.error, variant: "destructive" });
        return;
      }
      toast({ title: "Request reopened" });
      fetchThread(selectedRequestId);
      fetchRequests();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Failed to reopen", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleFallbackCaseSelect = (caseId: string) => {
    const c = fallbackCases.find((x) => x.id === caseId);
    if (!c) return;
    setCases([c]);
    setSelectedCaseId(c.id);
    setSelectedRequestId(null);
    setView("list");
    try {
      localStorage.setItem(FALLBACK_CASE_KEY, c.id);
    } catch (_) {}
  };

  // ---- Render ----

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-slate-600">Loading…</p>
      </div>
    );
  }

  if (errorCode === "COMM-FETCH-ERROR") {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4 flex flex-col gap-2">
          <p className="text-red-800">Could not load communications. Please try again.</p>
          <Button variant="outline" size="sm" onClick={fetchCases}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (cases.length === 0) {
    return (
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-6 space-y-4">
          <div>
            <p className="text-amber-800 font-medium">No cases assigned to you yet.</p>
            <p className="text-amber-700/90 text-sm mt-1">You don&apos;t have any cases assigned yet.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white">
              <Link to="/attorney/pending-intakes">
                <Inbox className="w-4 h-4 mr-2" />
                View Intakes Awaiting Review
              </Link>
            </Button>
          </div>
          {allowUnassignedCaseSelect && (
            <div className="pt-4 border-t border-amber-200/80">
              <Label className="text-amber-800/90 text-sm">Select a case (for testing)</Label>
              {fallbackLoading ? (
                <p className="text-amber-700/80 text-sm mt-1">Loading cases…</p>
              ) : (
                <Select onValueChange={handleFallbackCaseSelect} value="">
                  <SelectTrigger className="mt-1 max-w-xs bg-white border-amber-300">
                    <SelectValue placeholder="Choose a case…" />
                  </SelectTrigger>
                  <SelectContent>
                    {fallbackCases.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.case_number || c.id.slice(0, 8)} — {c.client_name || "Client"}
                      </SelectItem>
                    ))}
                    {fallbackCases.length === 0 && !fallbackLoading && (
                      <div className="py-2 px-2 text-sm text-slate-500">No cases available</div>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Thread view
  if (view === "thread" && selectedCaseId) {
    const req = thread?.request;
    const isClosed = req?.status === "closed";
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => { setView("list"); setSelectedRequestId(null); setThread(null); }}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to list
        </Button>
        {!caseId && (
          <div className="flex items-center gap-2 flex-wrap">
            <Label className="text-slate-700">Case</Label>
            <Select
              value={selectedCaseId}
              onValueChange={(v) => {
                setSelectedCaseId(v || null);
                setSelectedRequestId(null);
                setView("list");
              }}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.case_number || c.id.slice(0, 8)} — {c.client_name || "Client"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {threadLoading && !thread ? (
          <Card className="border-slate-200">
            <CardContent className="p-8 text-center">
              <p className="text-slate-600">Loading thread…</p>
              {(threadSlow || threadError) && (
                <p className="text-sm text-amber-700 mt-2">Still loading… try refresh.</p>
              )}
              {threadError && <p className="text-sm text-red-600 mt-1">{threadError}</p>}
              <Button variant="outline" size="sm" className="mt-3" onClick={() => selectedRequestId && fetchThread(selectedRequestId)}>Retry</Button>
            </CardContent>
          </Card>
        ) : threadError && !thread ? (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 flex flex-col gap-2">
              <p className="text-red-800">{threadError}</p>
              <Button variant="outline" size="sm" onClick={() => selectedRequestId && fetchThread(selectedRequestId)}>Retry</Button>
            </CardContent>
          </Card>
        ) : req ? (
          <Card className="border-slate-200">
            <CardHeader className="py-3 flex flex-row items-start justify-between gap-2 flex-wrap">
              <div>
                <CardTitle className="text-base">{req.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge className={req.status === "open" ? "bg-amber-500" : req.status === "responded" ? "bg-green-600" : "bg-slate-400"}>
                    {statusLabel(req.status)}
                  </Badge>
                  {req.status === "open" && (
                    <span className="text-xs text-slate-500">Awaiting RN response</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {isClosed ? (
                  <Button variant="outline" size="sm" onClick={handleReopen} disabled={sending}>Reopen Request</Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleClose} disabled={sending}>Close Request</Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[320px] pr-4">
                <div className="space-y-3">
                  {/* Initial body as Attorney message */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="font-medium text-slate-700">Attorney</span>
                    <span className="text-slate-500 text-xs ml-2">{format(new Date(req.created_at), "MMM d, h:mm a")}</span>
                    <p className="text-slate-700 whitespace-pre-wrap mt-1">{req.body}</p>
                  </div>
                  {thread.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-lg ${m.sender_role === "rn" ? "bg-green-50 border border-green-200" : "bg-slate-50 border border-slate-200"}`}
                    >
                      <span className="font-medium text-slate-700">{m.sender_role === "rn" ? "RN" : "Attorney"}</span>
                      <span className="text-slate-500 text-xs ml-2">{format(new Date(m.created_at), "MMM d, h:mm a")}</span>
                      <p className="text-slate-700 whitespace-pre-wrap mt-1">{m.message}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="mt-4 border-t border-slate-200 pt-3">
                {isClosed ? (
                  <p className="text-slate-500 text-sm">This request is closed. Reopen to send another message.</p>
                ) : (
                  <>
                    <Textarea
                      value={composeMessage}
                      onChange={(e) => setComposeMessage(e.target.value)}
                      placeholder="Add a follow-up message…"
                      rows={2}
                      className="border-slate-200"
                    />
                    <Button size="sm" className="mt-2" onClick={postMessage} disabled={!composeMessage.trim() || sending}>
                      Send
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    );
  }

  // Main: list + All Activity
  return (
    <div className="space-y-6">
      {!caseId && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-800 text-2xl flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              Requests
            </CardTitle>
            <p className="text-slate-600 text-sm mt-1">Create case-linked requests to RN and view responses.</p>
          </CardHeader>
        </Card>
      )}

      {!caseId && (
        <div className="flex items-center gap-2 flex-wrap">
          <Label className="text-slate-700">Case</Label>
          <Select
            value={selectedCaseId ?? ""}
            onValueChange={(v) => {
              setSelectedCaseId(v || null);
              setSelectedRequestId(null);
            }}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select a case." />
            </SelectTrigger>
            <SelectContent>
              {cases.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.case_number || c.id.slice(0, 8)} — {c.client_name || "Client"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!selectedCaseId && (
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-6 text-center">
            <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-700">Select a case to view Requests.</p>
          </CardContent>
        </Card>
      )}

      {selectedCaseId && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "requests" | "all-activity")} className="w-full">
          <TabsList className="bg-white border-b border-slate-200">
            <TabsTrigger value="requests" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Requests</TabsTrigger>
            <TabsTrigger value="all-activity" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">All Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setNewRequestOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" /> Create Request
              </Button>
            </div>

            {requestsError && (
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4 flex flex-col gap-2">
                  <p className="text-red-800">{requestsError}</p>
                  <Button variant="outline" size="sm" onClick={fetchRequests}>Retry</Button>
                </CardContent>
              </Card>
            )}

            {requestsLoading && !requestsError ? (
              <Card className="border-slate-200">
                <CardContent className="p-8 text-center">
                  <p className="text-slate-600">Loading requests…</p>
                  {requestsSlow && <p className="text-sm text-amber-700 mt-2">Still loading… try refresh.</p>}
                  <Button variant="outline" size="sm" className="mt-3" onClick={fetchRequests}>Retry</Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-200">
                <CardHeader className="py-3"><CardTitle className="text-base">Requests</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="h-[400px]">
                    {requests.length === 0 ? (
                      <div className="py-6 text-center">
                        <p className="text-slate-500 text-sm mb-3">No requests yet for this case. Create a request to communicate with the RN.</p>
                        <Button onClick={() => setNewRequestOpen(true)} variant="outline" size="sm">Create Request</Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {requests.map((r) => (
                          <div
                            key={r.id}
                            onClick={() => { setSelectedRequestId(r.id); setView("thread"); }}
                            className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                          >
                            <div className="flex flex-wrap items-center gap-1 mb-1">
                              <Badge className={r.status === "open" ? "bg-amber-500" : r.status === "responded" ? "bg-green-600" : "bg-slate-400"}>
                                {statusLabel(r.status)}
                              </Badge>
                              {r.status === "open" && <span className="text-xs text-slate-500">Awaiting RN response</span>}
                            </div>
                            <p className="font-medium text-slate-800 truncate">{r.title}</p>
                            <p className="text-xs text-slate-500">{format(new Date(r.last_activity_at), "MMM d, yyyy 'at' h:mm a")}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="all-activity" className="space-y-4">
            {activityError && (
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4 flex flex-col gap-2">
                  <p className="text-red-800">{activityError}</p>
                  <Button variant="outline" size="sm" onClick={fetchActivity}>Retry</Button>
                </CardContent>
              </Card>
            )}
            {activityLoading && !activityError ? (
              <Card className="border-slate-200">
                <CardContent className="p-8 text-center">
                  <p className="text-slate-600">Loading activity…</p>
                  {activitySlow && <p className="text-sm text-amber-700 mt-2">Still loading… try refresh.</p>}
                  <Button variant="outline" size="sm" className="mt-3" onClick={fetchActivity}>Retry</Button>
                </CardContent>
              </Card>
            ) : activity.length === 0 ? (
              <Card className="bg-slate-50 border-slate-200">
                <CardContent className="p-8 text-center">
                  <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="font-medium text-slate-800">No activity yet.</p>
                  <p className="text-slate-600 text-sm mt-1">Once you create a request or RN responds, activity will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 pr-4">
                  {activity.map((a) => {
                    const isClientComm = a.activity_type === "client_communication";
                    const typeMatch = a.summary.match(/^Client communication \((\w+)\)/);
                    const commType = typeMatch ? typeMatch[1] : "";
                    const ccRn = a.visibility === "attorney_rn";
                    return (
                      <Card key={a.id} className="bg-slate-50 border-slate-200">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start flex-wrap gap-1">
                            <div className="flex flex-wrap items-center gap-1">
                              <Badge className="bg-blue-600">
                                {isClientComm ? "Attorney → Client" : a.activity_type.replace(/_/g, " ")}
                              </Badge>
                              {isClientComm && commType && (
                                <span className="text-xs text-slate-600">{commType}</span>
                              )}
                              {isClientComm && ccRn && (
                                <Badge variant="outline" className="text-xs">CC&apos;d to RN</Badge>
                              )}
                            </div>
                            <span className="text-xs text-slate-500">{format(new Date(a.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                          </div>
                          <p className="text-slate-800 text-sm mt-2">{a.details || a.summary}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={newRequestOpen} onOpenChange={setNewRequestOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create Request</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Title (required)</Label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Short title for the request"
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-md"
              />
            </div>
            <div>
              <Label>Message (required)</Label>
              <Textarea value={formBody} onChange={(e) => setFormBody(e.target.value)} placeholder="Describe what you need…" rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewRequestOpen(false)}>Cancel</Button>
            <Button onClick={createRequest} disabled={!formTitle.trim() || !formBody.trim() || sending}>Create Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
