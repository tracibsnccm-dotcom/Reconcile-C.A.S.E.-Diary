// src/lib/pdfSummary.ts
import { AppState, Flag, Task } from "./models";
import { buildCaseSummaryForExport } from "./exportHelpers";

function esc(s: string | number | boolean | null | undefined) {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function fmtDate(d?: string) {
  if (!d) return "";
  return d;
}

function renderFlags(list: Flag[]) {
  if (!list?.length) return "<div class='muted'>None</div>";
  return `
    <table class="t">
      <thead><tr>
        <th>ID</th><th>Type</th><th>Label</th><th>Severity</th><th>Status</th><th>Created</th><th>Resolved</th>
      </tr></thead>
      <tbody>
        ${list
          .map(
            (f) => `<tr>
              <td>${esc(f.id)}</td>
              <td>${esc(f.type || "")}</td>
              <td>${esc(f.label || "")}</td>
              <td>${esc(f.severity || "")}</td>
              <td>${esc(f.status || "")}</td>
              <td>${esc(f.createdAt || "")}</td>
              <td>${esc((f as any).resolvedAt || "")}</td>
            </tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderTasks(list: Task[]) {
  if (!list?.length) return "<div class='muted'>None</div>";
  return `
    <table class="t">
      <thead><tr>
        <th>ID</th><th>Type</th><th>Title</th><th>Due</th><th>Status</th><th>Created</th><th>Assignee</th>
      </tr></thead>
      <tbody>
        ${list
          .map(
            (t) => `<tr>
              <td>${esc(t.task_id)}</td>
              <td>${esc(t.type)}</td>
              <td>${esc(t.title)}</td>
              <td>${esc(t.due_date || "")}</td>
              <td>${esc(t.status)}</td>
              <td>${esc(t.created_at || "")}</td>
              <td>${esc(t.assigned_to || "")}</td>
            </tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderInjuries(state: AppState) {
  const injuries = (state as any).injuries || [];
  if (!injuries.length) return "<div class='muted'>None recorded</div>";
  return `
    <table class="t">
      <thead><tr>
        <th>Primary?</th><th>Form</th><th>Label</th><th>ICD-10</th><th>Side</th><th>Notes</th>
      </tr></thead>
      <tbody>
        ${injuries
          .map((inj: any) => {
            const codes = Array.isArray(inj.icd10) ? inj.icd10.join(", ") : esc(inj.icd10 || "");
            return `<tr>
              <td>${inj.primary ? "Yes" : ""}</td>
              <td>${esc(inj.form || "")}</td>
              <td>${esc(inj.label || "")}</td>
              <td>${esc(codes)}</td>
              <td>${esc(inj.side || "")}</td>
              <td>${esc(inj.notes || "")}</td>
            </tr>`;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

/**
 * Opens a print window for a branded Case Summary PDF (Print / Save as PDF).
 * Ensure your logo exists at /public/rcms-logo.png (or change the path below).
 */
export function openCaseSummaryPrintWindow(state: AppState) {
  const snapshot = buildCaseSummaryForExport(state);
  const today = new Date().toISOString().slice(0, 10);

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>RCMS Case Summary — ${esc(state.client?.name || "Client")}</title>
    <style>
      @page { size: Letter; margin: 0.6in; }
      body { font-family: ui-sans-serif, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"; color: #0f172a; }
      .header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
      .header img { height: 40px; }
      .title { font-size: 18px; font-weight: 700; }
      .sub { font-size: 11px; color: #475569; }
      .hr { height: 1px; background: #e2e8f0; margin: 12px 0 16px; }
      .meta { font-size: 12px; color: #334155; margin: 4px 0 16px; }
      h2 { font-size: 14px; margin: 16px 0 8px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .t { width: 100%; border-collapse: collapse; font-size: 11px; }
      .t th, .t td { border: 1px solid #e2e8f0; padding: 6px 8px; vertical-align: top; }
      .muted { color: #64748b; font-size: 11px; }
      .badge { display: inline-block; padding: 2px 6px; border-radius: 8px; font-size: 10px; background: #eef2ff; color: #3730a3; }
      .footer { margin-top: 20px; font-size: 10px; color: #64748b; }
      @media print { .no-print { display: none; } }
    </style>
  </head>
  <body>
    <div class="header">
      <img src="/rcms-logo.png" alt="RCMS Logo" />
      <div>
        <div class="title">Reconcile C.A.R.E. — Case Summary</div>
        <div class="sub">Integrating Clinical Precision with Compassionate Advocacy</div>
      </div>
    </div>
    <div class="hr"></div>

    <div class="meta">
      <div><strong>Generated:</strong> ${esc(today)}</div>
      <div><strong>Client:</strong> ${esc(snapshot.client.name || "")}
        &nbsp; <strong>ID:</strong> ${esc(snapshot.client.id || "")}
      </div>
      <div><strong>Viability:</strong> ${esc(snapshot.client.viabilityScore ?? "")}
        ${snapshot.client.viabilityStatus ? `<span class="badge">${esc(snapshot.client.viabilityStatus)}</span>` : ""}
      </div>
      <div><strong>Next Follow-Up Due:</strong> ${esc(fmtDate(snapshot.client.nextFollowupDue))}</div>
    </div>

    <h2>Injuries & ICD-10</h2>
    ${renderInjuries(state)}

    <div class="grid">
      <div>
        <h2>Open Flags</h2>
        ${renderFlags(snapshot.flags.open as any)}
      </div>
      <div>
        <h2>Closed Flags</h2>
        ${renderFlags(snapshot.flags.closed as any)}
      </div>
    </div>

    <div class="grid">
      <div>
        <h2>Follow-Up Tasks</h2>
        ${renderTasks(snapshot.tasks.followUps as any)}
      </div>
      <div>
        <h2>All Tasks</h2>
        ${renderTasks(snapshot.tasks.all as any)}
      </div>
    </div>

    <h2>Voice / View</h2>
    <div class="meta">
      <div><strong>Voice:</strong> ${esc((snapshot.client.voiceView as any)?.voice || "")}</div>
      <div><strong>View:</strong> ${esc((snapshot.client.voiceView as any)?.view || "")}</div>
    </div>

    <h2>4Ps & SDOH (Snapshot)</h2>
    <div class="meta">
      <div><strong>4Ps:</strong> ${esc(JSON.stringify(snapshot.client.fourPs || {}, null, 0))}</div>
      <div><strong>SDOH:</strong> ${esc(JSON.stringify(snapshot.client.sdoh || {}, null, 0))}</div>
    </div>

    <div class="footer">
      Reconcile C.A.R.E.™ — Confidential. For authorized attorney/provider/audit use.
    </div>

    <div class="no-print" style="margin-top:16px;">
      <button onclick="window.print()">Print / Save as PDF</button>
    </div>
    <script>window.onload = () => setTimeout(() => window.print(), 250);</script>
  </body>
</html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}
