/* ----------------------------------------------------
   FILE: src/components/CaseIntel.tsx
   (All UI widgets for attorney portal case cards/pages)
   ---------------------------------------------------- */
import React, { useMemo, useState } from "react";
import { RCMS } from "../lib/rcms-colors";
import { CaseLite, computeSettlementReadinessScore, getNextActions, computeAlerts } from "../lib/readiness";
import { getRNCallTriggers } from "../lib/triggers";
import { Templates } from "../lib/templates";
import { sendNudge } from "../lib/supabaseOperations";

/** ENV not needed anymore - using Supabase edge functions */

/* ---------- Visual helpers ---------- */
const Badge = ({ text, tone }:{text:string; tone:"ok"|"warn"|"bad"}) => {
  const bg = tone==="ok"?"#198754":tone==="warn"?"#f59e0b":"#dc2626";
  return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{backgroundColor:bg}}>{text}</span>;
};

/* ---------- Next Action banner ---------- */
export function NextActionBanner({ kase }:{kase:CaseLite}) {
  const actions = useMemo(()=>getNextActions(kase), [kase]);
  const primary = actions[0];
  if (!primary) return null;
  return (
    <div className="rounded-xl border border-gray-200 p-3" style={{background:"#fff7ed"}}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-gray-800">
          <span className="mr-2">{primary.icon}</span>
          NEXT ACTION: {primary.text}
        </div>
        <FixNextButton kase={kase} action={primary.action} />
      </div>
    </div>
  );
}

/* ---------- Fix Next button (action router) ---------- */
export function FixNextButton({ kase, action }:{kase:CaseLite; action:ReturnType<typeof getNextActions>[number]["action"];}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);

  // Action handlers
  const onClick = async () => {
    setBusy(true);
    setMsg(null);
    try {
      switch(action) {
        case "ROUTE_PROVIDER":
          setMsg("TODO: Open Provider Router modal");
          break;
        case "REQUEST_SPECIALIST":
          setMsg("TODO: Implement specialist request");
          // TODO: Create edge function for provider updates
          break;
        case "NARRATIVE_CAPTURE":
          setMsg("TODO: Open Incident Narrative form");
          break;
        case "ENABLE_DIARY":
          await sendNudge({ caseId: kase.id });
          setMsg("Nudge sent to enable diary");
          break;
        case "CONSENT_FIX":
          setMsg("TODO: Navigate to Consent Manager");
          break;
        case "SDOH_PROTOCOL":
          setMsg("TODO: Open SDOH Resource Kit");
          break;
        case "GENERATE_MEDIATION_PDF":
          setMsg("TODO: Implement mediation summary generation");
          // TODO: Create edge function for PDF generation
          break;
        case "SEND_SMS":
          setMsg("TODO: Implement SMS sending");
          // TODO: Create edge function for SMS
          break;
        case "REQUEST_PROVIDER_UPDATE":
          setMsg("TODO: Implement provider update request");
          // TODO: Create edge function for provider updates
          break;
        case "REQUEST_CLINICAL_RECO":
          setMsg("TODO: Implement clinical recommendation");
          // TODO: Create edge function for clinical recommendations
          break;
      }
    } catch(e: any) {
      setMsg(e.message || "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold text-white"
      style={{backgroundColor: RCMS.orange}}
    >
      {busy ? "Working…" : "Fix next"}
    </button>
  );
}

/* ---------- Alerts / Milestones ---------- */
export function MilestoneAlerts({ kase }:{kase:CaseLite}) {
  const alerts = computeAlerts(kase);
  if (!alerts.length) return null;
  return (
    <div className="space-y-2">
      {alerts.map((a,i)=>(
        <div key={i} className="rounded-lg border p-2 text-sm"
             style={{borderColor:a.level==="crit"?"#dc2626":a.level==="warn"?"#f59e0b":"#93c5fd", background:"#fff"}}>
          <strong className="mr-2">{a.level==="crit"?"🚨":a.level==="warn"?"⚠️":"ℹ️"}</strong>{a.text}
        </div>
      ))}
    </div>
  );
}

/* ---------- Settlement Readiness (badge + meter) ---------- */
export function SettlementReadiness({ kase }:{kase:CaseLite}) {
  const { score, buckets, blockers } = useMemo(()=>computeSettlementReadinessScore(kase), [kase]);
  const bar = score>=80?"#198754":score>=50?"#f59e0b":"#dc2626";
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{backgroundColor:bar}}>SR {score}</span>
        <span className="text-xs text-gray-600">0–49 Low • 50–79 Moderate • 80–100 High</span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full" style={{backgroundColor:RCMS.rail}}>
        <div className="h-2 rounded-full" style={{width:`${score}%`, backgroundColor:bar}}/>
      </div>
      <details className="mt-2">
        <summary className="text-xs text-gray-700 cursor-pointer">Breakdown & blockers</summary>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <Mini label="Medical" value={buckets.medical} color="#198754" />
          <Mini label="Documentation" value={buckets.documentation} color={RCMS.teal} />
          <Mini label="Routing/Flow" value={buckets.routing} color={RCMS.orange} />
          <Mini label="SDOH" value={buckets.sdoh} color={RCMS.eggplant} />
        </div>
        {blockers.length>0 && (
          <ul className="mt-2 list-disc pl-5 text-xs text-gray-700">
            {blockers.slice(0,6).map((b,i)=><li key={i}>{b}</li>)}
          </ul>
        )}
      </details>
    </div>
  );
}
function Mini({label,value,color}:{label:string;value:number;color:string}) {
  const pct = Math.min(100, Math.round((value/35)*100));
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-600">{value}</span>
      </div>
      <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
        <div className="h-1.5 rounded-full" style={{width:`${pct}%`, backgroundColor:color}} />
      </div>
    </div>
  );
}

