// src/screens/client/MedicationReconciliationScreen.tsx
// Client form for medication reconciliation with "No Changes" confirmation option

import React, { useEffect, useState } from "react";

const SUPABASE_URL = 'https://zmjxyspizdqhrtdcgkwk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptanh5c3BpemRxaHJ0ZGNna3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMjgxODMsImV4cCI6MjA3OTcwNDE4M30.i5rqJXZPSHYFeaA8E26Vh69UPzgCmhrU9zL2kdE8jrM';

async function supabaseFetch(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.method === 'POST' ? 'return=representation' : 'return=minimal',
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

interface Medication {
  id?: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  route: string;
  prescriber: string;
  reason_condition: string;
  start_date: string;
  still_taking: boolean;
  prn: boolean;
  side_effects: string;
  is_otc: boolean;
  is_supplement: boolean;
}

interface PreviousMedRec {
  id: string;
  created_at: string;
  medications: Medication[];
}

type AssessmentType = "check_in" | "case_review";

const EMPTY_MED: Medication = {
  medication_name: '',
  dosage: '',
  frequency: '',
  route: 'oral',
  prescriber: '',
  reason_condition: '',
  start_date: '',
  still_taking: true,
  prn: false,
  side_effects: '',
  is_otc: false,
  is_supplement: false,
};

const FREQUENCY_OPTIONS = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every morning',
  'Every evening',
  'At bedtime',
  'As needed (PRN)',
  'Weekly',
  'Other'
];

const ROUTE_OPTIONS = [
  { value: 'oral', label: 'By mouth (oral)' },
  { value: 'topical', label: 'On skin (topical)' },
  { value: 'injection', label: 'Injection' },
  { value: 'inhaled', label: 'Inhaled' },
  { value: 'sublingual', label: 'Under tongue' },
  { value: 'rectal', label: 'Rectal' },
  { value: 'transdermal', label: 'Patch (transdermal)' },
  { value: 'other', label: 'Other' },
];

interface MedicationReconciliationScreenProps {
  assessmentType?: AssessmentType;
  carePlanId?: string;
}

