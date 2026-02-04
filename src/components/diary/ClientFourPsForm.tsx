import React, { useState, useRef } from 'react';

const SCALE_LOW = 'Crisis';
const SCALE_HIGH = 'Optimal';

interface PhysicalData {
  comfort: number;
  adls: number;
  adlsConcerns: string[];
  movementDiscomfort: number;
  energy: number;
  changeFromYesterday: number;
  notes: string;
  photo: string | null;
}

interface PsychologicalData {
  emotionalComfort: number;
  emotionalConcerns: string[];
  coping: number;
  mentalClarity: number;
  changeFromYesterday: number;
  notes: string;
  photo: string | null;
}

interface PsychosocialData {
  connection: number;
  communication: number;
  support: number;
  basicNeedsSafety: number;
  basicNeedsConcerns: string[];
  personalSafetyConcerns: boolean;
  changeFromYesterday: number;
  notes: string;
  photo: string | null;
}

interface ProfessionalData {
  purpose: number;
  motivation: number;
  abilityToAct: number;
  changeFromYesterday: number;
  notes: string;
  photo: string | null;
}

interface FormData {
  physical: PhysicalData;
  psychological: PsychologicalData;
  psychosocial: PsychosocialData;
  professional: ProfessionalData;
}

const cardStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderRadius: '20px',
  padding: '28px 32px',
  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.4)',
};

const accentOrange = '#fb923c';
const gradientOrange = 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)';

function getScoreColor(score: number): string {
  if (score >= 5) return '#10b981';
  if (score >= 4) return '#86efac';
  if (score >= 3) return '#eab308';
  if (score >= 2) return '#f97316';
  return '#ef4444';
}