/* ---------- Case Summary at a Glance ---------- */
export function CaseSummaryGlance({ kase }:{kase:CaseLite}) {
  const { score } = computeSettlementReadinessScore(kase);
  const health = score>=80?"ok":score>=50?"warn":"bad";
  return (
    <div className="grid gap-3 rounded-xl border border-gray-200 p-3 sm:grid-cols-4">
      <div><div className="text-xs text-gray-500">Health</div><Badge text={health==="ok"?"Green":"Yellow"} tone={health==="ok"?"ok":"warn"} /></div>
      <div><div className="text-xs text-gray-500">Days to 1st MD</div><div className="text-sm font-semibold">2</div></div>
      <div><div className="text-xs text-gray-500">Top SDOH</div><div className="text-sm font-semibold">{kase.sdoh ? (Object.entries(kase.sdoh).some(([k,v])=>v) ? "🚨 Active" : "Stable") : "Stable"}</div></div>
      <div><div className="text-xs text-gray-500">Next Milestone</div><div className="text-sm font-semibold">Pain Mgmt consult (5d)</div></div>
    </div>
  );
}

/* ---------- Documentation Tracker ---------- */
export function DocumentationTracker({ kase }:{kase:CaseLite}) {
  const d = kase.documentation || {};
  const Item = ({label, ok}:{label:string; ok?:boolean}) => (
    <div className="flex items-center gap-2 text-sm">
      <input type="checkbox" readOnly checked={!!ok} className="rounded border-gray-300" />
      <span className={ok?"text-gray-700":"text-gray-500"}>{label}</span>
    </div>
  );
  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <div className="mb-2 text-sm font-semibold text-gray-800">Documentation Tracker</div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Item label="Initial MD report" ok={d.mdInitialReport}/>
        <Item label="Specialist report (Neuro/etc.)" ok={d.specialistNeurology}/>
        <Item label="Pain diary ≥ 4 weeks" ok={d.diary4wks}/>
        <Item label="SDOH flags addressed" ok={d.sdohAddressed}/>
      </div>
    </div>
  );
}