const MedicationReconciliationScreen: React.FC<MedicationReconciliationScreenProps> = ({ 
  assessmentType = 'check_in',
  carePlanId 
}) => {
  const [step, setStep] = useState<'choice' | 'confirm_no_changes' | 'edit_meds' | 'additional_questions' | 'complete'>('choice');
  const [previousMedRec, setPreviousMedRec] = useState<PreviousMedRec | null>(null);
  const [medications, setMedications] = useState<Medication[]>([{ ...EMPTY_MED }]);
  const [noChangesConfirmed, setNoChangesConfirmed] = useState(false);
  
  // Additional questions
  const [stoppedMedications, setStoppedMedications] = useState('');
  const [troubleAffording, setTroubleAffording] = useState<'yes' | 'no' | ''>('');
  const [allergies, setAllergies] = useState('');
  const [otcSupplements, setOtcSupplements] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const caseId = typeof window !== 'undefined' ? window.localStorage.getItem("rcms_active_case_id") : null;

  // Load previous medication reconciliation
  useEffect(() => {
    async function loadPreviousMedRec() {
      if (!caseId) {
        setLoading(false);
        return;
      }

      try {
        // Get most recent submitted med rec
        const medRecResult = await supabaseFetch(
          `rc_medication_reconciliations?case_id=eq.${caseId}&status=eq.submitted&order=created_at.desc&limit=1`
        );

        if (medRecResult && medRecResult.length > 0) {
          const medRec = medRecResult[0];
          
          // Get medications for this med rec
          const medsResult = await supabaseFetch(
            `rc_medication_items?med_rec_id=eq.${medRec.id}&still_taking=eq.true&order=medication_name`
          );
          
          setPreviousMedRec({
            id: medRec.id,
            created_at: medRec.created_at,
            medications: medsResult || []
          });
        } else {
          // No previous med rec - go straight to edit
          setStep('edit_meds');
        }
      } catch (error) {
        console.error("Failed to load previous med rec:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPreviousMedRec();
  }, [caseId]);

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
  };

  const handleNoChanges = () => {
    setStep('confirm_no_changes');
  };

  const handleYesChanges = () => {
    // Copy previous meds to editable list
    if (previousMedRec && previousMedRec.medications.length > 0) {
      setMedications(previousMedRec.medications.map(m => ({ ...m })));
    }
    setStep('edit_meds');
  };

  const handleConfirmNoChanges = () => {
    if (!noChangesConfirmed) {
      setStatus("Please check the confirmation box.");
      return;
    }
    setStep('additional_questions');
  };

  const addMedication = () => {
    setMedications(prev => [...prev, { ...EMPTY_MED }]);
  };

  const removeMedication = (index: number) => {
    setMedications(prev => prev.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof Medication, value: any) => {
    setMedications(prev => prev.map((med, i) => 
      i === index ? { ...med, [field]: value } : med
    ));
  };

  const handleSubmitMeds = () => {
    // Validate at least one medication or explicit "none"
    const hasValidMeds = medications.some(m => m.medication_name.trim());
    if (!hasValidMeds && medications.length > 0) {
      // Remove empty medications
      const validMeds = medications.filter(m => m.medication_name.trim());
      if (validMeds.length === 0) {
        setMedications([]);
      } else {
        setMedications(validMeds);
      }
    }
    setStep('additional_questions');
  };

  const handleFinalSubmit = async () => {
    if (!caseId) {
      setStatus("No case selected.");
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      // Create med rec record
      const medRecData = {
        case_id: caseId,
        assessment_type: assessmentType,
        care_plan_id: carePlanId || null,
        copied_from_previous: step === 'confirm_no_changes' || (previousMedRec && noChangesConfirmed),
        copied_from_id: noChangesConfirmed && previousMedRec ? previousMedRec.id : null,
        no_changes_confirmed: noChangesConfirmed,
        no_changes_confirmed_at: noChangesConfirmed ? new Date().toISOString() : null,
        status: 'submitted',
      };

      const medRecResult = await supabaseFetch('rc_medication_reconciliations', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify(medRecData),
      });

      if (!medRecResult || medRecResult.length === 0) {
        throw new Error("Failed to create medication reconciliation");
      }

      const medRecId = medRecResult[0].id;

      // Insert medications
      const medsToSave = noChangesConfirmed && previousMedRec 
        ? previousMedRec.medications 
        : medications.filter(m => m.medication_name.trim());

      if (medsToSave.length > 0) {
        const medItems = medsToSave.map(med => ({
          med_rec_id: medRecId,
          medication_name: med.medication_name,
          dosage: med.dosage || null,
          frequency: med.frequency || null,
          route: med.route || 'oral',
          prescriber: med.prescriber || null,
          reason_condition: med.reason_condition || null,
          start_date: med.start_date || null,
          still_taking: med.still_taking ?? true,
          prn: med.prn ?? false,
          side_effects: med.side_effects || null,
          is_otc: med.is_otc ?? false,
          is_supplement: med.is_supplement ?? false,
        }));

        await supabaseFetch('rc_medication_items', {
          method: 'POST',
          body: JSON.stringify(medItems),
        });
      }

      // TODO: Save additional questions to a separate table or as JSON in med rec

      setStep('complete');
      setStatus("✓ Medication reconciliation submitted successfully!");

    } catch (error: any) {
      console.error("Failed to save med rec:", error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        Loading medication information...
      </div>
    );
  }

  // Completion screen
  if (step === 'complete') {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          background: '#f0fdf4',
          border: '2px solid #86efac',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#166534' }}>
            Medication Reconciliation Complete
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#15803d', marginBottom: '1.5rem' }}>
            Your medication information has been submitted to your care team.
          </p>
          <button
            onClick={() => window.location.href = '/client-portal'}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              background: '#0f2a6a',
              color: '#ffffff',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Return to Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.25rem' }}>
          Medication Reconciliation
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          {assessmentType === 'case_review' 
            ? 'Please update your medication list for your care plan review.'
            : 'Keep your medication list current for accurate care coordination.'}
        </p>
        {assessmentType === 'case_review' && (
          <div style={{
            marginTop: '0.5rem',
            padding: '0.5rem 0.75rem',
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: '6px',
            fontSize: '0.8rem',
            color: '#92400e'
          }}>
            ⚠️ This is for your <strong>Care Plan Review</strong>. Please ensure your medication list is accurate.
          </div>
        )}
      </div>

      {/* Step: Choice (if has previous) */}
      {step === 'choice' && previousMedRec && (
        <div>
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0369a1', marginBottom: '0.5rem' }}>
              Your Previous Medication List
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
              Last updated: {formatDate(previousMedRec.created_at)}
            </div>
            
            {previousMedRec.medications.length > 0 ? (
              <div style={{ 
                background: '#ffffff', 
                borderRadius: '8px', 
                padding: '0.75rem',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {previousMedRec.medications.map((med, idx) => (
                  <div key={idx} style={{ 
                    padding: '0.5rem 0',
                    borderBottom: idx < previousMedRec.medications.length - 1 ? '1px solid #e2e8f0' : 'none',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ fontWeight: 600 }}>{med.medication_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {med.dosage && `${med.dosage} • `}
                      {med.frequency && `${med.frequency}`}
                      {med.prn && ' (as needed)'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                No medications on file.
              </div>
            )}
          </div>

          <div style={{ 
            fontSize: '1rem', 
            fontWeight: 600, 
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            Has anything changed with your medications since {formatDate(previousMedRec.created_at)}?
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '1rem',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            <button
              onClick={handleNoChanges}
              style={{
                padding: '1.5rem 1rem',
                borderRadius: '10px',
                border: '2px solid #22c55e',
                background: '#f0fdf4',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#166534',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ✓ No Changes<br />
              <span style={{ fontWeight: 400, fontSize: '0.8rem' }}>Same medications</span>
            </button>
            <button
              onClick={handleYesChanges}
              style={{
                padding: '1.5rem 1rem',
                borderRadius: '10px',
                border: '2px solid #f59e0b',
                background: '#fffbeb',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#92400e',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ✏️ Yes, Update<br />
              <span style={{ fontWeight: 400, fontSize: '0.8rem' }}>Edit my medications</span>
            </button>
          </div>
        </div>
      )}

      {/* Step: Confirm No Changes */}
      {step === 'confirm_no_changes' && previousMedRec && (
        <div>
          <div style={{
            background: '#f0fdf4',
            border: '2px solid #86efac',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#166534', marginBottom: '0.75rem' }}>
              ✓ Confirming No Changes to Your Medications
            </div>
            
            <div style={{ 
              background: '#ffffff', 
              borderRadius: '8px', 
              padding: '0.75rem',
              marginBottom: '1rem'
            }}>
              {previousMedRec.medications.map((med, idx) => (
                <div key={idx} style={{ 
                  padding: '0.4rem 0',
                  borderBottom: idx < previousMedRec.medications.length - 1 ? '1px solid #e2e8f0' : 'none',
                  fontSize: '0.85rem'
                }}>
                  <span style={{ fontWeight: 600 }}>{med.medication_name}</span>
                  <span style={{ color: '#64748b' }}>
                    {med.dosage && ` - ${med.dosage}`}
                    {med.frequency && `, ${med.frequency}`}
                  </span>
                </div>
              ))}
            </div>

            <label style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '0.5rem', 
              cursor: 'pointer',
              padding: '0.75rem',
              background: '#dcfce7',
              borderRadius: '6px'
            }}>
              <input
                type="checkbox"
                checked={noChangesConfirmed}
                onChange={(e) => setNoChangesConfirmed(e.target.checked)}
                style={{ marginTop: '0.2rem', width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '0.85rem', color: '#166534' }}>
                <strong>I confirm</strong> that this medication list is still accurate and complete as of today. 
                I have not started, stopped, or changed any medications since my last update.
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={() => setStep('choice')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              ← Back
            </button>
            <button
              onClick={handleConfirmNoChanges}
              disabled={!noChangesConfirmed}
              style={{
                padding: '0.5rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                background: noChangesConfirmed ? '#22c55e' : '#94a3b8',
                color: '#ffffff',
                fontSize: '0.85rem',
                cursor: noChangesConfirmed ? 'pointer' : 'not-allowed'
              }}
            >
              Confirm & Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step: Edit Medications */}
      {step === 'edit_meds' && (
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>
            Your Current Medications
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
            Include all prescription medications, over-the-counter drugs, vitamins, and supplements.
          </p>

          {medications.map((med, idx) => (
            <div key={idx} style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '0.75rem'
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Medication {idx + 1}
                </div>
                {medications.length > 1 && (
                  <button
                    onClick={() => removeMedication(idx)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      border: '1px solid #fecaca',
                      background: '#fef2f2',
                      color: '#dc2626',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    Medication Name *
                  </label>
                  <input
                    type="text"
                    value={med.medication_name}
                    onChange={(e) => updateMedication(idx, 'medication_name', e.target.value)}
                    placeholder="e.g., Lisinopril"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={med.dosage}
                    onChange={(e) => updateMedication(idx, 'dosage', e.target.value)}
                    placeholder="e.g., 10mg"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    Frequency
                  </label>
                  <select
                    value={med.frequency}
                    onChange={(e) => updateMedication(idx, 'frequency', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="">Select...</option>
                    {FREQUENCY_OPTIONS.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    How Taken
                  </label>
                  <select
                    value={med.route}
                    onChange={(e) => updateMedication(idx, 'route', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.85rem'
                    }}
                  >
                    {ROUTE_OPTIONS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    Prescriber
                  </label>
                  <input
                    type="text"
                    value={med.prescriber}
                    onChange={(e) => updateMedication(idx, 'prescriber', e.target.value)}
                    placeholder="Doctor's name"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    Reason/Condition
                  </label>
                  <input
                    type="text"
                    value={med.reason_condition}
                    onChange={(e) => updateMedication(idx, 'reason_condition', e.target.value)}
                    placeholder="e.g., High blood pressure"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  Any Side Effects?
                </label>
                <input
                  type="text"
                  value={med.side_effects}
                  onChange={(e) => updateMedication(idx, 'side_effects', e.target.value)}
                  placeholder="Describe any side effects you've experienced"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                  <input
                    type="checkbox"
                    checked={med.is_otc}
                    onChange={(e) => updateMedication(idx, 'is_otc', e.target.checked)}
                  />
                  Over-the-counter
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                  <input
                    type="checkbox"
                    checked={med.is_supplement}
                    onChange={(e) => updateMedication(idx, 'is_supplement', e.target.checked)}
                  />
                  Vitamin/Supplement
                </label>
              </div>
            </div>
          ))}

          <button
            onClick={addMedication}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '2px dashed #cbd5e1',
              background: '#ffffff',
              fontSize: '0.85rem',
              color: '#64748b',
              cursor: 'pointer',
              width: '100%',
              marginBottom: '1.5rem'
            }}
          >
            + Add Another Medication
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {previousMedRec && (
              <button
                onClick={() => setStep('choice')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                ← Back
              </button>
            )}
            <button
              onClick={handleSubmitMeds}
              style={{
                padding: '0.5rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                background: '#0f2a6a',
                color: '#ffffff',
                fontSize: '0.85rem',
                cursor: 'pointer',
                marginLeft: previousMedRec ? '0' : 'auto'
              }}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step: Additional Questions */}
      {step === 'additional_questions' && (
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>
            Additional Questions
          </div>

          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Have you stopped taking any medications recently?
            </label>
            <textarea
              value={stoppedMedications}
              onChange={(e) => setStoppedMedications(e.target.value)}
              placeholder="List any medications you've stopped, and why (if known)"
              rows={2}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '0.85rem',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Do you have trouble affording or obtaining any of your medications?
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {['yes', 'no'].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setTroubleAffording(v as 'yes' | 'no')}
                  style={{
                    padding: '0.4rem 1rem',
                    borderRadius: '6px',
                    border: troubleAffording === v ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
                    background: troubleAffording === v ? '#f0f9ff' : '#ffffff',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  {v === 'yes' ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Do you have any medication allergies?
            </label>
            <textarea
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="List any medications you are allergic to and the reaction"
              rows={2}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '0.85rem',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={() => setStep(noChangesConfirmed ? 'confirm_no_changes' : 'edit_meds')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              ← Back
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={saving}
              style={{
                padding: '0.5rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                background: saving ? '#94a3b8' : '#22c55e',
                color: '#ffffff',
                fontSize: '0.85rem',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Submitting...' : 'Submit Medication List'}
            </button>
          </div>

          {status && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              borderRadius: '6px',
              background: status.startsWith('✓') ? '#f0fdf4' : '#fef2f2',
              color: status.startsWith('✓') ? '#166534' : '#991b1b',
              fontSize: '0.85rem'
            }}>
              {status}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicationReconciliationScreen;
