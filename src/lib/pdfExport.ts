import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConcernData {
  id: string;
  client_id: string;
  case_id: string;
  concern_description: string;
  provider_name: string;
  visit_date?: string;
  concern_status: string;
  created_at: string;
  rn_followup_notes?: string;
}

interface ComplaintData {
  id: string;
  complaint_about: string;
  complaint_description: string;
  status: string;
  created_at: string;
  resolution_notes?: string;
  resolved_at?: string;
}

interface TimelineEntry {
  event_type: string;
  status: string;
  performed_by_role?: string;
  notes?: string;
  created_at: string;
  performer_name: string;
}

export async function exportConcernPDF(concernId: string) {
  try {
    toast.info('Generating PDF...');

    // Fetch concern data
    const { data: concern, error: concernError } = await supabase
      .from('concerns')
      .select('*')
      .eq('id', concernId)
      .single();

    if (concernError) throw concernError;

    // Fetch timeline
    const { data: timeline, error: timelineError } = await supabase
      .from('concern_timeline')
      .select('*')
      .eq('concern_id', concernId)
      .order('created_at', { ascending: true });

    if (timelineError) throw timelineError;

    // Fetch performer names
    const timelineWithNames = await Promise.all(
      (timeline || []).map(async (entry) => {
        if (entry.performed_by) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', entry.performed_by)
            .maybeSingle();
          
          return {
            ...entry,
            performer_name: profile?.display_name || 'Unknown',
          };
        }
        return { ...entry, performer_name: 'System' };
      })
    );

    // Get client initials
    const { data: client } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', concern.client_id)
      .maybeSingle();

    const clientInitial = client?.display_name?.charAt(0).toUpperCase() || 'N/A';
    const caseIdShort = concern.case_id.split('-').pop()?.substring(0, 8) || '';

    // Generate HTML for PDF
    const html = generateConcernPDFHTML({
      concern,
      timeline: timelineWithNames,
      clientInitial,
      caseIdShort,
    });

    // Create blob and download
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ConcernReport_RC-${caseIdShort}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Log export event
    await supabase.from('audit_logs').insert({
      action: 'concern_pdf_exported',
      case_id: concern.case_id,
      meta: { concern_id: concernId },
    });

    toast.success('PDF generated successfully');
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    toast.error('Failed to generate PDF: ' + error.message);
  }
}

export async function exportComplaintPDF(complaintId: string) {
  try {
    toast.info('Generating PDF...');

    // Fetch complaint data
    const { data: complaint, error: complaintError } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', complaintId)
      .single();

    if (complaintError) throw complaintError;

    // Fetch timeline
    const { data: timeline, error: timelineError } = await supabase
      .from('complaint_timeline')
      .select('*')
      .eq('complaint_id', complaintId)
      .order('created_at', { ascending: true });

    if (timelineError) throw timelineError;

    // Fetch performer names
    const timelineWithNames = await Promise.all(
      (timeline || []).map(async (entry) => {
        if (entry.performed_by) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', entry.performed_by)
            .maybeSingle();
          
          return {
            ...entry,
            performer_name: profile?.display_name || 'Unknown',
          };
        }
        return { ...entry, performer_name: 'System' };
      })
    );

    // Generate HTML for PDF
    const html = generateComplaintPDFHTML({
      complaint,
      timeline: timelineWithNames,
    });

    // Create blob and download
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ComplaintReport_RC-${complaint.id.substring(0, 8)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Log export event
    await supabase.from('audit_logs').insert({
      action: 'complaint_pdf_exported',
      meta: { complaint_id: complaintId },
    });

    toast.success('PDF generated successfully');
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    toast.error('Failed to generate PDF: ' + error.message);
  }
}