/* ---------- Cost-of-Care Calculator (light modal) ---------- */
export function CostOfCareCalculator() {
  const [open,setOpen] = useState(false);
  const [injury,setInjury] = useState("Lumbar Strain");
  const [range,setRange] = useState<[number,number]>([8500,12000]); // mock
  return (
    <>
      <button className="rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{backgroundColor:RCMS.teal}} onClick={()=>setOpen(true)}>Cost of Care</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold" style={{color:RCMS.navy}}>Cost of Care</h3>
              <button onClick={()=>setOpen(false)} className="text-2xl leading-none">×</button>
            </div>
            <label className="mt-3 block text-sm font-medium text-gray-700">Injury</label>
            <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" value={injury} onChange={(e)=>setInjury(e.target.value)}>
              <option>Lumbar Strain</option>
              <option>Cervical Sprain</option>
              <option>Radiculopathy (lumbar)</option>
            </select>
            <div className="mt-4 text-sm">Expected range (region-adjusted): <strong>${range[0].toLocaleString()} – ${range[1].toLocaleString()}</strong></div>
            <div className="mt-1 text-xs text-gray-500">// TODO: replace with ODG + regional UCC/Medicare fee data.</div>
            <div className="mt-5 text-right">
              <button onClick={()=>setOpen(false)} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- One-Click Mediation Summary (PDF stub) ---------- */
export function MediationSummaryButton({ kase }:{kase:CaseLite}) {
  const [busy,setBusy] = useState(false);
  const [msg,setMsg] = useState<string|null>(null);
  async function gen() {
    setBusy(true); setMsg(null);
    try {
      // TODO: Create edge function for PDF generation
      setMsg("TODO: Implement mediation summary PDF generation");
      // When implemented:
      // await supabase.functions.invoke("generate-mediation-pdf", { body: { caseId: kase.id } })
    } catch(e:any){ 
      setMsg(e.message || "Error"); 
    } finally { 
      setBusy(false); 
    }
  }
  return (
    <div>
      <button onClick={gen} disabled={busy} className="rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{backgroundColor:RCMS.orange}}>
        {busy ? "Generating…" : "Mediation Summary (PDF)"}
      </button>
      {msg && <div className="mt-1 text-xs text-gray-600">{msg}</div>}
    </div>
  );
}

/* ---------- SMS Quick Actions ---------- */
export function SMSQuickActions({ clientName="Client", kase }:{clientName?:string; kase:CaseLite}) {
  const [busy,setBusy] = useState(false);
  const [msg,setMsg] = useState<string|null>(null);
  async function send(kind:"appt"|"diary") {
    setBusy(true); setMsg(null);
    try {
      // TODO: Create edge function for SMS sending
      setMsg("TODO: Implement SMS sending");
      // When implemented:
      // await supabase.functions.invoke("send-sms", { 
      //   body: { caseId: kase.id, template: kind === "appt" ? "apptReminder" : "diaryNudge" }
      // })
    } catch(e:any){ 
      setMsg(e.message||"Error"); 
    } finally { 
      setBusy(false); 
    }
  }
  return (
    <div className="flex items-center gap-2">
      <button onClick={()=>send("appt")} disabled={busy} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold">Text Appt Reminder</button>
      <button onClick={()=>send("diary")} disabled={busy} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold">Text Diary Nudge</button>
      {msg && <span className="text-xs text-gray-600">{msg}</span>}
    </div>
  );
}

/* ---------- Provider Requests (Update / Clinical Recommendation) ---------- */
export function ProviderComms({ kase }:{kase:CaseLite}) {
  const [open,setOpen] = useState<null|"update"|"reco">(null);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={()=>setOpen("update")} className="rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{backgroundColor:RCMS.teal}}>Provider Update</button>
      <button onClick={()=>setOpen("reco")} className="rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{backgroundColor:RCMS.navy}}>Clinical Recommendation</button>

      {open && <ProviderModal kind={open} onClose={()=>setOpen(null)} kase={kase} />}
    </div>
  );
}

function ProviderModal({ kind, onClose, kase }:{kind:"update"|"reco"; onClose:()=>void; kase:CaseLite}) {
  const [busy,setBusy] = useState(false);
  const [msg,setMsg] = useState<string|null>(null);
  const title = kind==="update"?"Request Provider Update":"Generate Clinical Recommendation";
  async function submit() {
    setBusy(true); setMsg(null);
    try {
      // TODO: Create edge function for provider communications
      setMsg("TODO: Implement provider update/recommendation");
      // When implemented:
      // await supabase.functions.invoke("provider-comms", {
      //   body: { caseId: kase.id, action: kind === "update" ? "providerUpdate" : "clinicalRecommendation" }
      // })
    } catch(e:any){ 
      setMsg(e.message||"Error"); 
    } finally { 
      setBusy(false); 
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-xl rounded-xl bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{color:RCMS.navy}}>{title}</h3>
          <button onClick={onClose} className="text-2xl leading-none">×</button>
        </div>
        <p className="mt-2 text-sm text-gray-700">
          {kind==="update" ? "Send a professional status update request to the treating provider." :
          "Generate a formal, guideline-cited recommendation from RN CM to provider."}
        </p>
        <div className="mt-4 text-xs text-gray-500">// TODO: preview/edit message body before sending.</div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold">Cancel</button>
          <button onClick={submit} disabled={busy} className="rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{backgroundColor:RCMS.orange}}>
            {busy?"Sending…":"Send"}
          </button>
        </div>
        {msg && <div className="mt-2 text-xs text-gray-600">{msg}</div>}
      </div>
    </div>
  );
}

/* ---------- Adverse Determination Log + Receipt Vault ---------- */
export function AdverseDeterminationLog() {
  const [items,setItems] = useState<{ date:string; what:string; insurer:string; reason:string; linked?:string; }[]>([]);
  const [form,setForm] = useState({ date:"", what:"", insurer:"", reason:"" });
  function add() {
    if (!form.date || !form.what) return;
    setItems(prev=>[{...form}, ...prev]);
    setForm({ date:"", what:"", insurer:"", reason:"" });
  }
  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <div className="mb-2 text-sm font-semibold text-gray-800">Adverse Determination Log</div>
      <div className="grid gap-2 sm:grid-cols-4">
        <input className="rounded-lg border border-gray-300 px-2 py-1 text-sm" placeholder="Date (yyyy-mm-dd)" value={form.date} onChange={e=>setForm(f=>({...f, date:e.target.value}))}/>
        <input className="rounded-lg border border-gray-300 px-2 py-1 text-sm" placeholder="Treatment/Medication" value={form.what} onChange={e=>setForm(f=>({...f, what:e.target.value}))}/>
        <input className="rounded-lg border border-gray-300 px-2 py-1 text-sm" placeholder="Insurer/Adjuster" value={form.insurer} onChange={e=>setForm(f=>({...f, insurer:e.target.value}))}/>
        <input className="rounded-lg border border-gray-300 px-2 py-1 text-sm" placeholder="Reason" value={form.reason} onChange={e=>setForm(f=>({...f, reason:e.target.value}))}/>
      </div>
      <div className="mt-2">
        <button onClick={add} className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-semibold">Add</button>
      </div>
      <div className="mt-3 divide-y">
        {items.map((it,idx)=>(
          <div key={idx} className="py-2 text-sm">
            <div className="font-medium">{it.date} — {it.what}</div>
            <div className="text-gray-600">{it.insurer} • {it.reason}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReceiptVault() {
  const [files,setFiles] = useState<File[]>([]);
  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <div className="mb-2 text-sm font-semibold text-gray-800">Receipt Vault</div>
      <input type="file" onChange={e=>{ if(e.target.files) setFiles(Array.from(e.target.files)); }} multiple />
      <div className="mt-2 text-xs text-gray-500">// TODO: upload securely; link to denial log entry.</div>
      <ul className="mt-2 list-disc pl-5 text-sm">
        {files.map((f,i)=><li key={i}>{f.name}</li>)}
      </ul>
    </div>
  );
}

export function VerifiedServiceReceipt() {
  return (
    <a href="/forms/rcms-verified-service.pdf" className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold">
      📄 Download Service Verification Form (Food/Housing/Transport)
    </a>
  );
}
