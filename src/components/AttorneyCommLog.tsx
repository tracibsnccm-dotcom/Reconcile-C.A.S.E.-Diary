// src/components/AttorneyCommLog.tsx

import * as React from "react";
import { useCaseEvents } from "../lib/caseEventsContext";
import type {
  CaseTimelineEvent,
  TenVsSnapshot,
} from "../domain/caseTimeline";

interface AttorneyCommLogProps {
  caseId: string;
  isCaseLegalLocked: boolean;
  tenVsSnapshot: TenVsSnapshot;
}

type ActorKey = "CLIENT" | "RN" | "PROVIDER" | "ATTORNEY" | "SYSTEM";

const actorOrder: ActorKey[] = ["CLIENT", "RN", "PROVIDER", "ATTORNEY", "SYSTEM"];

const actorLabel: Record<ActorKey, string> = {
  CLIENT: "Client",
  RN: "RN CM",
  PROVIDER: "Provider",
  ATTORNEY: "Attorney",
  SYSTEM: "System",
};

const chipClass =
  "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border";

const AttorneyCommLog: React.FC<AttorneyCommLogProps> = ({
  caseId,
  isCaseLegalLocked,
  tenVsSnapshot,
}) => {
  const { events } = useCaseEvents();

  const caseEvents: CaseTimelineEvent[] = React.useMemo(
    () => events.filter((e) => e.caseId === caseId),
    [events, caseId]
  );

  const lastEvent = React.useMemo(() => {
    if (caseEvents.length === 0) return undefined;
    return [...caseEvents].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }, [caseEvents]);

  const countsByActor = React.useMemo(() => {
    const base = {
      CLIENT: 0,
      RN: 0,
      PROVIDER: 0,
      ATTORNEY: 0,
      SYSTEM: 0,
    } as Record<ActorKey, number>;

    for (const evt of caseEvents) {
      const role = evt.actorRole as ActorKey;
      if (base[role] !== undefined) {
        base[role] += 1;
      }
    }
    return base;
  }, [caseEvents]);

  // For each P, see which actors have ever documented it.
  const pSupport = React.useMemo(() => {
    const initFlag = { CLIENT: false, RN: false, PROVIDER: false, ATTORNEY: false, SYSTEM: false } as Record<
      ActorKey,
      boolean
    >;

    const result = {
      p1: { ...initFlag },
      p2: { ...initFlag },
      p3: { ...initFlag },
      p4: { ...initFlag },
    };

    for (const evt of caseEvents) {
      const role = evt.actorRole as ActorKey;
      if (!evt.fourPsProfile) continue;

      if (evt.fourPsProfile.p1Physical) {
        if (result.p1[role] !== undefined) result.p1[role] = true;
      }
      if (evt.fourPsProfile.p2Psychological) {
        if (result.p2[role] !== undefined) result.p2[role] = true;
      }
      if (evt.fourPsProfile.p3Psychosocial) {
        if (result.p3[role] !== undefined) result.p3[role] = true;
      }
      if (evt.fourPsProfile.p4Professional) {
        if (result.p4[role] !== undefined) result.p4[role] = true;
      }
    }

    return result;
  }, [caseEvents]);

  const safetySignals = React.useMemo(() => {
    const safetyEvents = caseEvents.filter(
      (e) => e.abuseRisk || e.suicideRisk
    );
    const anyAbuse = safetyEvents.some((e) => e.abuseRisk);
    const anySuicide = safetyEvents.some((e) => e.suicideRisk);

    return {
      count: safetyEvents.length,
      anyAbuse,
      anySuicide,
    };
  }, [caseEvents]);

  const formatShortDateTime = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const riskScore =
    tenVsSnapshot.v1PainSignal +
    tenVsSnapshot.v2FunctionalLoss +
    tenVsSnapshot.v4VigilanceRisk +
    tenVsSnapshot.v6VelocityOfChange +
    (3 - tenVsSnapshot.v3VitalityReserve) +
    (3 - tenVsSnapshot.v10ViabilityTrajectory);

  let ragLabel: "Green" | "Amber" | "Red" = "Green";
  let ragClass =
    "bg-emerald-50 text-emerald-800 border-emerald-200";
  let ragText = "Clinically stable / negotiation-ready.";

  if (riskScore >= 9) {
    ragLabel = "Red";
    ragClass = "bg-red-50 text-red-800 border-red-200";
    ragText =
      "High-risk clinical picture. Anchor negotiations around instability, safety, and future risk.";
  } else if (riskScore >= 5) {
    ragLabel = "Amber";
    ragClass = "bg-amber-50 text-amber-800 border-amber-200";
    ragText =
      "Mixed picture. Negotiation possible, but attach conditions, guardrails, and ongoing monitoring.";
  }

  return (
    <div className="border rounded-xl bg-white p-4 space-y-4 text-[11px]">
      {/* Top attorney banner */}
      <section className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">
              Attorney Negotiation Snapshot
            </div>
            <p className="text-[10px] text-slate-500 max-w-md">
              This panel translates the 4Ps, RN notes, and provider activity
              into a simple posture for negotiation — and shows which parts of
              the story are backed by client, RN, and provider documentation.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
            <span
              className={[
                chipClass,
                ragClass,
              ].join(" ")}
            >
              RAG: {ragLabel}
            </span>
            {isCaseLegalLocked && (
              <span
                className={[
                  chipClass,
                  "bg-amber-50 text-amber-800 border-amber-300",
                ].join(" ")}
              >
                ⚖️ Legal lock-down active
              </span>
            )}
            {lastEvent && (
              <span className={chipClass + " border-slate-200 text-slate-600"}>
                Last event: {formatShortDateTime(lastEvent.createdAt)}
              </span>
            )}
          </div>
        </div>
        <p className="text-[10px] text-slate-600">
          {ragText}
        </p>
      </section>

      {/* Evidence mix by actor */}
      <section className="border rounded-lg p-3 bg-slate-50/70 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">
            Evidence Mix – Who Is Backing the Story?
          </div>
          <div className="flex flex-wrap gap-1 text-[10px] text-slate-600">
            {actorOrder.map((key) => {
              const count = countsByActor[key];
              if (!count) return null;
              return (
                <span
                  key={key}
                  className="inline-flex items-center px-2 py-0.5 rounded-full bg-white border border-slate-200"
                >
                  {actorLabel[key]}:{" "}
                  <span className="font-semibold ml-1">{count}</span>
                </span>
              );
            })}
            {caseEvents.length === 0 && (
              <span className="text-[10px] text-slate-500">
                No timeline events yet for this case.
              </span>
            )}
          </div>
        </div>

        {/* 4Ps rows */}
        <div className="grid grid-cols-1 gap-2">
          {/* P1 */}
          <div className="border rounded-md bg-white px-2 py-1.5">
            <div className="flex items-center justify-between mb-1">
              <div className="font-semibold text-[11px]">
                P1 – Physical (Pain / Function)
              </div>
              <div className="text-[10px] text-slate-500">
                Anchors V1, V2, V5
              </div>
            </div>
            <div className="flex flex-wrap gap-1 text-[10px]">
              {actorOrder.map((key) => {
                if (!pSupport.p1[key]) return null;
                return (
                  <span
                    key={key}
                    className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800"
                  >
                    {actorLabel[key]} documented P1
                  </span>
                );
              })}
              {!Object.values(pSupport.p1).some(Boolean) && (
                <span className="text-[10px] text-slate-500">
                  No explicit 4Ps events tagged as P1 yet. Pain/function may
                  still be implied in clinical notes.
                </span>
              )}
            </div>
          </div>

          {/* P2 */}
          <div className="border rounded-md bg-white px-2 py-1.5">
            <div className="flex items-center justify-between mb-1">
              <div className="font-semibold text-[11px]">
                P2 – Psychological (Mood / Stress / Coping)
              </div>
              <div className="text-[10px] text-slate-500">
                Anchors V3, V4, V6, V8, V10
              </div>
            </div>
            <div className="flex flex-wrap gap-1 text-[10px]">
              {actorOrder.map((key) => {
                if (!pSupport.p2[key]) return null;
                return (
                  <span
                    key={key}
                    className="inline-flex items-center px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-800"
                  >
                    {actorLabel[key]} documented P2
                  </span>
                );
              })}
              {!Object.values(pSupport.p2).some(Boolean) && (
                <span className="text-[10px] text-slate-500">
                  No explicit P2 documentation yet. Emotional impact may still
                  appear in narrative notes.
                </span>
              )}
            </div>
          </div>

          {/* P3 */}
          <div className="border rounded-md bg-white px-2 py-1.5">
            <div className="flex items-center justify-between mb-1">
              <div className="font-semibold text-[11px]">
                P3 – Psychosocial (Home / Support / Environment)
              </div>
              <div className="text-[10px] text-slate-500">
                Anchors V4, V8, V10 (SDOH window)
              </div>
            </div>
            <div className="flex flex-wrap gap-1 text-[10px]">
              {actorOrder.map((key) => {
                if (!pSupport.p3[key]) return null;
                return (
                  <span
                    key={key}
                    className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900"
                  >
                    {actorLabel[key]} documented P3
                  </span>
                );
              })}
              {!Object.values(pSupport.p3).some(Boolean) && (
                <span className="text-[10px] text-slate-500">
                  No explicit P3 documentation yet. Home and environment may
                  still be present in case narrative.
                </span>
              )}
            </div>
          </div>

          {/* P4 */}
          <div className="border rounded-md bg-white px-2 py-1.5">
            <div className="flex items-center justify-between mb-1">
              <div className="font-semibold text-[11px]">
                P4 – Professional (Work / Role / Income)
              </div>
              <div className="text-[10px] text-slate-500">
                Anchors V2, V7, V8, V9, V10
              </div>
            </div>
            <div className="flex flex-wrap gap-1 text-[10px]">
              {actorOrder.map((key) => {
                if (!pSupport.p4[key]) return null;
                return (
                  <span
                    key={key}
                    className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800"
                  >
                    {actorLabel[key]} documented P4
                  </span>
                );
              })}
              {!Object.values(pSupport.p4).some(Boolean) && (
                <span className="text-[10px] text-slate-500">
                  No explicit P4 documentation yet. Work/role may still appear
                  in other notes or forms.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Safety strip */}
        <div className="mt-2 border-t pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">
              Safety &amp; High-Risk Signals
            </div>
            <div className="flex flex-wrap gap-1 text-[10px]">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                Safety events:{" "}
                <span className="font-semibold ml-1">
                  {safetySignals.count}
                </span>
              </span>
              {safetySignals.anyAbuse && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900">
                  ⚠️ Abuse / unsafe environment disclosed
                </span>
              )}
              {safetySignals.anySuicide && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 border border-red-300 text-red-800">
                  ⚠️ Self-harm / suicide risk documented
                </span>
              )}
            </div>
          </div>
          <p className="text-[10px] text-slate-600 mt-1">
            Use these signals to explain why the trajectory (V10) and vigilance
            (V4) remain elevated even when some other Vs improve. Safety and
            life context keep the case fragile.
          </p>
        </div>
      </section>

      {/* Communications log placeholder */}
      <section className="border rounded-lg p-3">
        <div className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide mb-1">
          Communications &amp; Touchpoints (Mock)
        </div>
        <p className="text-[10px] text-slate-600">
          In this mock, we are not yet pulling real emails or call logs. In
          production, this section will summarize attorney–client–provider
          communications tied to the case, with filters for privileged vs
          standard notes and follow-up flags.
        </p>
      </section>
    </div>
  );
};

export { AttorneyCommLog };