function generateConcernPDFHTML(data: {
  concern: any;
  timeline: TimelineEntry[];
  clientInitial: string;
  caseIdShort: string;
}): string {
  const { concern, timeline, clientInitial, caseIdShort } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Concern Report - ${caseIdShort}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; background: white; color: black; }
    .header { border-bottom: 3px solid #D4AF37; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 28px; margin-bottom: 5px; }
    .header .subtitle { color: #666; font-size: 14px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: 600; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #D4AF37; }
    .info-grid { display: grid; grid-template-columns: 150px 1fr; gap: 10px; }
    .info-label { font-weight: 600; color: #666; }
    .timeline-entry { padding: 15px; border-left: 3px solid #D4AF37; margin-bottom: 15px; background: #f9f9f9; }
    .timeline-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .timeline-event { font-weight: 600; }
    .timeline-status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; background: #eee; }
    .timeline-meta { color: #666; font-size: 13px; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏛️ Reconcile C.A.R.E.</h1>
    <div class="subtitle">Concern Report - Case #${caseIdShort}</div>
  </div>

  <div class="section">
    <div class="section-title">📋 Submission Details</div>
    <div class="info-grid">
      <div class="info-label">Client:</div>
      <div>Client ${clientInitial}.</div>
      
      <div class="info-label">Case ID:</div>
      <div>#${caseIdShort}</div>
      
      <div class="info-label">Submitted:</div>
      <div>${new Date(concern.created_at).toLocaleString()}</div>
      
      <div class="info-label">Provider:</div>
      <div>${concern.provider_name}</div>
      
      ${concern.visit_date ? `
      <div class="info-label">Visit Date:</div>
      <div>${new Date(concern.visit_date).toLocaleDateString()}</div>
      ` : ''}
      
      <div class="info-label">Status:</div>
      <div><span class="timeline-status">${concern.concern_status}</span></div>
      
      <div class="info-label">Description:</div>
      <div>${concern.concern_description}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">📅 Timeline of Events</div>
    ${timeline.map(entry => `
      <div class="timeline-entry">
        <div class="timeline-header">
          <div class="timeline-event">${entry.event_type}</div>
          <div>${new Date(entry.created_at).toLocaleString()}</div>
        </div>
        <div class="timeline-meta">
          Status: <span class="timeline-status">${entry.status}</span> | 
          Performed by: ${entry.performer_name} ${entry.performed_by_role ? `(${entry.performed_by_role})` : ''}
        </div>
        ${entry.notes ? `<div style="margin-top: 8px;">${entry.notes}</div>` : ''}
      </div>
    `).join('')}
  </div>

  ${concern.rn_followup_notes ? `
  <div class="section">
    <div class="section-title">🩺 RN Follow-Up Notes</div>
    <div>${concern.rn_followup_notes}</div>
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">✅ Compliance Sign-Off</div>
    <p>This concern has been reviewed and processed according to Reconcile C.A.R.E. compliance protocols.</p>
    <div style="margin-top: 20px;">
      <div>Reviewed By: _______________________________</div>
      <div style="margin-top: 10px;">Date: _______________________________</div>
    </div>
  </div>

  <div class="footer">
    <p><strong>CONFIDENTIAL & PRIVILEGED COMMUNICATION</strong></p>
    <p>This document contains confidential case management information. Unauthorized disclosure is prohibited.</p>
    <p>Generated on ${new Date().toLocaleString()} | Reconcile C.A.R.E. Compliance System</p>
  </div>
</body>
</html>
  `;
}

function generateComplaintPDFHTML(data: {
  complaint: any;
  timeline: TimelineEntry[];
}): string {
  const { complaint, timeline } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Complaint Report - ${complaint.id.substring(0, 8)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; background: white; color: black; }
    .header { border-bottom: 3px solid #D4AF37; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 28px; margin-bottom: 5px; }
    .header .subtitle { color: #666; font-size: 14px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: 600; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #D4AF37; }
    .info-grid { display: grid; grid-template-columns: 150px 1fr; gap: 10px; }
    .info-label { font-weight: 600; color: #666; }
    .timeline-entry { padding: 15px; border-left: 3px solid #D4AF37; margin-bottom: 15px; background: #f9f9f9; }
    .timeline-header { display: flex; justify-between; margin-bottom: 8px; }
    .timeline-event { font-weight: 600; }
    .timeline-status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; background: #eee; }
    .timeline-meta { color: #666; font-size: 13px; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
    .alert { padding: 15px; background: #fff3cd; border-left: 3px solid #ffc107; margin-bottom: 20px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏛️ Reconcile C.A.R.E.</h1>
    <div class="subtitle">Anonymous Complaint Report - #${complaint.id.substring(0, 8)}</div>
  </div>

  <div class="alert">
    <strong>⚠️ Anonymous Complaint</strong><br>
    This complaint was filed anonymously. No identifying client information is available.
  </div>

  <div class="section">
    <div class="section-title">📋 Complaint Details</div>
    <div class="info-grid">
      <div class="info-label">Complaint ID:</div>
      <div>#${complaint.id.substring(0, 8)}</div>
      
      <div class="info-label">Submitted:</div>
      <div>${new Date(complaint.created_at).toLocaleString()}</div>
      
      <div class="info-label">Regarding:</div>
      <div>${complaint.complaint_about}</div>
      
      <div class="info-label">Status:</div>
      <div><span class="timeline-status">${complaint.status}</span></div>
      
      <div class="info-label">Description:</div>
      <div>${complaint.complaint_description}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">📅 Timeline of Events</div>
    ${timeline.map(entry => `
      <div class="timeline-entry">
        <div class="timeline-header">
          <div class="timeline-event">${entry.event_type}</div>
          <div>${new Date(entry.created_at).toLocaleString()}</div>
        </div>
        <div class="timeline-meta">
          Status: <span class="timeline-status">${entry.status}</span> | 
          Performed by: ${entry.performer_name} ${entry.performed_by_role ? `(${entry.performed_by_role})` : ''}
        </div>
        ${entry.notes ? `<div style="margin-top: 8px;">${entry.notes}</div>` : ''}
      </div>
    `).join('')}
  </div>

  ${complaint.resolution_notes ? `
  <div class="section">
    <div class="section-title">📝 Resolution Notes</div>
    <div>${complaint.resolution_notes}</div>
    ${complaint.resolved_at ? `<div style="margin-top: 10px; color: #666;">Resolved on: ${new Date(complaint.resolved_at).toLocaleString()}</div>` : ''}
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">✅ Compliance Sign-Off</div>
    <p>This anonymous complaint has been reviewed and processed according to Reconcile C.A.R.E. compliance protocols and 15-day resolution requirements.</p>
    <div style="margin-top: 20px;">
      <div>Reviewed By: _______________________________</div>
      <div style="margin-top: 10px;">Date: _______________________________</div>
    </div>
  </div>

  <div class="footer">
    <p><strong>CONFIDENTIAL & PRIVILEGED COMMUNICATION</strong></p>
    <p>This document contains confidential compliance information. Unauthorized disclosure is prohibited.</p>
    <p>Generated on ${new Date().toLocaleString()} | Reconcile C.A.R.E. Compliance System</p>
  </div>
</body>
</html>
  `;
}
