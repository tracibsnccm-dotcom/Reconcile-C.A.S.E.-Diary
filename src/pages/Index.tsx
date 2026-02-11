import { NavLink } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Activity, Shield, Users } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-primary">
      <div className="container mx-auto px-4 pb-16">
        <style>
          {`
            #rcms-getstarted .rcms-card {
              border:2px solid rgba(255,255,255,0.2);
              border-radius:1rem;
              background:rgba(255,255,255,0.05);
              backdrop-filter:blur(4px);
            }

            #rcms-getstarted h3 .rcms-gs-prefix { color:#0f2a6a !important; }

            /* Base button style */
            #rcms-getstarted a.rcms-btn {
              display:inline-flex;
              align-items:center;
              justify-content:center;
              color:#fff;
              border-radius:0.75rem;
              font-weight:700;
              text-decoration:none;
              transition:transform .15s ease, filter .2s ease;
              white-space:nowrap;
              line-height:1.15;
            }
            #rcms-getstarted a.rcms-btn:hover {
              transform:translateY(-1px);
              filter:brightness(1.08);
            }

            /* Large Client Intake CTA */
            #rcms-getstarted a.cta-intake {
              background:#00695c;
              font-size:1.6rem;
              padding:1.25rem 3.25rem;
              min-width:18rem;
              font-weight:800;
            }
            #rcms-getstarted a.cta-intake:hover { background:#00897b; }

            /* Secondary buttons (slimmer but equal width) */
            #rcms-getstarted a.btn-secondary {
              font-size:1.05rem;
              padding:0.65rem 2rem;
              min-width:12rem;
              font-weight:700;
            }

            /* Returning CTA: full-width on mobile, prominent on desktop */
            #rcms-getstarted a.btn-returning {
              background: rgba(255,255,255,0.2);
              font-size: 1.05rem;
              font-weight: 700;
              min-height: 2.75rem;
              height: 2.75rem;
              padding: 0 1.25rem;
              width: 100%;
            }
            @media (min-width: 640px) {
              #rcms-getstarted a.btn-returning {
                width: auto;
                min-width: 14rem;
              }
            }

            /* Keep row horizontal on mobile */
            #rcms-getstarted .rcms-row {
              display:flex;
              flex-direction:row;
              flex-wrap:nowrap;
              justify-content:center;
              gap:0.75rem;
            }
            @media (max-width:480px){
              #rcms-getstarted .rcms-row a.rcms-btn {
                font-size:0.9rem;
                padding:0.5rem 1rem;
                min-width:auto;
                flex:1 1 auto;
              }
            }

            /* Colors */
            #rcms-getstarted a.btn-client-portal { background:#0f2a6a; }
            #rcms-getstarted a.btn-client-portal:hover { background:#1a3f8b; }

            #rcms-getstarted a.btn-attorney-portal { background:#ff8c42; }
            #rcms-getstarted a.btn-attorney-portal:hover { background:#ff9f5c; }

            #rcms-getstarted a.btn-provider-portal { background:#4b2e83; }
            #rcms-getstarted a.btn-provider-portal:hover { background:#5a36a5; }

            /* Client Portal in lifecycle section: smaller, navy, quieter */
            #rcms-getstarted a.btn-client-portal-section {
              background:#0f2a6a;
              font-size:0.95rem;
              padding:0.5rem 1.5rem;
              min-width:10rem;
              font-weight:600;
            }
            #rcms-getstarted a.btn-client-portal-section:hover { background:#1a3f8b; }

            /* Professional Access: outline/muted, smaller, does not compete with Client Intake */
            #rcms-getstarted a.btn-professional {
              font-size:0.875rem;
              padding:0.45rem 1.25rem;
              font-weight:600;
              background:rgba(255,255,255,0.06);
              border:1px solid rgba(255,255,255,0.35);
              color:rgba(255,255,255,0.9);
            }
            #rcms-getstarted a.btn-professional:hover {
              background:rgba(255,255,255,0.12);
              border-color:rgba(255,255,255,0.5);
              color:#fff;
            }
            #rcms-getstarted a.btn-professional-attorney:hover { border-color:rgba(255,140,66,0.6); }
            #rcms-getstarted a.btn-professional-provider:hover { border-color:rgba(75,46,131,0.6); }

            /* Footer base rcms buttons */
            #rcms-footer a.rcms-btn {
              display:inline-block !important;
              color:#ffffff !important;
              border-radius:0.75rem !important;
              box-shadow:0 6px 18px rgba(0,0,0,0.25) !important;
              text-decoration:none !important;
              transition:transform .15s ease, filter .2s ease !important;
            }
            #rcms-footer a.rcms-btn:hover { transform: translateY(-1px) !important; filter: brightness(1.06) !important; }

            /* Intake in footer */
            #rcms-footer a.cta-intake {
              background:#00695c !important;
              padding:0.75rem 1.25rem !important;
              font-size:1rem !important;
              font-weight:600 !important;
            }
            #rcms-footer a.cta-intake:hover { background:#00897b !important; }

            /* Client Portal = Navy */
            #rcms-footer a.btn-client-portal {
              background:#0f2a6a !important;
              padding:0.75rem 1.25rem !important;
              font-size:1rem !important;
              font-weight:600 !important;
            }
            #rcms-footer a.btn-client-portal:hover { background:#1a3f8b !important; }

            /* Attorney Portal = Orange */
            #rcms-footer a.btn-attorney-portal {
              background:#ff8c42 !important;
              padding:0.75rem 1.25rem !important;
              font-size:1rem !important;
              font-weight:600 !important;
            }
            #rcms-footer a.btn-attorney-portal:hover { background:#ff9f5c !important; }

            /* Provider Portal = Eggplant */
            #rcms-footer a.btn-provider-portal {
              background:#4b2e83 !important;
              padding:0.75rem 1.25rem !important;
              font-size:1rem !important;
              font-weight:600 !important;
            }
            #rcms-footer a.btn-provider-portal:hover { background:#5a36a5 !important; }
          `}
        </style>

        {/* ===================== HERO + GET STARTED ===================== */}
        <section id="rcms-getstarted" className="text-center py-16 px-6 bg-gradient-to-b from-[#0f2a6a] via-[#128f8b] to-[#0f2a6a]">
          {/* Hero */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
            Reconcile <span className="text-[#ff8c42]">C.A.R.E.</span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-white leading-snug mb-6">
            Comprehensive Nursing Care Management<br />
            <span className="text-lg font-normal">for</span><br />
            Legal and Clinical Coordination
          </h2>

          {/* Divider */}
          <div className="border-t border-white/30 w-2/3 mx-auto my-8"></div>

          {/* Get Started (with border & forced colors) */}
          <div className="rcms-card p-8 md:p-10 max-w-4xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              <span className="rcms-gs-prefix">Get&nbsp;Started&nbsp;with</span>{' '}
              <span className="text-white">Reconcile</span>{' '}
              <span className="text-[#ff8c42]">C.A.R.E.</span>
            </h3>

            {/* Client Intake path (PRIMARY): single panel with Start Intake + intake-scoped Returning */}
            <div className="flex flex-col items-center mb-14">
              <p className="text-white text-lg md:text-xl font-medium text-center mb-4">
                New here or haven't completed Client Intake yet? Click below to begin.
              </p>
              {/* Client Intake panel: one unit for Start Intake + Returning */}
              <div className="mt-8 md:mt-10">
                <div className="rounded-xl bg-white/10 border border-white/20 p-6 md:p-7 space-y-6 md:space-y-7 w-full max-w-lg">
                <h3 className="text-lg md:text-xl font-semibold text-white tracking-tight">
                  Client Intake
                </h3>
                <a href="/client-consent" className="rcms-btn cta-intake">Start Intake</a>
                <div className="space-y-4">
                  <p className="text-base md:text-lg font-semibold text-white">Returning to Client Intake?</p>
                  <p className="text-sm text-white/90">Resume an in-progress intake or check a submitted intake status.</p>
                  <div className="w-full sm:w-auto">
                    <a href="/resume-intake" className="rcms-btn btn-returning">Resume / Check Status</a>
                  </div>
                </div>
                </div>
              </div>
            </div>

            {/* Client Portal (SECONDARY, client-scoped) */}
            <div className="flex flex-col items-center mb-8">
              <h3 className="text-lg md:text-xl font-semibold text-white tracking-tight">
                Client Portal
              </h3>
              <p className="text-sm text-white/80 mb-3">Access your completed intake and case status.</p>
              <a href="/client-login" className="rcms-btn btn-client-portal-section">Client Portal</a>
            </div>

            {/* Professional Access (TERTIARY) */}
            <div className="flex flex-col items-center pt-2">
              <h3 className="text-lg md:text-xl font-semibold text-white tracking-tight">
                Professional Access
              </h3>
              <p className="text-sm text-white/60 mb-3">For attorneys and healthcare providers.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <a href="/attorney-login" className="rcms-btn btn-secondary btn-attorney-portal">Attorney Portal</a>
                <a href="/provider-portal" className="rcms-btn btn-secondary btn-provider-portal">Provider Portal</a>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────── Cards Section Heading (context above cards) ─────────────── */}
        <section id="platform-highlights" className="text-center mb-6 mt-16">
          <h3 className="text-2xl md:text-3xl font-bold text-primary-foreground">
            Platform Highlights
          </h3>
          <p className="text-primary-foreground/90 text-base md:text-lg mt-1">
            Designed for privacy, clinical insight, and dependable provider coordination.
          </p>
        </section>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="p-6 bg-white/95 backdrop-blur border-0 shadow-card">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Secure & Compliant</h3>
            <p className="text-muted-foreground">
              Built with privacy-first design and role-based access controls
            </p>
          </Card>

          <Card className="p-6 bg-white/95 backdrop-blur border-0 shadow-card">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <Activity className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">The 4Ps of Wellness Care Management Tool</h3>
            <p className="text-muted-foreground">
              Tracks Physical, Psychological, Psychosocial and Professional dynamics that impacts overall health and wellness.
            </p>
          </Card>

          <Card className="p-6 bg-white/95 backdrop-blur border-0 shadow-card">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-success" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Provider Network</h3>
            <p className="text-muted-foreground">
              Connect clients with verified healthcare providers seamlessly
            </p>
          </Card>
        </div>

        <p className="text-primary-foreground/60 text-sm text-center mt-8">Demo Mode • No Authentication Required</p>
      </div>

      {/* ===================== RCMS Reserved Modules + RN Dash Placeholders + Footer ===================== */}

      {/* ===== Reserved Future Modules Section (placeholders only) ===== */}
      <section id="rcms-reserved" className="py-16 px-6 bg-gradient-to-b from-[#0f2a6a] via-[#128f8b] to-[#0f2a6a] text-white">
        <div className="max-w-7xl mx-auto">
          {/* Section heading */}
          <header className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Coming Soon to Reconcile <span className="text-[#ff8c42]">C.A.R.E.</span></h2>
            <p className="mt-3 text-white/90 max-w-2xl mx-auto">
              We're reserving space for key enhancements. These modules will activate once server endpoints and content are connected.
            </p>
          </header>

          {/* Grid of reserved modules */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1) Intake Explainer Video */}
            <div className="rounded-xl border border-white/20 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-2">🎥 Intake Explainer Video</h3>
              <p className="text-white/90 mb-4">
                A short walkthrough for clients covering how to complete intake quickly and easily. 
                Explains why certain questions matter and what happens once you submit your form.
              </p>
              <div className="aspect-video rounded-lg border border-white/20 bg-black/30 flex items-center justify-center">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition"
                  aria-label="Play Intake Explainer Video"
                >
                  <span className="inline-block w-0 h-0 border-t-[10px] border-b-[10px] border-l-[16px] border-t-transparent border-b-transparent border-l-white" />
                  <span className="text-white/90 font-semibold">Watch Intake Explainer</span>
                </button>
              </div>
              <p className="mt-3 text-sm text-white/70">Reserved space • Upload/Embed when ready (no PHI in titles or captions).</p>
            </div>

            {/* 2) Client Portal Explainer Video */}
            <div className="rounded-xl border border-white/20 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-2">🎥 Client Portal Explainer Video</h3>
              <p className="text-white/90 mb-4">
                Shows how to use your Client Portal to track progress, update pain or mood scores, 
                message your RN Case Manager, and stay informed about case updates.
              </p>
              <div className="aspect-video rounded-lg border border-white/20 bg-black/30 flex items-center justify-center">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition"
                  aria-label="Play Portal Explainer Video"
                >
                  <span className="inline-block w-0 h-0 border-t-[10px] border-b-[10px] border-l-[16px] border-t-transparent border-b-transparent border-l-white" />
                  <span className="text-white/90 font-semibold">Watch Portal Explainer</span>
                </button>
              </div>
              <p className="mt-3 text-sm text-white/70">Reserved space • Upload/Embed when ready (no PHI in titles or captions).</p>
            </div>

            {/* 3) Attorney Portal Explainer Video */}
            <div className="rounded-xl border border-white/20 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-2">🎥 Attorney Portal Explainer Video</h3>
              <p className="text-white/90 mb-4">
                This video walks you through managing cases, viewing consents, and routing providers securely.
              </p>
              <div className="aspect-video rounded-lg border border-white/20 bg-black/30 flex items-center justify-center">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition"
                  aria-label="Play Attorney Portal Explainer Video"
                >
                  <span className="inline-block w-0 h-0 border-t-[10px] border-b-[10px] border-l-[16px] border-t-transparent border-b-transparent border-l-white" />
                  <span className="text-white/90 font-semibold">Watch Attorney Portal Overview</span>
                </button>
              </div>
              <p className="mt-3 text-sm text-white/70">Reserved space • Upload/Embed when ready (no PHI in titles or captions).</p>
            </div>

            {/* 4) Provider Portal Explainer Video */}
            <div className="rounded-xl border border-white/20 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-2">🎥 Provider Portal Explainer Video</h3>
              <p className="text-white/90 mb-4">
                Learn how to record visits, update care plans, and stay compliant with Reconcile C.A.R.E.
              </p>
              <div className="aspect-video rounded-lg border border-white/20 bg-black/30 flex items-center justify-center">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition"
                  aria-label="Play Provider Portal Explainer Video"
                >
                  <span className="inline-block w-0 h-0 border-t-[10px] border-b-[10px] border-l-[16px] border-t-transparent border-b-transparent border-l-white" />
                  <span className="text-white/90 font-semibold">Watch Provider Portal Overview</span>
                </button>
              </div>
              <p className="mt-3 text-sm text-white/70">Reserved space • Upload/Embed when ready (no PHI in titles or captions).</p>
            </div>

            {/* 5) Savings / ROI Calculator Placeholder */}
            <div className="rounded-xl border border-white/20 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-2">📈 Attorney Savings / ROI Calculator</h3>
              <p className="text-white/90 mb-4">
                Estimate cost savings and outcome impact when partnering with RN Care Management on personal injury or workers' comp cases.
              </p>
              <div className="rounded-lg border border-white/20 bg-white/10 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-white/80 mb-1">Avg. Case Volume / Month</label>
                    <input className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white" placeholder="e.g., 10" disabled />
                  </div>
                  <div>
                    <label className="block text-sm text-white/80 mb-1">Avg. Case Value ($)</label>
                    <input className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white" placeholder="e.g., 25,000" disabled />
                  </div>
                  <div>
                    <label className="block text-sm text-white/80 mb-1">RN CM Tier</label>
                    <select className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white" disabled>
                      <option>Trial</option>
                      <option>Basic</option>
                      <option>Solo</option>
                      <option>Mid-Sized</option>
                      <option>Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/80 mb-1">Assumed Efficiency Gain (%)</label>
                    <input className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white" placeholder="e.g., 8%" disabled />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-white/70">* Inputs disabled until calculator goes live.</span>
                  <button className="px-4 py-2 rounded-lg bg-white/10 text-white/80" disabled>Calculate</button>
                </div>
              </div>
              <p className="mt-3 text-sm text-white/70">Reserved space • Wire to simple JS or backend function later.</p>
            </div>

            {/* 3) Nurse Portal Module — Individual RN "My Metrics" */}
            <div className="rounded-xl border border-white/20 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-2">🩺 RN Portal — My Quality Metrics</h3>
              <p className="text-white/90 mb-4">
                Private dashboard for each RN Case Manager. Shows personal performance vs. targets (weekly & monthly).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Example metric tiles (placeholders) */}
                <div className="rounded-lg border border-white/20 bg-white/10 p-4">
                  <div className="text-sm text-white/80">Timeliness of Notes</div>
                  <div className="mt-1 text-2xl font-extrabold text-white">95%</div>
                  <div className="mt-2 h-2 rounded bg-white/10">
                    <div className="h-2 rounded bg-green-500" style={{ width: '95%' }} />
                  </div>
                  <div className="mt-2 text-xs text-white/70">Target ≥ 95% • You're on track</div>
                </div>
                <div className="rounded-lg border border-white/20 bg-white/10 p-4">
                  <div className="text-sm text-white/80">Follow-Up Calls Completed</div>
                  <div className="mt-1 text-2xl font-extrabold text-white">88%</div>
                  <div className="mt-2 h-2 rounded bg-white/10">
                    <div className="h-2 rounded bg-yellow-400" style={{ width: '88%' }} />
                  </div>
                  <div className="mt-2 text-xs text-white/70">Target ≥ 92% • Improve this week</div>
                </div>
                <div className="rounded-lg border border-white/20 bg-white/10 p-4">
                  <div className="text-sm text-white/80">Medication Reconciliation</div>
                  <div className="mt-1 text-2xl font-extrabold text-white">90%</div>
                  <div className="mt-2 h-2 rounded bg-white/10">
                    <div className="h-2 rounded bg-green-500" style={{ width: '90%' }} />
                  </div>
                  <div className="mt-2 text-xs text-white/70">Target ≥ 90% • Meets goal</div>
                </div>
                <div className="rounded-lg border border-white/20 bg-white/10 p-4">
                  <div className="text-sm text-white/80">Care Plans Up-to-Date</div>
                  <div className="mt-1 text-2xl font-extrabold text-white">92%</div>
                  <div className="mt-2 h-2 rounded bg-white/10">
                    <div className="h-2 rounded bg-green-500" style={{ width: '92%' }} />
                  </div>
                  <div className="mt-2 text-xs text-white/70">Target ≥ 92% • On target</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-white/70">
                Weekly vs. Monthly trend lines will appear here • Individual RN access only.
              </div>
            </div>

            {/* 4) Nurse Portal Module — Team Quality Metrics (Supervisor) */}
            <div className="rounded-xl border border-white/20 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-2">🩺 RN Portal — Team Quality Metrics (Supervisor)</h3>
              <p className="text-white/90 mb-4">
                Supervisor view: compare RN performance, drill into details, and identify areas needing support.
              </p>
              <div className="overflow-x-auto rounded-lg border border-white/20 bg-white/10">
                <table className="min-w-full text-sm">
                  <thead className="bg-white/10 text-white/80">
                    <tr>
                      <th className="text-left px-4 py-2 font-semibold">RN</th>
                      <th className="text-left px-4 py-2 font-semibold">Notes ≤24h</th>
                      <th className="text-left px-4 py-2 font-semibold">Follow-Ups</th>
                      <th className="text-left px-4 py-2 font-semibold">Med Rec</th>
                      <th className="text-left px-4 py-2 font-semibold">Care Plans</th>
                      <th className="text-left px-4 py-2 font-semibold">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'RN A', notes: 97, fu: 93, med: 91, cp: 95, score: 94 },
                      { name: 'RN B', notes: 92, fu: 88, med: 90, cp: 89, score: 90 },
                      { name: 'RN C', notes: 89, fu: 85, med: 87, cp: 86, score: 87 },
                    ].map((r, i) => (
                      <tr key={i} className="border-t border-white/10">
                        <td className="px-4 py-2">{r.name}</td>
                        <td className="px-4 py-2">{r.notes}%</td>
                        <td className="px-4 py-2">{r.fu}%</td>
                        <td className="px-4 py-2">{r.med}%</td>
                        <td className="px-4 py-2">{r.cp}%</td>
                        <td className="px-4 py-2 font-semibold">{r.score}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-sm text-white/70">Supervisor-only access • Alerts for &gt;48h overdue notes will surface here.</div>
            </div>

            {/* 5) Privacy / Consent Statement (Modal placeholder) */}
            <div className="rounded-xl border border-white/20 bg-white/5 p-6 backdrop-blur-sm lg:col-span-2">
              <h3 className="text-xl font-bold mb-2">📜 Privacy & Consent</h3>
              <p className="text-white/90">
                Reconcile C.A.R.E. uses privacy by design — minimum necessary data, no PHI in URLs, and consent-gated sharing.
                This is a placeholder for the consent notice/modal link. It will appear on first visit and in the footer.
              </p>
              <button
                type="button"
                className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-white/10 text-white/80"
                aria-disabled="true"
                disabled
              >
                Open Consent Notice (Preview)
              </button>
              <p className="mt-2 text-sm text-white/70">Reserved space • Wire to your consent content and acknowledgment audit later.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Footer (rebuilt with four columns and correct links/colors) ===== */}
      <footer id="rcms-footer" className="bg-gradient-to-b from-[#0f2a6a] via-[#0e385f] to-[#0f2a6a] text-white/90" aria-label="Site footer">
        {/* Top strip: brand + quick actions */}
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-extrabold tracking-tight">
              Reconcile <span className="text-[#ff8c42]">C.A.R.E.</span>
            </h3>
            <p className="text-sm text-white/80 mt-1">
              Comprehensive Nursing Care Management for Legal and Medical Coordination
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/attorney-login" className="inline-block bg-[#ff8c42] hover:bg-[#ff9f5c] text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-md transition">Attorney Portal</a>
            <a href="/client-login"   className="inline-block bg-[#0f2a6a] hover:bg-[#1a3f8b] text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-md transition">Client Portal</a>
            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault();
                toast.info("Provider Portal coming soon (not in Jan 15 MVP).");
              }}
              className="inline-block bg-[#4b2e83] hover:bg-[#5a36a5] text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-md transition"
            >
              Provider Portal
            </a>
            <a href="/client-consent"          className="inline-block bg-[#00695c] hover:bg-[#00897b] text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-md transition">Client Intake</a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20" />

        {/* Four columns */}
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1 — RCMS Info */}
          <div>
            <h4 className="text-white font-semibold mb-3">Reconcile Care Management Services</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/about" className="hover:underline">About RCMS</a></li>
              <li><a href="/mission" className="hover:underline">Our Mission</a></li>
              <li><a href="/standards" className="hover:underline">Care Standards</a></li>
              <li className="text-white/70 italic mt-2">"Where Clinical Insight Meets Legal Advocacy."</li>
            </ul>
          </div>

          {/* Column 2 — Portals & Access */}
          <div>
            <h4 className="text-white font-semibold mb-3">Portals &amp; Access</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/client-consent" className="hover:underline">Client Intake</a></li>
              <li><a href="/client-login" className="hover:underline">Client Portal</a></li>
              <li><a href="/attorney-login" className="hover:underline">Attorney Portal</a></li>
              <li><span className="text-white/60">Provider Portal (Coming Soon)</span></li>
              <li><span className="text-white/60">RN Portal (coming soon)</span></li>
            </ul>
          </div>

          {/* Column 3 — Legal & Compliance */}
          <div>
            <h4 className="text-white font-semibold mb-3">Legal &amp; Compliance</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/baa" className="hover:underline">Business Associate Agreement</a></li>
              <li><a href="/security" className="hover:underline">Security &amp; Data Retention</a></li>
              <li><a href="/privacy" className="hover:underline">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:underline">Terms of Service</a></li>
            </ul>
          </div>

          {/* Column 4 — System & Support */}
          <div>
            <h4 className="text-white font-semibold mb-3">System &amp; Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/accessibility" className="hover:underline">Accessibility (WCAG 2.1 AA)</a></li>
              <li><a href="/roadmap" className="hover:underline">Roadmap</a></li>
              <li><a href="/status" className="hover:underline">System Status</a></li>
              <li><a href="/contact" className="hover:underline">Contact Us</a> &nbsp;•&nbsp; <a href="/faq" className="hover:underline">FAQ</a></li>
            </ul>
          </div>
        </div>

        {/* Mini disclaimer */}
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <div className="rounded-xl bg-white/5 border border-white/15 p-4">
            <p className="text-xs text-white/80">
              <strong>Notice:</strong> Reconcile C.A.R.E. is designed with privacy by default. Do not include PHI in URLs, email, or SMS.
              Minimum necessary data is collected. Access to sensitive cases is restricted by role and consent.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/15">
          <div className="max-w-7xl mx-auto px-6 py-4 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-white/70">
            <p>© {new Date().getFullYear()} Reconcile Care Management Services. All rights reserved.</p>
            <p className="text-white/70">Built for clients, attorneys, and nurse care managers — secure, auditable, and HIPAA-aware.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