export const ClientFourPsForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showResults, setShowResults] = useState(false);
  const [showSafetyProtocol, setShowSafetyProtocol] = useState(false);
  const [scores, setScores] = useState<{
    physical: number;
    psychological: number;
    psychosocial: number;
    professional: number;
  } | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const [formData, setFormData] = useState<FormData>({
    physical: {
      comfort: 3,
      adls: 3,
      adlsConcerns: [],
      movementDiscomfort: 3,
      energy: 3,
      changeFromYesterday: 3,
      notes: '',
      photo: null,
    },
    psychological: {
      emotionalComfort: 3,
      emotionalConcerns: [],
      coping: 3,
      mentalClarity: 3,
      changeFromYesterday: 3,
      notes: '',
      photo: null,
    },
    psychosocial: {
      connection: 3,
      communication: 3,
      support: 3,
      basicNeedsSafety: 3,
      basicNeedsConcerns: [],
      personalSafetyConcerns: false,
      changeFromYesterday: 3,
      notes: '',
      photo: null,
    },
    professional: {
      purpose: 3,
      motivation: 3,
      abilityToAct: 3,
      changeFromYesterday: 3,
      notes: '',
      photo: null,
    },
  });

  const handlePhotoChange = (
    section: keyof FormData,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setFormData((prev) => ({
        ...prev,
        [section]: { ...prev[section], photo: dataUrl },
      }));
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (section: keyof FormData) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], photo: null },
    }));
    const input = fileInputRefs.current[section];
    if (input) input.value = '';
  };

  const toggleConcern = (
    section: 'physical' | 'psychological' | 'psychosocial',
    field: 'adlsConcerns' | 'emotionalConcerns' | 'basicNeedsConcerns',
    option: string
  ) => {
    const key = section as keyof FormData;
    const current: string[] =
      section === 'physical'
        ? formData.physical.adlsConcerns
        : section === 'psychological'
          ? formData.psychological.emotionalConcerns
          : formData.psychosocial.basicNeedsConcerns;
    const next = current.includes(option)
      ? current.filter((x) => x !== option)
      : [...current, option];
    setFormData((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: next },
    }));
  };

  const setPersonalSafetyConcerns = (value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      psychosocial: {
        ...prev.psychosocial,
        personalSafetyConcerns: value,
        basicNeedsConcerns: value
          ? Array.from(new Set([...prev.psychosocial.basicNeedsConcerns, 'Personal safety concerns']))
          : prev.psychosocial.basicNeedsConcerns.filter((x) => x !== 'Personal safety concerns'),
      },
    }));
    if (value) setShowSafetyProtocol(true);
  };

  const calculateScores = () => {
    const phys =
      (formData.physical.comfort +
        formData.physical.adls +
        formData.physical.movementDiscomfort +
        formData.physical.energy +
        formData.physical.changeFromYesterday) /
      5;
    const psych =
      (formData.psychological.emotionalComfort +
        formData.psychological.coping +
        formData.psychological.mentalClarity +
        formData.psychological.changeFromYesterday) /
      4;
    const psycho =
      (formData.psychosocial.connection +
        formData.psychosocial.communication +
        formData.psychosocial.support +
        formData.psychosocial.basicNeedsSafety +
        formData.psychosocial.changeFromYesterday) /
      5;
    const prof =
      (formData.professional.purpose +
        formData.professional.motivation +
        formData.professional.abilityToAct +
        formData.professional.changeFromYesterday) /
      4;
    return {
      physical: Math.round(phys * 10) / 10,
      psychological: Math.round(psych * 10) / 10,
      psychosocial: Math.round(psycho * 10) / 10,
      professional: Math.round(prof * 10) / 10,
    };
  };

  const handleSubmit = () => {
    const s = calculateScores();
    setScores(s);
    setShowResults(true);
    const entry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      formData,
      scores: s,
    };
    const existing = JSON.parse(localStorage.getItem('diaryEntries') || '[]');
    existing.push(entry);
    localStorage.setItem('diaryEntries', JSON.stringify(existing));
    if (formData.psychosocial.personalSafetyConcerns) {
      console.log('🚨 SAFETY PROTOCOL: Personal safety concerns indicated. Entry ID:', entry.id);
    }
  };

  const resetForm = () => {
    setShowResults(false);
    setShowSafetyProtocol(false);
    setScores(null);
    setCurrentStep(1);
    setFormData({
      physical: {
        comfort: 3,
        adls: 3,
        adlsConcerns: [],
        movementDiscomfort: 3,
        energy: 3,
        changeFromYesterday: 3,
        notes: '',
        photo: null,
      },
      psychological: {
        emotionalComfort: 3,
        emotionalConcerns: [],
        coping: 3,
        mentalClarity: 3,
        changeFromYesterday: 3,
        notes: '',
        photo: null,
      },
      psychosocial: {
        connection: 3,
        communication: 3,
        support: 3,
        basicNeedsSafety: 3,
        basicNeedsConcerns: [],
        personalSafetyConcerns: false,
        changeFromYesterday: 3,
        notes: '',
        photo: null,
      },
      professional: {
        purpose: 3,
        motivation: 3,
        abilityToAct: 3,
        changeFromYesterday: 3,
        notes: '',
        photo: null,
      },
    });
  };

  const QuestionSlider: React.FC<{
    label: string;
    value: number;
    onChange: (v: number) => void;
  }> = ({ label, value, onChange }) => (
    <div style={{ marginBottom: '24px' }}>
      <label style={{ display: 'block', fontSize: '15px', fontWeight: '600', marginBottom: '10px', color: '#374151' }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px', minWidth: 0 }}>
          <input
            type="range"
            min={1}
            max={5}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
            style={{
              width: '100%',
              height: '10px',
              cursor: 'pointer',
              accentColor: accentOrange,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
            <span>1 — {SCALE_LOW}</span>
            <span>5 — {SCALE_HIGH}</span>
          </div>
        </div>
        <div
          style={{
            minWidth: '56px',
            textAlign: 'center',
            padding: '10px 16px',
            borderRadius: '12px',
            background: gradientOrange,
            color: 'white',
            fontWeight: 'bold',
            fontSize: '20px',
            boxShadow: '0 4px 12px rgba(251, 146, 60, 0.35)',
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );

  const PhotoUpload: React.FC<{ section: keyof FormData; label: string }> = ({ section, label }) => {
    const data = formData[section] as PhysicalData | PsychologicalData | PsychosocialData | ProfessionalData;
    const photo = data.photo;
    return (
      <div style={{ marginTop: '24px' }}>
        <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#374151', fontSize: '15px' }}>
          {label}
        </label>
        <input
          ref={(el) => { fileInputRefs.current[section] = el; }}
          type="file"
          accept="image/*"
          onChange={(e) => handlePhotoChange(section, e)}
          style={{ display: 'none' }}
        />
        {photo ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <img
              src={photo}
              alt="Upload preview"
              style={{
                maxWidth: '160px',
                maxHeight: '120px',
                borderRadius: '12px',
                objectFit: 'cover',
                border: '2px solid #e5e7eb',
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => fileInputRefs.current[section]?.click()}
                style={{
                  padding: '10px 18px',
                  background: '#f3f4f6',
                  border: '2px solid #e5e7eb',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color: '#374151',
                }}
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => removePhoto(section)}
                style={{
                  padding: '10px 18px',
                  background: '#fef2f2',
                  border: '2px solid #fecaca',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color: '#991b1b',
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRefs.current[section]?.click()}
            style={{
              padding: '14px 24px',
              background: 'rgba(251, 146, 60, 0.1)',
              border: '2px dashed ' + accentOrange,
              borderRadius: '12px',
              color: accentOrange,
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%',
              maxWidth: '280px',
            }}
          >
            📷 Add photo (optional)
          </button>
        )}
      </div>
    );
  };

  const SafetyProtocolModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...cardStyle,
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '3px solid #dc2626',
          boxShadow: '0 20px 60px rgba(220, 38, 38, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '16px', color: '#991b1b' }}>
          🚨 Safety Resources — You deserve to feel safe
        </h3>
        <p style={{ fontSize: '15px', color: '#374151', marginBottom: '20px', lineHeight: 1.6 }}>
          If you are in immediate danger, call <strong>911</strong>. Confidential support is available 24/7:
        </p>
        <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '2px solid #fecaca' }}>
          <div style={{ marginBottom: '14px' }}>
            <strong style={{ color: '#1f2937' }}>📞 National Domestic Violence Hotline</strong>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626', marginTop: '4px' }}>1-800-799-7233</div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>24/7, free, confidential</div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <strong style={{ color: '#1f2937' }}>💬 Text support</strong>
            <div style={{ fontSize: '17px', fontWeight: 'bold', color: '#dc2626', marginTop: '4px' }}>Text "START" to 88788</div>
          </div>
          <div>
            <strong style={{ color: '#1f2937' }}>🚨 Emergency</strong>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626', marginTop: '4px' }}>Call 911</div>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic', marginBottom: '20px' }}>
          All communications are confidential. Our RN Care Manager can also provide a private consultation: (682) 556-8472.
        </p>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            padding: '14px',
            background: gradientOrange,
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(251, 146, 60, 0.4)',
          }}
        >
          I understand — continue
        </button>
      </div>
    </div>
  );

  if (showSafetyProtocol) {
    return <SafetyProtocolModal onClose={() => setShowSafetyProtocol(false)} />;
  }

  if (showResults && scores) {
    const domainNames = { physical: 'Physical', psychological: 'Psychological', psychosocial: 'Psychosocial', professional: 'Professional' };
    const vals = Object.entries(scores) as [keyof typeof scores, number][];
    const lowest = vals.reduce((a, b) => (scores[a[0]] <= scores[b[0]] ? a : b));
    return (
      <div style={{ padding: '8px 0' }}>
        <div style={{ ...cardStyle, padding: '36px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937', textAlign: 'center' }}>
            📊 Your 4Ps Wellness Summary
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            {(Object.keys(scores) as (keyof typeof scores)[]).map((d) => (
              <div
                key={d}
                style={{
                  ...cardStyle,
                  padding: '20px',
                  border: lowest[0] === d ? '3px solid ' + accentOrange : '1px solid rgba(0,0,0,0.08)',
                  background: lowest[0] === d ? 'rgba(251, 146, 60, 0.08)' : 'rgba(255,255,255,0.98)',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>{domainNames[d]}</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: getScoreColor(scores[d]) }}>{scores[d]}</div>
                <div style={{ width: '100%', height: '6px', background: '#e5e7eb', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${(scores[d] / 5) * 100}%`, height: '100%', background: getScoreColor(scores[d]), borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: 'linear-gradient(135deg, rgba(251,146,60,0.15) 0%, rgba(249,115,22,0.1) 100%)', padding: '20px', borderRadius: '16px', marginBottom: '24px', border: '2px solid rgba(251,146,60,0.4)' }}>
            <div style={{ fontSize: '14px', color: '#92400e', fontWeight: '600', marginBottom: '6px' }}>Primary wellness gap</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>{domainNames[lowest[0]]} ({scores[lowest[0]]}/5)</div>
          </div>
          {formData.psychosocial.personalSafetyConcerns && (
            <div style={{ background: '#fef2f2', border: '2px solid #fecaca', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
              <div style={{ fontWeight: '600', color: '#991b1b', marginBottom: '8px' }}>🚨 Safety</div>
              <p style={{ fontSize: '14px', color: '#7f1d1d', lineHeight: 1.5 }}>
                You indicated personal safety concerns. Please use the safety resources we shared. Our team is here to support you.
              </p>
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={resetForm}
              style={{
                flex: 1,
                minWidth: '180px',
                padding: '16px 24px',
                background: gradientOrange,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(251, 146, 60, 0.4)',
              }}
            >
              ✏️ Create another entry
            </button>
            <button
              onClick={() => window.print()}
              style={{
                padding: '16px 28px',
                background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              🖨️ Print
            </button>
          </div>
        </div>
      </div>
    );
  }

  const steps = ['Physical', 'Psychological', 'Psychosocial', 'Professional'] as const;

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          {steps.map((label, idx) => (
            <div
              key={label}
              style={{
                flex: 1,
                minWidth: '80px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: currentStep === idx + 1 ? gradientOrange : currentStep > idx + 1 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#e5e7eb',
                  color: currentStep > idx + 1 ? 'white' : currentStep === idx + 1 ? 'white' : '#9ca3af',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '15px',
                }}
              >
                {currentStep > idx + 1 ? '✓' : idx + 1}
              </span>
              <span style={{ fontSize: '12px', fontWeight: currentStep === idx + 1 ? 'bold' : 'normal', color: currentStep === idx + 1 ? accentOrange : '#6b7280' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
        <div style={{ height: '10px', background: '#e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${(currentStep / 4) * 100}%`,
              height: '100%',
              background: gradientOrange,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      <div style={cardStyle}>
        {/* P1 — Physical */}
        {currentStep === 1 && (
          <>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '6px', color: '#1f2937' }}>1. Physical Wellness</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '28px' }}>Rate your physical health and function today (1 = Crisis, 5 = Optimal).</p>

            <QuestionSlider
              label="How would you rate your overall physical comfort today?"
              value={formData.physical.comfort}
              onChange={(v) => setFormData({ ...formData, physical: { ...formData.physical, comfort: v } })}
            />
            <QuestionSlider
              label="How able are you to manage your everyday tasks / ADLs today?"
              value={formData.physical.adls}
              onChange={(v) => setFormData({ ...formData, physical: { ...formData.physical, adls: v } })}
            />
            {formData.physical.adls <= 3 && (
              <div style={{ background: 'rgba(251, 146, 60, 0.08)', padding: '20px', borderRadius: '14px', marginBottom: '24px', border: '2px solid rgba(251, 146, 60, 0.35)' }}>
                <div style={{ fontWeight: '600', marginBottom: '12px', color: '#92400e' }}>Which tasks were harder than usual? (Select all that apply)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {['Getting dressed', 'Bathing/showering', 'Mobility (bed/chair)', 'Walking', 'Household tasks', 'Driving', 'Other'].map((opt) => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.physical.adlsConcerns.includes(opt)}
                        onChange={() => toggleConcern('physical', 'adlsConcerns', opt)}
                      />
                      <span style={{ fontSize: '14px', color: '#374151' }}>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <QuestionSlider
              label="How would you rate discomfort when moving your body today?"
              value={formData.physical.movementDiscomfort}
              onChange={(v) => setFormData({ ...formData, physical: { ...formData.physical, movementDiscomfort: v } })}
            />
            <QuestionSlider
              label="How would you rate your physical energy level today?"
              value={formData.physical.energy}
              onChange={(v) => setFormData({ ...formData, physical: { ...formData.physical, energy: v } })}
            />
            <QuestionSlider
              label="Compared to yesterday, how is your physical condition today?"
              value={formData.physical.changeFromYesterday}
              onChange={(v) => setFormData({ ...formData, physical: { ...formData.physical, changeFromYesterday: v } })}
            />
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>Additional notes (optional)</label>
              <textarea
                value={formData.physical.notes}
                onChange={(e) => setFormData({ ...formData, physical: { ...formData.physical, notes: e.target.value } })}
                placeholder="e.g. pain patterns, medication effects, activities tried..."
                style={{ width: '100%', padding: '14px', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', minHeight: '100px', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>
            <PhotoUpload section="physical" label="Photo for this section (optional)" />
          </>
        )}

        {/* P2 — Psychological */}
        {currentStep === 2 && (
          <>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '6px', color: '#1f2937' }}>2. Psychological Wellness</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '28px' }}>Rate your emotional and mental wellness today (1 = Crisis, 5 = Optimal).</p>

            <QuestionSlider
              label="How would you rate your overall emotional comfort today?"
              value={formData.psychological.emotionalComfort}
              onChange={(v) => setFormData({ ...formData, psychological: { ...formData.psychological, emotionalComfort: v } })}
            />
            {formData.psychological.emotionalComfort <= 3 && (
              <div style={{ background: 'rgba(251, 146, 60, 0.08)', padding: '20px', borderRadius: '14px', marginBottom: '24px', border: '2px solid rgba(251, 146, 60, 0.35)' }}>
                <div style={{ fontWeight: '600', marginBottom: '12px', color: '#92400e' }}>Which emotional experiences were harder today? (Select all that apply)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {['Overwhelmed', 'Anxious', 'Sad or low', 'Frustrated or irritable', 'Disconnected or numb', 'Difficulty relaxing', 'Other'].map((opt) => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.psychological.emotionalConcerns.includes(opt)}
                        onChange={() => toggleConcern('psychological', 'emotionalConcerns', opt)}
                      />
                      <span style={{ fontSize: '14px', color: '#374151' }}>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <QuestionSlider
              label="How able do you feel to cope with stress or challenges today?"
              value={formData.psychological.coping}
              onChange={(v) => setFormData({ ...formData, psychological: { ...formData.psychological, coping: v } })}
            />
            <QuestionSlider
              label="How would you rate your mental clarity and ability to focus today?"
              value={formData.psychological.mentalClarity}
              onChange={(v) => setFormData({ ...formData, psychological: { ...formData.psychological, mentalClarity: v } })}
            />
            <QuestionSlider
              label="Compared to yesterday, how is your emotional well-being today?"
              value={formData.psychological.changeFromYesterday}
              onChange={(v) => setFormData({ ...formData, psychological: { ...formData.psychological, changeFromYesterday: v } })}
            />
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>Additional notes (optional)</label>
              <textarea
                value={formData.psychological.notes}
                onChange={(e) => setFormData({ ...formData, psychological: { ...formData.psychological, notes: e.target.value } })}
                placeholder="e.g. mood, sleep, coping strategies, triggers..."
                style={{ width: '100%', padding: '14px', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', minHeight: '100px', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>
            <PhotoUpload section="psychological" label="Photo for this section (optional)" />
          </>
        )}

        {/* P3 — Psychosocial */}
        {currentStep === 3 && (
          <>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '6px', color: '#1f2937' }}>3. Psychosocial Wellness</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '28px' }}>Rate your connections, support, and basic needs today (1 = Crisis, 5 = Optimal).</p>

            <QuestionSlider
              label="How connected do you feel to the people who matter to you today?"
              value={formData.psychosocial.connection}
              onChange={(v) => setFormData({ ...formData, psychosocial: { ...formData.psychosocial, connection: v } })}
            />
            <QuestionSlider
              label="How able do you feel to communicate your needs or ask for help today?"
              value={formData.psychosocial.communication}
              onChange={(v) => setFormData({ ...formData, psychosocial: { ...formData.psychosocial, communication: v } })}
            />
            <QuestionSlider
              label="How supported do you feel by those around you today?"
              value={formData.psychosocial.support}
              onChange={(v) => setFormData({ ...formData, psychosocial: { ...formData.psychosocial, support: v } })}
            />
            <QuestionSlider
              label="How secure do you feel with basic needs (food, housing, safety) today?"
              value={formData.psychosocial.basicNeedsSafety}
              onChange={(v) => setFormData({ ...formData, psychosocial: { ...formData.psychosocial, basicNeedsSafety: v } })}
            />
            {formData.psychosocial.basicNeedsSafety <= 3 && (
              <div style={{ background: 'rgba(251, 146, 60, 0.08)', padding: '20px', borderRadius: '14px', marginBottom: '24px', border: '2px solid rgba(251, 146, 60, 0.35)' }}>
                <div style={{ fontWeight: '600', marginBottom: '12px', color: '#92400e' }}>Which areas are of concern? (Select all that apply)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {['Food / groceries', 'Housing', 'Transportation', 'Childcare', 'Financial resources', 'Personal safety concerns', 'Other'].map((opt) => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={
                          opt === 'Personal safety concerns'
                            ? formData.psychosocial.personalSafetyConcerns
                            : formData.psychosocial.basicNeedsConcerns.includes(opt)
                        }
                        onChange={() => {
                          if (opt === 'Personal safety concerns') {
                            setPersonalSafetyConcerns(!formData.psychosocial.personalSafetyConcerns);
                          } else {
                            toggleConcern('psychosocial', 'basicNeedsConcerns', opt);
                          }
                        }}
                      />
                      <span style={{ fontSize: '14px', color: '#374151' }}>{opt}</span>
                    </label>
                  ))}
                </div>
                {formData.psychosocial.personalSafetyConcerns && (
                  <div style={{ marginTop: '16px', padding: '14px', background: '#fef2f2', borderRadius: '10px', border: '2px solid #fecaca' }}>
                    <div style={{ fontWeight: '600', color: '#991b1b', marginBottom: '8px' }}>🚨 Safety protocol</div>
                    <p style={{ fontSize: '14px', color: '#7f1d1d', marginBottom: '12px', lineHeight: 1.5 }}>
                      You indicated personal safety concerns. We’ve shared resources. If you’re in immediate danger, call 911.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowSafetyProtocol(true)}
                      style={{
                        padding: '10px 18px',
                        background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      View safety resources again
                    </button>
                  </div>
                )}
              </div>
            )}
            <QuestionSlider
              label="Compared to yesterday, how is your social / personal well-being today?"
              value={formData.psychosocial.changeFromYesterday}
              onChange={(v) => setFormData({ ...formData, psychosocial: { ...formData.psychosocial, changeFromYesterday: v } })}
            />
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>Additional notes (optional)</label>
              <textarea
                value={formData.psychosocial.notes}
                onChange={(e) => setFormData({ ...formData, psychosocial: { ...formData.psychosocial, notes: e.target.value } })}
                placeholder="e.g. social interactions, support changes, housing, transportation..."
                style={{ width: '100%', padding: '14px', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', minHeight: '100px', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>
            <PhotoUpload section="psychosocial" label="Photo for this section (optional)" />
          </>
        )}

        {/* P4 — Professional */}
        {currentStep === 4 && (
          <>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '6px', color: '#1f2937' }}>4. Professional Wellness</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '28px' }}>Rate purpose, motivation, and ability to act (1 = Crisis, 5 = Optimal).</p>

            <QuestionSlider
              label="How would you rate your sense of purpose (work, school, or vocation) today?"
              value={formData.professional.purpose}
              onChange={(v) => setFormData({ ...formData, professional: { ...formData.professional, purpose: v } })}
            />
            <QuestionSlider
              label="How motivated do you feel to engage in work or daily responsibilities today?"
              value={formData.professional.motivation}
              onChange={(v) => setFormData({ ...formData, professional: { ...formData.professional, motivation: v } })}
            />
            <QuestionSlider
              label="How able do you feel to take action on tasks or goals today?"
              value={formData.professional.abilityToAct}
              onChange={(v) => setFormData({ ...formData, professional: { ...formData.professional, abilityToAct: v } })}
            />
            <QuestionSlider
              label="Compared to yesterday, how is your work/vocational well-being today?"
              value={formData.professional.changeFromYesterday}
              onChange={(v) => setFormData({ ...formData, professional: { ...formData.professional, changeFromYesterday: v } })}
            />
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>Additional notes (optional)</label>
              <textarea
                value={formData.professional.notes}
                onChange={(e) => setFormData({ ...formData, professional: { ...formData.professional, notes: e.target.value } })}
                placeholder="e.g. work impacts, missed days, accommodations, financial impact..."
                style={{ width: '100%', padding: '14px', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', minHeight: '100px', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>
            <PhotoUpload section="professional" label="Photo for this section (optional)" />
          </>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '36px',
            paddingTop: '24px',
            borderTop: '2px solid #e5e7eb',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            disabled={currentStep === 1}
            style={{
              padding: '14px 28px',
              background: currentStep === 1 ? '#e5e7eb' : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              color: currentStep === 1 ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
              minWidth: '130px',
            }}
          >
            ← Previous
          </button>
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => s + 1)}
              style={{
                padding: '14px 28px',
                background: gradientOrange,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(251, 146, 60, 0.4)',
                minWidth: '130px',
              }}
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              style={{
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                minWidth: '160px',
              }}
            >
              Submit entry ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
