/* ================= RCMS C.A.R.E. — Pre-Settlement Case Analysis + Readiness ================
 * Contents:
 *   1) <PreSettlementDossier /> — Button + modal for consult / commission
 *   2) <DossierReadiness /> — Small readiness meter (Green/Yellow/Red)
 *
 * Brand:
 *   Blue  : #0f2a6a
 *   Teal  : #128f8b
 *   Orange CTA (Attorney): Tailwind orange-500 / orange-600
 *
 * Safety:
 *   - PHI: No full names; uses client_label + case id
 *   - Consent-aware: disables CTA if client disallows attorney sharing
 *   - Audit: logs modal open + actions
 *
 * Integration points expected in your app:
 *   - useAuth() from @/auth/AuthContext
 *   - audit(), notifyDossierCommissioned() from @/lib/rcmsApi
 *
 * Usage:
 *   import { PreSettlementDossier, DossierReadiness } from "@/components/PreSettlementDossier";
 *   ...
 *   <div className="flex items-center justify-between">
 *     <div className="flex items-center gap-2">
 *       <h4 className="font-semibold text-[#0f2a6a]">Case {c.id}</h4>
 *       <DossierReadiness caseObj={c} />
 *     </div>
 *     <PreSettlementDossier caseObj={c} />
 *   </div>
 * =========================================================================================== */

import React, { useMemo, useState } from "react";
import { useAuth } from "@/auth/supabaseAuth";
import { audit, notifyDossierCommissioned } from "@/lib/supabaseOperations";

/* ------------------------------- Types (loose) -------------------------------- */
type CaseLike = {
  id?: string;
  case_id?: string;
  client_label?: string; // tokenized initials, e.g., "J.D."
  tags?: string[];
  status?: string; // e.g., "pre-mediation", "settlement-negotiations"
  mediationDate?: string; // ISO string or yyyy-mm-dd
  consent?: { signed?: boolean; scope?: { shareWithAttorney?: boolean } };
  /** Attorney-6: Phase-2+ feature — only shown when RN care plan released (active case phase) */
  carePlanReleased?: boolean;
  care_plan_released?: boolean;
  // Optional readiness inputs (if present)
  missing?: {
    intake?: boolean;
    providerNotes?: boolean;
    labsOrImaging?: boolean;
    rnSummary?: boolean;
  };
  completenessScorePct?: number; // 0..100 if you compute one upstream
};

type ReadinessInputs = {
  missing?: CaseLike["missing"];
  score?: number | undefined;
  status?: string | undefined;
};

/* ------------------------------- Utilities ----------------------------------- */
function parseAsDateSafe(v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function consentAllowsAttorney(c: CaseLike) {
  const signed = !!c?.consent?.signed;
  const share = c?.consent?.scope?.shareWithAttorney !== false; // default allow unless explicitly false
  return signed && share;
}

function inNegotiationWindow(c: CaseLike) {
  const tags = (c.tags || []).map((t) => String(t || "").toLowerCase());
  const relevantTags = new Set(["mediation", "pre-mediation", "settlement-negotiations", "pre-trial"]);
  const hasTag = tags.some((t) => relevantTags.has(t));

  const relevantStatuses = new Set(["pre-mediation", "settlement-negotiations", "pre-trial"]);
  const hasStatus = c.status ? relevantStatuses.has(String(c.status).toLowerCase()) : false;

  const mediation = parseAsDateSafe(c.mediationDate);
  const now = new Date();
  const fortyFiveDaysMs = 45 * 24 * 60 * 60 * 1000;
  const isMediationSoon = mediation ? mediation.getTime() - now.getTime() <= fortyFiveDaysMs : false;

  return hasTag || hasStatus || isMediationSoon;
}

function caseRef(c: CaseLike) {
  const id = c.id || c.case_id || "—";
  const who = c.client_label ? `Client ${c.client_label}` : "Client";
  return `${who} • Case ${id}`;
}

/* ---------------------------- Readiness Heuristics --------------------------- */
/** Decide G/Y/R from either a numeric score or missing flags + status. */
function evaluateReadiness({ score, missing, status }: ReadinessInputs): {
  band: "green" | "yellow" | "red";
  label: string;
  tooltip: string;
} {
  // If score provided, use that.
  if (typeof score === "number") {
    if (score >= 80) return { band: "green", label: "Ready", tooltip: "Core docs complete; strong for dossier." };
    if (score >= 50) return { band: "yellow", label: "Needs Docs", tooltip: "Some items missing; dossier possible but weaker." };
    return { band: "red", label: "Not Ready", tooltip: "Critical items missing; complete records before dossier." };
  }

  // Otherwise derive from missing flags and status.
  const m = missing || {};
  const criticalMissing = !!(m.intake || m.rnSummary);
  const someMissing = !!(m.providerNotes || m.labsOrImaging);

  if (criticalMissing) return { band: "red", label: "Not Ready", tooltip: "Intake/RN summary missing." };
  if (someMissing) return { band: "yellow", label: "Needs Docs", tooltip: "Provider notes or imaging outstanding." };

  // Nudge toward yellow if status is early
  const earlyStatuses = new Set(["new", "in_progress", "awaiting_consent"]);
  if (status && earlyStatuses.has(String(status).toLowerCase())) {
    return { band: "yellow", label: "Early", tooltip: "Case still early; gather more documentation." };
  }

  return { band: "green", label: "Ready", tooltip: "Docs appear complete." };
}

/* ----------------------------- Dossier Readiness ----------------------------- */
export function DossierReadiness({ caseObj }: { caseObj: CaseLike }) {
  const inputs: ReadinessInputs = {
    score: typeof caseObj?.completenessScorePct === "number" ? caseObj.completenessScorePct : undefined,
    missing: caseObj?.missing,
    status: caseObj?.status,
  };
  const info = evaluateReadiness(inputs);

  const color =
    info.band === "green" ? "bg-emerald-500" : info.band === "yellow" ? "bg-amber-500" : "bg-rose-500";

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
      title={info.tooltip}
    >
      <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
      <span className="text-[#0f2a6a] bg-white/80 rounded px-1">{info.label}</span>
    </span>
  );
}

