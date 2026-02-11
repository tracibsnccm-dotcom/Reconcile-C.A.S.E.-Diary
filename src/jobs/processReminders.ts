// src/jobs/processReminders.ts
// Scheduled job to process pending notification reminders
// Run this via: cron job, Vercel cron, Supabase Edge Function, or manual trigger

import { supabase } from "@/integrations/supabase/client";
import { sendNotification, NotificationType } from '../services/NotificationService';

interface PendingReminder {
  reminder_id: string;
  case_id: string;
  care_plan_id: string;
  client_email: string;
  client_phone: string;
  client_first_name: string;
  client_last_name: string;
  reminder_type: string;
  deadline: string;
}

// Map reminder types to notification types
const REMINDER_TYPE_MAP: Record<string, NotificationType> = {
  '48_hour': 'case_review_reminder',
  '24_hour': 'case_review_reminder',
  'overdue': 'case_review_overdue',
};

/**
 * Process all pending reminders
 */
export async function processReminders(): Promise<{
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}> {
  const result = {
    processed: 0,
    successful: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    // Get pending reminders using the database function
    const { data: pendingReminders, error: rpcError } = await supabase.rpc('get_pending_reminders');

    if (rpcError) {
      throw new Error(`RPC get_pending_reminders failed: ${rpcError.message}`);
    }

    if (!pendingReminders || pendingReminders.length === 0) {
      console.log('No pending reminders to process');
      return result;
    }

    console.log(`Processing ${pendingReminders.length} pending reminders...`);

    for (const reminder of pendingReminders as PendingReminder[]) {
      result.processed++;

      try {
        const notificationType = REMINDER_TYPE_MAP[reminder.reminder_type];
        
        if (!notificationType) {
          throw new Error(`Unknown reminder type: ${reminder.reminder_type}`);
        }

        // Send the notification
        const notificationResult = await sendNotification({
          type: notificationType,
          recipient: {
            email: reminder.client_email,
            phone: reminder.client_phone,
            firstName: reminder.client_first_name,
            lastName: reminder.client_last_name,
          },
          carePlanId: reminder.care_plan_id,
          deadline: reminder.deadline,
        });

        // Log to notification_logs table
        const { data: logResult, error: logError } = await supabase
          .from('rc_notification_logs')
          .insert({
            case_id: reminder.case_id,
            care_plan_id: reminder.care_plan_id,
            notification_type: notificationType,
            email_sent: notificationResult.emailSent,
            email_id: notificationResult.emailId,
            email_address: reminder.client_email,
            sms_sent: notificationResult.smsSent,
            sms_id: notificationResult.smsId,
            phone_number: reminder.client_phone,
            success: notificationResult.success,
            error: notificationResult.error,
            trigger_source: 'scheduled',
          })
          .select()
          .single();

        if (logError) {
          console.error('Failed to log notification:', logError);
        }

        const logId = logResult?.id;

        // Mark reminder as sent or failed
        const { error: markError } = await supabase.rpc('mark_reminder_sent', {
          p_reminder_id: reminder.reminder_id,
          p_notification_log_id: logId,
          p_success: notificationResult.success,
          p_error: notificationResult.error,
        });

        if (markError) {
          console.error('Failed to mark reminder as sent:', markError);
        }

        if (notificationResult.success) {
          result.successful++;
          console.log(`✓ Sent ${reminder.reminder_type} reminder to ${reminder.client_email || reminder.client_phone}`);
        } else {
          result.failed++;
          result.errors.push(`Reminder ${reminder.reminder_id}: ${notificationResult.error}`);
          console.error(`✗ Failed ${reminder.reminder_type} reminder: ${notificationResult.error}`);
        }

      } catch (error: any) {
        result.failed++;
        result.errors.push(`Reminder ${reminder.reminder_id}: ${error.message}`);
        console.error(`✗ Error processing reminder ${reminder.reminder_id}:`, error);

        // Mark as failed in database
        try {
          await supabase.rpc('mark_reminder_sent', {
            p_reminder_id: reminder.reminder_id,
            p_notification_log_id: null,
            p_success: false,
            p_error: error.message,
          });
        } catch (e: any) {
          console.error('Failed to mark reminder as failed:', e);
        }
      }
    }

  } catch (error: any) {
    console.error('Failed to fetch pending reminders:', error);
    result.errors.push(`Fetch error: ${error.message}`);
  }

  console.log(`Reminder processing complete: ${result.successful}/${result.processed} successful`);
  return result;
}

/**
 * Check for clients who haven't completed assessments and alert RN
 */
export async function checkOverdueAssessments(): Promise<void> {
  try {
    const now = new Date().toISOString();
    
    // Find care plans where deadline has passed but assessment not complete
    const { data: overduePlans, error: fetchError } = await supabase
      .from('rc_care_plans')
      .select('id')
      .lt('client_assessment_deadline', now)
      .neq('client_assessment_status', 'completed')
      .eq('status', 'draft');

    if (fetchError) {
      throw fetchError;
    }

    if (!overduePlans || overduePlans.length === 0) {
      console.log('No overdue assessments found');
      return;
    }

    console.log(`Found ${overduePlans.length} overdue assessments`);

    // Update status to 'overdue'
    for (const plan of overduePlans) {
      const { error: updateError } = await supabase
        .from('rc_care_plans')
        .update({
          client_assessment_status: 'overdue',
        })
        .eq('id', plan.id);

      if (updateError) {
        console.error(`Failed to mark care plan ${plan.id} as overdue:`, updateError);
      } else {
        console.log(`Marked care plan ${plan.id} as overdue`);
      }

      // TODO: Create alert for RN in rc_portal_messages or similar
    }

  } catch (error: any) {
    console.error('Failed to check overdue assessments:', error);
  }
}

export default processReminders;
