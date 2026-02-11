import React, { useMemo, useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";

/* =================== CONFIG (edit in one place) =================== */
type Role = "CLIENT"|"ATTORNEY"|"RN_CM"|"RCMS_CLINICAL_MGMT"|"CLINICAL_STAFF_EXTERNAL"|"STAFF"|"SUPER_USER"|"SUPER_ADMIN";
const SEND_ALLOWED: Role[] = ["RN_CM", "RCMS_CLINICAL_MGMT", "SUPER_USER", "SUPER_ADMIN"]; // only these can create portal shares
const COLORS = { ok:"#16a34a", warn:"#f59e0b", stop:"#dc2626", ink:"#0f2a6a", teal:"#128f8b" };

/** In real life you’d issue tokens on the server and store them server-side.
 * For demo purposes we store in sessionStorage with an expiry timestamp.
 */
const STORAGE_KEY = "RCMS_PORTAL_SHARES_DEMO";

/* =================== Minimal types you can pass in =================== */
type Consent = { scope: { shareWithProviders: boolean } };
type CaseLite = {
  id: string;                       // e.g., "RCMS-01234"
  isSensitive?: boolean;            // apply redaction by default
  clientLabel?: string;             // initials or masked label, not full name
  summary?: string;                 // non-PHI summary for provider
};
type Provider = {
  id: string;
  name: string;
  city?: string; state?: string;
};

/* =================== Tiny “token store” for demo =================== */
type ShareRecord = {
  token: string;
  caseId: string;
  providerId: string;
  redacted: boolean;
  createdAt: number;         // ms
  expiresAt: number;         // ms
  // demo payload (NON-PHI): we keep this very light
  payload: {
    caseId: string;
    clientLabel?: string;
    summary?: string;
  };
};
function loadShares(): ShareRecord[] {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveShares(list: ShareRecord[]) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
function pruneExpired() {
  const now = Date.now();
  const keep = loadShares().filter(s => s.expiresAt > now);
  saveShares(keep);
}
function randToken(len=32) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = ""; for (let i=0;i<len;i++) s += chars[Math.floor(Math.random()*chars.length)];
  return s;
}

/* =================== Portal Share Panel (RN-side) =================== */
export function PortalSharePanel({
  currentRole,
  consent,
  caseInfo,
  provider
}:{
  currentRole: Role;
  consent: Consent;
  caseInfo: CaseLite;
  provider: Provider;
}) {
  const [ttl, setTtl] = useState<number>(48);         // link lifetime (hours)
  const [redact, setRedact] = useState<boolean>(!!caseInfo.isSensitive);
  const [status,setStatus] = useState<"idle"|"creating"|"done"|"error">("idle");
  const [msg,setMsg] = useState<string>("");
  const [link,setLink] = useState<string>("");

  const blockedReason = useMemo(()=>{
    if (!SEND_ALLOWED.includes(currentRole)) return "Only RN_CM / RCMS_CLINICAL_MGMT / SUPER_USER / SUPER_ADMIN can create portal shares.";
    if (!consent?.scope?.shareWithProviders) return "Client has not consented to share with providers.";
    return "";
  }, [currentRole, consent]);

  async function createShare() {
    if (blockedReason) return;
    try {
      setStatus("creating"); setMsg(""); setLink("");
      pruneExpired();
      const token = randToken(40);
      const now = Date.now();
      const rec: ShareRecord = {
        token,
        caseId: caseInfo.id,
        providerId: provider.id,
        redacted: redact,
        createdAt: now,
        expiresAt: now + ttl * 3600 * 1000,
        payload: {
          caseId: caseInfo.id,
          clientLabel: caseInfo.clientLabel, // masked only
          summary: caseInfo.summary || "Care summary will appear here (non-PHI demo)."
        }
      };
      const all = loadShares();
      all.push(rec); saveShares(all);

      // IMPORTANT: URL contains only the token, never PHI.
      const url = `/provider/preview?token=${encodeURIComponent(token)}`;
      setLink(url);
      setStatus("done");
      setMsg(`Portal link created — expires in ${ttl} hours.`);
      // TODO: log audit to backend when available
      console.log("AUDIT: PROVIDER_SHARE_PORTAL", { caseId: caseInfo.id, providerId: provider.id, ttlHours: ttl, redacted: redact });
    } catch (e:any) {
      setStatus("error");
      setMsg(e?.message || "Unable to create share link");
    }
  }

  const badge = blockedReason ? {text:"Blocked", color:COLORS.stop}
    : caseInfo.isSensitive ? {text:"Sensitive — Redaction Required", color:COLORS.warn}
    : {text:"Ready", color:COLORS.ok};

  return (
    <section className="rounded-2xl border border-border p-4 bg-card/50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-foreground font-bold">Secure Portal Share</h3>
        <span className="text-xs rounded-full px-2 py-0.5 font-semibold" style={{background:badge.color, color:"#fff"}}>
          {badge.text}
        </span>
      </div>

      <dl className="grid grid-cols-1 md:grid-cols-3 gap-3 text-foreground/90 text-sm mb-3">
        <div><dt className="text-muted-foreground">Case</dt><dd className="font-semibold">{caseInfo.id}</dd></div>
        <div><dt className="text-muted-foreground">Provider</dt><dd className="font-semibold">{provider.name}{provider.city?`, ${provider.city}`:""}{provider.state?`, ${provider.state}`:""}</dd></div>
        <div><dt className="text-muted-foreground">Consent</dt><dd className="font-semibold">{consent.scope.shareWithProviders ? "Share Allowed" : "Not Allowed"}</dd></div>
      </dl>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="block text-sm font-semibold text-foreground">
          Link Expiration (hours)
          <input
            type="number" min={4} max={168}
            className="mt-1 w-full rounded-md border px-3 py-2 bg-white"
            value={ttl}
            onChange={(e)=> setTtl(Math.max(4, Math.min(168, Number(e.target.value) || 24)))}
            disabled={!!blockedReason || status==="creating"}
          />
        </label>

        <div className="block text-sm font-semibold text-foreground">
          Redaction
          <div className="mt-2 flex items-center gap-2">
            <input
              id="redact"
              type="checkbox"
              className="h-4 w-4"
              checked={redact}
              onChange={(e)=> setRedact(e.target.checked)}
              disabled={!!blockedReason || status==="creating" || !caseInfo.isSensitive}
            />
            <label htmlFor="redact" className="text-sm text-foreground">
              Apply redaction for sensitive cases (default)
            </label>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Sensitive cases require limited fields and watermarked output.</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={createShare}
          disabled={!!blockedReason || status==="creating"}
          className={blockedReason
            ? "bg-muted cursor-not-allowed rounded-md px-4 py-2 text-muted-foreground font-semibold"
            : "bg-secondary hover:brightness-110 rounded-md px-4 py-2 text-secondary-foreground font-semibold"}
          title={blockedReason || "Create portal link"}
        >
          {status==="creating" ? "Creating…" : "Create Portal Link"}
        </button>

        {status==="done" && link && (
          <span className="text-foreground/90 text-sm">
            Link ready →{" "}
            <Link className="underline text-foreground" to={link}>Preview Provider View</Link>
          </span>
        )}
        {status==="error" && <span className="text-warning text-sm">{msg}</span>}
      </div>

      {!blockedReason && msg && status!=="error" && (
        <p className="mt-2 text-xs text-muted-foreground">{msg}</p>
      )}

      <hr className="my-3 border-border" />
      <p className="text-xs text-muted-foreground">
        <strong>Policy:</strong> No PHI in emails, texts, or URLs. The provider receives a notification to log in and view items inside the portal.
        This demo issues token links client-side; production must issue and validate tokens on the server with audit logging.
      </p>
    </section>
  );
}

/* =================== Provider-side “share view” (demo) =================== */
/** This page simulates what a provider sees after following the token link.
 *  In production you’d validate the token server-side and render redacted data.
 */
export function ProviderShareView() {
  const query = useQuery();
  const token = query.get("token") || "";
  const [record, setRecord] = useState<ShareRecord | null>(null);
  const [state, setState] = useState<"loading"|"ok"|"expired"|"invalid">("loading");

  useEffect(() => {
    pruneExpired();
    const all = loadShares();
    const rec = all.find(r => r.token === token) || null;
    if (!token || !rec) { setState("invalid"); return; }
    if (Date.now() > rec.expiresAt) { setState("expired"); return; }
    setRecord(rec); setState("ok");
  }, [token]);

  if (state === "loading") return <div className="p-6 text-foreground">Loading…</div>;
  if (state === "invalid") return (
    <section className="p-6">
      <div className="rounded-xl border border-border bg-card/50 p-5 text-foreground">
        <h3 className="font-bold text-lg text-destructive">Invalid Link</h3>
        <p className="text-sm text-foreground/80 mt-1">This secure link is not valid. Please contact the sender.</p>
      </div>
    </section>
  );
  if (state === "expired") return (
    <section className="p-6">
      <div className="rounded-xl border border-border bg-card/50 p-5 text-foreground">
        <h3 className="font-bold text-lg text-warning">Link Expired</h3>
        <p className="text-sm text-foreground/80 mt-1">This secure link has expired. Request a new link from the sender.</p>
      </div>
    </section>
  );

  // ok
  const minutesLeft = record ? Math.max(0, Math.round((record.expiresAt - Date.now())/60000)) : 0;
  return (
    <section className="p-6">
      <div className="rounded-2xl border border-border bg-card/50 p-5 text-foreground space-y-3">
        <header className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Reconcile C.A.R.E. — Secure Share</h3>
          <span className="text-xs rounded-full px-2 py-0.5 font-semibold" style={{background:COLORS.teal, color:"#fff"}}>
            Expires in ~{minutesLeft} min
          </span>
        </header>
        <dl className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div><dt className="text-muted-foreground">Case</dt><dd className="font-semibold">{record?.payload.caseId}</dd></div>
          <div><dt className="text-muted-foreground">Client</dt><dd className="font-semibold">{record?.payload.clientLabel || "—"}</dd></div>
          <div><dt className="text-muted-foreground">Scope</dt><dd className="font-semibold">{record?.redacted ? "Redacted (Sensitive)" : "Standard"}</dd></div>
        </dl>

        {/* Redacted content example — keep minimal in demo */}
        <div className="rounded-lg border border-border p-3 bg-card">
          <h4 className="font-semibold">Shared Summary</h4>
          <p className="text-foreground/90 text-sm mt-1">{record?.payload.summary}</p>
          {record?.redacted && (
            <p className="text-xs text-muted-foreground mt-2">
              Sensitive case: extended identifiers and detailed clinical data are withheld by policy.
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          This is a demonstration view. Production links are verified on the server and fully audited.
        </p>
      </div>
    </section>
  );
}

/* =================== ONE-PAGE DEMO (optional) =================== */
/** You can render this on a temporary route to try the flow end-to-end. */
export default function PortalShareDemoPage() {
  const currentRole: Role = "RN_CM";
  const consent: Consent = { scope: { shareWithProviders: true } };
  const caseInfo: CaseLite = {
    id: "RCMS-01234",
    isSensitive: true,
    clientLabel: "A.B.",
    summary: "Injury related to MVA. Conservative care in progress. PT scheduled; monitoring pain and function."
  };
  const provider: Provider = { id: "prov-001", name: "Green Valley PT", city: "Austin", state: "TX" };

  return (
    <section className="space-y-6 p-6">
      <h2 className="text-foreground text-2xl font-extrabold">Secure Portal Share — Demo</h2>
      <PortalSharePanel currentRole={currentRole} consent={consent} caseInfo={caseInfo} provider={provider} />
    </section>
  );
}

/* =================== Small helper =================== */
function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}
