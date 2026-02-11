// src/screens/rn/GuidelinesReferenceScreen.tsx
// Step 4 of RN Care Plan Workflow - Document ODG/MCG/InterQual/State Reg lookups
// Uses authenticated supabaseGet + supabase client for plan-scoped guidelines (draft plan.id).

import React, { useEffect, useState } from "react";
import { RN_VIEW_ONLY_TOOLTIP } from "@/components/rn/RNCaseStateBadge";
import { supabase } from "@/integrations/supabase/client";
import { supabaseGet } from "@/lib/supabaseRest";

type GuidelineSource = 'ODG' | 'MCG' | 'InterQual' | 'State_Reg' | 'Other';

interface GuidelineReference {
  id?: string;
  sourceType: GuidelineSource;
  sourceName: string;
  guidelineCode: string;
  guidelineTitle: string;
  guidelineRecommendation: string;
  relevanceNotes: string;
  deviatesFromGuideline: boolean;
  deviationRationale: string;
  alternativeApproach: string;
  fourpsJustification: string;
  sdohJustification: string;
  clinicalJustification: string;
}

const EMPTY_REFERENCE: GuidelineReference = {
  sourceType: 'ODG',
  sourceName: '',
  guidelineCode: '',
  guidelineTitle: '',
  guidelineRecommendation: '',
  relevanceNotes: '',
  deviatesFromGuideline: false,
  deviationRationale: '',
  alternativeApproach: '',
  fourpsJustification: '',
  sdohJustification: '',
  clinicalJustification: '',
};

const SOURCE_INFO: Record<GuidelineSource, { name: string; description: string; color: string }> = {
  ODG: {
    name: "ODG (Official Disability Guidelines)",
    description: "Evidence-based treatment and return-to-work guidelines",
    color: "#3b82f6"
  },
  MCG: {
    name: "MCG (Milliman Care Guidelines)",
    description: "Clinical guidelines for care management decisions",
    color: "#8b5cf6"
  },
  InterQual: {
    name: "InterQual",
    description: "Evidence-based clinical decision support criteria",
    color: "#06b6d4"
  },
  State_Reg: {
    name: "State Regulations",
    description: "State-specific treatment guidelines and requirements",
    color: "#f59e0b"
  },
  Other: {
    name: "Other Source",
    description: "Other clinical guidelines or evidence sources",
    color: "#6b7280"
  }
};

interface GuidelinesReferenceScreenProps { readOnly?: boolean; onMarkDirty?: () => void; }

