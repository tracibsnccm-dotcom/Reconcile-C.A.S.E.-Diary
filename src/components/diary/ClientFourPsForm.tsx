// src/client/ClientFourPsForm.tsx

import * as React from "react";
import {
  CaseTimelineEvent,
  FourPsProfile,
} from "../domain/caseTimeline";
import { useMockDB } from "../lib/mockDB";
import { useCaseEvents } from "../lib/caseEventsContext";

import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";

export const ClientFourPsForm: React.FC = () => {
  const { activeCase } = useMockDB() as any;
  const { addEvent } = useCaseEvents();

  const caseId: string = activeCase?.id ?? "case-001";
  const clientName: string =
    activeCase?.clientName ??
    activeCase?.name ??
    activeCase?.displayName ??
    "Client";

  // 4Ps toggles
  const [p1Physical, setP1Physical] = React.useState(false);
  const [p2Psychological, setP2Psychological] = React.useState(false);
  const [p3Psychosocial, setP3Psychosocial] = React.useState(false);
  const [p4Professional, setP4Professional] = React.useState(false);

  // Safety
  const [abuseRisk, setAbuseRisk] = React.useState(false);
  const [suicideRisk, setSuicideRisk] = React.useState(false);

  // Narrative fields
  const [physicalNotes, setPhysicalNotes] = React.useState("");
  const [psychNotes, setPsychNotes] = React.useState("");
  const [socialNotes, setSocialNotes] = React.useState("");
  const [workNotes, setWorkNotes] = React.useState("");
  const [goals, setGoals] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);

  const hasAnyP =
    p1Physical || p2Psychological || p3Psychosocial || p4Professional;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAnyP && !abuseRisk && !suicideRisk) {
      return;
    }

    setSubmitting(true);

    const now = new Date();

    const profile: FourPsProfile = {
      p1Physical,
      p2Psychological,
      p3Psychosocial,
      p4Professional,
    };

    const pieces: string[] = [];

    if (physicalNotes.trim()) {
      pieces.push(`Physical: ${physicalNotes.trim()}`);
    }
    if (psychNotes.trim()) {
      pieces.push(`Psychological: ${psychNotes.trim()}`);
    }
    if (socialNotes.trim()) {
      pieces.push(
        `Psychosocial (home & environment): ${socialNotes.trim()}`
      );
    }
    if (workNotes.trim()) {
      pieces.push(`Professional / Work: ${workNotes.trim()}`);
    }
    if (goals.trim()) {
      pieces.push(`Client goals: ${goals.trim()}`);
    }

    if (abuseRisk) {
      pieces.push(
        "Client indicated concerns about safety / possible abuse or coercion."
      );
    }
    if (suicideRisk) {
      pieces.push(
        "Client indicated current or past thoughts of self-harm or suicide."
      );
    }

    const details =
      pieces.length > 0
        ? pieces.join("\n\n")
        : "Client submitted a 4Ps check-in without additional narrative.";

    const activePsLabels: string[] = [];
    if (p1Physical) activePsLabels.push("P1 Physical");
    if (p2Psychological) activePsLabels.push("P2 Psychological");
    if (p3Psychosocial) activePsLabels.push("P3 Psychosocial");
    if (p4Professional) activePsLabels.push("P4 Professional");

    const summary = activePsLabels.length
      ? `Client 4Ps check-in: ${activePsLabels.join(", ")}`
      : "Client safety / risk check-in";

    const tags: string[] = [];
    if (p3Psychosocial || p4Professional) tags.push("sdoh");
    if (abuseRisk) tags.push("abuse-risk", "safety-critical");
    if (suicideRisk) tags.push("suicide-risk", "safety-critical");

    const isCritical = abuseRisk || suicideRisk;

    const newEvent: CaseTimelineEvent = {
      id: `client-evt-${now.getTime()}`,
      caseId,
      category: "CLINICAL",
      summary,
      details,
      actorRole: "CLIENT",
      actorName: clientName,
      createdAt: now.toISOString(),
      isCritical,
      requiresAudit: isCritical,
      auditStatus: isCritical ? "FLAGGED" : undefined,
      fourPsProfile: profile,
      abuseRisk,
      suicideRisk,
      tags,
      fourPsSummary: activePsLabels.join(", "),
    };

    addEvent(newEvent);

    // Reset form
    setP1Physical(false);
    setP2Psychological(false);
    setP3Psychosocial(false);
    setP4Professional(false);
    setAbuseRisk(false);
    setSuicideRisk(false);
    setPhysicalNotes("");
    setPsychNotes("");
    setSocialNotes("");
    setWorkNotes("");
    setGoals("");
    setSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Client 4Ps &amp; Safety Check-In
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          This is a mock of what your client would see in their portal. Their
          answers create timeline events, drive the 10-Vs engine, and update the
          RN and attorney views.
        </p>
      </CardHeader>
      <Separator />
      <CardContent className="pt-3">
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="flex flex-wrap gap-2 mb-1">
            <Badge variant="outline" className="text-[10px]">
              Case: {caseId}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              Client: {clientName}
            </Badge>
          </div>

          <div className="grid gap-3">
            {/* P1 Physical */}
            <div className="space-y-1">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3 w-3"
                  checked={p1Physical}
                  onChange={(e) => setP1Physical(e.target.checked)}
                />
                <span className="font-semibold">
                  P1 – Physical (Pain, movement, body)
                </span>
              </label>
              <Textarea
                rows={2}
                value={physicalNotes}
                onChange={(e) => setPhysicalNotes(e.target.value)}
                placeholder="In your own words, what is going on with your body or pain today?"
                className="text-xs"
              />
            </div>

            {/* P2 Psychological */}
            <div className="space-y-1">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3 w-3"
                  checked={p2Psychological}
                  onChange={(e) => setP2Psychological(e.target.checked)}
                />
                <span className="font-semibold">
                  P2 – Psychological (Mood, stress, coping)
                </span>
              </label>
              <Textarea
                rows={2}
                value={psychNotes}
                onChange={(e) => setPsychNotes(e.target.value)}
                placeholder="How has this injury or condition been affecting your mood, stress level, or sleep?"
                className="text-xs"
              />
            </div>

            {/* P3 Psychosocial / Environment */}
            <div className="space-y-1">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3 w-3"
                  checked={p3Psychosocial}
                  onChange={(e) => setP3Psychosocial(e.target.checked)}
                />
                <span className="font-semibold">
                  P3 – Psychosocial (Home, support, environment)
                </span>
              </label>
              <Textarea
                rows={2}
                value={socialNotes}
                onChange={(e) => setSocialNotes(e.target.value)}
                placeholder="Is anything at home, with family, transportation, housing, or your environment making it harder to get care or heal?"
                className="text-xs"
              />
            </div>

            {/* P4 Professional */}
            <div className="space-y-1">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3 w-3"
                  checked={p4Professional}
                  onChange={(e) => setP4Professional(e.target.checked)}
                />
                <span className="font-semibold">
                  P4 – Professional (Work, income, role)
                </span>
              </label>
              <Textarea
                rows={2}
                value={workNotes}
                onChange={(e) => setWorkNotes(e.target.value)}
                placeholder="How has this affected your job, income, or ability to return to your usual role?"
                className="text-xs"
              />
            </div>

            {/* Safety section */}
            <div className="space-y-1 border rounded-md p-2 bg-amber-50/60">
              <div className="text-[11px] font-semibold text-amber-900">
                Safety &amp; Difficult Situations
              </div>
              <p className="text-[10px] text-amber-900">
                These questions can feel uncomfortable. We ask them because they
                affect your safety, healing, and legal protections. Answer only
                what you feel safe sharing here.
              </p>
              <label className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  className="h-3 w-3"
                  checked={abuseRisk}
                  onChange={(e) => setAbuseRisk(e.target.checked)}
                />
                <span className="text-[11px]">
                  I have concerns about feeling safe with someone in my life
                  (including possible abuse, control, or coercion).
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3 w-3"
                  checked={suicideRisk}
                  onChange={(e) => setSuicideRisk(e.target.checked)}
                />
                <span className="text-[11px]">
                  I have had thoughts of harming myself or suicide in the past
                  or recently.
                </span>
              </label>
              <p className="text-[10px] text-amber-900 mt-1">
                If you are in immediate danger, or thinking of hurting yourself
                or someone else, please contact emergency services or your local
                crisis line right away.
              </p>
            </div>

            {/* Goals */}
            <div className="space-y-1">
              <label className="font-semibold">
                What would you most like help with right now?
              </label>
              <Textarea
                rows={2}
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="For example: pain control, getting to appointments, support at work, help with anxiety, housing, etc."
                className="text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[10px] text-muted-foreground max-w-xs">
              When you submit, your nurse case manager and care team will see
              this as part of your case timeline. Some answers may be reviewed
              by a supervisor when safety is a concern.
            </p>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || (!hasAnyP && !abuseRisk && !suicideRisk)}
            >
              {submitting ? "Submitting…" : "Submit Check-In"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
