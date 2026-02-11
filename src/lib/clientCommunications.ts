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
  message_content?: string;
  metadata?: any;
  sent_at: string;
  delivered_at?: string;
  created_at: string;
}

/**
 * Service for tracking and managing client communications
 */
export class ClientCommunicationService {
  /**
   * Log a communication sent to a client
   */
  static async logCommunication(
    clientId: string,
    type: CommunicationType,
    channel: CommunicationChannel,
    messageContent?: string,
    metadata?: any
  ): Promise<{ success: boolean; communicationId?: string; error?: string }> {
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
          sent_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error logging communication:', error);
        return { success: false, error: error.message };
      }

      return { success: true, communicationId: data.id };
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
      const updateData: any = {
        status,
      };

      if (status === 'DELIVERED') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('client_communications')
        .update(updateData)
        .eq('id', communicationId);

      if (error) {
        console.error('Error updating communication status:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception updating communication status:', error);
      return { success: false, error: 'Failed to update status' };
    }
  }

  /**
   * Get communication history for a client
   */
  static async getClientCommunications(
    clientId: string,
    type?: CommunicationType
  ): Promise<{ success: boolean; communications?: ClientCommunication[]; error?: string }> {
    try {
      let query = supabase
        .from('client_communications')
        .select('*')
        .eq('client_id', clientId)
        .order('sent_at', { ascending: false });

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching communications:', error);
        return { success: false, error: error.message };
      }

      return { success: true, communications: (data as any) || [] };
    } catch (error) {
      console.error('Exception fetching communications:', error);
      return { success: false, error: 'Failed to fetch communications' };
    }
  }

  /**
   * Send welcome communication when intake is completed
   */
  static async sendWelcomeMessage(clientId: string, channel: CommunicationChannel = 'EMAIL'): Promise<void> {
    await this.logCommunication(
      clientId,
      'WELCOME',
      channel,
      'Welcome message sent to client',
      { automated: true }
    );
  }

  /**
   * Send attorney assignment notification
   */
  static async sendAttorneyAssignedNotification(
    clientId: string,
    attorneyName: string,
    channel: CommunicationChannel = 'EMAIL'
  ): Promise<void> {
    await this.logCommunication(
      clientId,
      'ATTORNEY_ASSIGNED',
      channel,
      `Attorney ${attorneyName} has been assigned to your case`,
      { attorneyName, automated: true }
    );
  }

  /**
   * Send intake reminder to incomplete intakes
   */
  static async sendIntakeReminder(clientId: string, channel: CommunicationChannel = 'EMAIL'): Promise<void> {
    await this.logCommunication(
      clientId,
      'INTAKE_REMINDER',
      channel,
      'Reminder to complete your intake form',
      { automated: true }
    );
  }
}
