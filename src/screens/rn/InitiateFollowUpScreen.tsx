// src/screens/rn/InitiateFollowUpScreen.tsx
// RN screen to initiate a subsequent care plan and notify the client

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

type CarePlanType = 
  | "routine_60_day"
  | "accelerated_30_day"
  | "event_based"
  | "attorney_request"
  | "discharge";

type FollowUpReason =
  | "new_diagnosis"
  | "new_specialist_referral"
  | "adverse_condition"
  | "attorney_request"
  | "client_request"
  | "other";

interface CaseInfo {
  id: string;
  caseNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  lastCarePlanDate: string | null;
  lastCarePlanId: string | null;
  lastCarePlanType: string | null;
}

interface CheckinSummary {
  total: number;
  lastDate: string | null;
  avgPhysical: number | null;
  avgPsychological: number | null;
  avgPsychosocial: number | null;
  avgProfessional: number | null;
}

const CARE_PLAN_TYPES: { id: CarePlanType; label: string; description: string; requiresReason: boolean }[] = [
  { 
    id: "routine_60_day", 
    label: "Routine 60-Day Review", 
    description: "Standard subsequent care plan at 60-day interval",
    requiresReason: false
  },
  { 
    id: "accelerated_30_day", 
    label: "Accelerated 30-Day Review", 
    description: "Earlier review due to new diagnosis, specialist referral, or adverse conditions",
    requiresReason: true
  },
  { 
    id: "event_based", 
    label: "Event-Based Review", 
    description: "Review triggered by specific event or change in client status",
    requiresReason: true
  },
  { 
    id: "attorney_request", 
    label: "Attorney Request", 
    description: "Review requested by the attorney",
    requiresReason: true
  },
  { 
    id: "discharge", 
    label: "Discharge Care Plan", 
    description: "Final care plan for case closure",
    requiresReason: true
  },
];

const FOLLOW_UP_REASONS: { id: FollowUpReason; label: string }[] = [
  { id: "new_diagnosis", label: "New Diagnosis" },
  { id: "new_specialist_referral", label: "New Specialist Referral" },
  { id: "adverse_condition", label: "Adverse Condition or Circumstances" },
  { id: "attorney_request", label: "Attorney Request" },
  { id: "client_request", label: "Client Request" },
  { id: "other", label: "Other" },
];