const GuidelinesReferenceScreen: React.FC<GuidelinesReferenceScreenProps> = ({ readOnly = false, onMarkDirty }) => {
  const [references, setReferences] = useState<GuidelineReference[]>([]);
  const [activeReference, setActiveReference] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [carePlanId, setCarePlanId] = useState<string | null>(null);

  const caseId = typeof window !== 'undefined' ? window.localStorage.getItem("rcms_active_case_id") : null;

  // Load existing references
  useEffect(() => {
    async function loadData() {
      if (!caseId) {
        setLoading(false);
        setStatus("No active case selected. Please select a case first.");
        return;
      }

      try {
        const { data: planResult, error: planErr } = await supabaseGet<unknown[]>(
          "rc_care_plans",
          `case_id=eq.${caseId}&order=created_at.desc&limit=1`
        );
        if (planErr) throw planErr;

        if (planResult && planResult.length > 0) {
          const plan = planResult[0] as { id: string };
          setCarePlanId(plan.id);
          
          const { data: refResult, error: refErr } = await supabaseGet<unknown[]>(
            "rc_guideline_references",
            `care_plan_id=eq.${plan.id}&order=created_at.asc`
          );
          if (!refErr && refResult && refResult.length > 0) {
            const rows = refResult as Record<string, unknown>[];
            setReferences(rows.map((r) => ({
              id: r.id as string | undefined,
              sourceType: (r.source_type as GuidelineSource) || 'ODG',
              sourceName: (r.source_name as string) || '',
              guidelineCode: (r.guideline_code as string) || '',
              guidelineTitle: (r.guideline_title as string) || '',
              guidelineRecommendation: (r.guideline_recommendation as string) || '',
              relevanceNotes: (r.relevance_notes as string) || '',
              deviatesFromGuideline: (r.deviates_from_guideline as boolean) || false,
              deviationRationale: (r.deviation_rationale as string) || '',
              alternativeApproach: (r.alternative_approach as string) || '',
              fourpsJustification: (r.fourps_justification as string) || '',
              sdohJustification: (r.sdoh_justification as string) || '',
              clinicalJustification: (r.clinical_justification as string) || '',
            })));
            setStatus(`Loaded ${refResult.length} guideline reference(s).`);
          }
        } else {
          const { data: newPlan, error: insertErr } = await supabase
            .from('rc_care_plans')
            .insert({ case_id: caseId, plan_type: 'initial', plan_number: 1, status: 'draft' })
            .select('id');
          if (!insertErr && newPlan && Array.isArray(newPlan) && newPlan.length > 0) {
            setCarePlanId((newPlan[0] as { id: string }).id);
          }
        }
      } catch (error) {
        console.error("Failed to load guideline data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [caseId]);

  const addReference = () => {
    onMarkDirty?.();
    setReferences(prev => [...prev, { ...EMPTY_REFERENCE }]);
    setActiveReference(references.length);
  };

  const removeReference = (index: number) => {
    onMarkDirty?.();
    setReferences(prev => prev.filter((_, i) => i !== index));
    if (activeReference === index) {
      setActiveReference(null);
    } else if (activeReference !== null && activeReference > index) {
      setActiveReference(activeReference - 1);
    }
  };

  const updateReference = (index: number, updates: Partial<GuidelineReference>) => {
    onMarkDirty?.();
    setReferences(prev => prev.map((ref, i) => 
      i === index ? { ...ref, ...updates } : ref
    ));
    setStatus(null);
  };

  const handleSave = async () => {
    if (!carePlanId) {
      setStatus("No care plan found. Please try again.");
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      const { error: delErr } = await supabase
        .from('rc_guideline_references')
        .delete()
        .eq('care_plan_id', carePlanId);
      if (delErr) throw delErr;

      if (references.length > 0) {
        const insertData = references.map(r => ({
          care_plan_id: carePlanId,
          source_type: r.sourceType,
          source_name: r.sourceName || null,
          guideline_code: r.guidelineCode || null,
          guideline_title: r.guidelineTitle || null,
          guideline_recommendation: r.guidelineRecommendation || null,
          relevance_notes: r.relevanceNotes || null,
          deviates_from_guideline: r.deviatesFromGuideline,
          deviation_rationale: r.deviationRationale || null,
          alternative_approach: r.alternativeApproach || null,
          fourps_justification: r.fourpsJustification || null,
          sdoh_justification: r.sdohJustification || null,
          clinical_justification: r.clinicalJustification || null,
        }));

        const { error: insErr } = await supabase.from('rc_guideline_references').insert(insertData);
        if (insErr) throw insErr;
      }

      setStatus(`✓ Saved ${references.length} guideline reference(s) to database.`);
    } catch (error: any) {
      console.error("Failed to save guideline references:", error);
      setStatus(`Error saving: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading guidelines data...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.2rem" }}>
          Treatment Guidelines Reference
        </h2>
        <p style={{ fontSize: "0.8rem", color: "#64748b", maxWidth: "50rem" }}>
          Document the ODG, MCG, InterQual, or State Regulations you referenced for this case.
          If your recommended treatment deviates from guidelines, document the clinical reasoning
          and how the client's 4Ps and SDOH factors justify the deviation.
        </p>
        {caseId && (
          <p style={{ fontSize: "0.75rem", color: "#0ea5e9", marginTop: "0.25rem" }}>
            Case ID: {caseId}
          </p>
        )}
      </div>

      {/* Quick Reference Info */}
      <div style={{
        marginBottom: "1rem", padding: "0.75rem", borderRadius: "10px",
        border: "1px solid #e2e8f0", background: "#f8fafc"
      }}>
        <div style={{ fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.85rem" }}>
          📚 Guideline Sources
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          {Object.entries(SOURCE_INFO).map(([key, info]) => (
            <div key={key} style={{
              fontSize: "0.75rem", padding: "0.3rem 0.5rem", borderRadius: "6px",
              background: `${info.color}15`, border: `1px solid ${info.color}40`, color: info.color
            }}>
              <strong>{key}</strong>: {info.description}
            </div>
          ))}
        </div>
        <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.5rem", fontStyle: "italic" }}>
          Note: Access ODG, MCG, and InterQual through your organization's subscription portals. Document your findings below.
        </p>
      </div>

      {/* Reference Count */}
      <div style={{
        marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>
          {references.length} guideline reference(s) documented
        </span>
        <button
          onClick={addReference}
          disabled={readOnly}
          style={{
            padding: "0.35rem 0.75rem", borderRadius: "6px", border: "1px solid #0ea5e9",
            background: readOnly ? "#f1f5f9" : "#f0f9ff", color: readOnly ? "#94a3b8" : "#0369a1", fontSize: "0.78rem", cursor: readOnly ? "not-allowed" : "pointer"
          }}
        >
          + Add Guideline Reference
        </button>
      </div>

      {/* References List */}
      {references.length === 0 ? (
        <div style={{
          padding: "2rem", textAlign: "center", borderRadius: "10px",
          border: "2px dashed #e2e8f0", color: "#94a3b8"
        }}>
          <p style={{ marginBottom: "0.5rem" }}>No guideline references documented yet.</p>
          <button
            onClick={addReference}
            disabled={readOnly}
            style={{
              padding: "0.4rem 1rem", borderRadius: "6px", border: "none",
              background: readOnly ? "#94a3b8" : "#0f2a6a", color: "#ffffff", fontSize: "0.8rem", cursor: readOnly ? "not-allowed" : "pointer"
            }}
          >
            Add First Reference
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {references.map((ref, index) => {
            const isExpanded = activeReference === index;
            const sourceInfo = SOURCE_INFO[ref.sourceType];
            
            return (
              <div
                key={index}
                style={{
                  borderRadius: "10px",
                  border: isExpanded ? "2px solid #0ea5e9" : "1px solid #e2e8f0",
                  background: "#ffffff",
                  overflow: "hidden"
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: "0.75rem", display: "flex", justifyContent: "space-between",
                    alignItems: "center", cursor: "pointer",
                    background: isExpanded ? "#f0f9ff" : "transparent"
                  }}
                  onClick={() => setActiveReference(isExpanded ? null : index)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{
                      padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem",
                      fontWeight: 600, background: `${sourceInfo.color}20`, color: sourceInfo.color
                    }}>
                      {ref.sourceType}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                      {ref.guidelineTitle || ref.guidelineCode || `Reference #${index + 1}`}
                    </span>
                    {ref.deviatesFromGuideline && (
                      <span style={{
                        padding: "0.15rem 0.4rem", borderRadius: "4px", fontSize: "0.7rem",
                        background: "#fef3c7", color: "#92400e", fontWeight: 600
                      }}>
                        ⚠️ DEVIATION
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeReference(index); }}
                      style={{
                        padding: "0.2rem 0.5rem", borderRadius: "4px", border: "1px solid #fecaca",
                        background: "#fef2f2", color: "#dc2626", fontSize: "0.75rem", cursor: "pointer"
                      }}
                    >
                      Remove
                    </button>
                    <span style={{ fontSize: "1rem", color: "#94a3b8" }}>
                      {isExpanded ? "▼" : "▶"}
                    </span>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div style={{ padding: "0.75rem", borderTop: "1px solid #e2e8f0" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      {/* Source Type */}
                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.2rem" }}>
                          Source Type *
                        </label>
                        <select
                          value={ref.sourceType}
                          onChange={(e) => updateReference(index, { sourceType: e.target.value as GuidelineSource })}
                          disabled={readOnly}
                          style={{
                            width: "100%", padding: "0.35rem", borderRadius: "6px",
                            border: "1px solid #cbd5e1", fontSize: "0.8rem"
                          }}
                        >
                          {Object.keys(SOURCE_INFO).map(key => (
                            <option key={key} value={key}>{SOURCE_INFO[key as GuidelineSource].name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Guideline Code */}
                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.2rem" }}>
                          Guideline Code/Section
                        </label>
                        <input
                          type="text"
                          value={ref.guidelineCode}
                          onChange={(e) => updateReference(index, { guidelineCode: e.target.value })}
                          readOnly={readOnly}
                          placeholder="e.g., Cervical.Strain.001"
                          style={{
                            width: "100%", padding: "0.35rem", borderRadius: "6px",
                            border: "1px solid #cbd5e1", fontSize: "0.8rem"
                          }}
                        />
                      </div>

                      {/* Guideline Title */}
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.2rem" }}>
                          Guideline Title/Description
                        </label>
                        <input
                          type="text"
                          value={ref.guidelineTitle}
                          onChange={(e) => updateReference(index, { guidelineTitle: e.target.value })}
                          placeholder="e.g., Cervical Strain/Sprain - Treatment Guidelines"
                          style={{
                            width: "100%", padding: "0.35rem", borderRadius: "6px",
                            border: "1px solid #cbd5e1", fontSize: "0.8rem"
                          }}
                        />
                      </div>

                      {/* Guideline Recommendation */}
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.2rem" }}>
                          Guideline Recommendation
                        </label>
                        <textarea
                          value={ref.guidelineRecommendation}
                          onChange={(e) => updateReference(index, { guidelineRecommendation: e.target.value })}
                          readOnly={readOnly}
                          placeholder="What does the guideline recommend? (e.g., RTW in 2-4 weeks, PT 2x/week for 4 weeks)"
                          rows={3}
                          style={{
                            width: "100%", padding: "0.35rem", borderRadius: "6px",
                            border: "1px solid #cbd5e1", fontSize: "0.8rem", resize: "vertical"
                          }}
                        />
                      </div>

                      {/* Relevance Notes */}
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.2rem" }}>
                          How This Applies to This Case
                        </label>
                        <textarea
                          value={ref.relevanceNotes}
                          onChange={(e) => updateReference(index, { relevanceNotes: e.target.value })}
                          placeholder="Explain how this guideline relates to this client's situation..."
                          rows={2}
                          style={{
                            width: "100%", padding: "0.35rem", borderRadius: "6px",
                            border: "1px solid #cbd5e1", fontSize: "0.8rem", resize: "vertical"
                          }}
                        />
                      </div>
                    </div>

                    {/* Deviation Section */}
                    <div style={{
                      marginTop: "1rem", padding: "0.75rem", borderRadius: "8px",
                      border: ref.deviatesFromGuideline ? "2px solid #f59e0b" : "1px solid #e2e8f0",
                      background: ref.deviatesFromGuideline ? "#fffbeb" : "#f8fafc"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <input
                          type="checkbox"
                          id={`deviation-${index}`}
                          checked={ref.deviatesFromGuideline}
                          onChange={(e) => updateReference(index, { deviatesFromGuideline: e.target.checked })}
                          disabled={readOnly}
                        />
                        <label htmlFor={`deviation-${index}`} style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                          ⚠️ Treatment plan DEVIATES from this guideline
                        </label>
                      </div>

                      {ref.deviatesFromGuideline && (
                        <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.75rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.2rem", color: "#92400e" }}>
                              Deviation Rationale * (Required)
                            </label>
                            <textarea
                              value={ref.deviationRationale}
                              onChange={(e) => updateReference(index, { deviationRationale: e.target.value })}
                              placeholder="Explain why the standard guideline doesn't fit this client's situation..."
                              rows={3}
                              style={{
                                width: "100%", padding: "0.35rem", borderRadius: "6px",
                                border: "1px solid #fbbf24", fontSize: "0.8rem", resize: "vertical"
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.2rem", color: "#92400e" }}>
                              Alternative Approach
                            </label>
                            <textarea
                              value={ref.alternativeApproach}
                              onChange={(e) => updateReference(index, { alternativeApproach: e.target.value })}
                              readOnly={readOnly}
                              placeholder="What are you recommending instead?"
                              rows={2}
                              style={{
                                width: "100%", padding: "0.35rem", borderRadius: "6px",
                                border: "1px solid #fbbf24", fontSize: "0.8rem", resize: "vertical"
                              }}
                            />
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.2rem" }}>
                                4Ps Justification
                              </label>
                              <textarea
                                value={ref.fourpsJustification}
                                onChange={(e) => updateReference(index, { fourpsJustification: e.target.value })}
                                placeholder="How do 4Ps scores justify deviation?"
                                rows={3}
                                style={{
                                  width: "100%", padding: "0.35rem", borderRadius: "6px",
                                  border: "1px solid #cbd5e1", fontSize: "0.75rem", resize: "vertical"
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.2rem" }}>
                                SDOH Justification
                              </label>
                              <textarea
                                value={ref.sdohJustification}
                                onChange={(e) => updateReference(index, { sdohJustification: e.target.value })}
                                readOnly={readOnly}
                                placeholder="How do SDOH factors justify deviation?"
                                rows={3}
                                style={{
                                  width: "100%", padding: "0.35rem", borderRadius: "6px",
                                  border: "1px solid #cbd5e1", fontSize: "0.75rem", resize: "vertical"
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.2rem" }}>
                                Clinical Justification
                              </label>
                              <textarea
                                value={ref.clinicalJustification}
                                onChange={(e) => updateReference(index, { clinicalJustification: e.target.value })}
                                placeholder="Clinical reasoning for deviation"
                                rows={3}
                                style={{
                                  width: "100%", padding: "0.35rem", borderRadius: "6px",
                                  border: "1px solid #cbd5e1", fontSize: "0.75rem", resize: "vertical"
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Save Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem" }}>
        <button
          onClick={handleSave}
          disabled={saving || readOnly}
          title={readOnly ? RN_VIEW_ONLY_TOOLTIP : undefined}
          style={{
            padding: "0.45rem 1rem", borderRadius: "999px", border: "none",
            background: saving || readOnly ? "#94a3b8" : "#0f2a6a", color: "#ffffff",
            fontSize: "0.8rem", cursor: saving || readOnly ? "not-allowed" : "pointer"
          }}
        >
          {saving ? "Saving..." : "Save Guideline References"}
        </button>
        {status && (
          <div style={{
            fontSize: "0.76rem",
            color: status.startsWith("✓") ? "#16a34a" : status.startsWith("Error") ? "#dc2626" : "#0369a1"
          }}>
            {status}
          </div>
        )}
      </div>

      <div style={{ marginTop: "1rem", fontSize: "0.7rem", color: "#94a3b8", textAlign: "right" }}>
        💾 Data saves to Supabase (rc_guideline_references table)
        {carePlanId && ` • Care Plan ID: ${carePlanId.slice(0, 8)}...`}
      </div>
    </div>
  );
};

export default GuidelinesReferenceScreen;
