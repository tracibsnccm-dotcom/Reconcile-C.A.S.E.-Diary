// src/screens/client/ClientCheckinScreen.tsx
// Client 4Ps wellness check-in supporting both routine check-ins and case review assessments

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

type SeverityScore = 1 | 2 | 3 | 4 | 5;
type AssessmentType = "check_in" | "case_review";

interface FourPScores {
  physical: SeverityScore | null;
  psychological: SeverityScore | null;
  psychosocial: SeverityScore | null;
  professional: SeverityScore | null;
}

interface FourPNotes {
  physical: string;
  psychological: string;
  psychosocial: string;
  professional: string;
}

const SCORE_LABELS: Record<SeverityScore, { label: string; description: string; color: string }> = {
  1: { label: "Crisis", description: "Immediate intervention needed", color: "#dc2626" },
  2: { label: "At Risk", description: "Significant concerns", color: "#f97316" },
  3: { label: "Struggling", description: "Some challenges present", color: "#eab308" },
  4: { label: "Stable", description: "Managing well", color: "#22c55e" },
  5: { label: "Thriving", description: "Doing great", color: "#10b981" },
};

const FOUR_P_DEFINITIONS = {
  physical: {
    title: "Physical Wellness",
    icon: "💪",
    description: "Your physical health, energy levels, sleep, pain, and ability to perform daily activities.",
    prompts: [
      "How is your pain level?",
      "Are you able to sleep well?",
      "Do you have enough energy for daily activities?",
      "Are you able to attend medical appointments?",
    ]
  },
  psychological: {
    title: "Psychological Wellness",
    icon: "🧠",
    description: "Your mental and emotional health, including mood, stress, anxiety, and coping.",
    prompts: [
      "How is your mood overall?",
      "Are you feeling anxious or worried?",
      "Are you able to cope with stress?",
      "Do you feel hopeful about recovery?",
    ]
  },
  psychosocial: {
    title: "Psychosocial Wellness",
    icon: "👥",
    description: "Your relationships, social support, living situation, and connection with others.",
    prompts: [
      "Do you have people who support you?",
      "Are you able to maintain relationships?",
      "How is your living situation?",
      "Do you feel connected to others?",
    ]
  },
  professional: {
    title: "Professional Wellness",
    icon: "💼",
    description: "Your work, financial stability, and ability to meet daily responsibilities.",
    prompts: [
      "How is your work/employment situation?",
      "Are you able to manage finances?",
      "Can you handle daily responsibilities?",
      "Do you have concerns about your career?",
    ]
  }
};

