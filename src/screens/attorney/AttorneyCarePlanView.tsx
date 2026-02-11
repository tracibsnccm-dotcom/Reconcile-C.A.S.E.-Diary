// src/screens/attorney/AttorneyCarePlanView.tsx
// Attorney view of finalized care plans - read-only with all sections visible
// ATTORNEY-4: Export/Print for released (status=submitted) care plans only

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { isUnableToReach, isParticipationUndetermined } from "@/lib/tenVsHelpers";
import { PARTICIPATION_COPY } from "@/constants/participationMessaging";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = 'https://zmjxyspizdqhrtdcgkwk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptanh5c3BpemRxaHJ0ZGNna3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMjgxODMsImV4cCI6MjA3OTcwNDE4M30.i5rqJXZPSHYFeaA8E26Vh69UPzgCmhrU9zL2kdE8jrM';

async function supabaseFetch(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

type SeverityScore = 1 | 2 | 3 | 4 | 5;

interface CarePlan {
  id: string;
  caseId: string;
  planNumber: number;
  planType: string;
  carePlanType: string;
  status: string;
  createdAt: string;
  submittedAt: string | null;
  pdfUrl: string | null;
}

interface CaseInfo {
  caseNumber: string;
  clientName: string;
  dateOfInjury: string | null;
  injuryType: string | null;
}

interface FourPsAssessment {
  physical: SeverityScore;
  psychological: SeverityScore;
  psychosocial: SeverityScore;
  professional: SeverityScore;
  physicalNotes: string | null;
  psychologicalNotes: string | null;
  psychosocialNotes: string | null;
  professionalNotes: string | null;
  assessedAt: string;
}

interface SDOHAssessment {
  economicScore: SeverityScore;
  educationScore: SeverityScore;
  healthcareScore: SeverityScore;
  neighborhoodScore: SeverityScore;
  socialScore: SeverityScore;
  flags: string[];
  assessedAt: string;
}

interface OverlaySelection {
  overlayType: string;
  overlaySubtype: string | null;
  notes: string | null;
}

interface GuidelineReference {
  guidelineType: string;
  guidelineName: string;
  recommendation: string;
  deviationReason: string | null;
  deviationJustification: string | null;
}

interface CareV {
  vNumber: number;
  vName: string;
  status: string;
  findings: string | null;
  recommendations: string | null;
  priority: string;
}

interface Attestation {
  attestedAt: string;
  attestedBy: string;
  attestationType: string;
  skippedSections: string[];
  skippedJustification: string | null;
}

const SCORE_LABELS: Record<SeverityScore, { label: string; color: string }> = {
  1: { label: "Crisis", color: "#dc2626" },
  2: { label: "At Risk", color: "#f97316" },
  3: { label: "Struggling", color: "#eab308" },
  4: { label: "Stable", color: "#22c55e" },
  5: { label: "Thriving", color: "#10b981" },
};

const CARE_PLAN_TYPE_LABELS: Record<string, string> = {
  initial: "Initial Care Plan",
  routine_60_day: "60-Day Routine Review",
  accelerated_30_day: "30-Day Accelerated Review",
  event_based: "Event-Based Review",
  attorney_request: "Attorney-Requested Review",
  discharge: "Discharge Care Plan",
};

const V_NAMES: Record<number, string> = {
  1: "Validate",
  2: "Vitals",
  3: "Verify",
  4: "Visualize",
  5: "Value",
  6: "Voice",
  7: "Volunteer",
  8: "Vigilance",
  9: "Victory",
  10: "Verify Discharge",
};

const AttorneyCarePlanView: React.FC = () => {
  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);
  const [caseInfo, setCaseInfo] = useState<CaseInfo | null>(null);
  const [fourPs, setFourPs] = useState<FourPsAssessment | null>(null);
  const [sdoh, setSdoh] = useState<SDOHAssessment | null>(null);
  const [overlays, setOverlays] = useState<OverlaySelection[]>([]);
  const [guidelines, setGuidelines] = useState<GuidelineReference[]>([]);
  const [careVs, setCareVs] = useState<CareV[]>([]);
  const [attestation, setAttestation] = useState<Attestation | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('summary');
  const [allCarePlans, setAllCarePlans] = useState<CarePlan[]>([]);
  const [unableToReach, setUnableToReach] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);

  // Released = status === 'submitted' (ATTORNEY-4)
  const isReleased = carePlan?.status === 'submitted';

  // planId from route = rc_care_plans.id (not case_id or plan_number)
  const { planId } = useParams<{ planId: string }>();

  useEffect(() => {
    async function loadCarePlan() {
      if (!planId || !supabase) {
        setLoading(false);
        return;
      }

      try {
        // Primary query: rc_care_plans by id (route param = care plan id)
        const { data: planRow, error: planError } = await supabase
          .from('rc_care_plans')
          .select('*')
          .eq('id', planId)
          .single();

        if (planError || !planRow) {
          setLoading(false);
          return;
        }

        const plan = planRow;
        setCarePlan({
          id: plan.id,
          caseId: plan.case_id,
          planNumber: plan.plan_number,
          planType: plan.plan_type,
          carePlanType: plan.care_plan_type || 'initial',
          status: plan.status,
          createdAt: plan.created_at,
          submittedAt: plan.submitted_at,
          pdfUrl: plan.pdf_url,
        });

        // D-8: Load draft for unable-to-reach banner (hardened: missing/parse error → no banner, no crash)
        try {
          const { data, error } = await supabase.storage.from('rcms-documents').download(`care-plan-drafts/${plan.case_id}.json`);
          if (error || !data) {
            setUnableToReach(false);
          } else {
            const text = await data.text();
            let draft: unknown = null;
            try {
              draft = JSON.parse(text);
            } catch {
              setUnableToReach(false);
            }
            if (draft == null) {
              setUnableToReach(false);
            } else {
              setUnableToReach(isParticipationUndetermined(draft) || isUnableToReach(draft));
            }
          }
        } catch {
          setUnableToReach(false);
        }

        // Get case info
        const caseResult = await supabaseFetch(
          `rc_cases?id=eq.${plan.case_id}&is_superseded=eq.false&select=*,rc_clients(*)`
        );
        
        if (caseResult && caseResult.length > 0) {
          const caseData = caseResult[0];
          const client = caseData.rc_clients;
          setCaseInfo({
            caseNumber: caseData.case_number,
            clientName: client ? `${client.first_name || ''} ${client.last_name || ''}`.trim() : 'Unknown',
            dateOfInjury: caseData.date_of_injury,
            injuryType: caseData.injury_type,
          });

          // Get all care plans for this case
          const allPlansResult = await supabaseFetch(
            `rc_care_plans?case_id=eq.${plan.case_id}&status=eq.submitted&order=created_at.desc`
          );
          if (allPlansResult) {
            setAllCarePlans(allPlansResult.map((p: any) => ({
              id: p.id,
              caseId: p.case_id,
              planNumber: p.plan_number,
              planType: p.plan_type,
              carePlanType: p.care_plan_type || 'initial',
              status: p.status,
              createdAt: p.created_at,
              submittedAt: p.submitted_at,
              pdfUrl: p.pdf_url,
            })));
          }
        }

        // Get 4Ps assessment
        const fourPsResult = await supabaseFetch(
          `rc_fourps_assessments?care_plan_id=eq.${planId}&order=created_at.desc&limit=1`
        );
        if (fourPsResult && fourPsResult.length > 0) {
          const fp = fourPsResult[0];
          setFourPs({
            physical: fp.p1_physical,
            psychological: fp.p2_psychological,
            psychosocial: fp.p3_psychosocial,
            professional: fp.p4_professional,
            physicalNotes: fp.p1_notes,
            psychologicalNotes: fp.p2_notes,
            psychosocialNotes: fp.p3_notes,
            professionalNotes: fp.p4_notes,
            assessedAt: fp.created_at,
          });
        }

        // Get SDOH assessment
        const sdohResult = await supabaseFetch(
          `rc_sdoh_assessments?care_plan_id=eq.${planId}&order=created_at.desc&limit=1`
        );
        if (sdohResult && sdohResult.length > 0) {
          const s = sdohResult[0];
          setSdoh({
            economicScore: s.economic_score,
            educationScore: s.education_score,
            healthcareScore: s.healthcare_score,
            neighborhoodScore: s.neighborhood_score,
            socialScore: s.social_score,
            flags: [
              s.housing_insecurity && 'Housing Insecurity',
              s.food_insecurity && 'Food Insecurity',
              s.transportation_barrier && 'Transportation Barrier',
              s.financial_hardship && 'Financial Hardship',
              s.social_isolation && 'Social Isolation',
            ].filter(Boolean) as string[],
            assessedAt: s.created_at,
          });
        }

        // Get overlays
        const overlaysResult = await supabaseFetch(
          `rc_overlay_selections?care_plan_id=eq.${planId}`
        );
        if (overlaysResult) {
          setOverlays(overlaysResult.map((o: any) => ({
            overlayType: o.overlay_type,
            overlaySubtype: o.overlay_subtype,
            notes: o.application_notes,
          })));
        }

        // Get guidelines
        const guidelinesResult = await supabaseFetch(
          `rc_guideline_references?care_plan_id=eq.${planId}`
        );
        if (guidelinesResult) {
          setGuidelines(guidelinesResult.map((g: any) => ({
            guidelineType: g.guideline_type,
            guidelineName: g.guideline_name,
            recommendation: g.recommendation,
            deviationReason: g.deviation_reason,
            deviationJustification: g.deviation_justification,
          })));
        }

        // Get 10-Vs
        const vsResult = await supabaseFetch(
          `rc_care_plan_vs?care_plan_id=eq.${planId}&order=v_number`
        );
        if (vsResult) {
          setCareVs(vsResult.map((v: any) => ({
            vNumber: v.v_number,
            vName: V_NAMES[v.v_number] || `V${v.v_number}`,
            status: v.status,
            findings: v.findings,
            recommendations: v.recommendations,
            priority: v.priority,
          })));
        }

        // Get attestation
        const attestationResult = await supabaseFetch(
          `rc_care_plan_attestations?care_plan_id=eq.${planId}&order=created_at.desc&limit=1`
        );
        if (attestationResult && attestationResult.length > 0) {
          const a = attestationResult[0];
          setAttestation({
            attestedAt: a.attested_at,
            attestedBy: a.attested_by,
            attestationType: a.attestation_type,
            skippedSections: a.skipped_sections || [],
            skippedJustification: a.skipped_justification,
          });
        }

      } catch (error) {
        console.error("Failed to load care plan:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCarePlan();
  }, [planId]);

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit'
    });
  };

  const renderScoreBadge = (score: SeverityScore) => {
    const info = SCORE_LABELS[score];
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.25rem 0.6rem',
        borderRadius: '999px',
        background: `${info.color}20`,
        color: info.color,
        fontWeight: 600,
        fontSize: '0.8rem'
      }}>
        <span style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: info.color,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.7rem',
          fontWeight: 700
        }}>
          {score}
        </span>
        {info.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          Loading care plan...
        </div>
      </div>
    );
  }

  if (!carePlan || !caseInfo) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          Care plan not found.
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'summary', label: 'Summary', icon: '📋' },
    { id: 'fourps', label: '4Ps Assessment', icon: '💚' },
    { id: 'sdoh', label: 'SDOH', icon: '🏠' },
    { id: 'overlays', label: 'Overlays', icon: '🔍' },
    { id: 'guidelines', label: 'Guidelines', icon: '📖' },
    { id: 'tenvs', label: '10-Vs Care Plan', icon: '✓' },
    { id: 'attestation', label: 'Attestation', icon: '✍️' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }} className="attorney-care-plan-view">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .attorney-care-plan-view .attorney-care-plan-sidebar { display: none !important; }
          .attorney-care-plan-view .attorney-care-plan-header { display: none !important; }
          .attorney-care-plan-print-header { display: block !important; }
          .attorney-care-plan-print-section { display: block !important; page-break-inside: avoid; }
          .attorney-care-plan-view { background: #fff !important; }
          .attorney-care-plan-view .attorney-care-plan-main { max-width: 100% !important; }
          body { background: #fff !important; }
        }
        .attorney-care-plan-print-header { display: none; }
      `}</style>
      {/* Print-only header: RN Care Plan — Released (ATTORNEY-4) */}
      <div className="attorney-care-plan-print-header" style={{
        padding: '1rem 0',
        marginBottom: '1rem',
        borderBottom: '2px solid #0f2a6a'
      }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f2a6a', marginBottom: '0.5rem' }}>
          RN Care Plan — Released
        </div>
        <div style={{ fontSize: '0.9rem', color: '#374151' }}>
          Case: {caseInfo.caseNumber} • Client: {caseInfo.clientName} • Care Plan #{carePlan.planNumber}
          {carePlan.submittedAt && (
            <span> • Released: {formatDate(carePlan.submittedAt)}</span>
          )}
        </div>
      </div>
      {printError && (
        <div className="no-print" style={{
          margin: '0 1.5rem 1rem',
          padding: '0.75rem',
          borderRadius: '8px',
          background: '#fef2f2',
          color: '#dc2626',
          fontSize: '0.9rem'
        }}>
          {printError}
        </div>
      )}
      {/* Header */}
      <div className="attorney-care-plan-header no-print" style={{
        background: '#0f2a6a',
        color: '#ffffff',
        padding: '1rem 1.5rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                Reconcile C.A.R.E. • Attorney Portal
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                Care Plan #{carePlan.planNumber} - {caseInfo.clientName}
              </div>
              <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '0.25rem' }}>
                {caseInfo.caseNumber} • {CARE_PLAN_TYPE_LABELS[carePlan.carePlanType] || carePlan.carePlanType}
              </div>
            </div>
            <div className="no-print" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {isReleased ? (
                <button
                  onClick={() => {
                    setPrintError(null);
                    try {
                      window.print();
                    } catch {
                      setPrintError('Unable to open print dialog. Please try again.');
                    }
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#ffffff',
                    color: '#0f2a6a',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Export / Print Care Plan
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem', display: 'flex', gap: '1.5rem' }}>
        {/* Sidebar - hidden when printing */}
        <div className="attorney-care-plan-sidebar no-print" style={{ width: '240px', flexShrink: 0 }}>
          {/* Section Navigation */}
          <div style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            padding: '0.5rem',
            marginBottom: '1rem'
          }}>
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeSection === section.id ? '#f0f9ff' : 'transparent',
                  color: activeSection === section.id ? '#0369a1' : '#64748b',
                  fontWeight: activeSection === section.id ? 600 : 400,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>{section.icon}</span>
                {section.label}
              </button>
            ))}
          </div>

          {/* Other Care Plans */}
          {allCarePlans.length > 1 && (
            <div style={{
              background: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              padding: '0.75rem'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
                All Care Plans
              </div>
              {allCarePlans.map(plan => (
                <a
                  key={plan.id}
                  href={`/attorney/care-plans/${plan.id}`}
                  style={{
                    display: 'block',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    background: plan.id === carePlan.id ? '#f0f9ff' : 'transparent',
                    color: plan.id === carePlan.id ? '#0369a1' : '#64748b',
                    textDecoration: 'none',
                    fontSize: '0.8rem',
                    marginBottom: '0.25rem'
                  }}
                >
                  #{plan.planNumber} - {formatDate(plan.createdAt).split(',')[0]}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="attorney-care-plan-main" style={{ flex: 1 }}>
          {/* C-6: Client Participation — when unable_to_determine (informational only, no CTA) */}
          {unableToReach && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#64748b',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Client Participation Status
              </div>
              <p style={{
                fontSize: '0.9rem',
                color: '#374151',
                margin: 0,
                lineHeight: '1.5'
              }}>
                {PARTICIPATION_COPY.unable_to_determine.attorneyBanner}
              </p>
            </div>
          )}

          {/* Client Approval Disclaimer Banner */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: '#64748b',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Client Review Status
            </div>
            <p style={{
              fontSize: '0.9rem',
              color: '#374151',
              margin: 0,
              lineHeight: '1.5'
            }}>
              This Initial Care Plan was developed by a Registered Nurse using information provided by the client. At the time of release, the client has not yet formally reviewed or approved this plan.
            </p>
          </div>

          {/* SUMMARY */}
          <div className="attorney-care-plan-print-section" style={{ display: activeSection === 'summary' ? 'block' : 'none' }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Care Plan Summary</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Client</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>{caseInfo.clientName}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{caseInfo.caseNumber}</div>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Care Plan Type</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                    {CARE_PLAN_TYPE_LABELS[carePlan.carePlanType] || carePlan.carePlanType}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Created: {formatDate(carePlan.createdAt)}
                  </div>
                </div>
              </div>

              {/* 4Ps Overview */}
              {fourPs && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>4Ps Wellness Scores</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                    {[
                      { key: 'physical', label: 'Physical', icon: '💪' },
                      { key: 'psychological', label: 'Psychological', icon: '🧠' },
                      { key: 'psychosocial', label: 'Psychosocial', icon: '👥' },
                      { key: 'professional', label: 'Professional', icon: '💼' },
                    ].map(p => (
                      <div key={p.key} style={{
                        background: '#f8fafc',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{p.icon}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>{p.label}</div>
                        {renderScoreBadge(fourPs[p.key as keyof FourPsAssessment] as SeverityScore)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SDOH Flags */}
              {sdoh && sdoh.flags.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>SDOH Flags</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {sdoh.flags.map(flag => (
                      <span key={flag} style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        background: '#fef2f2',
                        color: '#dc2626',
                        fontSize: '0.8rem',
                        fontWeight: 500
                      }}>
                        ⚠️ {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Overlays */}
              {overlays.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>Applied Overlays</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {overlays.map((o, idx) => (
                      <span key={idx} style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        background: '#f0f9ff',
                        color: '#0369a1',
                        fontSize: '0.8rem',
                        fontWeight: 500
                      }}>
                        {o.overlayType.replace(/_/g, ' ')}
                        {o.overlaySubtype && ` (${o.overlaySubtype})`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Attestation */}
              {attestation && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '8px',
                  padding: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>✅</span>
                    <span style={{ fontWeight: 600, color: '#166534' }}>Care Plan Finalized</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#15803d' }}>
                    Attested on {formatDateTime(attestation.attestedAt)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4Ps ASSESSMENT */}
          {activeSection === 'fourps' && fourPs && (
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>4Ps Wellness Assessment</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
                Assessed on {formatDateTime(fourPs.assessedAt)}
              </p>

              <div style={{ display: 'grid', gap: '1rem' }}>
                {[
                  { key: 'physical', label: 'P1 - Physical', icon: '💪', notes: fourPs.physicalNotes },
                  { key: 'psychological', label: 'P2 - Psychological', icon: '🧠', notes: fourPs.psychologicalNotes },
                  { key: 'psychosocial', label: 'P3 - Psychosocial', icon: '👥', notes: fourPs.psychosocialNotes },
                  { key: 'professional', label: 'P4 - Professional', icon: '💼', notes: fourPs.professionalNotes },
                ].map(p => (
                  <div key={p.key} style={{
                    background: '#f8fafc',
                    borderRadius: '10px',
                    padding: '1rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>{p.icon}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.label}</span>
                      </div>
                      {renderScoreBadge(fourPs[p.key as keyof FourPsAssessment] as SeverityScore)}
                    </div>
                    {p.notes && (
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '0.75rem',
                        background: '#ffffff',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        color: '#374151'
                      }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>RN Notes:</div>
                        {p.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>

          {/* SDOH */}
          <div className="attorney-care-plan-print-section" style={{ display: activeSection === 'sdoh' ? 'block' : 'none' }}>
          {sdoh && (
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Social Determinants of Health</h2>
              
              <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[
                  { key: 'economicScore', label: 'Economic Stability' },
                  { key: 'educationScore', label: 'Education Access' },
                  { key: 'healthcareScore', label: 'Healthcare Access' },
                  { key: 'neighborhoodScore', label: 'Neighborhood & Environment' },
                  { key: 'socialScore', label: 'Social & Community' },
                ].map(domain => (
                  <div key={domain.key} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    background: '#f8fafc',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontSize: '0.9rem' }}>{domain.label}</span>
                    {renderScoreBadge(sdoh[domain.key as keyof SDOHAssessment] as SeverityScore)}
                  </div>
                ))}
              </div>

              {sdoh.flags.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Identified Barriers</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {sdoh.flags.map(flag => (
                      <span key={flag} style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        background: '#fef2f2',
                        color: '#dc2626',
                        fontSize: '0.85rem'
                      }}>
                        ⚠️ {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          </div>

          {/* OVERLAYS */}
          <div className="attorney-care-plan-print-section" style={{ display: activeSection === 'overlays' ? 'block' : 'none' }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Applied Condition Overlays</h2>
              
              {overlays.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>No overlays applied to this care plan.</div>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {overlays.map((overlay, idx) => (
                    <div key={idx} style={{
                      background: '#f8fafc',
                      borderRadius: '10px',
                      padding: '1rem'
                    }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                        {overlay.overlayType.replaceAll('_', ' ')}
                        {overlay.overlaySubtype && (
                          <span style={{ fontWeight: 400, color: '#64748b' }}> ({overlay.overlaySubtype})</span>
                        )}
                      </div>
                      {overlay.notes && (
                        <div style={{ fontSize: '0.85rem', color: '#374151', marginTop: '0.5rem' }}>
                          {overlay.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* GUIDELINES */}
          <div className="attorney-care-plan-print-section" style={{ display: activeSection === 'guidelines' ? 'block' : 'none' }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Clinical Guidelines Reference</h2>
              
              {guidelines.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>No guidelines referenced in this care plan.</div>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {guidelines.map((g, idx) => (
                    <div key={idx} style={{
                      background: '#f8fafc',
                      borderRadius: '10px',
                      padding: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          background: '#e0e7ff',
                          color: '#3730a3',
                          fontSize: '0.7rem',
                          fontWeight: 600
                        }}>
                          {g.guidelineType}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{g.guidelineName}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#374151', marginBottom: '0.5rem' }}>
                        {g.recommendation}
                      </div>
                      {g.deviationReason && (
                        <div style={{
                          marginTop: '0.5rem',
                          padding: '0.75rem',
                          background: '#fef3c7',
                          borderRadius: '6px',
                          border: '1px solid #fcd34d'
                        }}>
                          <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 600 }}>⚠️ Deviation</div>
                          <div style={{ fontSize: '0.85rem', color: '#78350f' }}>
                            <strong>Reason:</strong> {g.deviationReason}
                          </div>
                          {g.deviationJustification && (
                            <div style={{ fontSize: '0.85rem', color: '#78350f', marginTop: '0.25rem' }}>
                              <strong>Justification:</strong> {g.deviationJustification}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 10-Vs */}
          <div className="attorney-care-plan-print-section" style={{ display: activeSection === 'tenvs' ? 'block' : 'none' }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>10-Vs Care Management Plan</h2>
              
              {careVs.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>No 10-Vs data available.</div>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {careVs.map(v => (
                    <div key={v.vNumber} style={{
                      background: '#f8fafc',
                      borderRadius: '10px',
                      padding: '1rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: '#0f2a6a',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.8rem'
                          }}>
                            {v.vNumber}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>V{v.vNumber} – {v.vName}</span>
                        </div>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '4px',
                          background: v.status === 'completed' ? '#dcfce7' : '#fef3c7',
                          color: v.status === 'completed' ? '#166534' : '#92400e',
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}>
                          {v.status}
                        </span>
                      </div>
                      {v.findings && (
                        <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                          <strong>Findings:</strong> {v.findings}
                        </div>
                      )}
                      {v.recommendations && (
                        <div style={{ fontSize: '0.85rem' }}>
                          <strong>Recommendations:</strong> {v.recommendations}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {activeSection === 'attestation' && (
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Care Plan Attestation</h2>
              
              {attestation ? (
                <div>
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                    borderRadius: '10px',
                    padding: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>✅</span>
                      <span style={{ fontWeight: 600, fontSize: '1rem', color: '#166534' }}>
                        Care Plan Finalized
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#15803d' }}>
                      Attested on {formatDateTime(attestation.attestedAt)}
                    </div>
                  </div>

                  {attestation.skippedSections.length > 0 && (
                    <div style={{
                      background: '#fef3c7',
                      border: '1px solid #fcd34d',
                      borderRadius: '10px',
                      padding: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#92400e', marginBottom: '0.5rem' }}>
                        ⚠️ Sections Marked as N/A
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        {attestation.skippedSections.map(section => (
                          <span key={section} style={{
                            padding: '0.25rem 0.5rem',
                            background: '#ffffff',
                            borderRadius: '4px',
                            fontSize: '0.8rem'
                          }}>
                            {section}
                          </span>
                        ))}
                      </div>
                      {attestation.skippedJustification && (
                        <div style={{ fontSize: '0.85rem', color: '#78350f' }}>
                          <strong>Justification:</strong> {attestation.skippedJustification}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '8px',
                    padding: '1rem',
                    fontSize: '0.85rem',
                    color: '#374151'
                  }}>
                    <p style={{ marginBottom: '0.5rem' }}>
                      By finalizing this care plan, the RN attested that:
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                      <li>All information has been reviewed for accuracy</li>
                      <li>Clinical guidelines have been appropriately referenced</li>
                      <li>Client-specific overlays have been considered</li>
                      <li>This care plan reflects appropriate clinical judgment</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  This care plan has not been finalized yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
  );
};

export default AttorneyCarePlanView;
