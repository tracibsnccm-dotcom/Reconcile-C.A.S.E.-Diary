// src/components/RNCaseTimeline.tsx

import * as React from "react";
import {
  CaseTimelineEvent,
  CaseEventCategory,
  TenVsSnapshot,
} from "../domain/caseTimeline";
import { mockTimelineEvents } from "../mock/mockTimeline";

import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

import {
  computeTenVsFromEvents,
  describeBand,
} from "../domain/tenVsEngine";

type Filter = "ALL" | CaseEventCategory | "CRITICAL" | "LEGAL_LOCK";

interface RNCaseTimelineProps {
  caseId: string;
  isCaseLegalLocked?: boolean;
  events?: CaseTimelineEvent[];
  onAddEvent?: (event: CaseTimelineEvent) => void;
}

export const RNCaseTimeline: React.FC<RNCaseTimelineProps> = ({
  caseId,
  isCaseLegalLocked,
  events,
  onAddEvent,
}) => {
  const [filter, setFilter] = React.useState<Filter>("ALL");

  // New-event form state
  const [showNewForm, setShowNewForm] = React.useState(false);
  const [category, setCategory] =
    React.useState<CaseEventCategory>("CLINICAL");
  const [summary, setSummary] = React.useState("");
  const [details, setDetails] = React.useState("");
  const [isCritical, setIsCritical] = React.useState(false);
  const [tagsText, setTagsText] = React.useState("");

  // Prefer events from parent; fall back to mock data if none passed
  const eventsForCase = React.useMemo(
    () =>
      (events ?? mockTimelineEvents).filter((e) => e.caseId === caseId),
    [events, caseId]
  );

  const filteredEvents = React.useMemo(() => {
    switch (filter) {
      case "CRITICAL":
        return eventsForCase.filter((e) => e.isCritical);
      case "LEGAL_LOCK":
        return eventsForCase.filter((e) => e.isLegalLocked);
      case "CLINICAL":
      case "LEGAL":
      case "WORKLOAD":
      case "SYSTEM":
      case "COMMUNICATION":
      case "OTHER":
        return eventsForCase.filter((e) => e.category === filter);
      case "ALL":
      default:
        return eventsForCase;
    }
  }, [eventsForCase, filter]);

  // Group by date (YYYY-MM-DD)
  const groupedByDate = React.useMemo(() => {
    const map = new Map<string, CaseTimelineEvent[]>();
    for (const evt of filteredEvents) {
      const dateKey = evt.createdAt.slice(0, 10);
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(evt);
    }
    // sort events within each date (newest first)
    for (const [key, list] of map.entries()) {
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      map.set(key, list);
    }
    // sort dates (newest first)
    return Array.from(map.entries()).sort(
      (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  }, [filteredEvents]);

  // --- 10-Vs derived view for this case -------------------------------------

  const tenVsSnapshot: TenVsSnapshot = React.useMemo(
    () => computeTenVsFromEvents(eventsForCase),
    [eventsForCase]
  );

  // --- New event handler ----------------------------------------------------

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;

    const now = new Date();

    const tags =
      tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean) ?? [];

    const newEvent: CaseTimelineEvent = {
      id: `evt-${now.getTime()}`,
      caseId,
      category,
      summary: summary.trim(),
      details: details.trim() || undefined,
      actorRole: "RN",
      actorName: "RN Case Manager",
      createdAt: now.toISOString(),
      isCritical,
      tags,
    };

    if (onAddEvent) {
      onAddEvent(newEvent);
    }

    // Reset form
    setSummary("");
    setDetails("");
    setTagsText("");
    setIsCritical(false);
    setShowNewForm(false);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">Case Timeline (RN)</CardTitle>
            <p className="text-xs text-muted-foreground">
              Clinical, legal, and system events for this case, with live 10-Vs
              context.
            </p>
          </div>

          <div className="flex flex-wrap gap-1">
            <Button
              variant={filter === "ALL" ? "default" : "outline"}
              size="xs"
              onClick={() => setFilter("ALL")}
            >
              All
            </Button>
            <Button
              variant={filter === "CLINICAL" ? "default" : "outline"}
              size="xs"
              onClick={() => setFilter("CLINICAL")}
            >
              Clinical
            </Button>
            <Button
              variant={filter === "LEGAL" ? "default" : "outline"}
              size="xs"
              onClick={() => setFilter("LEGAL")}
            >
              Legal
            </Button>
            <Button
              variant={filter === "CRITICAL" ? "default" : "outline"}
              size="xs"
              onClick={() => setFilter("CRITICAL")}
            >
              Critical
            </Button>
            <Button
              variant={filter === "LEGAL_LOCK" ? "default" : "outline"}
              size="xs"
              onClick={() => setFilter("LEGAL_LOCK")}
            >
              Legal Lock
            </Button>
          </div>
        </div>

        {isCaseLegalLocked && (
          <div className="text-[11px] text-amber-700">
            ⚖️ Legal lock-down is active. Editing of certain entries may be
            restricted.
          </div>
        )}

        {/* 10-Vs mini dashboard */}
        <TenVsSummaryBar snapshot={tenVsSnapshot} />

        {/* Log New Event toggle + form */}
        <div className="mt-2">
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => setShowNewForm((v) => !v)}
            >
              {showNewForm ? "Cancel" : "Log New Event"}
            </Button>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              RN-only; entries update this session&apos;s timeline and 10-Vs
              snapshot.
            </span>
          </div>

          {showNewForm && (
            <form
              onSubmit={handleSubmitNew}
              className="mt-2 rounded-md border bg-muted/40 px-2 py-2 space-y-2"
            >
              <div className="grid gap-2 text-[11px]">
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Category</span>
                    <select
                      className="h-7 rounded border px-2 text-xs bg-white"
                      value={category}
                      onChange={(e) =>
                        setCategory(e.target.value as CaseEventCategory)
                      }
                    >
                      <option value="CLINICAL">Clinical</option>
                      <option value="LEGAL">Legal</option>
                      <option value="SYSTEM">System</option>
                      <option value="WORKLOAD">Workload</option>
                      <option value="COMMUNICATION">Communication</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </label>

                  <label className="flex items-center gap-2 mt-5">
                    <input
                      type="checkbox"
                      className="h-3 w-3"
                      checked={isCritical}
                      onChange={(e) => setIsCritical(e.target.checked)}
                    />
                    <span className="text-[11px]">Mark as critical</span>
                  </label>
                </div>

                <label className="flex flex-col gap-1">
                  <span className="font-medium">Summary</span>
                  <Input
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Short title for this event (required)…"
                    className="h-7 text-xs"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="font-medium">Details</span>
                  <Textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Optional clinical / SDOH / workflow details…"
                    className="text-xs"
                    rows={3}
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="font-medium">Tags</span>
                  <Input
                    value={tagsText}
                    onChange={(e) => setTagsText(e.target.value)}
                    placeholder='Comma-separated (e.g. "sdoh, pt-no-show")'
                    className="h-7 text-xs"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => setShowNewForm(false)}
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  size="xs"
                  disabled={!summary.trim()}
                >
                  Save Event
                </Button>
              </div>
            </form>
          )}
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[420px]">
          <div className="px-4 py-3 space-y-6">
            {groupedByDate.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No timeline events available for this case yet.
              </p>
            )}

            {groupedByDate.map(([dateKey, events]) => (
              <div key={dateKey} className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  {new Date(dateKey).toLocaleDateString()}
                </div>
                <div className="space-y-2">
                  {events.map((evt) => (
                    <TimelineRow key={evt.id} event={evt} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

// --- 10-Vs summary bar ------------------------------------------------------

interface TenVsSummaryBarProps {
  snapshot: TenVsSnapshot;
}

const TenVsSummaryBar: React.FC<TenVsSummaryBarProps> = ({ snapshot }) => {
  const items: { key: keyof TenVsSnapshot; label: string }[] = [
    { key: "v1PainSignal", label: "V1 Pain" },
    { key: "v2FunctionalLoss", label: "V2 Function" },
    { key: "v3VitalityReserve", label: "V3 Vitality" },
    { key: "v4VigilanceRisk", label: "V4 Vigilance" },
    { key: "v10ViabilityTrajectory", label: "V10 Viability" },
  ];

  return (
    <div className="rounded-md border bg-muted/40 px-2 py-2">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="text-[11px] font-medium text-muted-foreground">
          10-Vs Snapshot (0–3 band, computed from timeline)
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => {
          const value = snapshot[item.key];
          const { label, tone } = describeBand(value);
          const toneClass =
            tone === "stable"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : tone === "watch"
              ? "border-sky-200 bg-sky-50 text-sky-700"
              : tone === "concern"
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-red-200 bg-red-50 text-red-800";

          return (
            <Badge
              key={item.key}
              variant="outline"
              className={`text-[10px] font-medium px-2 py-1 ${toneClass}`}
            >
              {item.label}: {value} • {label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

// --- Timeline rows ----------------------------------------------------------

interface TimelineRowProps {
  event: CaseTimelineEvent;
}

const TimelineRow: React.FC<TimelineRowProps> = ({ event }) => {
  const [expanded, setExpanded] = React.useState(false);

  const time = new Date(event.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const roleLabel = event.actorRole === "SYSTEM" ? "System" : event.actorRole;

  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-1 top-0 bottom-0 w-px bg-border" />

      {/* Dot */}
      <div className="absolute left-0 top-2 h-2 w-2 rounded-full bg-foreground" />

      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">{time}</span>
            <Badge variant="outline" className="capitalize">
              {event.category.toLowerCase()}
            </Badge>
            {event.isCritical && (
              <Badge className="text-xs font-semibold">Critical</Badge>
            )}
            {event.isLegalLocked && (
              <Badge variant="outline" className="text-[10px]">
                Legal Lock
              </Badge>
            )}
            {event.requiresAudit && (
              <Badge
                variant={
                  event.auditStatus === "FLAGGED" ? "default" : "outline"
                }
                className="text-[10px]"
              >
                Audit: {event.auditStatus ?? "PENDING"}
              </Badge>
            )}
          </div>
          <div className="text-xs font-medium">{event.summary}</div>
          <div className="text-[11px] text-muted-foreground">
            {roleLabel}
            {event.actorName ? ` • ${event.actorName}` : ""}
          </div>

          {expanded && (
            <div className="mt-1 space-y-1 text-[11px] text-muted-foreground">
              {event.details && <p>{event.details}</p>}
              {event.fourPsSummary && (
                <p>
                  <span className="font-semibold">4Ps:</span>{" "}
                  {event.fourPsSummary}
                </p>
              )}
              {event.tenVsSnapshot && (
                <p>
                  <span className="font-semibold">10-Vs snapshot set here.</span>
                </p>
              )}
              {event.tenVsDelta && (
                <p>
                  <span className="font-semibold">10-Vs delta applied.</span>
                </p>
              )}
              {event.tags && event.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {event.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-[10px]"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <Button
          size="xs"
          variant="ghost"
          className="text-[11px]"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Hide" : "Details"}
        </Button>
      </div>
    </div>
  );
};
