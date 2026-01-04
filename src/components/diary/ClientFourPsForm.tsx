import React, { useState } from 'react';

interface PhysicalData {
  physicalComfort: number;
  abilityManageTasks: number;
  tasksHarder: string[];
  discomfortMovement: number;
  physicalEnergy: number;
  changeFromYesterday: number;
  notes: string;
}

interface PsychologicalData {
  emotionalComfort: number;
  abilityCopeStress: number;
  mentalClarity: number;
  changeFromYesterday: number;
  emotionalExperiences: string[];
  crisisRisk: number;
  notes: string;
}

interface PsychosocialData {
  senseConnection: number;
  abilityCommunicate: number;
  supportAvailability: number;
  basicNeedsSafety: number;
  basicNeedsConcerns: string[];
  personalSafety: number;
  ipvQuestion: number | null; // null means not answered (optional)
  changeFromYesterday: number;
  notes: string;
}

interface ProfessionalData {
  workTaskCompletion: number;
  workEfficiency: number;
  workloadManageability: number;
  workEnergyLevel: number;
  changeFromYesterday: number;
  notes: string;
}

interface FormData {
  physical: PhysicalData;
  psychological: PsychologicalData;
  psychosocial: PsychosocialData;
  professional: ProfessionalData;
}

interface UpcomingAppointment {
  id: string;
  date: string;
  time: string;
  provider: string;
  type: string;
}

interface ScoringResult {
  wellnessGap: 'physical' | 'psychological' | 'psychosocial' | 'professional';
  lowestScore: number;
  scores: {
    physical: number;
    psychological: number;
    psychosocial: number;
    professional: number;
  };
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  monitoringFrequency: string;
  providerNotification: boolean;
  safetyFlagged: boolean;
  crisisFlagged: boolean;
  ipvFlagged: boolean;
  recommendations: string[];
  upcomingAppointments: UpcomingAppointment[];
}

