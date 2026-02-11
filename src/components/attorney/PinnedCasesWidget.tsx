import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pin, PinOff, ExternalLink, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { usePinnedCases } from "@/hooks/usePinnedCases";

const PINNED_LIST_URL = "/attorney/pinned";

export default function PinnedCasesWidget() {
  const { cases } = useApp();
  const navigate = useNavigate();
  const { pinnedCaseIds, loading, togglePin: togglePinHook, isPinned } = usePinnedCases();

  const pinnedCases = (cases || []).filter((c) => pinnedCaseIds.includes(c.id)).slice(0, 5);

  const handleTogglePin = (caseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    togglePinHook(caseId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW": return "bg-yellow-500/10 text-yellow-500";
      case "IN_PROGRESS": return "bg-green-500/10 text-green-500";
      case "AWAITING_CONSENT": return "bg-orange-500/10 text-orange-500";
      case "CLOSED": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card
      className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
      role="button"
      tabIndex={0}
      onClick={() => navigate(PINNED_LIST_URL)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(PINNED_LIST_URL); } }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Pin className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Pinned Cases</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {pinnedCaseIds.length}/5
          </Badge>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(PINNED_LIST_URL); }}>
            View
          </Button>
        </div>
      </div>

      <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div className="flex items-center gap-2 py-4">
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        ) : pinnedCases.length === 0 ? (
          <div className="flex items-center gap-2 py-4">
            <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <p className="text-sm text-muted-foreground">No pinned cases. Pin from a case’s detail page for quick access.</p>
          </div>
        ) : (
          pinnedCases.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/attorney/cases/${c.id}`)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {c.client?.rcmsId || c.id}
                    {c.client?.fullName || c.client?.displayNameMasked ? ` — ${c.client.fullName || c.client.displayNameMasked}` : ""}
                  </p>
                  <Badge variant="secondary" className={`text-xs ${getStatusColor(c.status)}`}>
                    {c.status}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => handleTogglePin(c.id, e)}
                >
                  <PinOff className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/attorney/cases/${c.id}`);
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && pinnedCases.length === 0 && (cases || []).length > 0 && pinnedCaseIds.length < 5 && (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-muted-foreground mb-1">Suggested cases to pin:</p>
          {(cases || []).filter((c) => !isPinned(c.id)).slice(0, 3).map((c) => (
            <Button
              key={c.id}
              variant="outline"
              size="sm"
              className="w-full justify-between"
              onClick={(e) => { e.stopPropagation(); handleTogglePin(c.id, e); }}
            >
              <span className="truncate">{c.client?.rcmsId || c.id.slice(-8)}{c.client?.fullName || c.client?.displayNameMasked ? ` — ${c.client.fullName || c.client.displayNameMasked}` : ""}</span>
              <Pin className="h-3 w-3 ml-2 flex-shrink-0" />
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
}