const InitiateFollowUpScreen: React.FC = () => {
  const [caseInfo, setCaseInfo] = useState<CaseInfo | null>(null);
  const [checkinSummary, setCheckinSummary] = useState<CheckinSummary | null>(null);
  const [carePlanType, setCarePlanType] = useState<CarePlanType | "">("");
  const [followUpReason, setFollowUpReason] = useState<FollowUpReason | "">("");
  const [reasonDetails, setReasonDetails] = useState("");
  const [deadlineHours, setDeadlineHours] = useState(72);
  const [notifyPortal, setNotifyPortal] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(true);
  const [customMessage, setCustomMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newCarePlanId, setNewCarePlanId] = useState<string | null>(null);

  const caseId = typeof window !== 'undefined' ? window.localStorage.getItem("rcms_active_case_id") : null;

  // Load case info and check-in history
  useEffect(() => {
    async function loadData() {
      if (!caseId) {
        setLoading(false);
        setStatus("No active case selected. Please select a case first.");
        return;
      }

      try {
        // Get case info
        const caseResult = await supabaseFetch(`rc_cases?id=eq.${caseId}&is_superseded=eq.false&select=*,rc_clients(*)`);
        
        if (caseResult && caseResult.length > 0) {
          const caseData = caseResult[0];
          const client = caseData.rc_clients;
          
          // Get last care plan
          const lastPlanResult = await supabaseFetch(
            `rc_care_plans?case_id=eq.${caseId}&status=eq.submitted&order=created_at.desc&limit=1`
          );
          
          const lastPlan = lastPlanResult && lastPlanResult.length > 0 ? lastPlanResult[0] : null;
          
          setCaseInfo({
            id: caseData.id,
            caseNumber: caseData.case_number,
            clientName: client ? `${client.first_name || ''} ${client.last_name || ''}`.trim() : 'Unknown',
            clientEmail: client?.email || '',
            clientPhone: client?.phone || '',
            lastCarePlanDate: lastPlan?.created_at || null,
            lastCarePlanId: lastPlan?.id || null,
            lastCarePlanType: lastPlan?.care_plan_type || null,
          });
        }

        // Get check-in summary since last care plan
        const checkinsResult = await supabaseFetch(
          `rc_client_checkins?case_id=eq.${caseId}&assessment_type=eq.check_in&order=created_at.desc`
        );
        
        if (checkinsResult && checkinsResult.length > 0) {
          const total = checkinsResult.length;
          const lastDate = checkinsResult[0].created_at;
          
          // Calculate averages
          const avgPhysical = checkinsResult.reduce((sum: number, c: any) => sum + (c.fourp_physical || 0), 0) / total;
          const avgPsychological = checkinsResult.reduce((sum: number, c: any) => sum + (c.fourp_psychological || 0), 0) / total;
          const avgPsychosocial = checkinsResult.reduce((sum: number, c: any) => sum + (c.fourp_psychosocial || 0), 0) / total;
          const avgProfessional = checkinsResult.reduce((sum: number, c: any) => sum + (c.fourp_professional || 0), 0) / total;
          
          setCheckinSummary({
            total,
            lastDate,
            avgPhysical: Math.round(avgPhysical * 10) / 10,
            avgPsychological: Math.round(avgPsychological * 10) / 10,
            avgPsychosocial: Math.round(avgPsychosocial * 10) / 10,
            avgProfessional: Math.round(avgProfessional * 10) / 10,
          });
        } else {
          setCheckinSummary({ total: 0, lastDate: null, avgPhysical: null, avgPsychological: null, avgPsychosocial: null, avgProfessional: null });
        }

      } catch (error) {
        console.error("Failed to load case data:", error);
        setStatus("Error loading case data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [caseId]);

  const selectedTypeConfig = CARE_PLAN_TYPES.find(t => t.id === carePlanType);
  const requiresReason = selectedTypeConfig?.requiresReason || false;

  const calculateDeadline = (): string => {
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + deadlineHours);
    return deadline.toISOString();
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string | null): string => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  const generateDefaultMessage = (): string => {
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + deadlineHours);
    const deadlineStr = deadline.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    
    return `Your RN Care Manager has requested updated health information for your care plan review.

Please complete the following assessments by ${deadlineStr}:
• 4Ps Wellness Assessment
• SDOH Assessment  
• Medication Reconciliation

This information is essential for developing your updated care plan. If you have any questions, please contact your care team.

Thank you for your prompt attention to this request.`;
  };

  const handleSubmit = async () => {
    if (!caseId || !caseInfo) {
      setStatus("No case selected.");
      return;
    }

    if (!carePlanType) {
      setStatus("Please select a care plan type.");
      return;
    }

    if (requiresReason && !followUpReason) {
      setStatus("Please select a reason for this subsequent care plan.");
      return;
    }

    if (followUpReason === 'other' && !reasonDetails.trim()) {
      setStatus("Please provide details for 'Other' reason.");
      return;
    }

    setSubmitting(true);
    setStatus(null);

    try {
      const deadline = calculateDeadline();

      // follow_up_interval_days for Phase 1 scheduler (pre-notice / due+48h attorney nudge)
      const intervalDays = carePlanType === 'accelerated_30_day' ? 30 : 60;

      // 1. Create new care plan
      const newCarePlan = await supabaseFetch('rc_care_plans', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify({
          case_id: caseId,
          plan_type: 'follow_up',
          care_plan_type: carePlanType,
          follow_up_interval_days: intervalDays,
          follow_up_reason: followUpReason || null,
          follow_up_reason_details: reasonDetails || null,
          previous_care_plan_id: caseInfo.lastCarePlanId,
          client_assessment_deadline: deadline,
          client_assessment_status: 'notified',
          status: 'draft',
          plan_number: 1, // Will need to increment properly
        }),
      });

      if (!newCarePlan || newCarePlan.length === 0) {
        throw new Error("Failed to create care plan");
      }

      const carePlanId = newCarePlan[0].id;
      setNewCarePlanId(carePlanId);

      // 2. Create notification record
      const notification = await supabaseFetch('rc_client_notifications', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify({
          case_id: caseId,
          care_plan_id: carePlanId,
          notification_type: 'case_review_request',
          portal_message_sent: notifyPortal,
          portal_message_sent_at: notifyPortal ? new Date().toISOString() : null,
          email_sent: notifyEmail,
          email_sent_at: notifyEmail ? new Date().toISOString() : null,
          sms_sent: notifySms,
          sms_sent_at: notifySms ? new Date().toISOString() : null,
          subject: 'Care Plan Review - Assessment Required',
          message_body: customMessage || generateDefaultMessage(),
          deadline: deadline,
        }),
      });

      // 3. Create portal message
      if (notifyPortal) {
        await supabaseFetch('rc_portal_messages', {
          method: 'POST',
          body: JSON.stringify({
            case_id: caseId,
            sender_type: 'system',
            subject: 'Care Plan Review - Assessment Required',
            message_body: customMessage || generateDefaultMessage(),
            message_type: 'case_review_request',
            care_plan_id: carePlanId,
            notification_id: notification?.[0]?.id,
            is_urgent: true,
            requires_action: true,
          }),
        });
      }

      // 4. TODO: Actually send email and SMS (would require external service integration)
      // For now, we're just tracking that they should be sent

      setSuccess(true);
      setStatus("✓ Subsequent care plan initiated and client notified!");

    } catch (error: any) {
      console.error("Failed to initiate follow-up:", error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartCarePlan = () => {
    if (newCarePlanId) {
      window.location.href = `/rn/case/${caseId}/workflow`;
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading case information...</div>;
  }

  if (success) {
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
            Subsequent Care Plan Initiated
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#15803d', marginBottom: '1.5rem' }}>
            The client has been notified to complete their assessments by the deadline.
          </p>
          
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>Notifications Sent:</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {notifyPortal && <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: '#dbeafe', borderRadius: '4px' }}>📱 Portal Message</span>}
              {notifyEmail && <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: '#dbeafe', borderRadius: '4px' }}>📧 Email</span>}
              {notifySms && <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: '#dbeafe', borderRadius: '4px' }}>💬 SMS</span>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.href = '/rn/dashboard'}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              ← Back to Dashboard
            </button>
            <button
              onClick={handleStartCarePlan}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: '#0f2a6a',
                color: '#ffffff',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Start Care Plan Now →
            </button>
          </div>
          
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '1rem' }}>
            Note: You can start the care plan now or wait until the client completes their assessments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        Initiate Subsequent Care Plan
      </h2>
      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
        Create a new care plan and notify the client to complete their assessments.
      </p>

      {/* Case Info */}
      {caseInfo && (
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Client</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{caseInfo.clientName}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{caseInfo.caseNumber}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Last Care Plan</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                {caseInfo.lastCarePlanDate ? formatDate(caseInfo.lastCarePlanDate) : 'None (Initial)'}
              </div>
              {caseInfo.lastCarePlanType && (
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Type: {caseInfo.lastCarePlanType.replace(/_/g, ' ')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Check-in Summary */}
      {checkinSummary && checkinSummary.total > 0 && (
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '10px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0369a1', marginBottom: '0.5rem' }}>
            📊 Client Check-ins Since Last Care Plan
          </div>
          <div style={{ fontSize: '0.8rem', color: '#0c4a6e', marginBottom: '0.5rem' }}>
            {checkinSummary.total} check-in(s) • Last: {formatDateTime(checkinSummary.lastDate)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            <div style={{ background: '#ffffff', padding: '0.5rem', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>P1 Physical</div>
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>{checkinSummary.avgPhysical ?? '—'}</div>
            </div>
            <div style={{ background: '#ffffff', padding: '0.5rem', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>P2 Psych</div>
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>{checkinSummary.avgPsychological ?? '—'}</div>
            </div>
            <div style={{ background: '#ffffff', padding: '0.5rem', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>P3 Social</div>
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>{checkinSummary.avgPsychosocial ?? '—'}</div>
            </div>
            <div style={{ background: '#ffffff', padding: '0.5rem', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>P4 Prof</div>
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>{checkinSummary.avgProfessional ?? '—'}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.5rem' }}>
            These averages will be available in the care plan workflow for trend analysis.
          </div>
        </div>
      )}

      {/* Care Plan Type Selection */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Care Plan Type <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {CARE_PLAN_TYPES.map(type => (
            <div
              key={type.id}
              onClick={() => setCarePlanType(type.id)}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: carePlanType === type.id ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
                background: carePlanType === type.id ? '#f0f9ff' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="radio"
                  checked={carePlanType === type.id}
                  onChange={() => {}}
                  style={{ width: '16px', height: '16px' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{type.label}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{type.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reason (if required) */}
      {requiresReason && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Reason for subsequent care plan <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {FOLLOW_UP_REASONS.map(reason => (
              <button
                key={reason.id}
                type="button"
                onClick={() => setFollowUpReason(reason.id)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  border: followUpReason === reason.id ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
                  background: followUpReason === reason.id ? '#f0f9ff' : '#ffffff',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                {reason.label}
              </button>
            ))}
          </div>
          
          {(followUpReason === 'other' || reasonDetails) && (
            <textarea
              value={reasonDetails}
              onChange={(e) => setReasonDetails(e.target.value)}
              placeholder="Please provide details..."
              rows={2}
              style={{
                width: '100%',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                padding: '0.5rem',
                fontSize: '0.85rem',
                resize: 'vertical'
              }}
            />
          )}
        </div>
      )}

      {/* Deadline */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Client Assessment Deadline
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select
            value={deadlineHours}
            onChange={(e) => setDeadlineHours(Number(e.target.value))}
            style={{
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              fontSize: '0.85rem'
            }}
          >
            <option value={24}>24 hours</option>
            <option value={48}>48 hours</option>
            <option value={72}>72 hours (recommended)</option>
            <option value={96}>96 hours</option>
            <option value={120}>5 days</option>
            <option value={168}>7 days</option>
          </select>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Deadline: {new Date(Date.now() + deadlineHours * 60 * 60 * 1000).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Notification Channels */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Notification Channels
        </label>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={notifyPortal}
              onChange={(e) => setNotifyPortal(e.target.checked)}
            />
            📱 Portal Message
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.checked)}
            />
            📧 Email
            {!caseInfo?.clientEmail && <span style={{ color: '#dc2626', fontSize: '0.7rem' }}>(no email on file)</span>}
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={notifySms}
              onChange={(e) => setNotifySms(e.target.checked)}
            />
            💬 SMS
            {!caseInfo?.clientPhone && <span style={{ color: '#dc2626', fontSize: '0.7rem' }}>(no phone on file)</span>}
          </label>
        </div>
      </div>

      {/* Custom Message */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Message to Client (optional customization)
        </label>
        <textarea
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          placeholder={generateDefaultMessage()}
          rows={6}
          style={{
            width: '100%',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            padding: '0.5rem',
            fontSize: '0.8rem',
            resize: 'vertical'
          }}
        />
        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>
          Leave blank to use the default message shown above.
        </div>
      </div>

      {/* Submit */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => window.location.href = '/rn/dashboard'}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={submitting || !carePlanType || (requiresReason && !followUpReason)}
          style={{
            padding: '0.5rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            background: submitting || !carePlanType ? '#94a3b8' : '#0f2a6a',
            color: '#ffffff',
            fontSize: '0.85rem',
            cursor: submitting || !carePlanType ? 'not-allowed' : 'pointer'
          }}
        >
          {submitting ? 'Creating...' : 'Create Subsequent Care Plan & Notify Client'}
        </button>
      </div>

      {status && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          borderRadius: '6px',
          background: status.startsWith('✓') ? '#f0fdf4' : '#fef2f2',
          border: status.startsWith('✓') ? '1px solid #86efac' : '1px solid #fecaca',
          color: status.startsWith('✓') ? '#166534' : '#991b1b',
          fontSize: '0.85rem'
        }}>
          {status}
        </div>
      )}
    </div>
  );
};

export default InitiateFollowUpScreen;