/* --------------------------- Pre-Settlement Dossier -------------------------- */
/** Phase-2+ feature: Pre-Settlement Case Analysis — only shown when care_plan_released === true (active case phase). */
export function PreSettlementDossier({ caseObj }: { caseObj: CaseLike }) {
  const { user, roles } = useAuth();
  const [open, setOpen] = useState(false);

  const isAttorney = roles.includes("ATTORNEY");
  const isActiveCase = !!(caseObj?.carePlanReleased ?? caseObj?.care_plan_released);
  // Attorney-6: Gate behind phase — hide when care_plan_released === false (intake phase)
  const showCTA = useMemo(
    () => isAttorney && isActiveCase && inNegotiationWindow(caseObj),
    [isAttorney, isActiveCase, caseObj]
  );
  const disabledByConsent = !consentAllowsAttorney(caseObj);

  // Attorney-6: Hide entirely when in intake phase (care plan not released)
  if (!isActiveCase) {
    return null;
  }

  async function onOpen() {
    setOpen(true);
    await audit({
      actorRole: roles[0] || "ATTORNEY",
      actorId: user?.id || "unknown",
      action: "DOSSIER_MODAL_OPEN",
      caseId: caseObj?.id || caseObj?.case_id || "",
    });
  }

  return (
    <div className="flex items-center gap-2">
      {showCTA ? (
        <button
          type="button"
          onClick={onOpen}
          disabled={disabledByConsent}
          title={
            disabledByConsent
              ? "Client consent not on file — sharing with attorney is disabled."
              : "Open pre-settlement analysis options"
          }
          className={`px-4 py-2 rounded-lg font-semibold shadow-sm transition
            ${disabledByConsent
              ? "bg-orange-300 text-white cursor-not-allowed"
              : "bg-orange-500 hover:bg-orange-600 text-white"
            }`}
        >
          Pre-Settlement Case Analysis
        </button>
      ) : (
        <button
          type="button"
          className="px-4 py-2 rounded-lg font-semibold bg-gray-100 text-gray-400 cursor-not-allowed"
          disabled
          title="This case isn't in a negotiation window yet."
        >
          Pre-Settlement Case Analysis
        </button>
      )}

      {open && (
        <DossierModal
          caseObj={caseObj}
          onClose={() => setOpen(false)}
          onAudit={(meta) =>
            audit({
              actorRole: roles[0] || "ATTORNEY",
              actorId: user?.id || "unknown",
              action: "DOSSIER_ACTION",
              caseId: caseObj?.id || caseObj?.case_id || "",
              meta,
            })
          }
        />
      )}
    </div>
  );
}

