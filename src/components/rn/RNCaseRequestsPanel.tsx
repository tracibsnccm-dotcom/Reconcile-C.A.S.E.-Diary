import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/auth/supabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { listCaseRequests, getRequestThread, postRequestMessage, type CaseRequest } from "@/lib/caseRequestsApi";
import { RN_VIEW_ONLY_TOOLTIP } from "@/components/rn/RNCaseStateBadge";

const LOADING_SLOW_MS = 12000;

interface RNCaseRequestsPanelProps {
  caseId: string;
  readOnly?: boolean;
}

function statusLabel(s: string): string {
  return s === "open" ? "Open" : s === "responded" ? "Responded" : "Closed";
}

export function RNCaseRequestsPanel({ caseId }: RNCaseRequestsPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<CaseRequest[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [threadByRequestId, setThreadByRequestId] = useState<Record<string, { request: CaseRequest; messages: { id: string; sender_role: string; message: string; created_at: string }[] }>>({});
  const [replyByRequestId, setReplyByRequestId] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [loadingSlow, setLoadingSlow] = useState(false);
  const [threadLoadingId, setThreadLoadingId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const slowRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!caseId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadingError(null);
    setLoadingSlow(false);
    if (slowRef.current) clearTimeout(slowRef.current);
    slowRef.current = setTimeout(() => setLoadingSlow(true), LOADING_SLOW_MS);
    try {
      const res = await listCaseRequests(caseId);
      if (res.error) {
        setLoadingError(res.error);
        setRequests([]);
      } else {
        setRequests(res.data ?? []);
        setLoadingError(null);
      }
    } catch (e: any) {
      setLoadingError(e?.message ?? "Failed to load requests");
      setRequests([]);
    } finally {
      setLoading(false);
      if (slowRef.current) {
        clearTimeout(slowRef.current);
        slowRef.current = null;
      }
    }
  }, [caseId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const loadThread = useCallback(async (requestId: string) => {
    setThreadLoadingId(requestId);
    try {
      const res = await getRequestThread(requestId);
      if (res.error) {
        toast({ title: "Error", description: res.error, variant: "destructive" });
        return;
      }
      if (res.data) {
        setThreadByRequestId((prev) => ({
          ...prev,
          [requestId]: { request: res.data.request, messages: res.data.messages },
        }));
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Failed to load thread", variant: "destructive" });
    } finally {
      setThreadLoadingId(null);
    }
  }, [toast]);

  useEffect(() => {
    if (expandedId && !threadByRequestId[expandedId]) {
      loadThread(expandedId);
    }
  }, [expandedId, threadByRequestId, loadThread]);

  const postReply = async (requestId: string) => {
    const message = (replyByRequestId[requestId] || "").trim();
    if (!message || !user?.id) {
      toast({ title: "Error", description: "Message and sign-in are required.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await postRequestMessage({
        requestId,
        caseId,
        message,
        senderUserId: user.id,
        senderRole: "rn",
      });
      if (res.error) {
        toast({ title: "Error", description: res.error, variant: "destructive" });
        return;
      }
      setReplyByRequestId((prev) => ({ ...prev, [requestId]: "" }));
      toast({ title: "Response sent", description: "Your response has been added." });
      loadThread(requestId);
      fetchRequests();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Failed to post response", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-600" />
            Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-4 text-center text-slate-600">Loading requests…</div>
          {loadingSlow && <p className="text-center text-sm text-amber-700 mt-1">This is taking longer than expected. Please retry.</p>}
          <Button variant="outline" size="sm" className="mt-2 w-full" onClick={fetchRequests}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (loadingError) {
    return (
      <Card className="border-slate-200 bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-lg">Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-800 text-sm">{loadingError}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={fetchRequests}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-600" />
          Requests
        </CardTitle>
        <p className="text-slate-600 text-sm">View attorney requests and add your responses.</p>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-sm">
            <p className="font-medium text-slate-700">No attorney requests for this case yet.</p>
            <p className="mt-1">When an attorney submits a request, it will appear here.</p>
          </div>
        ) : (
          <ScrollArea className="h-[360px]">
            <div className="space-y-3 pr-2">
              {requests.map((r) => {
                const isExpanded = expandedId === r.id;
                const thread = threadByRequestId[r.id];
                const loadingThread = threadLoadingId === r.id;
                const reply = replyByRequestId[r.id] ?? "";
                const isClosed = r.status === "closed";
                return (
                  <div key={r.id} className="border border-slate-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      className="w-full text-left p-3 hover:bg-slate-50 flex justify-between items-start"
                      onClick={() => toggle(r.id)}
                    >
                      <div>
                        <div className="flex flex-wrap gap-1 mb-1">
                          <Badge className={r.status === "open" ? "bg-amber-500" : r.status === "responded" ? "bg-green-600" : "bg-slate-400"}>
                            {statusLabel(r.status)}
                          </Badge>
                        </div>
                        <p className="font-medium text-slate-800">{r.title}</p>
                        <p className="text-slate-600 text-xs">{format(new Date(r.last_activity_at), "MMM d, h:mm a")}</p>
                      </div>
                      <span className="text-slate-400 text-sm">{isExpanded ? "▼" : "▶"}</span>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-slate-200 p-3 bg-slate-50/50">
                        {loadingThread && !thread ? (
                          <p className="text-slate-500 text-sm">Loading…</p>
                        ) : thread ? (
                          <>
                            <p className="text-slate-700 text-sm whitespace-pre-wrap mb-3">{thread.request.body}</p>
                            <p className="text-xs text-slate-500 mb-2">Created {format(new Date(thread.request.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                            {thread.messages.length > 0 && (
                              <div className="space-y-2 mb-3">
                                <p className="text-xs font-medium text-slate-600">Messages</p>
                                {thread.messages.map((m) => (
                                  <div
                                    key={m.id}
                                    className={`p-2 rounded text-sm ${m.sender_role === "rn" ? "bg-green-50 border border-green-200" : "bg-slate-100 border border-slate-200"}`}
                                  >
                                    <span className="font-medium text-slate-700">{m.sender_role === "rn" ? "You" : "Attorney"}</span>
                                    <span className="text-slate-500 text-xs ml-2">{format(new Date(m.created_at), "MMM d, h:mm a")}</span>
                                    <p className="text-slate-700 whitespace-pre-wrap mt-1">{m.message}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {isClosed ? (
                              <p className="text-slate-500 text-sm">This request is closed.</p>
                            ) : (
                              <div>
                                <Textarea
                                  value={reply}
                                  onChange={(e) => setReplyByRequestId((prev) => ({ ...prev, [r.id]: e.target.value }))}
                                  readOnly={readOnly}
                                  placeholder="Add your response…"
                                  rows={2}
                                  className="border-slate-200 mb-2"
                                />
                                <Button size="sm" onClick={() => postReply(r.id)} disabled={!reply.trim() || sending || readOnly} title={readOnly ? RN_VIEW_ONLY_TOOLTIP : undefined}>
                                  Post Response
                                </Button>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-slate-500 text-sm">Could not load thread.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
