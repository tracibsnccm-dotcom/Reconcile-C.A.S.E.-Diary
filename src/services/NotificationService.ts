// src/services/NotificationService.ts
// Unified notification service for email and SMS
// Supports: Resend (email), Twilio (SMS), with fallback console logging for dev

import { supabase } from "@/integrations/supabase/client";

// Environment variables (set these in your .env file)
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || '';
const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = import.meta.env.VITE_TWILIO_PHONE_NUMBER || '';
const FROM_EMAIL = import.meta.env.VITE_FROM_EMAIL || 'care@reconcilecare.com';
const APP_URL = import.meta.env.VITE_APP_URL || 'https://reconcilecare.com';

// Notification types
export type NotificationType = 
  | 'case_review_request'
  | 'case_review_reminder'
  | 'case_review_overdue'
  | 'care_plan_ready'
  | 'message_received'
  | 'welcome';

export interface NotificationRecipient {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

export interface NotificationData {
  type: NotificationType;
  recipient: NotificationRecipient;
  caseNumber?: string;
  carePlanId?: string;
  deadline?: string;
  customMessage?: string;
  portalUrl?: string;
}

export interface NotificationResult {
  success: boolean;
  emailSent: boolean;
  emailId?: string;
  smsSent: boolean;
  smsId?: string;
  error?: string;
}

// Email templates
const EMAIL_TEMPLATES: Record<NotificationType, { subject: string; getBody: (data: NotificationData) => string }> = {
  case_review_request: {
    subject: 'Action Required: Care Plan Review Assessment',
    getBody: (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Care Plan Review Required</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0f2a6a; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Reconcile C.A.R.E.</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="font-size: 16px;">Hello ${data.recipient.firstName || 'there'},</p>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <strong style="color: #92400e;">⚠️ Action Required</strong>
      <p style="margin: 10px 0 0 0; color: #78350f;">
        Your care team has requested updated health information for your care plan review.
      </p>
    </div>
    
    ${data.deadline ? `
    <p style="font-size: 14px; color: #64748b;">
      <strong>Deadline:</strong> ${new Date(data.deadline).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
    </p>
    ` : ''}
    
    <p>Please log into your patient portal and complete the following assessments:</p>
    
    <ul style="padding-left: 20px;">
      <li>4Ps Wellness Assessment</li>
      <li>SDOH Assessment</li>
      <li>Medication Reconciliation</li>
    </ul>
    
    ${data.customMessage ? `
    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-style: italic;">"${data.customMessage}"</p>
    </div>
    ` : ''}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.portalUrl || APP_URL + '/client-portal'}" 
         style="display: inline-block; background: #0f2a6a; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Go to Patient Portal
      </a>
    </div>
    
    <p style="font-size: 14px; color: #64748b;">
      If you have questions, please contact your care team through the portal messaging system.
    </p>
  </div>
  
  <div style="background: #f8fafc; padding: 20px; text-align: center; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 12px; color: #94a3b8; margin: 0;">
      This is a confidential communication from Reconcile C.A.R.E.<br>
      Your health information is protected under HIPAA.
    </p>
  </div>
</body>
</html>
    `,
  },

  case_review_reminder: {
    subject: 'Reminder: Care Plan Assessment Due Soon',
    getBody: (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Assessment Reminder</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0f2a6a; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Reconcile C.A.R.E.</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="font-size: 16px;">Hello ${data.recipient.firstName || 'there'},</p>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <strong style="color: #92400e;">⏰ Reminder</strong>
      <p style="margin: 10px 0 0 0; color: #78350f;">
        Your care plan assessments are due soon. Please complete them at your earliest convenience.
      </p>
    </div>
    
    ${data.deadline ? `
    <p style="font-size: 14px;">
      <strong>Due by:</strong> ${new Date(data.deadline).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
    </p>
    ` : ''}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.portalUrl || APP_URL + '/client-portal'}" 
         style="display: inline-block; background: #0f2a6a; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Complete Assessments
      </a>
    </div>
  </div>
  
  <div style="background: #f8fafc; padding: 20px; text-align: center; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 12px; color: #94a3b8; margin: 0;">
      Reconcile C.A.R.E. • Confidential Health Information
    </p>
  </div>
</body>
</html>
    `,
  },

  case_review_overdue: {
    subject: 'Urgent: Care Plan Assessment Overdue',
    getBody: (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Assessment Overdue</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #dc2626; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Reconcile C.A.R.E.</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="font-size: 16px;">Hello ${data.recipient.firstName || 'there'},</p>
    
    <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <strong style="color: #991b1b;">🚨 Urgent: Assessment Overdue</strong>
      <p style="margin: 10px 0 0 0; color: #991b1b;">
        Your care plan assessments are now overdue. Please complete them as soon as possible to avoid delays in your care plan.
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.portalUrl || APP_URL + '/client-portal'}" 
         style="display: inline-block; background: #dc2626; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Complete Now
      </a>
    </div>
    
    <p style="font-size: 14px; color: #64748b;">
      If you need assistance or have questions, please contact your care team immediately.
    </p>
  </div>
  
  <div style="background: #f8fafc; padding: 20px; text-align: center; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 12px; color: #94a3b8; margin: 0;">
      Reconcile C.A.R.E. • Confidential Health Information
    </p>
  </div>
</body>
</html>
    `,
  },

  care_plan_ready: {
    subject: 'Your Care Plan is Ready',
    getBody: (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Care Plan Ready</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0f2a6a; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Reconcile C.A.R.E.</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="font-size: 16px;">Hello ${data.recipient.firstName || 'there'},</p>
    
    <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <strong style="color: #166534;">✅ Good News!</strong>
      <p style="margin: 10px 0 0 0; color: #15803d;">
        Your updated care plan is now available in your patient portal.
      </p>
    </div>
    
    <p>Your care team has completed your care plan review. You can now:</p>
    
    <ul style="padding-left: 20px;">
      <li>View your care plan details</li>
      <li>Download a PDF copy</li>
      <li>Review recommendations from your care team</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.portalUrl || APP_URL + '/client-portal'}" 
         style="display: inline-block; background: #22c55e; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
        View Care Plan
      </a>
    </div>
  </div>
  
  <div style="background: #f8fafc; padding: 20px; text-align: center; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 12px; color: #94a3b8; margin: 0;">
      Reconcile C.A.R.E. • Confidential Health Information
    </p>
  </div>
</body>
</html>
    `,
  },

  message_received: {
    subject: 'New Message from Your Care Team',
    getBody: (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Message</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0f2a6a; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Reconcile C.A.R.E.</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="font-size: 16px;">Hello ${data.recipient.firstName || 'there'},</p>
    
    <p>You have a new message from your care team in your patient portal.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.portalUrl || APP_URL + '/client-portal'}" 
         style="display: inline-block; background: #0f2a6a; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
        View Message
      </a>
    </div>
  </div>
  
  <div style="background: #f8fafc; padding: 20px; text-align: center; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 12px; color: #94a3b8; margin: 0;">
      Reconcile C.A.R.E. • Confidential Health Information
    </p>
  </div>
</body>
</html>
    `,
  },

  welcome: {
    subject: 'Welcome to Reconcile C.A.R.E.',
    getBody: (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0f2a6a; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Reconcile C.A.R.E.</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="font-size: 16px;">Hello ${data.recipient.firstName || 'there'},</p>
    
    <p>Welcome to Reconcile C.A.R.E.! Your patient portal account has been created.</p>
    
    <p>Through your portal, you can:</p>
    
    <ul style="padding-left: 20px;">
      <li>Complete wellness check-ins</li>
      <li>Update your medication list</li>
      <li>View your care plans</li>
      <li>Communicate with your care team</li>
    </ul>
    
    ${data.caseNumber ? `
    <p><strong>Your Case Number:</strong> ${data.caseNumber}</p>
    ` : ''}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.portalUrl || APP_URL + '/client-portal'}" 
         style="display: inline-block; background: #0f2a6a; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Access Your Portal
      </a>
    </div>
  </div>
  
  <div style="background: #f8fafc; padding: 20px; text-align: center; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 12px; color: #94a3b8; margin: 0;">
      Reconcile C.A.R.E. • Confidential Health Information
    </p>
  </div>
</body>
</html>
    `,
  },
};

// SMS templates (keep short - 160 chars max for single SMS)
const SMS_TEMPLATES: Record<NotificationType, (data: NotificationData) => string> = {
  case_review_request: (data) => 
    `Reconcile C.A.R.E.: Your care team needs updated health info. Please complete your assessments by ${data.deadline ? new Date(data.deadline).toLocaleDateString() : 'soon'}. Log in: ${APP_URL}/client-portal`,
  
  case_review_reminder: (data) => 
    `Reminder: Your care plan assessments are due ${data.deadline ? new Date(data.deadline).toLocaleDateString() : 'soon'}. Please complete them: ${APP_URL}/client-portal`,
  
  case_review_overdue: (data) => 
    `URGENT: Your care plan assessments are overdue. Please complete them ASAP: ${APP_URL}/client-portal`,
  
  care_plan_ready: (data) => 
    `Good news! Your care plan is ready to view in your portal: ${APP_URL}/client-portal`,
  
  message_received: (data) => 
    `You have a new message from your care team. View it: ${APP_URL}/client-portal`,
  
  welcome: (data) => 
    `Welcome to Reconcile C.A.R.E.! Your portal is ready. Case #: ${data.caseNumber || 'N/A'}. Log in: ${APP_URL}/client-portal`,
};

/**
 * Send email using Resend API
 */
async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    console.log('[DEV] Email would be sent to:', to);
    console.log('[DEV] Subject:', subject);
    return { success: true, id: 'dev-mode' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: subject,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const result = await response.json();
    return { success: true, id: result.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Send SMS using Twilio API
 */
async function sendSMS(
  to: string,
  message: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.log('[DEV] SMS would be sent to:', to);
    console.log('[DEV] Message:', message);
    return { success: true, id: 'dev-mode' };
  }

  // Format phone number
  let formattedPhone = to.replace(/\D/g, '');
  if (formattedPhone.length === 10) {
    formattedPhone = '1' + formattedPhone;
  }
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = '+' + formattedPhone;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    // Base64 encode for Basic Auth (browser-compatible)
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: TWILIO_PHONE_NUMBER,
        To: formattedPhone,
        Body: message,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const result = await response.json();
    return { success: true, id: result.sid };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Log notification to database
 */
async function logNotification(
  caseId: string | null,
  carePlanId: string | null,
  type: NotificationType,
  result: NotificationResult
): Promise<void> {
  try {
    await supabase.from('rc_notification_logs').insert({
      case_id: caseId,
      care_plan_id: carePlanId,
      notification_type: type,
      email_sent: result.emailSent,
      email_id: result.emailId,
      sms_sent: result.smsSent,
      sms_id: result.smsId,
      success: result.success,
      error: result.error,
    });
  } catch (error) {
    console.error('Failed to log notification:', error);
  }
}

/**
 * Main notification function
 */
export async function sendNotification(
  data: NotificationData,
  options: { email?: boolean; sms?: boolean; logToDb?: boolean } = { email: true, sms: true, logToDb: true }
): Promise<NotificationResult> {
  const result: NotificationResult = {
    success: false,
    emailSent: false,
    smsSent: false,
  };

  const template = EMAIL_TEMPLATES[data.type];
  const smsTemplate = SMS_TEMPLATES[data.type];

  if (!template || !smsTemplate) {
    result.error = `Unknown notification type: ${data.type}`;
    return result;
  }

  // Send email
  if (options.email !== false && data.recipient.email) {
    const emailResult = await sendEmail(
      data.recipient.email,
      template.subject,
      template.getBody(data)
    );
    result.emailSent = emailResult.success;
    result.emailId = emailResult.id;
    if (!emailResult.success && emailResult.error) {
      result.error = `Email error: ${emailResult.error}`;
    }
  }

  // Send SMS
  if (options.sms !== false && data.recipient.phone) {
    const smsResult = await sendSMS(
      data.recipient.phone,
      smsTemplate(data)
    );
    result.smsSent = smsResult.success;
    result.smsId = smsResult.id;
    if (!smsResult.success && smsResult.error) {
      result.error = (result.error || '') + ` SMS error: ${smsResult.error}`;
    }
  }

  // Overall success if at least one channel worked
  result.success = result.emailSent || result.smsSent;

  // Log to database
  if (options.logToDb !== false) {
    await logNotification(
      data.caseNumber || null,
      data.carePlanId || null,
      data.type,
      result
    );
  }

  return result;
}

/**
 * Convenience function for case review requests
 */
export async function sendCaseReviewRequest(
  recipient: NotificationRecipient,
  carePlanId: string,
  deadline: string,
  customMessage?: string
): Promise<NotificationResult> {
  return sendNotification({
    type: 'case_review_request',
    recipient,
    carePlanId,
    deadline,
    customMessage,
  });
}

/**
 * Convenience function for reminders
 */
export async function sendReminder(
  recipient: NotificationRecipient,
  carePlanId: string,
  deadline: string
): Promise<NotificationResult> {
  return sendNotification({
    type: 'case_review_reminder',
    recipient,
    carePlanId,
    deadline,
  });
}

/**
 * Convenience function for care plan ready notification
 */
export async function sendCarePlanReady(
  recipient: NotificationRecipient,
  carePlanId: string
): Promise<NotificationResult> {
  return sendNotification({
    type: 'care_plan_ready',
    recipient,
    carePlanId,
  });
}

export default {
  sendNotification,
  sendCaseReviewRequest,
  sendReminder,
  sendCarePlanReady,
};