const ClientCheckinScreen: React.FC = () => {
  const [step, setStep] = useState<'intro' | 'physical' | 'psychological' | 'psychosocial' | 'professional' | 'review' | 'complete'>('intro');
  const [scores, setScores] = useState<FourPScores>({
    physical: null,
    psychological: null,
    psychosocial: null,
    professional: null,
  });
  const [notes, setNotes] = useState<FourPNotes>({
    physical: '',
    psychological: '',
    psychosocial: '',
    professional: '',
  });
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('check_in');
  const [carePlanId, setCarePlanId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const caseId = typeof window !== 'undefined' ? window.localStorage.getItem("rcms_active_case_id") : null;

  // Parse URL params for assessment type and care plan ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const cpId = params.get('care_plan_id');
    
    if (type === 'case_review') {
      setAssessmentType('case_review');
    }
    if (cpId) {
      setCarePlanId(cpId);
    }
  }, []);

  const stepOrder: ('physical' | 'psychological' | 'psychosocial' | 'professional')[] = [
    'physical', 'psychological', 'psychosocial', 'professional'
  ];

  const currentStepIndex = stepOrder.indexOf(step as any);

  const handleScoreSelect = (pillar: keyof FourPScores, score: SeverityScore) => {
    setScores(prev => ({ ...prev, [pillar]: score }));
  };

  const handleNext = () => {
    if (step === 'intro') {
      setStep('physical');
    } else if (step === 'professional') {
      setStep('review');
    } else {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < stepOrder.length) {
        setStep(stepOrder[nextIndex]);
      }
    }
  };

  const handleBack = () => {
    if (step === 'physical') {
      setStep('intro');
    } else if (step === 'review') {
      setStep('professional');
    } else {
      const prevIndex = currentStepIndex - 1;
      if (prevIndex >= 0) {
        setStep(stepOrder[prevIndex]);
      }
    }
  };

  const handleSubmit = async () => {
    if (!caseId) {
      setStatus("No case selected.");
      return;
    }

    if (!scores.physical || !scores.psychological || !scores.psychosocial || !scores.professional) {
      setStatus("Please complete all sections.");
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      const checkinData = {
        case_id: caseId,
        assessment_type: assessmentType,
        care_plan_id: carePlanId,
        fourp_physical: scores.physical,
        fourp_psychological: scores.psychological,
        fourp_psychosocial: scores.psychosocial,
        fourp_professional: scores.professional,
        physical_notes: notes.physical || null,
        psychological_notes: notes.psychological || null,
        psychosocial_notes: notes.psychosocial || null,
        professional_notes: notes.professional || null,
      };

      await supabaseFetch('rc_client_checkins', {
        method: 'POST',
        body: JSON.stringify(checkinData),
      });

      // If this was a case review, update the care plan status
      if (assessmentType === 'case_review' && carePlanId) {
        await supabaseFetch(`rc_care_plans?id=eq.${carePlanId}`, {
          method: 'PATCH',
          body: JSON.stringify({ client_assessment_status: 'in_progress' }),
        });
      }

      setStep('complete');
      setStatus("✓ Check-in submitted successfully!");

    } catch (error: any) {
      console.error("Failed to save check-in:", error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const renderScoreSelector = (pillar: keyof FourPScores) => {
    const definition = FOUR_P_DEFINITIONS[pillar];
    const currentScore = scores[pillar];

    return (
      <div>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{definition.icon}</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            {definition.title}
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>
            {definition.description}
          </p>
        </div>

        <div style={{
          background: '#f8fafc',
          borderRadius: '10px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
            Consider these questions:
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#374151' }}>
            {definition.prompts.map((prompt, idx) => (
              <li key={idx} style={{ marginBottom: '0.25rem' }}>{prompt}</li>
            ))}
          </ul>
        </div>

        <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', textAlign: 'center' }}>
          How are you doing in this area right now?
        </div>

        <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {([5, 4, 3, 2, 1] as SeverityScore[]).map(score => {
            const scoreInfo = SCORE_LABELS[score];
            const isSelected = currentScore === score;
            
            return (
              <button
                key={score}
                onClick={() => handleScoreSelect(pillar, score)}
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  border: isSelected ? `3px solid ${scoreInfo.color}` : '2px solid #e2e8f0',
                  background: isSelected ? `${scoreInfo.color}15` : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: scoreInfo.color,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.1rem'
                }}>
                  {score}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{scoreInfo.label}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{scoreInfo.description}</div>
                </div>
                {isSelected && (
                  <div style={{ marginLeft: 'auto', fontSize: '1.25rem' }}>✓</div>
                )}
              </button>
            );
          })}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            Anything you'd like to share about your {pillar} wellness? (optional)
          </label>
          <textarea
            value={notes[pillar]}
            onChange={(e) => setNotes(prev => ({ ...prev, [pillar]: e.target.value }))}
            placeholder="Share any details that might help your care team understand your situation..."
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '0.9rem',
              resize: 'vertical'
            }}
          />
        </div>
      </div>
    );
  };

  const getProgressWidth = (): string => {
    if (step === 'intro') return '0%';
    if (step === 'complete') return '100%';
    if (step === 'review') return '100%';
    const idx = stepOrder.indexOf(step as any);
    return `${((idx + 1) / stepOrder.length) * 100}%`;
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
    }}>
      {/* Header */}
      <div style={{
        background: '#0f2a6a',
        color: '#ffffff',
        padding: '1rem 1.5rem'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
            {assessmentType === 'case_review' ? 'Care Plan Review' : 'Wellness Check-in'}
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>4Ps Assessment</div>
        </div>
      </div>

      {/* Progress Bar */}
      {step !== 'intro' && step !== 'complete' && (
        <div style={{ background: '#e2e8f0', height: '4px' }}>
          <div style={{
            background: '#0ea5e9',
            height: '100%',
            width: getProgressWidth(),
            transition: 'width 0.3s ease'
          }} />
        </div>
      )}

      {/* Case Review Banner */}
      {assessmentType === 'case_review' && step !== 'complete' && (
        <div style={{
          background: '#fef3c7',
          borderBottom: '1px solid #fcd34d',
          padding: '0.75rem 1.5rem',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: '#92400e'
        }}>
          ⚠️ This assessment is for your <strong>Care Plan Review</strong>. Please answer as accurately as possible.
        </div>
      )}

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem' }}>
        
        {/* INTRO */}
        {step === 'intro' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💚</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              {assessmentType === 'case_review' ? 'Care Plan Review Assessment' : 'Wellness Check-in'}
            </h1>
            <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
              {assessmentType === 'case_review' 
                ? 'Your care team needs your current wellness assessment to develop your updated care plan.'
                : 'Take a moment to reflect on how you\'re doing across four key areas of wellness.'}
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              {stepOrder.map(pillar => (
                <div key={pillar} style={{
                  background: '#ffffff',
                  borderRadius: '10px',
                  padding: '1rem',
                  textAlign: 'center',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                    {FOUR_P_DEFINITIONS[pillar].icon}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {FOUR_P_DEFINITIONS[pillar].title.replace(' Wellness', '')}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleNext}
              style={{
                padding: '0.75rem 2rem',
                borderRadius: '999px',
                border: 'none',
                background: '#0f2a6a',
                color: '#ffffff',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Begin Assessment →
            </button>

            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '1rem' }}>
              This will take about 5 minutes
            </p>
          </div>
        )}

        {/* PILLAR SCREENS */}
        {stepOrder.includes(step as any) && (
          <div>
            {renderScoreSelector(step as keyof FourPScores)}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
              <button
                onClick={handleBack}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                ← Back
              </button>
              <button
                onClick={handleNext}
                disabled={!scores[step as keyof FourPScores]}
                style={{
                  padding: '0.5rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: scores[step as keyof FourPScores] ? '#0f2a6a' : '#94a3b8',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  cursor: scores[step as keyof FourPScores] ? 'pointer' : 'not-allowed'
                }}
              >
                {step === 'professional' ? 'Review →' : 'Next →'}
              </button>
            </div>
          </div>
        )}

        {/* REVIEW */}
        {step === 'review' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', textAlign: 'center' }}>
              Review Your Assessment
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b', textAlign: 'center', marginBottom: '1.5rem' }}>
              Please confirm your wellness ratings before submitting.
            </p>

            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {stepOrder.map(pillar => {
                const score = scores[pillar];
                const scoreInfo = score ? SCORE_LABELS[score] : null;
                const definition = FOUR_P_DEFINITIONS[pillar];

                return (
                  <div
                    key={pillar}
                    onClick={() => setStep(pillar)}
                    style={{
                      background: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '1.5rem' }}>{definition.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{definition.title}</div>
                      {notes[pillar] && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                          Note added
                        </div>
                      )}
                    </div>
                    {scoreInfo && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: scoreInfo.color,
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.9rem'
                        }}>
                          {score}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: scoreInfo.color, fontWeight: 600 }}>
                          {scoreInfo.label}
                        </div>
                      </div>
                    )}
                    <div style={{ color: '#64748b' }}>✏️</div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={handleBack}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                style={{
                  padding: '0.5rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: saving ? '#94a3b8' : '#22c55e',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'Submitting...' : 'Submit Check-in ✓'}
              </button>
            </div>

            {status && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                borderRadius: '6px',
                background: status.startsWith('✓') ? '#f0fdf4' : '#fef2f2',
                color: status.startsWith('✓') ? '#166534' : '#991b1b',
                fontSize: '0.85rem',
                textAlign: 'center'
              }}>
                {status}
              </div>
            )}
          </div>
        )}

        {/* COMPLETE */}
        {step === 'complete' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem', color: '#166534' }}>
              Assessment Complete!
            </h2>
            <p style={{ fontSize: '1rem', color: '#15803d', marginBottom: '2rem' }}>
              {assessmentType === 'case_review'
                ? 'Your care team will use this assessment to develop your updated care plan.'
                : 'Thank you for checking in. Your care team has been notified.'}
            </p>

            {/* Score Summary */}
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '1.25rem',
              marginBottom: '2rem',
              textAlign: 'left'
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', textAlign: 'center' }}>
                Your Wellness Snapshot
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                {stepOrder.map(pillar => {
                  const score = scores[pillar];
                  const scoreInfo = score ? SCORE_LABELS[score] : null;
                  
                  return (
                    <div key={pillar} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{ fontSize: '1.25rem' }}>{FOUR_P_DEFINITIONS[pillar].icon}</span>
                      {scoreInfo && (
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: scoreInfo.color,
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.75rem'
                        }}>
                          {score}
                        </div>
                      )}
                      <span style={{ fontSize: '0.8rem', color: scoreInfo?.color, fontWeight: 500 }}>
                        {scoreInfo?.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => window.location.href = '/client-portal'}
              style={{
                padding: '0.75rem 2rem',
                borderRadius: '999px',
                border: 'none',
                background: '#0f2a6a',
                color: '#ffffff',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Return to Portal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientCheckinScreen;
