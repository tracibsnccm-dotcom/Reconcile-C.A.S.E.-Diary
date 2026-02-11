// src/screens/client/ClientPortalDashboard.tsx
// Main client portal dashboard with Case Review alerts and pending tasks
// This component should be integrated into or replace ClientPortalSimple

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

interface CaseReviewRequest {
  id: string;
  carePlanId: string;
  carePlanType: string;
  deadline: string;
  createdAt: string;
  tasks: {
    fourPs: boolean;
    sdoh: boolean;
    medRec: boolean;
  };
}

interface PortalMessage {
  id: string;
  subject: string;
  messageBody: string;
  messageType: string;
  isUrgent: boolean;
  requiresAction: boolean;
  readAt: string | null;
  createdAt: string;
  carePlanId: string | null;
}

interface CarePlanPdf {
  id: string;
  carePlanNumber: number;
  carePlanType: string;
  createdAt: string;
  pdfUrl: string | null;
}

const ClientPortalDashboard: React.FC = () => {
  const [caseReview, setCaseReview] = useState<CaseReviewRequest | null>(null);
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [carePlans, setCarePlans] = useState<CarePlanPdf[]>([]);
  const [clientName, setClientName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'messages' | 'documents' | 'checkin'>('home');

  const caseId = typeof window !== 'undefined' ? window.localStorage.getItem("rcms_active_case_id") : null;

  useEffect(() => {
    async function loadData() {
      if (!caseId) {
        setLoading(false);
        return;
      }

      try {
        // Get client name
        const caseResult = await supabaseFetch(`rc_cases?id=eq.${caseId}&is_superseded=eq.false&select=*,rc_clients(*)`);
        if (caseResult && caseResult.length > 0 && caseResult[0].rc_clients) {
          const client = caseResult[0].rc_clients;
          setClientName(`${client.first_name || ''} ${client.last_name || ''}`.trim());
        }

        // Check for pending case review requests
        const pendingPlans = await supabaseFetch(
          `rc_care_plans?case_id=eq.${caseId}&client_assessment_status=in.(notified,in_progress)&order=created_at.desc&limit=1`
        );

        if (pendingPlans && pendingPlans.length > 0) {
          const plan = pendingPlans[0];
          
          // Check what tasks are completed
          const fourPsResult = await supabaseFetch(
            `rc_client_checkins?case_id=eq.${caseId}&care_plan_id=eq.${plan.id}&assessment_type=eq.case_review&limit=1`
          );
          
          const sdohResult = await supabaseFetch(
            `rc_sdoh_assessments?case_id=eq.${caseId}&care_plan_id=eq.${plan.id}&limit=1`
          );
          
          const medRecResult = await supabaseFetch(
            `rc_medication_reconciliations?case_id=eq.${caseId}&care_plan_id=eq.${plan.id}&status=eq.submitted&limit=1`
          );

          setCaseReview({
            id: plan.id,
            carePlanId: plan.id,
            carePlanType: plan.care_plan_type || 'routine_60_day',
            deadline: plan.client_assessment_deadline,
            createdAt: plan.created_at,
            tasks: {
              fourPs: fourPsResult && fourPsResult.length > 0,
              sdoh: sdohResult && sdohResult.length > 0,
              medRec: medRecResult && medRecResult.length > 0,
            }
          });
        }

        // Get unread messages
        const messagesResult = await supabaseFetch(
          `rc_portal_messages?case_id=eq.${caseId}&archived_at=is.null&order=created_at.desc&limit=10`
        );
        
        if (messagesResult) {
          setMessages(messagesResult.map((m: any) => ({
            id: m.id,
            subject: m.subject,
            messageBody: m.message_body,
            messageType: m.message_type,
            isUrgent: m.is_urgent,
            requiresAction: m.requires_action,
            readAt: m.read_at,
            createdAt: m.created_at,
            carePlanId: m.care_plan_id,
          })));
        }

        // Get completed care plans (with PDFs)
        const plansResult = await supabaseFetch(
          `rc_care_plans?case_id=eq.${caseId}&status=eq.submitted&order=created_at.desc&limit=10`
        );
        
        if (plansResult) {
          setCarePlans(plansResult.map((p: any) => ({
            id: p.id,
            carePlanNumber: p.plan_number,
            carePlanType: p.care_plan_type,
            createdAt: p.created_at,
            pdfUrl: p.pdf_url || null,
          })));
        }

      } catch (error) {
        console.error("Failed to load client data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [caseId]);

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
  };

  const formatShortDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const getTimeRemaining = (deadline: string): { text: string; urgent: boolean } => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const hoursRemaining = Math.floor((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (hoursRemaining < 0) {
      return { text: 'Overdue', urgent: true };
    } else if (hoursRemaining < 24) {
      return { text: `${hoursRemaining} hours remaining`, urgent: true };
    } else {
      const daysRemaining = Math.floor(hoursRemaining / 24);
      return { text: `${daysRemaining} day(s) remaining`, urgent: daysRemaining <= 1 };
    }
  };

  const getCompletedCount = (): number => {
    if (!caseReview) return 0;
    return [caseReview.tasks.fourPs, caseReview.tasks.sdoh, caseReview.tasks.medRec].filter(Boolean).length;
  };

  const markMessageRead = async (messageId: string) => {
    try {
      await supabaseFetch(`rc_portal_messages?id=eq.${messageId}`, {
        method: 'PATCH',
        body: JSON.stringify({ read_at: new Date().toISOString() }),
      });
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, readAt: new Date().toISOString() } : m
      ));
    } catch (error) {
      console.error("Failed to mark message read:", error);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
      }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💙</div>
          Loading your portal...
        </div>
      </div>
    );
  }

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
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Reconcile C.A.R.E.</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            Welcome{clientName ? `, ${clientName}` : ''}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 1.5rem'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', gap: '0.5rem' }}>
          {[
            { id: 'home', label: 'Home', icon: '🏠' },
            { id: 'messages', label: 'Messages', icon: '📬', badge: messages.filter(m => !m.readAt).length },
            { id: 'documents', label: 'Care Plans', icon: '📄' },
            { id: 'checkin', label: 'Check-in', icon: '💚' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '0.75rem 1rem',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === tab.id ? '3px solid #0ea5e9' : '3px solid transparent',
                color: activeTab === tab.id ? '#0369a1' : '#64748b',
                fontWeight: activeTab === tab.id ? 600 : 400,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <span style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '999px',
                  fontWeight: 600
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>
        
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <>
            {/* Case Review Required Banner */}
            {caseReview && (
              <div style={{
                background: '#fef3c7',
                border: '2px solid #f59e0b',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <div style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: 700, 
                      color: '#92400e',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      ⚠️ Care Plan Review Required
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#a16207', marginTop: '0.25rem' }}>
                      Your care team has requested updated health information
                    </div>
                  </div>
                  <div style={{
                    background: getTimeRemaining(caseReview.deadline).urgent ? '#dc2626' : '#f59e0b',
                    color: '#ffffff',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {getTimeRemaining(caseReview.deadline).text}
                  </div>
                </div>

                <div style={{ 
                  fontSize: '0.8rem', 
                  color: '#78350f', 
                  marginBottom: '1rem' 
                }}>
                  <strong>Deadline:</strong> {formatDate(caseReview.deadline)}
                </div>

                {/* Task Checklist */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '8px',
                  padding: '1rem'
                }}>
                  <div style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 600, 
                    marginBottom: '0.75rem',
                    color: '#374151'
                  }}>
                    Required Assessments ({getCompletedCount()}/3 completed)
                  </div>
                  
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {/* 4Ps Assessment */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '6px',
                      background: caseReview.tasks.fourPs ? '#f0fdf4' : '#fef2f2',
                      border: caseReview.tasks.fourPs ? '1px solid #86efac' : '1px solid #fecaca'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>
                          {caseReview.tasks.fourPs ? '✅' : '⭕'}
                        </span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>4Ps Wellness Assessment</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Physical, Psychological, Psychosocial, Professional</div>
                        </div>
                      </div>
                      {!caseReview.tasks.fourPs && (
                        <button
                          onClick={() => window.location.href = `/client-checkin?type=case_review&care_plan_id=${caseReview.carePlanId}`}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#0f2a6a',
                            color: '#ffffff',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          Start →
                        </button>
                      )}
                    </div>

                    {/* SDOH Assessment */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '6px',
                      background: caseReview.tasks.sdoh ? '#f0fdf4' : '#fef2f2',
                      border: caseReview.tasks.sdoh ? '1px solid #86efac' : '1px solid #fecaca'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>
                          {caseReview.tasks.sdoh ? '✅' : '⭕'}
                        </span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>SDOH Assessment</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Social Determinants of Health</div>
                        </div>
                      </div>
                      {!caseReview.tasks.sdoh && (
                        <button
                          onClick={() => window.location.href = `/client-sdoh?type=case_review&care_plan_id=${caseReview.carePlanId}`}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#0f2a6a',
                            color: '#ffffff',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          Start →
                        </button>
                      )}
                    </div>

                    {/* Medication Reconciliation */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '6px',
                      background: caseReview.tasks.medRec ? '#f0fdf4' : '#fef2f2',
                      border: caseReview.tasks.medRec ? '1px solid #86efac' : '1px solid #fecaca'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>
                          {caseReview.tasks.medRec ? '✅' : '⭕'}
                        </span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Medication Reconciliation</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Current medications list</div>
                        </div>
                      </div>
                      {!caseReview.tasks.medRec && (
                        <button
                          onClick={() => window.location.href = `/client-medrec?type=case_review&care_plan_id=${caseReview.carePlanId}`}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#0f2a6a',
                            color: '#ffffff',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          Start →
                        </button>
                      )}
                    </div>
                  </div>

                  {getCompletedCount() === 3 && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '0.75rem',
                      background: '#dcfce7',
                      borderRadius: '6px',
                      textAlign: 'center',
                      fontSize: '0.85rem',
                      color: '#166534',
                      fontWeight: 600
                    }}>
                      ✓ All assessments complete! Your care team has been notified.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <button
                onClick={() => setActiveTab('checkin')}
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💚</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Wellness Check-in</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Log how you're feeling today</div>
              </button>

              <button
                onClick={() => window.location.href = '/client-medrec'}
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💊</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Update Medications</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Keep your med list current</div>
              </button>
            </div>

            {/* Recent Messages Preview */}
            {messages.length > 0 && (
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Recent Messages</div>
                  <button
                    onClick={() => setActiveTab('messages')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#0ea5e9',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    View All →
                  </button>
                </div>
                
                {messages.slice(0, 3).map(msg => (
                  <div
                    key={msg.id}
                    style={{
                      padding: '0.6rem 0',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: msg.readAt ? 'transparent' : '#0ea5e9',
                      marginTop: '0.4rem',
                      flexShrink: 0
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: msg.readAt ? 400 : 600, 
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        {msg.subject}
                        {msg.isUrgent && (
                          <span style={{ 
                            background: '#fef2f2', 
                            color: '#dc2626', 
                            fontSize: '0.65rem',
                            padding: '0.1rem 0.3rem',
                            borderRadius: '3px'
                          }}>
                            Urgent
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {formatShortDate(msg.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Messages</h2>
            
            {messages.length === 0 ? (
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '2rem',
                textAlign: 'center',
                color: '#64748b'
              }}>
                No messages yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    onClick={() => markMessageRead(msg.id)}
                    style={{
                      background: '#ffffff',
                      borderRadius: '10px',
                      border: msg.readAt ? '1px solid #e2e8f0' : '2px solid #0ea5e9',
                      padding: '1rem',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ 
                        fontWeight: msg.readAt ? 400 : 600, 
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        {!msg.readAt && <span style={{ color: '#0ea5e9' }}>●</span>}
                        {msg.subject}
                        {msg.isUrgent && (
                          <span style={{ 
                            background: '#fef2f2', 
                            color: '#dc2626', 
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '4px'
                          }}>
                            Urgent
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {formatShortDate(msg.createdAt)}
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '0.85rem', 
                      color: '#64748b',
                      whiteSpace: 'pre-line',
                      lineHeight: 1.5
                    }}>
                      {msg.messageBody.length > 200 
                        ? msg.messageBody.substring(0, 200) + '...' 
                        : msg.messageBody}
                    </div>
                    {msg.requiresAction && !msg.readAt && (
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.5rem',
                        background: '#fef3c7',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        color: '#92400e'
                      }}>
                        ⚡ This message requires your action
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Your Care Plans</h2>
            
            {carePlans.length === 0 ? (
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '2rem',
                textAlign: 'center',
                color: '#64748b'
              }}>
                No care plans available yet. Your care team is working on your first care plan.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {carePlans.map(plan => (
                  <div
                    key={plan.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      padding: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        Care Plan #{plan.carePlanNumber}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {plan.carePlanType?.replace(/_/g, ' ')} • {formatShortDate(plan.createdAt)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => window.open(`/care-plan/${plan.id}/view`, '_blank')}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          background: '#ffffff',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        View
                      </button>
                      {plan.pdfUrl && (
                        <button
                          onClick={() => window.open(plan.pdfUrl!, '_blank')}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#0f2a6a',
                            color: '#ffffff',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          Download PDF
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHECKIN TAB */}
        {activeTab === 'checkin' && (
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Wellness Check-in</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
              Regular check-ins help your care team understand how you're doing and adjust your care plan as needed.
            </p>
            
            <div style={{
              display: 'grid',
              gap: '1rem'
            }}>
              <button
                onClick={() => window.location.href = '/client-checkin?type=check_in'}
                style={{
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '2px solid #22c55e',
                  background: '#f0fdf4',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💚</div>
                <div style={{ fontWeight: 600, fontSize: '1rem', color: '#166534' }}>4Ps Wellness Check-in</div>
                <div style={{ fontSize: '0.85rem', color: '#15803d', marginTop: '0.25rem' }}>
                  Rate your physical, psychological, psychosocial, and professional wellness
                </div>
              </button>

              <button
                onClick={() => window.location.href = '/client-medrec?type=check_in'}
                style={{
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💊</div>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>Medication Update</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Report any changes to your medications
                </div>
              </button>

              <button
                onClick={() => window.location.href = '/client-journal'}
                style={{
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📔</div>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>C.A.S.E. Journal</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Document your daily experiences and progress
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        padding: '1.5rem',
        fontSize: '0.75rem',
        color: '#94a3b8'
      }}>
        Reconcile C.A.R.E. • Your health information is protected
      </div>
    </div>
  );
};

export default ClientPortalDashboard;