export const ClientFourPsForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showResults, setShowResults] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    physical: {
      physicalComfort: 3,
      abilityManageTasks: 3,
      tasksHarder: [],
      discomfortMovement: 3,
      physicalEnergy: 3,
      changeFromYesterday: 3,
      notes: ''
    },
    psychological: {
      emotionalComfort: 3,
      abilityCopeStress: 3,
      mentalClarity: 3,
      changeFromYesterday: 3,
      emotionalExperiences: [],
      crisisRisk: 3,
      notes: ''
    },
    psychosocial: {
      senseConnection: 3,
      abilityCommunicate: 3,
      supportAvailability: 3,
      basicNeedsSafety: 3,
      basicNeedsConcerns: [],
      personalSafety: 5,
      ipvQuestion: null, // Optional - starts as null
      changeFromYesterday: 3,
      notes: ''
    },
    professional: {
      workTaskCompletion: 3,
      workEfficiency: 3,
      workloadManageability: 3,
      workEnergyLevel: 3,
      changeFromYesterday: 3,
      notes: ''
    }
  });
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);

  // Mock upcoming appointments - in production this would come from backend
  const mockUpcomingAppointments: UpcomingAppointment[] = [
    {
      id: '1',
      date: '2024-01-05',
      time: '2:00 PM',
      provider: 'Dr. Smith (Primary Care)',
      type: 'Follow-up'
    },
    {
      id: '2',
      date: '2024-01-12',
      time: '10:30 AM',
      provider: 'Physical Therapy',
      type: 'Treatment Session'
    }
  ];

  const getScoreColor = (score: number): string => {
    if (score >= 5) return '#10b981'; // Green
    if (score >= 4) return '#86efac'; // Light green
    if (score >= 3) return '#eab308'; // Yellow
    if (score >= 2) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const getStabilityLevel = (score: number): string => {
    if (score >= 5) return 'Excellent';
    if (score >= 4) return 'Good';
    if (score >= 3) return 'Moderate';
    if (score >= 2) return 'Emergent';
    return 'Critical';
  };

  const getRiskDefinition = (level: string): string => {
    const definitions: Record<string, string> = {
      'Critical': 'Immediate crisis requiring emergency intervention within 24 hours. Your safety and wellbeing are at immediate risk.',
      'High': 'Urgent situation requiring professional attention within 48-72 hours. Rapid deterioration is possible without intervention.',
      'Moderate': 'Concerning pattern requiring close monitoring and professional consultation within 1 week. Early intervention can prevent escalation.',
      'Low': 'Stable situation with routine monitoring recommended. Continue current care plan and document any changes.'
    };
    return definitions[level] || '';
  };

  const calculateScores = (): ScoringResult => {
    // Calculate average for each domain - using Math.floor for whole numbers only
    const physicalAvg = (
      formData.physical.physicalComfort +
      formData.physical.abilityManageTasks +
      formData.physical.discomfortMovement +
      formData.physical.physicalEnergy +
      formData.physical.changeFromYesterday
    ) / 5;

    const psychologicalAvg = (
      formData.psychological.emotionalComfort +
      formData.psychological.abilityCopeStress +
      formData.psychological.mentalClarity +
      formData.psychological.crisisRisk +
      formData.psychological.changeFromYesterday
    ) / 5;

    // Psychosocial scoring with IPV override logic
    let psychosocialScore: number;
    const ipvFlagged = formData.psychosocial.ipvQuestion === 1;
    
    if (ipvFlagged) {
      // If IPV question answered YES (1), entire section scores as 1
      psychosocialScore = 1;
    } else {
      // Normal calculation - only include ipvQuestion if it was answered
      const ipvValue = formData.psychosocial.ipvQuestion !== null ? formData.psychosocial.ipvQuestion : 5;
      const psychosocialAvg = (
        formData.psychosocial.senseConnection +
        formData.psychosocial.abilityCommunicate +
        formData.psychosocial.supportAvailability +
        formData.psychosocial.basicNeedsSafety +
        formData.psychosocial.personalSafety +
        ipvValue +
        formData.psychosocial.changeFromYesterday
      ) / 7;
      psychosocialScore = Math.floor(psychosocialAvg);
    }

    const professionalAvg = (
      formData.professional.workTaskCompletion +
      formData.professional.workEfficiency +
      formData.professional.workloadManageability +
      formData.professional.workEnergyLevel +
      formData.professional.changeFromYesterday
    ) / 5;

    // Use Math.floor to keep scores at whole number levels
    const scores = {
      physical: Math.floor(physicalAvg),
      psychological: Math.floor(psychologicalAvg),
      psychosocial: psychosocialScore,
      professional: Math.floor(professionalAvg)
    };

    // Check for safety and crisis flags
    const safetyFlagged = formData.psychosocial.personalSafety <= 2;
    const crisisFlagged = formData.psychological.crisisRisk <= 2;

    const pillars = [
      { name: 'physical' as const, score: scores.physical },
      { name: 'psychological' as const, score: scores.psychological },
      { name: 'psychosocial' as const, score: scores.psychosocial },
      { name: 'professional' as const, score: scores.professional }
    ];

    const wellnessGapObj = pillars.reduce((prev, current) => 
      current.score < prev.score ? current : prev
    );

    const lowestScore = wellnessGapObj.score;
    
    // If safety, crisis, or IPV flagged, force to Critical
    let riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Low';
    let monitoringFrequency = 'Every 2-3 days as needed';
    
    if (safetyFlagged || crisisFlagged || ipvFlagged) {
      riskLevel = 'Critical';
      monitoringFrequency = 'Three times daily (morning, afternoon, evening) until safety plan is in place';
    } else if (lowestScore <= 1) {
      riskLevel = 'Critical';
      monitoringFrequency = 'Three times daily (morning, afternoon, evening)';
    } else if (lowestScore === 2) {
      riskLevel = 'High';
      monitoringFrequency = 'Twice daily (morning and evening)';
    } else if (lowestScore === 3) {
      riskLevel = 'Moderate';
      monitoringFrequency = 'Daily';
    } else if (lowestScore === 4) {
      riskLevel = 'Low';
      monitoringFrequency = 'Every 2-3 days';
    }

    // Provider notification ONLY for Physical or Psychological scores ≤ 3
    // Psychosocial and Professional offer resources/callbacks but NO auto provider notification
    const providerNotification = (scores.physical <= 3) || (scores.psychological <= 3);

    const recommendations = generateRecommendations(wellnessGapObj.name, lowestScore, safetyFlagged, crisisFlagged, ipvFlagged);

    return {
      wellnessGap: wellnessGapObj.name,
      lowestScore,
      scores,
      riskLevel,
      monitoringFrequency,
      providerNotification,
      safetyFlagged,
      crisisFlagged,
      ipvFlagged,
      recommendations,
      upcomingAppointments: mockUpcomingAppointments
    };
  };

  const generateRecommendations = (domain: string, score: number, safetyFlagged: boolean, crisisFlagged: boolean, ipvFlagged: boolean): string[] => {
    const recs: string[] = [];
    
    if (crisisFlagged) {
      recs.push('🚨 CRISIS ALERT: If you are in immediate danger or having thoughts of harming yourself, call 911 or 988 (Suicide & Crisis Lifeline) right now.');
      recs.push('📞 988 Suicide & Crisis Lifeline (24/7, free, confidential)');
      recs.push('💬 Crisis Text Line: Text HOME to 741741');
      recs.push('🏥 Go to your nearest emergency room if you cannot keep yourself safe');
    }
    
    if (safetyFlagged || ipvFlagged) {
      recs.push('🚨 SAFETY CONCERN: If you are in immediate danger, call 911 now. You deserve to feel safe.');
      recs.push('📞 National Domestic Violence Hotline: 1-800-799-7233 (24/7)');
      recs.push('💬 Text "START" to 88788 for confidential text support');
      recs.push('📄 Download Safety Resources guide for local and national support options');
      recs.push('☎️ Private consultation available with RN Care Manager: (682) 556-8472 - All conversations are confidential');
    }
    
    if (domain === 'physical') {
      if (score <= 1) {
        recs.push('🚨 URGENT: Seek emergency medical attention immediately or call 911');
        recs.push('📞 Contact your primary care physician today');
        recs.push('📋 Document all symptoms in detail - this is critical legal evidence');
      } else if (score === 2) {
        recs.push('📞 Schedule urgent appointment with your doctor within 48 hours');
        recs.push('💊 Review pain management plan with your provider');
        recs.push('📸 Take photos of visible symptoms or injuries');
      } else if (score === 3) {
        recs.push('👨‍⚕️ Your treating provider will be notified of your status');
        recs.push('📅 Schedule follow-up appointment within 1 week');
        recs.push('📝 Keep detailed daily symptom log');
      }
    } else if (domain === 'psychological') {
      if (score <= 1) {
        recs.push('🚨 CRISIS: Call 988 Suicide & Crisis Lifeline immediately');
        recs.push('🏥 Go to nearest emergency room or call 911 if in immediate danger');
        recs.push('👥 Do not be alone - contact someone you trust right now');
      } else if (score === 2) {
        recs.push('📞 Contact your therapist or psychiatrist within 24-48 hours');
        recs.push('🆘 Crisis support available: 988 or text HOME to 741741');
        recs.push('👨‍👩‍👧 Reach out to your support system today');
      } else if (score === 3) {
        recs.push('👨‍⚕️ Your mental health provider will be notified');
        recs.push('📅 Schedule therapy session this week');
        recs.push('🧘 Practice daily self-care and coping strategies');
      }
    } else if (domain === 'psychosocial') {
      if (score <= 1) {
        recs.push('🏠 URGENT: Contact local social services or 211 for emergency assistance');
        recs.push('🍽️ Access emergency food resources immediately');
        recs.push('🚨 Your care team will coordinate emergency support');
      } else if (score === 2) {
        recs.push('📞 Connect with social worker within 48 hours');
        recs.push('🏘️ Explore community resources and support programs');
        recs.push('🚗 Address transportation barriers urgently');
      } else if (score === 3) {
        recs.push('🤝 Strengthen your support network - reach out to 2-3 people this week');
        recs.push('🏘️ Research local community resources');
        recs.push('📋 Document social barriers for your legal case');
      }
    } else if (domain === 'professional') {
      if (score <= 1) {
        recs.push('💼 URGENT: File for emergency unemployment or disability benefits today');
        recs.push('💰 Contact financial assistance programs immediately');
        recs.push('📞 Speak with your attorney about lost income documentation');
      } else if (score === 2) {
        recs.push('💼 Explore disability benefits options this week');
        recs.push('💵 Create emergency financial plan');
        recs.push('📄 Document all lost wages and work limitations');
      } else if (score === 3) {
        recs.push('💰 Review budget and financial resources');
        recs.push('💼 Track all work limitations and accommodations needed');
        recs.push('📋 Keep detailed records of financial impact and lost income');
      }
    }

    if (!safetyFlagged && !crisisFlagged && !ipvFlagged && recs.length === 0) {
      recs.push('✅ You are doing well in this area. Continue your current care plan.');
      recs.push('📝 Keep documenting your progress for your legal case');
    }

    return recs;
  };

  const handleSubmit = () => {
    const result = calculateScores();
    setScoringResult(result);
    setShowResults(true);
    
    const entry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      formData,
      result
    };
    
    const existingEntries = JSON.parse(localStorage.getItem('diaryEntries') || '[]');
    existingEntries.push(entry);
    localStorage.setItem('diaryEntries', JSON.stringify(existingEntries));

    // Log notifications for RN dashboard
    if (result.ipvFlagged) {
      console.log('🚨 CRITICAL IPV ALERT: Client indicated feeling unsafe in relationships');
      console.log('Entry ID:', entry.id);
      console.log('Timestamp:', entry.date);
    }
    if (result.safetyFlagged) {
      console.log('🚨 CRITICAL SAFETY ALERT: Client flagged personal safety concerns');
      console.log('Entry ID:', entry.id);
      console.log('Timestamp:', entry.date);
    }
    if (result.crisisFlagged) {
      console.log('🚨 CRITICAL CRISIS ALERT: Client at risk of self-harm');
      console.log('Entry ID:', entry.id);
      console.log('Timestamp:', entry.date);
    }
    if (result.providerNotification) {
      console.log(`🔔 PROVIDER NOTIFICATION: ${result.wellnessGap} wellness at ${result.riskLevel} risk level`);
    }
  };

  const QuestionSlider = ({ 
    label, 
    value, 
    onChange, 
    lowText, 
    highText 
  }: { 
    label: string; 
    value: number; 
    onChange: (val: number) => void;
    lowText: string;
    highText: string;
  }) => (
    <div style={{ marginBottom: '28px' }}>
      <label style={{ display: 'block', fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="range"
            min="1"
            max="5"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            style={{ width: '100%', height: '8px', cursor: 'pointer', accentColor: getScoreColor(value) }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            <span>{lowText}</span>
            <span>{highText}</span>
          </div>
        </div>
        <div style={{
          minWidth: '60px',
          textAlign: 'center',
          padding: '10px 18px',
          borderRadius: '10px',
          background: `linear-gradient(135deg, ${getScoreColor(value)} 0%, ${getScoreColor(value)}dd 100%)`,
          color: 'white',
          fontWeight: 'bold',
          fontSize: '20px',
          boxShadow: '0 3px 8px rgba(0,0,0,0.15)'
        }}>
          {value}
        </div>
      </div>
    </div>
  );

  const CheckboxGroup = ({ 
    options, 
    selected, 
    onChange 
  }: { 
    options: string[]; 
    selected: string[]; 
    onChange: (vals: string[]) => void;
  }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginTop: '12px' }}>
      {options.map(option => (
        <label key={option} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', borderRadius: '6px', background: selected.includes(option) ? '#f0f9ff' : 'transparent', border: selected.includes(option) ? '2px solid #3b82f6' : '2px solid transparent' }}>
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={(e) => {
              if (e.target.checked) {
                onChange([...selected, option]);
              } else {
                onChange(selected.filter(s => s !== option));
              }
            }}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '14px', color: '#374151' }}>{option}</span>
        </label>
      ))}
    </div>
  );

  if (showResults && scoringResult) {
    return (
      <div style={{
        background: (scoringResult.safetyFlagged || scoringResult.crisisFlagged || scoringResult.ipvFlagged) ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px',
        borderRadius: '24px',
        color: 'white',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ 
          background: 'rgba(255,255,255,0.97)', 
          borderRadius: '20px', 
          padding: '40px',
          color: '#1f2937'
        }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center', color: '#1f2937' }}>
            📊 Your Wellness Assessment
          </h2>

          {/* Crisis Alert if flagged */}
          {scoringResult.crisisFlagged && (
            <div style={{
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              border: '3px solid #dc2626',
              borderRadius: '16px',
              padding: '32px',
              marginBottom: '32px',
              boxShadow: '0 8px 24px rgba(220, 38, 38, 0.2)'
            }}>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#991b1b' }}>
                🚨 Crisis Resources - Help is Available Now
              </h3>
              <p style={{ fontSize: '16px', marginBottom: '20px', color: '#7f1d1d', lineHeight: '1.6', fontWeight: '600' }}>
                If you are in immediate danger or having thoughts of harming yourself, please reach out for help right now:
              </p>
              
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ fontSize: '16px', color: '#1f2937' }}>📞 988 Suicide & Crisis Lifeline (24/7):</strong>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626', marginTop: '8px' }}>Call or Text 988</div>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Free, confidential support for people in distress</p>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ fontSize: '16px', color: '#1f2937' }}>💬 Crisis Text Line:</strong>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626', marginTop: '8px' }}>Text HOME to 741741</div>
                </div>
                <div>
                  <strong style={{ fontSize: '16px', color: '#1f2937' }}>🚨 Emergency:</strong>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626', marginTop: '8px' }}>Call 911</div>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Or go to your nearest emergency room</p>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '16px', fontStyle: 'italic', textAlign: 'center' }}>
                🔒 All calls and texts are confidential and free
              </p>
            </div>
          )}

          {/* IPV/Safety Alert if flagged */}
          {(scoringResult.safetyFlagged || scoringResult.ipvFlagged) && !scoringResult.crisisFlagged && (
            <div style={{
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              border: '3px solid #dc2626',
              borderRadius: '16px',
              padding: '32px',
              marginBottom: '32px',
              boxShadow: '0 8px 24px rgba(220, 38, 38, 0.2)'
            }}>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#991b1b' }}>
                🚨 Safety Resources Available
              </h3>
              <p style={{ fontSize: '16px', marginBottom: '20px', color: '#7f1d1d', lineHeight: '1.6' }}>
                You deserve to feel safe. Confidential help is available 24/7.
              </p>
              
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ fontSize: '16px', color: '#1f2937' }}>📞 National Domestic Violence Hotline (24/7):</strong>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626', marginTop: '8px' }}>1-800-799-7233</div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ fontSize: '16px', color: '#1f2937' }}>💬 Text Support:</strong>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626', marginTop: '8px' }}>Text "START" to 88788</div>
                </div>
                <div>
                  <strong style={{ fontSize: '16px', color: '#1f2937' }}>🚨 Emergency:</strong>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626', marginTop: '8px' }}>Call 911</div>
                </div>
              </div>

              <button
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginBottom: '12px',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                }}
              >
                📄 Download Safety Resources (National & Local)
              </button>

              <div style={{ background: '#fef3c7', padding: '16px', borderRadius: '10px', border: '2px solid #f59e0b' }}>
                <p style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: '#92400e' }}>
                  Optional: Confidential Consultation with RN Care Manager
                </p>
                <p style={{ fontSize: '14px', color: '#78350f', marginBottom: '16px', lineHeight: '1.6' }}>
                  If you would like to speak privately with an RN Care Manager about local resources and support options, all conversations are completely confidential and will not be disclosed unless you specifically authorize it.
                </p>
                <button
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginBottom: '12px',
                    boxShadow: '0 3px 8px rgba(245, 158, 11, 0.3)'
                  }}
                >
                  📞 Request Private RN Callback
                </button>
                <div style={{ fontSize: '13px', color: '#78350f' }}>
                  <strong>Office Hours:</strong> Mon-Sat, 9am-9pm CST<br/>
                  <strong>Phone:</strong> (682) 556-8472
                </div>
              </div>

              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '16px', fontStyle: 'italic', textAlign: 'center' }}>
                🔒 All communications are confidential
              </p>
            </div>
          )}

          {/* Risk Level Badge */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '32px',
            padding: '28px',
            background: scoringResult.riskLevel === 'Critical' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
                       scoringResult.riskLevel === 'High' ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' :
                       scoringResult.riskLevel === 'Moderate' ? 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' :
                       'linear-gradient(135deg, #86efac 0%, #10b981 100%)',
            borderRadius: '16px',
            color: 'white',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: '52px', fontWeight: 'bold', marginBottom: '8px' }}>
              {scoringResult.lowestScore}/5
            </div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', marginBottom: '16px' }}>
              {scoringResult.riskLevel} Risk Level
            </div>
            <div style={{ fontSize: '15px', opacity: 0.95, maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
              {getRiskDefinition(scoringResult.riskLevel)}
            </div>
          </div>

          {/* Wellness Gap */}
          <div style={{ 
            background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
            padding: '24px',
            borderRadius: '16px',
            marginBottom: '24px',
            color: 'white',
            boxShadow: '0 4px 12px rgba(251, 146, 60, 0.3)'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>
              🎯 Primary Wellness Gap
            </h3>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>
              <strong style={{ textTransform: 'capitalize' }}>{scoringResult.wellnessGap}</strong> wellness (Score: {scoringResult.scores[scoringResult.wellnessGap]}/5)
            </p>
            <p style={{ fontSize: '14px', opacity: 0.95 }}>
              Addressing this area first will create the foundation for improvements in other areas
            </p>
          </div>

          {/* All Domain Scores */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {(['physical', 'psychological', 'psychosocial', 'professional'] as const).map(domain => {
              const score = scoringResult.scores[domain];
              const isGap = scoringResult.wellnessGap === domain;
              return (
                <div key={domain} style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  border: isGap ? '3px solid #fb923c' : '2px solid #e5e7eb',
                  boxShadow: isGap ? '0 6px 16px rgba(251, 146, 60, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
                  position: 'relative'
                }}>
                  {isGap && (
                    <div style={{
                      position: 'absolute',
                      top: '-12px',
                      right: '12px',
                      background: '#fb923c',
                      color: 'white',
                      padding: '6px 14px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                    }}>
                      ⚠️ PRIMARY GAP
                    </div>
                  )}
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'capitalize', marginBottom: '12px', color: '#1f2937' }}>{domain}</h4>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: getScoreColor(score), marginBottom: '8px' }}>
                    {score}
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e5e7eb', borderRadius: '3px', marginBottom: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${(score / 5) * 100}%`, height: '100%', background: getScoreColor(score), transition: 'width 0.5s' }} />
                  </div>
                  <p style={{ fontSize: '13px', color: getScoreColor(score), fontWeight: '600' }}>
                    {getStabilityLevel(score)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Monitoring Frequency */}
          <div style={{ 
            background: '#f0f9ff',
            border: '2px solid #3b82f6',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', color: '#1e40af' }}>
              📅 Recommended Monitoring Schedule
            </h3>
            <p style={{ fontSize: '16px', color: '#1f2937', fontWeight: '600' }}>
              {scoringResult.monitoringFrequency}
            </p>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
              Consistent documentation builds stronger legal evidence and helps track your recovery
            </p>
          </div>

          {/* Provider Notification */}
          {scoringResult.providerNotification && (
            <div style={{ 
              background: '#fef3c7',
              border: '2px solid #f59e0b',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', color: '#92400e' }}>
                🔔 Provider Notification Sent
              </h3>
              <p style={{ fontSize: '15px', color: '#78350f', marginBottom: '12px' }}>
                Your treating provider has been automatically notified of your {scoringResult.scores.physical <= 3 ? 'physical' : 'psychological'} wellness status at {scoringResult.riskLevel.toLowerCase()} risk level. They will follow up with you according to their care protocol.
              </p>
              <p style={{ fontSize: '13px', color: '#78350f', fontStyle: 'italic' }}>
                Note: Provider notifications are sent for physical or psychological wellness scores of 3 or below to ensure timely medical intervention and support.
              </p>
            </div>
          )}

          {/* Upcoming Appointments */}
          {scoringResult.upcomingAppointments.length > 0 && (
            <div style={{
              background: '#f0fdf4',
              border: '2px solid #10b981',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', color: '#065f46' }}>
                📅 Upcoming Appointments
              </h3>
              <p style={{ fontSize: '14px', color: '#047857', marginBottom: '16px' }}>
                You will receive a reminder 48-72 hours before each appointment to check if you need transportation assistance or have any barriers to attending.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {scoringResult.upcomingAppointments.map(apt => (
                  <div key={apt.id} style={{
                    background: 'white',
                    border: '2px solid #d1fae5',
                    padding: '16px',
                    borderRadius: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                          {apt.provider}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          {apt.type}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#059669' }}>
                          {new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          {apt.time}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {scoringResult.recommendations.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
                💡 Recommended Action Steps
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {scoringResult.recommendations.map((rec, idx) => (
                  <div 
                    key={idx}
                    style={{
                      background: 'white',
                      border: '2px solid #e5e7eb',
                      padding: '16px',
                      borderRadius: '12px',
                      fontSize: '15px',
                      lineHeight: '1.6',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                  >
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RN Care Manager Contact */}
          {!scoringResult.safetyFlagged && !scoringResult.crisisFlagged && !scoringResult.ipvFlagged && (
            <div style={{
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              border: '2px solid #3b82f6',
              padding: '24px',
              borderRadius: '16px',
              marginBottom: '32px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', color: '#1e40af' }}>
                💬 Questions or Concerns?
              </h3>
              <p style={{ fontSize: '15px', color: '#1f2937', marginBottom: '16px', lineHeight: '1.6' }}>
                If you have questions about your care, treatment, or appointments, our RN Care Managers are here to help.
              </p>
              <div style={{ fontSize: '14px', color: '#374151' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>📞 Phone:</strong> (682) 556-8472
                </div>
                <div>
                  <strong>🕐 Hours:</strong> Monday-Saturday, 9am-9pm CST
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setShowResults(false);
                setCurrentStep(1);
                setFormData({
                  physical: { physicalComfort: 3, abilityManageTasks: 3, tasksHarder: [], discomfortMovement: 3, physicalEnergy: 3, changeFromYesterday: 3, notes: '' },
                  psychological: { emotionalComfort: 3, abilityCopeStress: 3, mentalClarity: 3, changeFromYesterday: 3, emotionalExperiences: [], crisisRisk: 3, notes: '' },
                  psychosocial: { senseConnection: 3, abilityCommunicate: 3, supportAvailability: 3, basicNeedsSafety: 3, basicNeedsConcerns: [], personalSafety: 5, ipvQuestion: null, changeFromYesterday: 3, notes: '' },
                  professional: { workTaskCompletion: 3, workEfficiency: 3, workloadManageability: 3, workEnergyLevel: 3, changeFromYesterday: 3, notes: '' }
                });
              }}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '18px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
              }}
            >
              ✏️ Create Next Entry
            </button>
            <button
              onClick={() => window.print()}
              style={{
                padding: '18px 28px',
                background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)'
              }}
            >
              🖨️ Print
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Form rendering with all 4 steps
  return (
    <div>
      {/* Progress Bar */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          {['Physical', 'Psychological', 'Psychosocial', 'Professional'].map((label, idx) => (
            <div key={label} style={{ 
              fontSize: '13px', 
              color: currentStep === idx + 1 ? '#fb923c' : currentStep > idx + 1 ? '#10b981' : '#9ca3af',
              fontWeight: currentStep === idx + 1 ? 'bold' : 'normal',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              flex: '1',
              minWidth: '80px'
            }}>
              <span style={{
                display: 'inline-block',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: currentStep === idx + 1 ? 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)' : 
                           currentStep > idx + 1 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#e5e7eb',
                color: currentStep > idx ? 'white' : '#9ca3af',
                textAlign: 'center',
                lineHeight: '36px',
                fontSize: '15px',
                fontWeight: 'bold',
                boxShadow: currentStep >= idx + 1 ? '0 3px 10px rgba(0,0,0,0.15)' : 'none'
              }}>
                {currentStep > idx + 1 ? '✓' : idx + 1}
              </span>
              <span style={{ fontSize: '12px', textAlign: 'center' }}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ 
          width: '100%', 
          height: '12px', 
          background: '#e5e7eb',
          borderRadius: '6px',
          overflow: 'hidden',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            width: `${(currentStep / 4) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #fb923c 0%, #f97316 100%)',
            transition: 'width 0.3s ease',
            boxShadow: '0 0 10px rgba(251, 146, 60, 0.5)'
          }} />
        </div>
      </div>

      {/* Step 1: Physical Wellness */}
      {currentStep === 1 && (
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>
            1. Physical Wellness
          </h2>
          <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '32px' }}>
            Document your physical health, comfort, and functional abilities today
          </p>

          <QuestionSlider
            label="How would you rate your overall physical comfort today?"
            value={formData.physical.physicalComfort}
            onChange={(val) => setFormData({ ...formData, physical: { ...formData.physical, physicalComfort: val } })}
            lowText="No comfort"
            highText="Excellent comfort"
          />

          <QuestionSlider
            label="How able do you feel to manage your everyday tasks today?"
            value={formData.physical.abilityManageTasks}
            onChange={(val) => setFormData({ ...formData, physical: { ...formData.physical, abilityManageTasks: val } })}
            lowText="Not able"
            highText="Fully able"
          />

          {formData.physical.abilityManageTasks <= 3 && (
            <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '12px', marginBottom: '28px', border: '2px solid #f59e0b' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '12px', color: '#92400e' }}>
                Which tasks were harder than usual today? (Select all that apply)
              </label>
              <CheckboxGroup
                options={[
                  'Getting dressed',
                  'Bathing/showering',
                  'Getting in/out of bed',
                  'Standing from a chair',
                  'Walking short distances',
                  'Carrying items',
                  'Reaching overhead',
                  'Bending/twisting',
                  'Household tasks',
                  'Driving/transportation',
                  'Work-related tasks',
                  'Other'
                ]}
                selected={formData.physical.tasksHarder}
                onChange={(vals) => setFormData({ ...formData, physical: { ...formData.physical, tasksHarder: vals } })}
              />
            </div>
          )}

          <QuestionSlider
            label="How would you rate your physical discomfort when moving your body today?"
            value={formData.physical.discomfortMovement}
            onChange={(val) => setFormData({ ...formData, physical: { ...formData.physical, discomfortMovement: val } })}
            lowText="Severe discomfort"
            highText="No discomfort"
          />

          <QuestionSlider
            label="How would you rate your physical energy level today?"
            value={formData.physical.physicalEnergy}
            onChange={(val) => setFormData({ ...formData, physical: { ...formData.physical, physicalEnergy: val } })}
            lowText="No energy"
            highText="Excellent energy"
          />

          <QuestionSlider
            label="Compared to yesterday, how would you rate your physical condition today?"
            value={formData.physical.changeFromYesterday}
            onChange={(val) => setFormData({ ...formData, physical: { ...formData.physical, changeFromYesterday: val } })}
            lowText="Much worse"
            highText="Much better"
          />

          <div style={{ marginTop: '32px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#374151', fontSize: '16px' }}>
              Additional Details & Context
            </label>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px', fontStyle: 'italic' }}>
              Use this space to provide any additional details that help your nurse understand your situation and make appropriate referrals
            </p>
            <textarea
              value={formData.physical.notes}
              onChange={(e) => setFormData({ ...formData, physical: { ...formData.physical, notes: e.target.value } })}
              placeholder="Example: Describe pain patterns, medication effects, activities attempted, how symptoms affected your day, conversations with providers..."
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '15px',
                minHeight: '140px',
                fontFamily: 'inherit',
                resize: 'vertical',
                lineHeight: '1.6'
              }}
            />
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px', textAlign: 'right' }}>
              {formData.physical.notes.length} characters
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Psychological Wellness */}
      {currentStep === 2 && (
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>
            2. Psychological / Emotional Wellness
          </h2>
          <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '32px' }}>
            Document your emotional health, mental clarity, and ability to cope today
          </p>

          <QuestionSlider
            label="How would you rate your overall emotional comfort today?"
            value={formData.psychological.emotionalComfort}
            onChange={(val) => setFormData({ ...formData, psychological: { ...formData.psychological, emotionalComfort: val } })}
            lowText="No emotional comfort"
            highText="Excellent emotional comfort"
          />

          {formData.psychological.emotionalComfort <= 3 && (
            <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '12px', marginBottom: '28px', border: '2px solid #f59e0b' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '12px', color: '#92400e' }}>
                Which emotional experiences were harder than usual today? (Select all that apply)
              </label>
              <CheckboxGroup
                options={[
                  'Feeling overwhelmed',
                  'Feeling anxious or tense',
                  'Feeling sad or low',
                  'Feeling frustrated or irritable',
                  'Feeling disconnected or numb',
                  'Difficulty relaxing',
                  'Other'
                ]}
                selected={formData.psychological.emotionalExperiences}
                onChange={(vals) => setFormData({ ...formData, psychological: { ...formData.psychological, emotionalExperiences: vals } })}
              />
            </div>
          )}

          <QuestionSlider
            label="How able do you feel to cope with stress or challenges today?"
            value={formData.psychological.abilityCopeStress}
            onChange={(val) => setFormData({ ...formData, psychological: { ...formData.psychological, abilityCopeStress: val } })}
            lowText="Not able"
            highText="Fully able"
          />

          <QuestionSlider
            label="How would you rate your ability to think clearly and focus today?"
            value={formData.psychological.mentalClarity}
            onChange={(val) => setFormData({ ...formData, psychological: { ...formData.psychological, mentalClarity: val } })}
            lowText="Not able to focus"
            highText="Excellent clarity and focus"
          />

          <QuestionSlider
            label="How safe do you feel from thoughts of harming yourself today?"
            value={formData.psychological.crisisRisk}
            onChange={(val) => setFormData({ ...formData, psychological: { ...formData.psychological, crisisRisk: val } })}
            lowText="Not safe at all"
            highText="Completely safe"
          />

          {formData.psychological.crisisRisk <= 2 && (
            <div style={{
              background: '#fef2f2',
              border: '3px solid #dc2626',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '28px'
            }}>
              <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', color: '#991b1b' }}>
                🚨 Crisis Support Available Now
              </h4>
              <p style={{ fontSize: '15px', color: '#7f1d1d', marginBottom: '16px', lineHeight: '1.6' }}>
                If you are having thoughts of harming yourself or are in crisis, please reach out for help immediately:
              </p>
              <div style={{ background: 'white', padding: '16px', borderRadius: '10px', marginBottom: '12px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#1f2937' }}>📞 988 Suicide & Crisis Lifeline:</strong>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626', marginTop: '4px' }}>
                    Call or Text 988 (24/7, Free, Confidential)
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#1f2937' }}>💬 Crisis Text Line:</strong>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#dc2626', marginTop: '4px' }}>
                    Text HOME to 741741
                  </div>
                </div>
                <div>
                  <strong style={{ color: '#1f2937' }}>🚨 Emergency:</strong>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626', marginTop: '4px' }}>
                    Call 911 or go to your nearest ER
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic', textAlign: 'center' }}>
                You are not alone. Help is available 24/7.
              </p>
            </div>
          )}

          <QuestionSlider
            label="Compared to yesterday, how would you rate your emotional well-being today?"
            value={formData.psychological.changeFromYesterday}
            onChange={(val) => setFormData({ ...formData, psychological: { ...formData.psychological, changeFromYesterday: val } })}
            lowText="Much worse"
            highText="Much better"
          />

          <div style={{ marginTop: '32px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#374151', fontSize: '16px' }}>
              Additional Details & Context
            </label>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px', fontStyle: 'italic' }}>
              Use this space to provide any additional details that help your nurse understand your situation and make appropriate referrals
            </p>
            <textarea
              value={formData.psychological.notes}
              onChange={(e) => setFormData({ ...formData, psychological: { ...formData.psychological, notes: e.target.value } })}
              placeholder="Example: Describe mood patterns, sleep quality, coping strategies tried, triggers encountered, therapy sessions..."
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '15px',
                minHeight: '140px',
                fontFamily: 'inherit',
                resize: 'vertical',
                lineHeight: '1.6'
              }}
            />
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px', textAlign: 'right' }}>
              {formData.psychological.notes.length} characters
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Psychosocial Wellness */}
      {currentStep === 3 && (
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>
            3. Psychosocial Wellness
          </h2>
          <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '32px' }}>
            Document your social connections, support system, and basic needs today
          </p>

          <QuestionSlider
            label="How connected do you feel to the people who matter to you today?"
            value={formData.psychosocial.senseConnection}
            onChange={(val) => setFormData({ ...formData, psychosocial: { ...formData.psychosocial, senseConnection: val } })}
            lowText="Not connected"
            highText="Very connected"
          />

          <QuestionSlider
            label="How able do you feel to express your needs or ask for help today?"
            value={formData.psychosocial.abilityCommunicate}
            onChange={(val) => setFormData({ ...formData, psychosocial: { ...formData.psychosocial, abilityCommunicate: val } })}
            lowText="Not able"
            highText="Fully able"
          />

          <QuestionSlider
            label="How supported do you feel by the people around you today?"
            value={formData.psychosocial.supportAvailability}
            onChange={(val) => setFormData({ ...formData, psychosocial: { ...formData.psychosocial, supportAvailability: val } })}
            lowText="Not supported"
            highText="Fully supported"
          />

          <QuestionSlider
            label="How secure do you feel with your basic needs (food, housing, transportation) today?"
            value={formData.psychosocial.basicNeedsSafety}
            onChange={(val) => setFormData({ ...formData, psychosocial: { ...formData.psychosocial, basicNeedsSafety: val } })}
            lowText="Very insecure"
            highText="Very secure"
          />

          {formData.psychosocial.basicNeedsSafety <= 3 && (
            <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '12px', marginBottom: '28px', border: '2px solid #f59e0b' }}>
              <div style={{ background: '#fefce8', padding: '16px', borderRadius: '10px', marginBottom: '16px', border: '2px solid #eab308' }}>
                <p style={{ fontSize: '14px', color: '#713f12', lineHeight: '1.6', marginBottom: '8px' }}>
                  <strong>🔒 Confidential Information:</strong> All information you provide is completely confidential and secure.
                </p>
                <p style={{ fontSize: '14px', color: '#713f12', lineHeight: '1.6' }}>
                  If you need assistance with any basic needs, we can provide community support referrals to help you access resources in your area.
                </p>
              </div>
              
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '12px', color: '#92400e' }}>
                Which basic needs felt harder to meet today? (Select all that apply)
              </label>
              <CheckboxGroup
                options={[
                  'Food/groceries',
                  'Safe housing',
                  'Transportation to appointments/work',
                  'Childcare/daycare',
                  'Financial resources',
                  'Other'
                ]}
                selected={formData.psychosocial.basicNeedsConcerns}
                onChange={(vals) => setFormData({ ...formData, psychosocial: { ...formData.psychosocial, basicNeedsConcerns: vals } })}
              />
            </div>
          )}

          <QuestionSlider
            label="How safe do you feel in your personal relationships and home environment today?"
            value={formData.psychosocial.personalSafety}
            onChange={(val) => setFormData({ ...formData, psychosocial: { ...formData.psychosocial, personalSafety: val } })}
            lowText="Not safe at all"
            highText="Completely safe"
          />

          {formData.psychosocial.personalSafety <= 2 && (
            <div style={{
              background: '#fef2f2',
              border: '3px solid #dc2626',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '28px'
            }}>
              <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', color: '#991b1b' }}>
                🚨 Safety Resources Available
              </h4>
              <p style={{ fontSize: '15px', color: '#7f1d1d', marginBottom: '16px', lineHeight: '1.6' }}>
                You deserve to feel safe. If you are in immediate danger, call 911. Confidential support is also available 24/7:
              </p>
              <div style={{ background: 'white', padding: '16px', borderRadius: '10px', marginBottom: '12px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#1f2937' }}>📞 National Domestic Violence Hotline:</strong>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626', marginTop: '4px' }}>
                    1-800-799-7233 (24/7, Free, Confidential)
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#1f2937' }}>💬 Text Support:</strong>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#dc2626', marginTop: '4px' }}>
                    Text "START" to 88788
                  </div>
                </div>
                <div>
                  <strong style={{ color: '#1f2937' }}>🚨 Emergency:</strong>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626', marginTop: '4px' }}>
                    Call 911 if you are in immediate danger
                  </div>
                </div>
              </div>
              <button
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 3px 8px rgba(220, 38, 38, 0.3)'
                }}
              >
                📄 Download Safety Resources (National & Local Options)
              </button>
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px', fontStyle: 'italic', textAlign: 'center' }}>
                🔒 All communications are confidential
              </p>
            </div>
          )}

          {/* NEW IPV QUESTION - OPTIONAL */}
          <div style={{ background: '#f0f9ff', padding: '24px', borderRadius: '12px', marginTop: '32px', border: '2px solid #3b82f6' }}>
            <div style={{ background: '#dbeafe', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#1e40af', lineHeight: '1.6', fontWeight: '600' }}>
                ℹ️ Optional Question: You may skip this question if you prefer not to answer. Your response will remain completely confidential.
              </p>
            </div>
            
            <label style={{ display: 'block', fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
              Has anyone you are close to made you feel afraid or unsafe recently?
            </label>
            
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setFormData({ ...formData, psychosocial: { ...formData.psychosocial, ipvQuestion: 1 } })}
                style={{
                  padding: '12px 24px',
                  background: formData.psychosocial.ipvQuestion === 1 ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : 'white',
                  color: formData.psychosocial.ipvQuestion === 1 ? 'white' : '#1f2937',
                  border: formData.psychosocial.ipvQuestion === 1 ? 'none' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: formData.psychosocial.ipvQuestion === 1 ? '0 3px 8px rgba(220, 38, 38, 0.3)' : 'none'
                }}
              >
                Yes
              </button>
              <button
                onClick={() => setFormData({ ...formData, psychosocial: { ...formData.psychosocial, ipvQuestion: 5 } })}
                style={{
                  padding: '12px 24px',
                  background: formData.psychosocial.ipvQuestion === 5 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'white',
                  color: formData.psychosocial.ipvQuestion === 5 ? 'white' : '#1f2937',
                  border: formData.psychosocial.ipvQuestion === 5 ? 'none' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: formData.psychosocial.ipvQuestion === 5 ? '0 3px 8px rgba(16, 185, 129, 0.3)' : 'none'
                }}
              >
                No
              </button>
              <button
                onClick={() => setFormData({ ...formData, psychosocial: { ...formData.psychosocial, ipvQuestion: null } })}
                style={{
                  padding: '12px 24px',
                  background: formData.psychosocial.ipvQuestion === null ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' : 'white',
                  color: formData.psychosocial.ipvQuestion === null ? 'white' : '#1f2937',
                  border: formData.psychosocial.ipvQuestion === null ? 'none' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: formData.psychosocial.ipvQuestion === null ? '0 3px 8px rgba(107, 114, 128, 0.3)' : 'none'
                }}
              >
                Prefer not to answer
              </button>
            </div>

            {formData.psychosocial.ipvQuestion === 1 && (
              <div style={{
                background: '#fef2f2',
                border: '2px solid #dc2626',
                padding: '16px',
                borderRadius: '10px',
                marginTop: '16px'
              }}>
                <p style={{ fontSize: '14px', color: '#7f1d1d', marginBottom: '12px', lineHeight: '1.6', fontWeight: '600' }}>
                  We want you to know that help is available. All resources below are confidential:
                </p>
                <div style={{ fontSize: '13px', color: '#991b1b', marginBottom: '8px' }}>
                  📞 <strong>National Hotline:</strong> 1-800-799-7233 (24/7)
                </div>
                <div style={{ fontSize: '13px', color: '#991b1b', marginBottom: '8px' }}>
                  💬 <strong>Text Support:</strong> Text "START" to 88788
                </div>
                <div style={{ fontSize: '13px', color: '#991b1b', marginBottom: '8px' }}>
                  🚨 <strong>Emergency:</strong> Call 911 if in immediate danger
                </div>
                <div style={{ fontSize: '13px', color: '#991b1b' }}>
                  ☎️ <strong>Private RN Consultation:</strong> (682) 556-8472 - Completely confidential, not disclosed without your authorization
                </div>
              </div>
            )}
          </div>

          <QuestionSlider
            label="Compared to yesterday, how would you rate your personal/social well-being today?"
            value={formData.psychosocial.changeFromYesterday}
            onChange={(val) => setFormData({ ...formData, psychosocial: { ...formData.psychosocial, changeFromYesterday: val } })}
            lowText="Much worse"
            highText="Much better"
          />

          <div style={{ marginTop: '32px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#374151', fontSize: '16px' }}>
              Additional Details & Context
            </label>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px', fontStyle: 'italic' }}>
              Use this space to provide any additional details that help your nurse understand your situation and make appropriate referrals
            </p>
            <textarea
              value={formData.psychosocial.notes}
              onChange={(e) => setFormData({ ...formData, psychosocial: { ...formData.psychosocial, notes: e.target.value } })}
              placeholder="Example: Describe social interactions, support system changes, housing concerns, transportation barriers, access to resources..."
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '15px',
                minHeight: '140px',
                fontFamily: 'inherit',
                resize: 'vertical',
                lineHeight: '1.6'
              }}
            />
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px', textAlign: 'right' }}>
              {formData.psychosocial.notes.length} characters
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Professional/Vocational/Educational Wellness */}
      {currentStep === 4 && (
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>
            4. Professional / Vocational / Educational Wellness
          </h2>
          <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '32px' }}>
            Document how your accident/injury/illness has impacted your work, school, or vocational activities
          </p>

          <QuestionSlider
            label="How able are you to complete your normal work tasks since your accident/injury/illness?"
            value={formData.professional.workTaskCompletion}
            onChange={(val) => setFormData({ ...formData, professional: { ...formData.professional, workTaskCompletion: val } })}
            lowText="Not able at all"
            highText="Fully able"
          />

          <QuestionSlider
            label="How would you rate your work efficiency compared to before your accident/injury/illness?"
            value={formData.professional.workEfficiency}
            onChange={(val) => setFormData({ ...formData, professional: { ...formData.professional, workEfficiency: val } })}
            lowText="Much slower/less efficient"
            highText="Same efficiency as before"
          />

          <QuestionSlider
            label="How manageable does your workload feel given your current condition?"
            value={formData.professional.workloadManageability}
            onChange={(val) => setFormData({ ...formData, professional: { ...formData.professional, workloadManageability: val } })}
            lowText="Completely unmanageable"
            highText="Fully manageable"
          />

          <QuestionSlider
            label="How would you rate your energy level for completing work throughout the day?"
            value={formData.professional.workEnergyLevel}
            onChange={(val) => setFormData({ ...formData, professional: { ...formData.professional, workEnergyLevel: val } })}
            lowText="No energy/constant exhaustion"
            highText="Excellent energy throughout day"
          />

          <QuestionSlider
            label="Compared to yesterday, how would you rate your work/vocational well-being today?"
            value={formData.professional.changeFromYesterday}
            onChange={(val) => setFormData({ ...formData, professional: { ...formData.professional, changeFromYesterday: val } })}
            lowText="Much worse"
            highText="Much better"
          />

          <div style={{ marginTop: '32px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#374151', fontSize: '16px' }}>
              Additional Details & Context
            </label>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px', fontStyle: 'italic' }}>
              Use this space to provide any additional details that help your nurse understand your situation and make appropriate referrals
            </p>
            <textarea
              value={formData.professional.notes}
              onChange={(e) => setFormData({ ...formData, professional: { ...formData.professional, notes: e.target.value } })}
              placeholder="Example: Describe work/school impacts, missed days, accommodations needed, financial concerns, lost income, disability applications, vocational barriers..."
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '15px',
                minHeight: '140px',
                fontFamily: 'inherit',
                resize: 'vertical',
                lineHeight: '1.6'
              }}
            />
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px', textAlign: 'right' }}>
              {formData.professional.notes.length} characters
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        marginTop: '48px',
        paddingTop: '24px',
        borderTop: '2px solid #e5e7eb',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          style={{
            padding: '16px 32px',
            background: currentStep === 1 ? '#e5e7eb' : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
            color: currentStep === 1 ? '#9ca3af' : 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '17px',
            fontWeight: 'bold',
            cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
            boxShadow: currentStep === 1 ? 'none' : '0 4px 12px rgba(107, 114, 128, 0.3)',
            minWidth: '140px'
          }}
        >
          ← Previous
        </button>

        {currentStep < 4 ? (
          <button
            onClick={() => setCurrentStep(currentStep + 1)}
            style={{
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '17px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(251, 146, 60, 0.4)',
              minWidth: '140px'
            }}
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            style={{
              padding: '16px 36px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '17px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
              minWidth: '160px'
            }}
          >
            Submit Entry ✓
          </button>
        )}
      </div>
    </div>
  );
};