/* ------------------------------------ Modal ---------------------------------- */
function DossierModal({
  caseObj,
  onClose,
  onAudit,
}: {
  caseObj: CaseLike;
  onClose: () => void;
  onAudit: (meta: Record<string, any>) => Promise<any>;
}) {
  const { user } = useAuth();
  const [choice, setChoice] = useState<"consult" | "commission" | "">("");

  function openNew(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!choice) return;

    const caseId = caseObj?.id || caseObj?.case_id || "";
    const meta = { choice, caseId };

    if (choice === "consult") {
      await onAudit({ ...meta, route: "schedule-consultation" });
      openNew("/schedule-consultation");
    } else {
      await onAudit({ ...meta, route: "checkout" });
      
      // Trigger RN Supervisor task via webhook
      await notifyDossierCommissioned({
        caseId,
        attorneyId: user?.id,
        attorneyEmail: user?.email,
        clientLabel: caseObj?.client_label,
      });
      
      openNew(`/checkout?case_id=${encodeURIComponent(caseId)}`);
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-2xl leading-none text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          ×
        </button>

        {/* Heading */}
        <h2 className="text-2xl font-extrabold text-[#0f2a6a]">Pre-Settlement Case Strength Dossier</h2>
        <p className="mt-1 text-sm text-gray-600">{caseRef(caseObj)}</p>

        {/* Value proposition */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-800">
            Anchor your settlement position in <strong>guideline-backed clinical authority</strong>.
            This forensic-level analysis distills the medical narrative into a cohesive, defensible valuation foundation.
          </p>
        </div>

        {/* Features */}
        <div className="mt-5">
          <h3 className="text-lg font-semibold text-[#0f2a6a]">What's included</h3>
          <ul className="mt-2 space-y-2 text-sm text-gray-800">
            <li className="border-b border-gray-100 pb-2">📊 <strong>Anchor Document:</strong> a formal report synthesizing the clinical story</li>
            <li className="border-b border-gray-100 pb-2">🛡️ <strong>Vulnerability Audit & Rebuttals:</strong> ODG/MCG-referenced counter-arguments</li>
            <li className="border-b border-gray-100 pb-2">💰 <strong>Future Damages Quantification:</strong> projected future care costs with guidelines</li>
            <li>🎯 <strong>90-minute Strategy Session:</strong> collaborative "war room" with lead RN</li>
          </ul>
        </div>

        {/* Pricing */}
        <div className="mt-5 rounded-xl bg-gradient-to-r from-[#0f2a6a] to-[#128f8b] p-5 text-center text-white">
          <h3 className="text-xl font-bold">Investment: $9,500</h3>
          <p className="mt-1 text-sm opacity-90">For cases where top-tier valuation evidence is critical.</p>
        </div>

        {/* Explainer placeholder */}
        <div className="mt-5">
          <h4 className="text-sm font-semibold text-[#0f2a6a]">Explainer</h4>
          <div className="mt-2 rounded-lg border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
            📺 Your explainer video embed goes here
          </div>
        </div>

        {/* PDF download */}
        <div className="mt-4">
          <a
            href="/assets/dossier-explainer.pdf"
            download
            className="block w-full rounded-lg bg-[#128f8b] px-4 py-3 text-center font-semibold text-white hover:bg-[#0f2a6a]"
          >
            Download Detailed PDF Overview
          </a>
        </div>

        {/* Action form */}
        <form onSubmit={onSubmit} className="mt-5">
          <label className="text-sm font-semibold text-gray-700">I'm ready to:</label>
          <div className="mt-2 space-y-2">
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border-2 border-gray-100 p-3 hover:border-[#128f8b]">
              <input
                type="radio"
                className="mt-1"
                name="ps-choice"
                value="consult"
                checked={choice === "consult"}
                onChange={() => setChoice("consult")}
              />
              <span className="text-sm text-gray-800">Schedule a confidential consultation (15 minutes)</span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border-2 border-gray-100 p-3 hover:border-[#128f8b]">
              <input
                type="radio"
                className="mt-1"
                name="ps-choice"
                value="commission"
                checked={choice === "commission"}
                onChange={() => setChoice("commission")}
              />
              <span className="text-sm text-gray-800">Commission the dossier now</span>
            </label>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={!choice}
              className={`flex-1 rounded-lg px-4 py-3 font-semibold text-white transition ${
                choice ? "bg-[#0f2a6a] hover:bg-[#128f8b]" : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Continue
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Maybe later
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
