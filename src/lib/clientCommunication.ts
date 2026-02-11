import { supabase } from "@/integrations/supabase/client";

export type CommunicationType = 'INTAKE_REMINDER' | 'ATTORNEY_ASSIGNED' | 'STATUS_UPDATE' | 'WELCOME';
export type CommunicationChannel = 'EMAIL' | 'SMS' | 'PORTAL';
export type DeliveryStatus = 'SENT' | 'DELIVERED' | 'FAILED';

export interface ClientCommunication {
  id: string;
  client_id: string;
  type: CommunicationType;
  channel: CommunicationChannel;
  status: DeliveryStatus;
  message_content: string | null;
  metadata: Record<string, any>;
  sent_at: string;
  delivered_at: string | null;
  created_at: string;
}

export class ClientCommunicationService {
  /**
   * Log a communication sent to a client
   */
  static async logCommunication(
    clientId: string,
    type: CommunicationType,
    channel: CommunicationChannel,
    messageContent?: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; communication?: ClientCommunication; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('client_communications')
        .insert({
          client_id: clientId,
          type,
          channel,
          status: 'SENT',
          message_content: messageContent,
          metadata: metadata || {},
        })
        .select()
        .single();

      if (error) {
        console.error('Error logging communication:', error);
        return { success: false, error: error.message };
      }

      return { success: true, communication: data as ClientCommunication };
    } catch (error) {
      console.error('Exception logging communication:', error);
      return { success: false, error: 'Failed to log communication' };
    }
  }

  /**
   * Update communication delivery status
   */
  static async updateDeliveryStatus(
    communicationId: string,
    status: DeliveryStatus
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('client_communications')
        .update({
          status,
          delivered_at: status === 'DELIVERED' ? new Date().toISOString() : null,
        })
        .eq('id', communicationId);

      if (error) {
        console.error('Error updating communication status:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception updating communication status:', error);
      return { success: false, error: 'Failed to update communication status' };
    }
  }

  /**
   * Get all communications for a client
   */
  static async getClientCommunications(
    clientId: string
  ): Promise<{ success: boolean; communications?: ClientCommunication[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('client_communications')
        .select('*')
        .eq('client_id', clientId)
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('Error fetching communications:', error);
        return { success: false, error: error.message };
      }

      return { success: true, communications: (data || []) as ClientCommunication[] };
    } catch (error) {
      console.error('Exception fetching communications:', error);
      return { success: false, error: 'Failed to fetch communications' };
    }
  }

  /**
   * Send welcome communication when intake is completed
   */
  static async sendWelcome(clientId: string, email: string): Promise<{ success: boolean; error?: string }> {
    return await this.logCommunication(
      clientId,
      'WELCOME',
      'EMAIL',
      `Welcome! Your intake has been received.`,
      { recipient: email }
    );
  }

  /**
   * Send attorney assignment notification
   */
  static async notifyAttorneyAssignment(
    clientId: string,
    email: string,
    attorneyName: string
  ): Promise<{ success: boolean; error?: string }> {
    return await this.logCommunication(
      clientId,
      'ATTORNEY_ASSIGNED',
      'EMAIL',
      `You have been assigned to attorney ${attorneyName}.`,
      { recipient: email, attorney: attorneyName }
    );
  }

  /**
   * Send intake reminder
   */
  static async sendIntakeReminder(clientId: string, email: string): Promise<{ success: boolean; error?: string }> {
    return await this.logCommunication(
      clientId,
      'INTAKE_REMINDER',
      'EMAIL',
      `Reminder: Please complete your intake form.`,
      { recipient: email }
    );
  }
}
