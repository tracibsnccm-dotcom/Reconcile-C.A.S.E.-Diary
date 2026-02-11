import { useState, useCallback } from "react";
import { Bell, FileText, Inbox, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { getAttorneyRcUserId } from "@/lib/attorneyCaseQueries";
import { isOptionalTableError } from "@/lib/optionalTableUtils";
import { useNavigate } from "react-router-dom";

interface NotificationItem {
  id: string;
  type: "rn_response" | "intake" | "billing";
  title: string;
  message?: string;
  at: string;
  caseId?: string;
  requestId?: string;
}

function formatTs(iso: string): string {
  const d = new Date(iso);
  const n = new Date();
  const mins = Math.floor((n.getTime() - d.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString();
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setItems([]);
    const out: NotificationItem[] = [];
    try {
      const attorneyRcId = await getAttorneyRcUserId();
      if (!attorneyRcId) {
        setItems([]);
        setLoading(false);
        setLoaded(true);
        return;
      }

      // Attorney's case ids
      const { data: caseRows } = await supabase
        .from("rc_cases")
        .select("id")
        .eq("attorney_id", attorneyRcId)
        .eq("is_superseded", false)
        .in("case_status", ["released", "closed", "ready"]);
      const caseIds = (caseRows || []).map((c: any) => c.id);

      // 1) RN request responses: rc_case_request_messages (sender_role=rn) + rc_case_requests
      if (caseIds.length > 0) {
        try {
          const { data: msgs } = await supabase
            .from("rc_case_request_messages")
            .select("id, request_id, case_id, created_at")
            .eq("sender_role", "rn")
            .in("case_id", caseIds)
            .order("created_at", { ascending: false })
            .limit(20);
          const reqIds = [...new Set((msgs || []).map((m: any) => m.request_id))];
          if (reqIds.length > 0) {
            const { data: reqs } = await supabase
              .from("rc_case_requests")
              .select("id, title")
              .in("id", reqIds);
            const byReq = (reqs || []).reduce((a: Record<string, any>, r: any) => { a[r.id] = r; return a; }, {});
            for (const m of (msgs || [])) {
              const r = byReq[m.request_id];
              out.push({
                id: `rn-${m.id}`,
                type: "rn_response",
                title: `RN responded to request: ${r?.title || "Request"}`,
                at: m.created_at,
                caseId: m.case_id,
                requestId: m.request_id,
              });
            }
          }
        } catch (e) {
          if (!isOptionalTableError(e)) { /* no retries, no spam */ }
        }
      }

      // 2) Intake events: rc_client_intakes for attorney's cases (best-effort)
      if (caseIds.length > 0) {
        try {
          const { data: intakes } = await supabase
            .from("rc_client_intakes")
            .select("id, case_id, intake_status, updated_at")
            .in("case_id", caseIds)
            .order("updated_at", { ascending: false })
            .limit(10);
          for (const i of (intakes || [])) {
            out.push({
              id: `intake-${i.id}`,
              type: "intake",
              title: "Intake update",
              message: `Status: ${i.intake_status || "—"}`,
              at: i.updated_at || i.id,
              caseId: i.case_id,
            });
          }
        } catch (e) {
          if (!isOptionalTableError(e)) { /* no retries */ }
        }
      }

      // 3) Billing/system alerts: placeholder
      // Keep empty; we could later add from a real source.

      setItems(out);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  const onOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !loaded) load();
  };

  const go = (item: NotificationItem) => {
    setOpen(false);
    if (item.caseId) navigate(`/attorney/cases/${item.caseId}`);
  };

  return (
    <Popover open={open} onOpenChange={onOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {items.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {items.length > 9 ? "9+" : items.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <p className="text-xs text-muted-foreground mt-1">
            RN responses, intake updates, and billing/system alerts appear here.
          </p>
        </div>
        <ScrollArea className="h-80">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium text-foreground">No notifications yet.</p>
              <p className="text-xs text-muted-foreground mt-1">
                RN responses to requests, intake updates, and billing/system alerts will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((n) => (
                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => go(n)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(n); } }}
                  className="flex gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="shrink-0 mt-0.5">
                    {n.type === "rn_response" && <FileText className="h-4 w-4 text-muted-foreground" />}
                    {n.type === "intake" && <Inbox className="h-4 w-4 text-muted-foreground" />}
                    {n.type === "billing" && <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{n.title}</p>
                    {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{formatTs(n.at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {/* Billing/system section: placeholder empty state when we have no alerts */}
        <div className="p-3 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            System alerts: No system alerts.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
