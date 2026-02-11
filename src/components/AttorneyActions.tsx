/** =================== RCMS C.A.R.E. — Attorney Actions (Invite + Export) ===================
 * Drop-in components to close the two gaps:
 *  1) AttorneyInvitePanel — creates copyable magic links (#token=...) and logs AUDIT: INVITE_CREATED
 *  2) ExportButton — consent-aware, role-gated CSV export with AUDIT: EXPORT_ATTEMPT (allowed/blocked)
 *
 * Requirements:
 *  - rcmsApi.ts already added with: audit(), withUserNotice()
 *  - Pass session object from useAuth hook
 *  - exportAllowed(role) and canAccess(role, feature, ctx) exist in your access.ts (or similar)
 *  - case objects passed to ExportButton should already be redacted per consent rules upstream
 * ========================================================================================= */

import React, { useMemo, useState } from "react";
import { audit } from "../lib/supabaseOperations";
import { exportAllowed } from "../lib/access";

/* --------------------------------- Utilities --------------------------------- */

/** Simple, opaque token generator for demo (replace server-side later). */
function makeInviteToken() {
  const rnd = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(rnd, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Build a hash-based magic link (keeps tokens out of server logs). */
function buildMagicLink(role: string, caseId?: string) {
  const base = window.location.origin + "/access";
  const token = makeInviteToken();
  const params = new URLSearchParams();
  params.set("token", token);
  params.set("role", role);
  if (caseId) params.set("case", caseId);
  return { url: `${base}#${params.toString()}`, token };
}

/** Very small CSV builder (values must already be redacted upstream per consent). */
function toCSV(rows: any[]) {
  if (!rows?.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(esc).join(",")];
  for (const r of rows) lines.push(headers.map((h) => esc(r[h])).join(","));
  return lines.join("\n");
}

/* ------------------------------ 1) Invite Panel -------------------------------- */

interface AttorneyInvitePanelProps {
  defaultCaseId?: string;
  session: { role: string; userId: string };
}

export function AttorneyInvitePanel({ defaultCaseId = "", session }: AttorneyInvitePanelProps) {
  const [role, setRole] = useState("CLIENT");
  const [caseId, setCaseId] = useState(defaultCaseId);
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  const canCreate = useMemo(() => {
    if (!session || session.role !== "ATTORNEY") return false;
    if (!["CLIENT", "PROVIDER"].includes(role)) return false;
    return true;
  }, [session, role]);

  async function handleCreate() {
    if (!canCreate) return;
    const { url, token } = buildMagicLink(role, caseId || undefined);
    setLink(url);
    setCopied(false);
    // Log invite creation (no email/SMS yet)
    await audit({
      actorRole: session.role,
      actorId: session.userId,
      action: "INVITE_CREATED",
      caseId: caseId || "",
      meta: { inviteRole: role, tokenSuffix: token.slice(-6) }
    });
  }

  async function handleCopy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-bold text-primary">Invite User</h3>
      <p className="text-sm text-muted-foreground mb-3">
        Generates a copyable sign-in link with a hash token (no PHI in query strings). Email/SMS delivery can be added later.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm mb-1 text-foreground">Invite Role</label>
          <select
            className="w-full border border-input rounded-md p-2 bg-background text-foreground"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="CLIENT">Client</option>
            <option value="PROVIDER">Provider</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1 text-foreground">Case ID (optional)</label>
          <input
            className="w-full border border-input rounded-md p-2 bg-background text-foreground"
            placeholder="RC-XXXX-XXXX (tokenized)"
            value={caseId}
            onChange={(e) => setCaseId(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">Recommended when inviting a specific client or provider.</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={handleCreate}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            canCreate ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
          disabled={!canCreate}
        >
          Create Link
        </button>

        <button
          onClick={handleCopy}
          className={`px-4 py-2 rounded-lg border font-semibold transition-colors ${
            link ? "border-primary text-primary hover:bg-accent" : "border-border text-muted-foreground cursor-not-allowed"
          }`}
          disabled={!link}
        >
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>

      {!!link && (
        <div className="mt-3 text-xs break-all text-muted-foreground bg-muted p-2 rounded">
          {link}
        </div>
      )}
    </section>
  );
}

/* ------------------------------ 2) Export Button -------------------------------- */

interface ExportButtonProps {
  role: string;
  caseId: string;
  consentAllows: boolean;
  rows: any[];
  filename?: string;
  userId?: string;
  caseData?: any;
}

export function ExportButton({ 
  role, 
  caseId, 
  consentAllows, 
  rows, 
  filename = "rcms_export.csv",
  userId = "",
  caseData
}: ExportButtonProps) {
  const roleAllowed = caseData ? exportAllowed(role as any, caseData) : consentAllows;
  const enabled = roleAllowed && consentAllows && rows?.length > 0;

  async function onClick() {
    // Always audit attempt, even if blocked
    await audit({
      actorRole: role,
      actorId: userId,
      action: "EXPORT_ATTEMPT",
      caseId,
      meta: { allowed: !!enabled, rows: rows?.length || 0, type: "CSV" }
    });

    if (!enabled) return;

    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const title = !roleAllowed
    ? "Export disabled for your role"
    : !consentAllows
    ? "Export disabled by client preference"
    : !rows?.length
    ? "No data to export"
    : "Download CSV";

  return (
    <button
      title={title}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
        enabled 
          ? "bg-primary text-primary-foreground hover:bg-primary/90" 
          : "bg-muted text-muted-foreground cursor-not-allowed"
      }`}
      disabled={!enabled}
    >
      Export CSV
    </button>
  );
}
