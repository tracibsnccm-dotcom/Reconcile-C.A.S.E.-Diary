export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      appointment_document_shares: {
        Row: {
          appointment_id: string | null
          approved_at: string | null
          approved_by: string | null
          auto_selected_docs: Json | null
          case_id: string | null
          client_id: string | null
          created_at: string | null
          document_ids: Json | null
          id: string
          notes: string | null
          provider_id: string | null
          sent_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auto_selected_docs?: Json | null
          case_id?: string | null
          client_id?: string | null
          created_at?: string | null
          document_ids?: Json | null
          id?: string
          notes?: string | null
          provider_id?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auto_selected_docs?: Json | null
          case_id?: string | null
          client_id?: string | null
          created_at?: string | null
          document_ids?: Json | null
          id?: string
          notes?: string | null
          provider_id?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_document_shares_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "client_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_document_shares_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_document_shares_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_document_shares_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_appointment_document_shares_appointment"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "client_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_appointment_document_shares_case"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_appointment_document_shares_case"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_appointment_document_shares_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_appointment_document_shares_provider"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_notes: {
        Row: {
          appointment_id: string
          case_id: string
          clinical_notes: string
          created_at: string
          follow_up_instructions: string | null
          follow_up_needed: boolean | null
          id: string
          provider_id: string
          updated_at: string
        }
        Insert: {
          appointment_id: string
          case_id: string
          clinical_notes: string
          created_at?: string
          follow_up_instructions?: string | null
          follow_up_needed?: boolean | null
          id?: string
          provider_id: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          case_id?: string
          clinical_notes?: string
          created_at?: string
          follow_up_instructions?: string | null
          follow_up_needed?: boolean | null
          id?: string
          provider_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "client_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_notes_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_notes_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_notes_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_appointment_notes_appointment"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "client_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_appointment_notes_case"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_appointment_notes_case"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_appointment_notes_provider"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      assignment_audit_log: {
        Row: {
          assigned_attorney_id: string
          assigned_by: string
          assigned_timestamp: string
          assignment_method: string
          case_id: string
          created_at: string
          id: string
          metadata: Json | null
          reviewed_by: string | null
        }
        Insert: {
          assigned_attorney_id: string
          assigned_by?: string
          assigned_timestamp?: string
          assignment_method?: string
          case_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reviewed_by?: string | null
        }
        Update: {
          assigned_attorney_id?: string
          assigned_by?: string
          assigned_timestamp?: string
          assignment_method?: string
          case_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reviewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_audit_log_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_audit_log_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_assignment_audit_log_attorney"
            columns: ["assigned_attorney_id"]
            isOneToOne: false
            referencedRelation: "attorney_metadata"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_assignment_audit_log_case"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_assignment_audit_log_case"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_offers: {
        Row: {
          attorney_id: string
          case_id: string
          created_at: string
          created_by: string | null
          decline_note: string | null
          decline_reason: string | null
          expires_at: string
          id: string
          offered_at: string
          responded_at: string | null
          status: Database["public"]["Enums"]["assignment_offer_status"]
          updated_at: string
        }
        Insert: {
          attorney_id: string
          case_id: string
          created_at?: string
          created_by?: string | null
          decline_note?: string | null
          decline_reason?: string | null
          expires_at?: string
          id?: string
          offered_at?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["assignment_offer_status"]
          updated_at?: string
        }
        Update: {
          attorney_id?: string
          case_id?: string
          created_at?: string
          created_by?: string | null
          decline_note?: string | null
          decline_reason?: string | null
          expires_at?: string
          id?: string
          offered_at?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["assignment_offer_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_offers_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_offers_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_assignment_offers_attorney"
            columns: ["attorney_id"]
            isOneToOne: false
            referencedRelation: "attorney_metadata"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_assignment_offers_case"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_assignment_offers_case"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      attorney_availability: {
        Row: {
          available_friday: boolean
          available_monday: boolean
          available_saturday: boolean
          available_sunday: boolean
          available_thursday: boolean
          available_tuesday: boolean
          available_wednesday: boolean
          created_at: string
          end_time: string
          id: string
          start_time: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          available_friday?: boolean
          available_monday?: boolean
          available_saturday?: boolean
          available_sunday?: boolean
          available_thursday?: boolean
          available_tuesday?: boolean
          available_wednesday?: boolean
          created_at?: string
          end_time?: string
          id?: string
          start_time?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          available_friday?: boolean
          available_monday?: boolean
          available_saturday?: boolean
          available_sunday?: boolean
          available_thursday?: boolean
          available_tuesday?: boolean
          available_wednesday?: boolean
          created_at?: string
          end_time?: string
          id?: string
          start_time?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_attorney_availability_user"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      attorney_metadata: {
        Row: {
          capacity_available: number
          capacity_limit: number
          created_at: string
          enabled_features: Json | null
          feature_usage_stats: Json | null
          id: string
          last_assigned_date: string | null
          plan_price: number | null
          renewal_date: string | null
          status: string
          subscription_started_at: string | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tier: string
          trial_ends_at: string | null
          trial_starts_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          capacity_available?: number
          capacity_limit?: number
          created_at?: string
          enabled_features?: Json | null
          feature_usage_stats?: Json | null
          id?: string
          last_assigned_date?: string | null
          plan_price?: number | null
          renewal_date?: string | null
          status?: string
          subscription_started_at?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tier?: string
          trial_ends_at?: string | null
          trial_starts_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          capacity_available?: number
          capacity_limit?: number
          created_at?: string
          enabled_features?: Json | null
          feature_usage_stats?: Json | null
          id?: string
          last_assigned_date?: string | null
          plan_price?: number | null
          renewal_date?: string | null
          status?: string
          subscription_started_at?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tier?: string
          trial_ends_at?: string | null
          trial_starts_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      attorney_monthly_reports: {
        Row: {
          attorney_id: string
          created_at: string | null
          generated_at: string | null
          hourly_rate_used: number
          id: string
          report_data: Json | null
          report_month: string
          total_attorney_time_saved_minutes: number
          total_cases: number
          total_cost_savings: number
          total_time_minutes: number
          updated_at: string | null
        }
        Insert: {
          attorney_id: string
          created_at?: string | null
          generated_at?: string | null
          hourly_rate_used?: number
          id?: string
          report_data?: Json | null
          report_month: string
          total_attorney_time_saved_minutes?: number
          total_cases?: number
          total_cost_savings?: number
          total_time_minutes?: number
          updated_at?: string | null
        }
        Update: {
          attorney_id?: string
          created_at?: string | null
          generated_at?: string | null
          hourly_rate_used?: number
          id?: string
          report_data?: Json | null
          report_month?: string
          total_attorney_time_saved_minutes?: number
          total_cases?: number
          total_cost_savings?: number
          total_time_minutes?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_attorney_monthly_reports_attorney"
            columns: ["attorney_id"]
            isOneToOne: false
            referencedRelation: "attorney_metadata"
            referencedColumns: ["user_id"]
          },
        ]
      }
      attorney_performance: {
        Row: {
          accepted: number | null
          attorney_code: string
          avg_response_time_hours: number | null
          conversion_rate: number | null
          declined: number | null
          id: string
          last_updated: string | null
          total_referrals: number | null
        }
        Insert: {
          accepted?: number | null
          attorney_code: string
          avg_response_time_hours?: number | null
          conversion_rate?: number | null
          declined?: number | null
          id?: string
          last_updated?: string | null
          total_referrals?: number | null
        }
        Update: {
          accepted?: number | null
          attorney_code?: string
          avg_response_time_hours?: number | null
          conversion_rate?: number | null
          declined?: number | null
          id?: string
          last_updated?: string | null
          total_referrals?: number | null
        }
        Relationships: []
      }
      attorney_practice_areas: {
        Row: {
          attorney_id: string
          created_at: string
          id: string
          practice_area_id: string
        }
        Insert: {
          attorney_id: string
          created_at?: string
          id?: string
          practice_area_id: string
        }
        Update: {
          attorney_id?: string
          created_at?: string
          id?: string
          practice_area_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attorney_practice_areas_practice_area_id_fkey"
            columns: ["practice_area_id"]
            isOneToOne: false
            referencedRelation: "practice_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_attorney_practice_areas_attorney"
            columns: ["attorney_id"]
            isOneToOne: false
            referencedRelation: "attorney_metadata"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_attorney_practice_areas_practice_area"
            columns: ["practice_area_id"]
            isOneToOne: false
            referencedRelation: "practice_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      attorney_rn_messages: {
        Row: {
          attachments: Json | null
          case_id: string
          created_at: string
          id: string
          is_important: boolean | null
          message_text: string
          sender_id: string
          sender_role: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          case_id: string
          created_at?: string
          id?: string
          is_important?: boolean | null
          message_text: string
          sender_id: string
          sender_role: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          case_id?: string
          created_at?: string
          id?: string
          is_important?: boolean | null
          message_text?: string
          sender_id?: string
          sender_role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attorney_rn_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attorney_rn_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_attorney_rn_messages_case"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_attorney_rn_messages_case"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_attorney_rn_messages_sender"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      attorney_sla: {
        Row: {
          attorney_code: string
          auto_accept: boolean | null
          created_at: string | null
          fee_amount: number | null
          id: string
          is_active: boolean | null
          response_time_hours: number
          updated_at: string | null
        }
        Insert: {
          attorney_code: string
          auto_accept?: boolean | null
          created_at?: string | null
          fee_amount?: number | null
          id?: string
          is_active?: boolean | null
          response_time_hours?: number
          updated_at?: string | null
        }
        Update: {
          attorney_code?: string
          auto_accept?: boolean | null
          created_at?: string | null
          fee_amount?: number | null
          id?: string
          is_active?: boolean | null
          response_time_hours?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      attorney_wallet: {
        Row: {
          attorney_id: string
          balance: number
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          attorney_id: string
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          attorney_id?: string
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_attorney_wallet_attorney"
            columns: ["attorney_id"]
            isOneToOne: true
            referencedRelation: "attorney_metadata"
            referencedColumns: ["user_id"]
          },
        ]
      }
      audit_events: {
        Row: {
          actor_user_id: string | null
          case_id: string
          created_at: string
          event_meta: Json | null
          event_type: string
          id: string
        }
        Insert: {
          actor_user_id?: string | null
          case_id: string
          created_at?: string
          event_meta?: Json | null
          event_type: string
          id?: string
        }
        Update: {
          actor_user_id?: string | null
          case_id?: string
          created_at?: string
          event_meta?: Json | null
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_audit_events_actor"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string | null
          actor_id: string | null
          actor_role: string | null
          case_id: string | null
          id: number
          meta: Json | null
          ts: string | null
        }
        Insert: {
          action?: string | null
          actor_id?: string | null
          actor_role?: string | null
          case_id?: string | null
          id?: number
          meta?: Json | null
          ts?: string | null
        }
        Update: {
          action?: string | null
          actor_id?: string | null
          actor_role?: string | null
          case_id?: string | null
          id?: number
          meta?: Json | null
          ts?: string | null
        }
        Relationships: []
      }
      billing_transactions: {
        Row: {
          amount: number
          attorney_id: string
          created_at: string
          id: string
          metadata: Json | null
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          processing_fee: number
          referral_id: string
          stripe_payment_id: string | null
          tax: number
          total_amount: number
          transaction_date: string
        }
        Insert: {
          amount: number
          attorney_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          processing_fee?: number
          referral_id: string
          stripe_payment_id?: string | null
          tax?: number
          total_amount: number
          transaction_date?: string
        }
        Update: {
          amount?: number
          attorney_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          processing_fee?: number
          referral_id?: string
          stripe_payment_id?: string | null
          tax?: number
          total_amount?: number
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_transactions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      care_plan_reminders: {
        Row: {
          acknowledged_at: string | null
          care_plan_id: string | null
          case_id: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          dismissed_at: string | null
          dismissed_reason: string | null
          id: string
          is_recurring: boolean | null
          metadata: Json | null
          priority: string | null
          recurrence_end_date: string | null
          recurrence_pattern: string | null
          reminder_date: string
          reminder_time: string | null
          reminder_type: string
          rn_id: string | null
          sent_at: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          care_plan_id?: string | null
          case_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          dismissed_at?: string | null
          dismissed_reason?: string | null
          id?: string
          is_recurring?: boolean | null
          metadata?: Json | null
          priority?: string | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          reminder_date: string
          reminder_time?: string | null
          reminder_type: string
          rn_id?: string | null
          sent_at?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          care_plan_id?: string | null
          case_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          dismissed_at?: string | null
          dismissed_reason?: string | null
          id?: string
          is_recurring?: boolean | null
          metadata?: Json | null
          priority?: string | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          reminder_date?: string
          reminder_time?: string | null
          reminder_type?: string
          rn_id?: string | null
          sent_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_plan_reminders_care_plan_id_fkey"
            columns: ["care_plan_id"]
            isOneToOne: false
            referencedRelation: "care_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_plan_reminders_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_plan_reminders_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      care_plans: {
        Row: {
          case_id: string
          created_at: string | null
          created_by: string | null
          id: string
          plan_text: string
          plan_type: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          case_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          plan_text: string
          plan_type?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          case_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          plan_text?: string
          plan_type?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "care_plans_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_plans_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_workflow_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          diagnosis_specific: string[] | null
          estimated_duration_days: number | null
          id: string
          is_active: boolean | null
          is_system_template: boolean | null
          steps: Json
          template_name: string
          updated_at: string | null
          workflow_type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          diagnosis_specific?: string[] | null
          estimated_duration_days?: number | null
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          steps?: Json
          template_name: string
          updated_at?: string | null
          workflow_type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          diagnosis_specific?: string[] | null
          estimated_duration_days?: number | null
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          steps?: Json
          template_name?: string
          updated_at?: string | null
          workflow_type?: string
        }
        Relationships: []
      }
      case_access: {
        Row: {
          case_id: string
          granted_at: string | null
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          case_id: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          case_id?: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      case_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          case_id: string
          created_at: string
          created_by: string | null
          disclosure_scope: Database["public"]["Enums"]["disclosure_scope"]
          id: string
          message: string
          metadata: Json | null
          severity: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          case_id: string
          created_at?: string
          created_by?: string | null
          disclosure_scope?: Database["public"]["Enums"]["disclosure_scope"]
          id?: string
          message: string
          metadata?: Json | null
          severity?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          case_id?: string
          created_at?: string
          created_by?: string | null
          disclosure_scope?: Database["public"]["Enums"]["disclosure_scope"]
          id?: string
          message?: string
          metadata?: Json | null
          severity?: string
        }
        Relationships: []
      }
      case_assignments: {
        Row: {
          case_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          case_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          case_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_assignments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_assignments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_handoffs: {
        Row: {
          accepted_at: string | null
          active_diagnoses: string[] | null
          active_treatments: string | null
          attorney_contact: string | null
          authorization_status: string | null
          care_plan_summary: string | null
          case_id: string | null
          checklist_completed: boolean | null
          checklist_items: Json | null
          client_summary: string
          completed_at: string | null
          created_at: string | null
          critical_alerts: string | null
          current_medications: string | null
          current_status: string
          decline_reason: string | null
          declined_at: string | null
          effective_date: string | null
          from_rn_id: string
          handoff_documents: string[] | null
          handoff_reason: string
          handoff_reason_notes: string | null
          id: string
          insurance_status: string | null
          key_contacts: string | null
          long_term_goals: string | null
          pending_tasks: string | null
          requested_at: string | null
          reviewed_at: string | null
          safety_concerns: string | null
          short_term_goals: string | null
          status: string | null
          to_rn_id: string
          transition_notes: string | null
          upcoming_appointments: string | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          active_diagnoses?: string[] | null
          active_treatments?: string | null
          attorney_contact?: string | null
          authorization_status?: string | null
          care_plan_summary?: string | null
          case_id?: string | null
          checklist_completed?: boolean | null
          checklist_items?: Json | null
          client_summary: string
          completed_at?: string | null
          created_at?: string | null
          critical_alerts?: string | null
          current_medications?: string | null
          current_status: string
          decline_reason?: string | null
          declined_at?: string | null
          effective_date?: string | null
          from_rn_id: string
          handoff_documents?: string[] | null
          handoff_reason: string
          handoff_reason_notes?: string | null
          id?: string
          insurance_status?: string | null
          key_contacts?: string | null
          long_term_goals?: string | null
          pending_tasks?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          safety_concerns?: string | null
          short_term_goals?: string | null
          status?: string | null
          to_rn_id: string
          transition_notes?: string | null
          upcoming_appointments?: string | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          active_diagnoses?: string[] | null
          active_treatments?: string | null
          attorney_contact?: string | null
          authorization_status?: string | null
          care_plan_summary?: string | null
          case_id?: string | null
          checklist_completed?: boolean | null
          checklist_items?: Json | null
          client_summary?: string
          completed_at?: string | null
          created_at?: string | null
          critical_alerts?: string | null
          current_medications?: string | null
          current_status?: string
          decline_reason?: string | null
          declined_at?: string | null
          effective_date?: string | null
          from_rn_id?: string
          handoff_documents?: string[] | null
          handoff_reason?: string
          handoff_reason_notes?: string | null
          id?: string
          insurance_status?: string | null
          key_contacts?: string | null
          long_term_goals?: string | null
          pending_tasks?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          safety_concerns?: string | null
          short_term_goals?: string | null
          status?: string | null
          to_rn_id?: string
          transition_notes?: string | null
          upcoming_appointments?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_handoffs_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_handoffs_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_notes: {
        Row: {
          case_id: string
          created_at: string
          created_by: string
          id: string
          note_text: string
          updated_at: string
          visibility: string
        }
        Insert: {
          case_id: string
          created_at?: string
          created_by: string
          id?: string
          note_text: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          case_id?: string
          created_at?: string
          created_by?: string
          id?: string
          note_text?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      case_reassignments: {
        Row: {
          case_id: string
          created_at: string
          from_rn_id: string
          id: string
          notes: string | null
          reason: string | null
          reassigned_at: string
          reassigned_by: string
          to_rn_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          from_rn_id: string
          id?: string
          notes?: string | null
          reason?: string | null
          reassigned_at?: string
          reassigned_by: string
          to_rn_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          from_rn_id?: string
          id?: string
          notes?: string | null
          reason?: string | null
          reassigned_at?: string
          reassigned_by?: string
          to_rn_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_reassignments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_reassignments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_reviews: {
        Row: {
          action_items: Json | null
          approved_at: string | null
          approved_by: string | null
          case_id: string
          created_at: string
          due_date: string | null
          findings: string | null
          id: string
          quality_score: number | null
          recommendations: string | null
          review_date: string
          review_type: string
          reviewer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          action_items?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          case_id: string
          created_at?: string
          due_date?: string | null
          findings?: string | null
          id?: string
          quality_score?: number | null
          recommendations?: string | null
          review_date?: string
          review_type: string
          reviewer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          action_items?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          case_id?: string
          created_at?: string
          due_date?: string | null
          findings?: string | null
          id?: string
          quality_score?: number | null
          recommendations?: string | null
          review_date?: string
          review_type?: string
          reviewer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_reviews_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_reviews_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_summaries: {
        Row: {
          case_id: string
          edited_at: string | null
          edited_content: string | null
          generated_at: string
          generated_by: string
          id: string
          metadata: Json | null
          summary_content: string
          summary_type: string
        }
        Insert: {
          case_id: string
          edited_at?: string | null
          edited_content?: string | null
          generated_at?: string
          generated_by: string
          id?: string
          metadata?: Json | null
          summary_content: string
          summary_type?: string
        }
        Update: {
          case_id?: string
          edited_at?: string | null
          edited_content?: string | null
          generated_at?: string
          generated_by?: string
          id?: string
          metadata?: Json | null
          summary_content?: string
          summary_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_summaries_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_summaries_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_tasks: {
        Row: {
          assigned_role: string | null
          assigned_to: string | null
          case_id: string
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_role?: string | null
          assigned_to?: string | null
          case_id: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_role?: string | null
          assigned_to?: string | null
          case_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      case_workflows: {
        Row: {
          case_id: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          current_step: number | null
          id: string
          started_at: string | null
          status: string | null
          steps: Json
          template_id: string | null
          updated_at: string | null
          workflow_name: string
        }
        Insert: {
          case_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          current_step?: number | null
          id?: string
          started_at?: string | null
          status?: string | null
          steps: Json
          template_id?: string | null
          updated_at?: string | null
          workflow_name: string
        }
        Update: {
          case_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          current_step?: number | null
          id?: string
          started_at?: string | null
          status?: string | null
          steps?: Json
          template_id?: string | null
          updated_at?: string | null
          workflow_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_workflows_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_workflows_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_workflows_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "care_workflow_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          attorney_code: string | null
          atty_ref: string | null
          client_label: string | null
          client_number: string | null
          client_type: string | null
          consent: Json | null
          converted_at: string | null
          created_at: string | null
          created_by: string | null
          documentation: Json | null
          flags: string[] | null
          fourps: Json | null
          has_sensitive_disclosures: boolean | null
          id: string
          incident: Json | null
          last_pain_diary_at: string | null
          odg_benchmarks: Json | null
          original_intake_id: string | null
          pain_diary_count_30d: number | null
          provider_routed: boolean | null
          sdoh: Json | null
          sdoh_resolved: Json | null
          specialist_report_uploaded: boolean | null
          status: string | null
        }
        Insert: {
          attorney_code?: string | null
          atty_ref?: string | null
          client_label?: string | null
          client_number?: string | null
          client_type?: string | null
          consent?: Json | null
          converted_at?: string | null
          created_at?: string | null
          created_by?: string | null
          documentation?: Json | null
          flags?: string[] | null
          fourps?: Json | null
          has_sensitive_disclosures?: boolean | null
          id?: string
          incident?: Json | null
          last_pain_diary_at?: string | null
          odg_benchmarks?: Json | null
          original_intake_id?: string | null
          pain_diary_count_30d?: number | null
          provider_routed?: boolean | null
          sdoh?: Json | null
          sdoh_resolved?: Json | null
          specialist_report_uploaded?: boolean | null
          status?: string | null
        }
        Update: {
          attorney_code?: string | null
          atty_ref?: string | null
          client_label?: string | null
          client_number?: string | null
          client_type?: string | null
          consent?: Json | null
          converted_at?: string | null
          created_at?: string | null
          created_by?: string | null
          documentation?: Json | null
          flags?: string[] | null
          fourps?: Json | null
          has_sensitive_disclosures?: boolean | null
          id?: string
          incident?: Json | null
          last_pain_diary_at?: string | null
          odg_benchmarks?: Json | null
          original_intake_id?: string | null
          pain_diary_count_30d?: number | null
          provider_routed?: boolean | null
          sdoh?: Json | null
          sdoh_resolved?: Json | null
          specialist_report_uploaded?: boolean | null
          status?: string | null
        }
        Relationships: []
      }
      checkins: {
        Row: {
          case_id: string | null
          created_at: string | null
          id: string
          payload: Json
          user_id: string | null
        }
        Insert: {
          case_id?: string | null
          created_at?: string | null
          id?: string
          payload: Json
          user_id?: string | null
        }
        Update: {
          case_id?: string | null
          created_at?: string | null
          id?: string
          payload?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkins_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      client_action_items: {
        Row: {
          assigned_by: string | null
          case_id: string
          client_id: string
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_by?: string | null
          case_id: string
          client_id: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string | null
          case_id?: string
          client_id?: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      client_allergies: {
        Row: {
          allergen_name: string
          case_id: string
          client_id: string
          created_at: string
          id: string
          is_active: boolean | null
          notes: string | null
          reaction: string | null
          reported_date: string | null
          severity: string | null
          updated_at: string
        }
        Insert: {
          allergen_name: string
          case_id: string
          client_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          reaction?: string | null
          reported_date?: string | null
          severity?: string | null
          updated_at?: string
        }
        Update: {
          allergen_name?: string
          case_id?: string
          client_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          reaction?: string | null
          reported_date?: string | null
          severity?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      client_appointments: {
        Row: {
          appointment_date: string
          appointment_time: string | null
          cancellation_deadline: string | null
          cancellation_policy_hours: number | null
          cancellation_reason: string | null
          cancelled_by: string | null
          case_id: string
          client_id: string
          created_at: string | null
          id: string
          location: string | null
          notes: string | null
          provider_id: string | null
          provider_name: string | null
          provider_ref_id: string | null
          reminder_sent: boolean | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time?: string | null
          cancellation_deadline?: string | null
          cancellation_policy_hours?: number | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          case_id: string
          client_id: string
          created_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          provider_id?: string | null
          provider_name?: string | null
          provider_ref_id?: string | null
          reminder_sent?: boolean | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string | null
          cancellation_deadline?: string | null
          cancellation_policy_hours?: number | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          case_id?: string
          client_id?: string
          created_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          provider_id?: string | null
          provider_name?: string | null
          provider_ref_id?: string | null
          reminder_sent?: boolean | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_appointments_provider_ref_id_fkey"
            columns: ["provider_ref_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      client_checkins: {
        Row: {
          anxiety_scale: number | null
          case_id: string
          client_id: string
          created_at: string
          created_by_role: string
          depression_scale: number | null
          id: string
          note: string | null
          p_physical: number
          p_psychological: number
          p_psychosocial: number
          p_purpose: number
          pain_scale: number
          sdoh_employment: number | null
          sdoh_financial: number | null
          sdoh_food: number | null
          sdoh_healthcare_access: number | null
          sdoh_housing: number | null
          sdoh_income_range: string | null
          sdoh_insurance: number | null
          sdoh_safety: number | null
          sdoh_social_support: number | null
          sdoh_transport: number | null
        }
        Insert: {
          anxiety_scale?: number | null
          case_id: string
          client_id: string
          created_at?: string
          created_by_role?: string
          depression_scale?: number | null
          id?: string
          note?: string | null
          p_physical: number
          p_psychological: number
          p_psychosocial: number
          p_purpose: number
          pain_scale: number
          sdoh_employment?: number | null
          sdoh_financial?: number | null
          sdoh_food?: number | null
          sdoh_healthcare_access?: number | null
          sdoh_housing?: number | null
          sdoh_income_range?: string | null
          sdoh_insurance?: number | null
          sdoh_safety?: number | null
          sdoh_social_support?: number | null
          sdoh_transport?: number | null
        }
        Update: {
          anxiety_scale?: number | null
          case_id?: string
          client_id?: string
          created_at?: string
          created_by_role?: string
          depression_scale?: number | null
          id?: string
          note?: string | null
          p_physical?: number
          p_psychological?: number
          p_psychosocial?: number
          p_purpose?: number
          pain_scale?: number
          sdoh_employment?: number | null
          sdoh_financial?: number | null
          sdoh_food?: number | null
          sdoh_healthcare_access?: number | null
          sdoh_housing?: number | null
          sdoh_income_range?: string | null
          sdoh_insurance?: number | null
          sdoh_safety?: number | null
          sdoh_social_support?: number | null
          sdoh_transport?: number | null
        }
        Relationships: []
      }
      client_communications: {
        Row: {
          channel: string
          client_id: string | null
          created_at: string | null
          delivered_at: string | null
          id: string
          message_content: string | null
          metadata: Json | null
          sent_at: string | null
          status: string
          type: string
        }
        Insert: {
          channel: string
          client_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          message_content?: string | null
          metadata?: Json | null
          sent_at?: string | null
          status?: string
          type: string
        }
        Update: {
          channel?: string
          client_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          message_content?: string | null
          metadata?: Json | null
          sent_at?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_communications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_communications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      client_direct_messages: {
        Row: {
          case_id: string
          created_at: string | null
          id: string
          message_text: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          case_id: string
          created_at?: string | null
          id?: string
          message_text: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          case_id?: string
          created_at?: string | null
          id?: string
          message_text?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      client_education_access: {
        Row: {
          accessed_at: string | null
          case_id: string | null
          client_id: string | null
          completed: boolean | null
          completed_at: string | null
          feedback_comment: string | null
          feedback_rating: number | null
          id: string
          material_id: string | null
          shared_by: string | null
        }
        Insert: {
          accessed_at?: string | null
          case_id?: string | null
          client_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          feedback_comment?: string | null
          feedback_rating?: number | null
          id?: string
          material_id?: string | null
          shared_by?: string | null
        }
        Update: {
          accessed_at?: string | null
          case_id?: string | null
          client_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          feedback_comment?: string | null
          feedback_rating?: number | null
          id?: string
          material_id?: string | null
          shared_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_education_access_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_education_access_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_education_access_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "education_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      client_goals: {
        Row: {
          case_id: string
          category: string
          client_id: string
          created_at: string | null
          current_progress: number | null
          goal_text: string
          id: string
          status: string | null
          target_date: string | null
          updated_at: string | null
        }
        Insert: {
          case_id: string
          category: string
          client_id: string
          created_at?: string | null
          current_progress?: number | null
          goal_text: string
          id?: string
          status?: string | null
          target_date?: string | null
          updated_at?: string | null
        }
        Update: {
          case_id?: string
          category?: string
          client_id?: string
          created_at?: string | null
          current_progress?: number | null
          goal_text?: string
          id?: string
          status?: string | null
          target_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      client_medications: {
        Row: {
          adherence_notes: string | null
          case_id: string
          change_history: Json | null
          client_id: string
          created_at: string | null
          dosage: string | null
          end_date: string | null
          frequency: string | null
          id: string
          injury_timing: string | null
          is_active: boolean | null
          medication_name: string
          prescribing_doctor: string | null
          side_effects: string | null
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          adherence_notes?: string | null
          case_id: string
          change_history?: Json | null
          client_id: string
          created_at?: string | null
          dosage?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          injury_timing?: string | null
          is_active?: boolean | null
          medication_name: string
          prescribing_doctor?: string | null
          side_effects?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          adherence_notes?: string | null
          case_id?: string
          change_history?: Json | null
          client_id?: string
          created_at?: string | null
          dosage?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          injury_timing?: string | null
          is_active?: boolean | null
          medication_name?: string
          prescribing_doctor?: string | null
          side_effects?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      client_preferences: {
        Row: {
          attorney_notify_consent: boolean
          client_id: string
          consent_expires_at: string | null
          consent_signed_at: string
          created_at: string
          id: string
          revoked: boolean
          revoked_at: string | null
          updated_at: string
        }
        Insert: {
          attorney_notify_consent?: boolean
          client_id: string
          consent_expires_at?: string | null
          consent_signed_at?: string
          created_at?: string
          id?: string
          revoked?: boolean
          revoked_at?: string | null
          updated_at?: string
        }
        Update: {
          attorney_notify_consent?: boolean
          client_id?: string
          consent_expires_at?: string | null
          consent_signed_at?: string
          created_at?: string
          id?: string
          revoked?: boolean
          revoked_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      client_satisfaction_surveys: {
        Row: {
          care_quality_rating: number | null
          case_id: string | null
          client_id: string | null
          comments: string | null
          communication_rating: number | null
          created_at: string | null
          id: string
          overall_rating: number
          professionalism_rating: number | null
          responsiveness_rating: number | null
          rn_id: string | null
          survey_date: string
          would_recommend: boolean | null
        }
        Insert: {
          care_quality_rating?: number | null
          case_id?: string | null
          client_id?: string | null
          comments?: string | null
          communication_rating?: number | null
          created_at?: string | null
          id?: string
          overall_rating: number
          professionalism_rating?: number | null
          responsiveness_rating?: number | null
          rn_id?: string | null
          survey_date?: string
          would_recommend?: boolean | null
        }
        Update: {
          care_quality_rating?: number | null
          case_id?: string | null
          client_id?: string | null
          comments?: string | null
          communication_rating?: number | null
          created_at?: string | null
          id?: string
          overall_rating?: number
          professionalism_rating?: number | null
          responsiveness_rating?: number | null
          rn_id?: string | null
          survey_date?: string
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "client_satisfaction_surveys_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_satisfaction_surveys_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      client_sensitive_disclosures: {
        Row: {
          audit_event: string | null
          audit_note: string | null
          case_id: string
          category: string
          consent_attorney: string | null
          consent_provider: string | null
          consent_ts: string | null
          created_at: string
          created_by: string | null
          free_text: string | null
          id: string
          item_code: string
          origin_section: string
          risk_level: string | null
          selected: boolean
          updated_at: string
        }
        Insert: {
          audit_event?: string | null
          audit_note?: string | null
          case_id: string
          category: string
          consent_attorney?: string | null
          consent_provider?: string | null
          consent_ts?: string | null
          created_at?: string
          created_by?: string | null
          free_text?: string | null
          id?: string
          item_code: string
          origin_section?: string
          risk_level?: string | null
          selected?: boolean
          updated_at?: string
        }
        Update: {
          audit_event?: string | null
          audit_note?: string | null
          case_id?: string
          category?: string
          consent_attorney?: string | null
          consent_provider?: string | null
          consent_ts?: string | null
          created_at?: string
          created_by?: string | null
          free_text?: string | null
          id?: string
          item_code?: string
          origin_section?: string
          risk_level?: string | null
          selected?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_sensitive_disclosures_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_sensitive_disclosures_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      client_treatments: {
        Row: {
          case_id: string
          client_id: string
          created_at: string | null
          end_date: string | null
          frequency: string | null
          id: string
          injury_timing: string | null
          is_active: boolean | null
          notes: string | null
          start_date: string | null
          treatment_name: string
          updated_at: string | null
        }
        Insert: {
          case_id: string
          client_id: string
          created_at?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          injury_timing?: string | null
          is_active?: boolean | null
          notes?: string | null
          start_date?: string | null
          treatment_name: string
          updated_at?: string | null
        }
        Update: {
          case_id?: string
          client_id?: string
          created_at?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          injury_timing?: string | null
          is_active?: boolean | null
          notes?: string | null
          start_date?: string | null
          treatment_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      clinical_audits: {
        Row: {
          audit_name: string
          audit_type: string
          auditor_id: string | null
          cases_reviewed: number | null
          completed_date: string | null
          compliance_rate: number | null
          created_at: string | null
          created_by: string | null
          findings: string | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          metadata: Json | null
          priority: string | null
          recommendations: string | null
          scheduled_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          audit_name: string
          audit_type: string
          auditor_id?: string | null
          cases_reviewed?: number | null
          completed_date?: string | null
          compliance_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          findings?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          recommendations?: string | null
          scheduled_date: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          audit_name?: string
          audit_type?: string
          auditor_id?: string | null
          cases_reviewed?: number | null
          completed_date?: string | null
          compliance_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          findings?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          recommendations?: string | null
          scheduled_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      clinical_guidelines: {
        Row: {
          contraindications: string[] | null
          created_at: string | null
          criteria_for_approval: string | null
          diagnosis_code: string
          diagnosis_name: string
          evidence_level: string | null
          frequency_guidelines: string | null
          guideline_source: string
          guideline_summary: string | null
          guideline_title: string
          guideline_url: string | null
          id: string
          is_active: boolean | null
          last_updated_date: string | null
          metadata: Json | null
          recommended_duration: string | null
          red_flags: string[] | null
          treatment_category: string
          updated_at: string | null
        }
        Insert: {
          contraindications?: string[] | null
          created_at?: string | null
          criteria_for_approval?: string | null
          diagnosis_code: string
          diagnosis_name: string
          evidence_level?: string | null
          frequency_guidelines?: string | null
          guideline_source: string
          guideline_summary?: string | null
          guideline_title: string
          guideline_url?: string | null
          id?: string
          is_active?: boolean | null
          last_updated_date?: string | null
          metadata?: Json | null
          recommended_duration?: string | null
          red_flags?: string[] | null
          treatment_category: string
          updated_at?: string | null
        }
        Update: {
          contraindications?: string[] | null
          created_at?: string | null
          criteria_for_approval?: string | null
          diagnosis_code?: string
          diagnosis_name?: string
          evidence_level?: string | null
          frequency_guidelines?: string | null
          guideline_source?: string
          guideline_summary?: string | null
          guideline_title?: string
          guideline_url?: string | null
          id?: string
          is_active?: boolean | null
          last_updated_date?: string | null
          metadata?: Json | null
          recommended_duration?: string | null
          red_flags?: string[] | null
          treatment_category?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      complaint_timeline: {
        Row: {
          complaint_id: string
          created_at: string
          event_type: string
          id: string
          notes: string | null
          performed_by: string | null
          performed_by_role: string | null
          status: string
        }
        Insert: {
          complaint_id: string
          created_at?: string
          event_type: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          performed_by_role?: string | null
          status: string
        }
        Update: {
          complaint_id?: string
          created_at?: string
          event_type?: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          performed_by_role?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_timeline_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          archived_at: string | null
          assigned_to: string | null
          complaint_about: string
          complaint_description: string
          created_at: string
          id: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          status_changed_at: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          assigned_to?: string | null
          complaint_about: string
          complaint_description: string
          created_at?: string
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          status_changed_at?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          assigned_to?: string | null
          complaint_about?: string
          complaint_description?: string
          created_at?: string
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          status_changed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      concern_attachments: {
        Row: {
          concern_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          uploaded_by: string
        }
        Insert: {
          concern_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by: string
        }
        Update: {
          concern_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "concern_attachments_concern_id_fkey"
            columns: ["concern_id"]
            isOneToOne: false
            referencedRelation: "concerns"
            referencedColumns: ["id"]
          },
        ]
      }
      concern_timeline: {
        Row: {
          concern_id: string
          created_at: string
          event_type: string
          id: string
          notes: string | null
          performed_by: string | null
          performed_by_role: string | null
          status: string
        }
        Insert: {
          concern_id: string
          created_at?: string
          event_type: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          performed_by_role?: string | null
          status: string
        }
        Update: {
          concern_id?: string
          created_at?: string
          event_type?: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          performed_by_role?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "concern_timeline_concern_id_fkey"
            columns: ["concern_id"]
            isOneToOne: false
            referencedRelation: "concerns"
            referencedColumns: ["id"]
          },
        ]
      }
      concerns: {
        Row: {
          archived_at: string | null
          assigned_rn: string | null
          care_addressed: string | null
          care_addressed_details: string | null
          case_id: string
          client_id: string
          concern_category: string | null
          concern_description: string
          concern_status: string
          concern_timestamp: string
          created_at: string
          felt_respected: string | null
          felt_respected_details: string | null
          id: string
          provider_name: string
          rn_followup_notes: string | null
          status_changed_at: string | null
          updated_at: string
          visit_date: string | null
        }
        Insert: {
          archived_at?: string | null
          assigned_rn?: string | null
          care_addressed?: string | null
          care_addressed_details?: string | null
          case_id: string
          client_id: string
          concern_category?: string | null
          concern_description: string
          concern_status?: string
          concern_timestamp?: string
          created_at?: string
          felt_respected?: string | null
          felt_respected_details?: string | null
          id?: string
          provider_name: string
          rn_followup_notes?: string | null
          status_changed_at?: string | null
          updated_at?: string
          visit_date?: string | null
        }
        Update: {
          archived_at?: string | null
          assigned_rn?: string | null
          care_addressed?: string | null
          care_addressed_details?: string | null
          case_id?: string
          client_id?: string
          concern_category?: string | null
          concern_description?: string
          concern_status?: string
          concern_timestamp?: string
          created_at?: string
          felt_respected?: string | null
          felt_respected_details?: string | null
          id?: string
          provider_name?: string
          rn_followup_notes?: string | null
          status_changed_at?: string | null
          updated_at?: string
          visit_date?: string | null
        }
        Relationships: []
      }
      credentials_tracking: {
        Row: {
          created_at: string | null
          created_by: string | null
          credential_name: string
          credential_type: string
          documents: Json | null
          expiration_date: string
          id: string
          issue_date: string | null
          issuing_organization: string | null
          license_number: string | null
          notes: string | null
          renewal_reminder_sent: boolean | null
          staff_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          credential_name: string
          credential_type: string
          documents?: Json | null
          expiration_date: string
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          license_number?: string | null
          notes?: string | null
          renewal_reminder_sent?: boolean | null
          staff_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          credential_name?: string
          credential_type?: string
          documents?: Json | null
          expiration_date?: string
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          license_number?: string | null
          notes?: string | null
          renewal_reminder_sent?: boolean | null
          staff_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      data_retention_policy: {
        Row: {
          client_record_years: number | null
          export_before_purge: boolean | null
          id: string
          purged_data_backup_days: number | null
          updated_at: string | null
        }
        Insert: {
          client_record_years?: number | null
          export_before_purge?: boolean | null
          id?: string
          purged_data_backup_days?: number | null
          updated_at?: string | null
        }
        Update: {
          client_record_years?: number | null
          export_before_purge?: boolean | null
          id?: string
          purged_data_backup_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      disclosure_log: {
        Row: {
          alert_id: string | null
          authorization_id: string | null
          case_id: string
          disclosed_at: string
          disclosed_by: string | null
          disclosed_to_role: string
          disclosed_to_user_id: string
          disclosure_reason: string
          disclosure_scope: Database["public"]["Enums"]["disclosure_scope"]
          id: string
          metadata: Json | null
        }
        Insert: {
          alert_id?: string | null
          authorization_id?: string | null
          case_id: string
          disclosed_at?: string
          disclosed_by?: string | null
          disclosed_to_role: string
          disclosed_to_user_id: string
          disclosure_reason: string
          disclosure_scope: Database["public"]["Enums"]["disclosure_scope"]
          id?: string
          metadata?: Json | null
        }
        Update: {
          alert_id?: string | null
          authorization_id?: string | null
          case_id?: string
          disclosed_at?: string
          disclosed_by?: string | null
          disclosed_to_role?: string
          disclosed_to_user_id?: string
          disclosure_reason?: string
          disclosure_scope?: Database["public"]["Enums"]["disclosure_scope"]
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "disclosure_log_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "case_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disclosure_log_authorization_id_fkey"
            columns: ["authorization_id"]
            isOneToOne: false
            referencedRelation: "client_preferences"
            referencedColumns: ["id"]
          },
        ]
      }
      document_activity_log: {
        Row: {
          action_type: string
          created_at: string
          document_id: string
          id: string
          metadata: Json | null
          performed_by: string
          performed_by_name: string | null
          performed_by_role: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          document_id: string
          id?: string
          metadata?: Json | null
          performed_by: string
          performed_by_name?: string | null
          performed_by_role?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          document_id?: string
          id?: string
          metadata?: Json | null
          performed_by?: string
          performed_by_name?: string | null
          performed_by_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_activity_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          activity_log: Json | null
          case_id: string
          category: string | null
          created_at: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_sensitive: boolean | null
          metadata: Json | null
          mime_type: string | null
          mirror_to_case_notes: boolean | null
          note: string | null
          read_by: string[] | null
          requires_attention: boolean | null
          shared_with: string[] | null
          status: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          activity_log?: Json | null
          case_id: string
          category?: string | null
          created_at?: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_sensitive?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          mirror_to_case_notes?: boolean | null
          note?: string | null
          read_by?: string[] | null
          requires_attention?: boolean | null
          shared_with?: string[] | null
          status?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          activity_log?: Json | null
          case_id?: string
          category?: string | null
          created_at?: string | null
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_sensitive?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          mirror_to_case_notes?: boolean | null
          note?: string | null
          read_by?: string[] | null
          requires_attention?: boolean | null
          shared_with?: string[] | null
          status?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      e_sign_audit_logs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          request_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          request_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          request_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "e_sign_audit_logs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "e_sign_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      e_sign_requests: {
        Row: {
          audit_trail: Json | null
          case_id: string
          created_at: string
          declined_at: string | null
          document_path: string | null
          expired_at: string | null
          id: string
          pdf_hash: string | null
          requested_by: string
          sent_at: string
          signed_at: string | null
          signer_id: string
          status: string
          template_id: string
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          audit_trail?: Json | null
          case_id: string
          created_at?: string
          declined_at?: string | null
          document_path?: string | null
          expired_at?: string | null
          id?: string
          pdf_hash?: string | null
          requested_by: string
          sent_at?: string
          signed_at?: string | null
          signer_id: string
          status?: string
          template_id: string
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          audit_trail?: Json | null
          case_id?: string
          created_at?: string
          declined_at?: string | null
          document_path?: string | null
          expired_at?: string | null
          id?: string
          pdf_hash?: string | null
          requested_by?: string
          sent_at?: string
          signed_at?: string | null
          signer_id?: string
          status?: string
          template_id?: string
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "e_sign_requests_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "e_sign_requests_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "e_sign_requests_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "e_sign_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      e_sign_templates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          merge_fields: Json | null
          name: string
          template_content: string
          template_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          merge_fields?: Json | null
          name: string
          template_content: string
          template_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          merge_fields?: Json | null
          name?: string
          template_content?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      education_materials: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          diagnosis_tags: string[] | null
          download_count: number | null
          duration_minutes: number | null
          external_url: string | null
          file_url: string | null
          id: string
          is_active: boolean | null
          language: string | null
          material_type: string
          reading_level: string | null
          thumbnail_url: string | null
          title: string
          treatment_tags: string[] | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          diagnosis_tags?: string[] | null
          download_count?: number | null
          duration_minutes?: number | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          material_type: string
          reading_level?: string | null
          thumbnail_url?: string | null
          title: string
          treatment_tags?: string[] | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          diagnosis_tags?: string[] | null
          download_count?: number | null
          duration_minutes?: number | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          material_type?: string
          reading_level?: string | null
          thumbnail_url?: string | null
          title?: string
          treatment_tags?: string[] | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      feature_definitions: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          display_order: number | null
          feature_key: string
          feature_name: string
          icon_name: string | null
          id: string
          is_core_feature: boolean | null
          tier_required: Database["public"]["Enums"]["subscription_tier"]
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          feature_key: string
          feature_name: string
          icon_name?: string | null
          id?: string
          is_core_feature?: boolean | null
          tier_required: Database["public"]["Enums"]["subscription_tier"]
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          feature_key?: string
          feature_name?: string
          icon_name?: string | null
          id?: string
          is_core_feature?: boolean | null
          tier_required?: Database["public"]["Enums"]["subscription_tier"]
        }
        Relationships: []
      }
      feature_usage_logs: {
        Row: {
          attorney_id: string
          created_at: string | null
          feature_key: string
          id: string
          last_used_at: string | null
          metadata: Json | null
          session_duration_seconds: number | null
          usage_count: number | null
        }
        Insert: {
          attorney_id: string
          created_at?: string | null
          feature_key: string
          id?: string
          last_used_at?: string | null
          metadata?: Json | null
          session_duration_seconds?: number | null
          usage_count?: number | null
        }
        Update: {
          attorney_id?: string
          created_at?: string | null
          feature_key?: string
          id?: string
          last_used_at?: string | null
          metadata?: Json | null
          session_duration_seconds?: number | null
          usage_count?: number | null
        }
        Relationships: []
      }
      financial_metrics: {
        Row: {
          amount: number
          attorney_id: string | null
          case_id: string | null
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          metadata: Json | null
          metric_date: string
          metric_type: string
        }
        Insert: {
          amount: number
          attorney_id?: string | null
          case_id?: string | null
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          metric_date?: string
          metric_type: string
        }
        Update: {
          amount?: number
          attorney_id?: string | null
          case_id?: string | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          metric_date?: string
          metric_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_metrics_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_metrics_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          case_id: string | null
          category: string
          created_at: string
          currency: string
          description: string
          due_date: string | null
          id: string
          invoice_number: string | null
          metadata: Json | null
          notes: string | null
          paid_date: string | null
          payment_method: string | null
          processed_at: string | null
          processed_by: string | null
          status: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          case_id?: string | null
          category: string
          created_at?: string
          currency?: string
          description: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          metadata?: Json | null
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          case_id?: string | null
          category?: string
          created_at?: string
          currency?: string
          description?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          metadata?: Json | null
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      hipaa_access_attempts: {
        Row: {
          access_granted: boolean
          attempted_at: string
          case_id: string | null
          created_at: string
          feature_attempted: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string
          user_role: string
        }
        Insert: {
          access_granted?: boolean
          attempted_at?: string
          case_id?: string | null
          created_at?: string
          feature_attempted: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
          user_role: string
        }
        Update: {
          access_granted?: boolean
          attempted_at?: string
          case_id?: string | null
          created_at?: string
          feature_attempted?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string
          user_role?: string
        }
        Relationships: []
      }
      intake_drafts: {
        Row: {
          case_id: string | null
          created_at: string
          expires_at: string
          form_data: Json
          id: string
          step: number
          updated_at: string
          user_id: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          expires_at?: string
          form_data?: Json
          id?: string
          step?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          case_id?: string | null
          created_at?: string
          expires_at?: string
          form_data?: Json
          id?: string
          step?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      intake_uploads: {
        Row: {
          case_id: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          intake_draft_id: string | null
          mime_type: string
          upload_status: string
          uploaded_by: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          intake_draft_id?: string | null
          mime_type: string
          upload_status?: string
          uploaded_by: string
        }
        Update: {
          case_id?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          intake_draft_id?: string | null
          mime_type?: string
          upload_status?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_uploads_intake_draft_id_fkey"
            columns: ["intake_draft_id"]
            isOneToOne: false
            referencedRelation: "intake_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      intakes: {
        Row: {
          case_id: string
          completed: boolean | null
          created_at: string | null
          id: string
          incident_date: string | null
          incident_type: string | null
          initial_treatment: string | null
          injuries: string[] | null
          intake_data: Json | null
          narrative: string | null
          severity_self_score: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          case_id: string
          completed?: boolean | null
          created_at?: string | null
          id?: string
          incident_date?: string | null
          incident_type?: string | null
          initial_treatment?: string | null
          injuries?: string[] | null
          intake_data?: Json | null
          narrative?: string | null
          severity_self_score?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          case_id?: string
          completed?: boolean | null
          created_at?: string | null
          id?: string
          incident_date?: string | null
          incident_type?: string | null
          initial_treatment?: string | null
          injuries?: string[] | null
          intake_data?: Json | null
          narrative?: string | null
          severity_self_score?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intakes_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intakes_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      management_resources: {
        Row: {
          access_level: string
          category: string
          created_at: string
          description: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_featured: boolean | null
          mime_type: string | null
          resource_type: string
          tags: string[] | null
          title: string
          updated_at: string
          uploaded_by: string | null
          version: string | null
        }
        Insert: {
          access_level?: string
          category: string
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_featured?: boolean | null
          mime_type?: string | null
          resource_type: string
          tags?: string[] | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
          version?: string | null
        }
        Update: {
          access_level?: string
          category?: string
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_featured?: boolean | null
          mime_type?: string | null
          resource_type?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          version?: string | null
        }
        Relationships: []
      }
      medication_changes: {
        Row: {
          case_id: string
          change_reason: string
          change_type: string
          changed_at: string
          changed_by: string
          client_id: string
          created_at: string
          id: string
          medication_id: string
          new_value: Json | null
          notes: string | null
          previous_value: Json | null
        }
        Insert: {
          case_id: string
          change_reason: string
          change_type: string
          changed_at?: string
          changed_by: string
          client_id: string
          created_at?: string
          id?: string
          medication_id: string
          new_value?: Json | null
          notes?: string | null
          previous_value?: Json | null
        }
        Update: {
          case_id?: string
          change_reason?: string
          change_type?: string
          changed_at?: string
          changed_by?: string
          client_id?: string
          created_at?: string
          id?: string
          medication_id?: string
          new_value?: Json | null
          notes?: string | null
          previous_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "medication_changes_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "client_medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications_reference: {
        Row: {
          created_at: string
          form: string | null
          generic_name: string | null
          id: string
          name: string
          search_text: string | null
          strength: string | null
        }
        Insert: {
          created_at?: string
          form?: string | null
          generic_name?: string | null
          id?: string
          name: string
          search_text?: string | null
          strength?: string | null
        }
        Update: {
          created_at?: string
          form?: string | null
          generic_name?: string | null
          id?: string
          name?: string
          search_text?: string | null
          strength?: string | null
        }
        Relationships: []
      }
      message_drafts: {
        Row: {
          case_id: string | null
          context: string
          created_at: string
          draft_content: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          case_id?: string | null
          context: string
          created_at?: string
          draft_content: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          case_id?: string | null
          context?: string
          created_at?: string
          draft_content?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      message_reminders: {
        Row: {
          case_id: string | null
          created_at: string
          id: string
          message_id: string
          remind_at: string
          reminded: boolean
          reminded_at: string | null
          user_id: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          id?: string
          message_id: string
          remind_at: string
          reminded?: boolean
          reminded_at?: string | null
          user_id: string
        }
        Update: {
          case_id?: string | null
          created_at?: string
          id?: string
          message_id?: string
          remind_at?: string
          reminded?: boolean
          reminded_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          case_id: string
          created_at: string | null
          id: string
          message_text: string
          recipient_role: string
          responded_at: string | null
          responded_by: string | null
          response_text: string | null
          sender_id: string
          status: string | null
          subject: string
        }
        Insert: {
          case_id: string
          created_at?: string | null
          id?: string
          message_text: string
          recipient_role: string
          responded_at?: string | null
          responded_by?: string | null
          response_text?: string | null
          sender_id: string
          status?: string | null
          subject: string
        }
        Update: {
          case_id?: string
          created_at?: string | null
          id?: string
          message_text?: string
          recipient_role?: string
          responded_at?: string | null
          responded_by?: string | null
          response_text?: string | null
          sender_id?: string
          status?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          metadata: Json | null
          read: boolean
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          metadata?: Json | null
          read?: boolean
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          metadata?: Json | null
          read?: boolean
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          avg_response_time_hours: number | null
          cases_handled: number | null
          client_satisfaction_avg: number | null
          created_at: string
          documentation_compliance_rate: number | null
          goals_met: number | null
          goals_total: number | null
          id: string
          metric_period_end: string
          metric_period_start: string
          notes: string | null
          quality_score_avg: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          staff_id: string
          updated_at: string
        }
        Insert: {
          avg_response_time_hours?: number | null
          cases_handled?: number | null
          client_satisfaction_avg?: number | null
          created_at?: string
          documentation_compliance_rate?: number | null
          goals_met?: number | null
          goals_total?: number | null
          id?: string
          metric_period_end: string
          metric_period_start: string
          notes?: string | null
          quality_score_avg?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_id: string
          updated_at?: string
        }
        Update: {
          avg_response_time_hours?: number | null
          cases_handled?: number | null
          client_satisfaction_avg?: number | null
          created_at?: string
          documentation_compliance_rate?: number | null
          goals_met?: number | null
          goals_total?: number | null
          id?: string
          metric_period_end?: string
          metric_period_start?: string
          notes?: string | null
          quality_score_avg?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      pinned_cases: {
        Row: {
          case_id: string
          created_at: string
          id: string
          position: number
          user_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          position?: number
          user_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          position?: number
          user_id?: string
        }
        Relationships: []
      }
      policy_acceptances: {
        Row: {
          accepted_at: string
          attorney_id: string
          attorney_name: string
          checksum: string
          created_at: string
          firm: string | null
          id: string
          ip_address: string | null
          policy_version: string
          signature_blob: string | null
          signature_type: string
          title: string | null
          typed_signature_text: string | null
          user_agent: string | null
        }
        Insert: {
          accepted_at?: string
          attorney_id: string
          attorney_name: string
          checksum: string
          created_at?: string
          firm?: string | null
          id?: string
          ip_address?: string | null
          policy_version?: string
          signature_blob?: string | null
          signature_type: string
          title?: string | null
          typed_signature_text?: string | null
          user_agent?: string | null
        }
        Update: {
          accepted_at?: string
          attorney_id?: string
          attorney_name?: string
          checksum?: string
          created_at?: string
          firm?: string | null
          id?: string
          ip_address?: string | null
          policy_version?: string
          signature_blob?: string | null
          signature_type?: string
          title?: string | null
          typed_signature_text?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      practice_areas: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string
          full_name: string | null
          id: string
          phone_number: string | null
          profile_photo_url: string | null
          sms_notifications_enabled: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email: string
          full_name?: string | null
          id: string
          phone_number?: string | null
          profile_photo_url?: string | null
          sms_notifications_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone_number?: string | null
          profile_photo_url?: string | null
          sms_notifications_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      provider_availability_slots: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean | null
          provider_id: string | null
          start_time: string
          time_slot: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean | null
          provider_id?: string | null
          start_time: string
          time_slot: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean | null
          provider_id?: string | null
          start_time?: string
          time_slot?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_availability_slots_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_contact_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          case_id: string
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          provider_id: string
          reason: string
          requested_by: string
          status: string
          updated_at: string
          urgency: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          case_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          provider_id: string
          reason: string
          requested_by: string
          status?: string
          updated_at?: string
          urgency?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          case_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          provider_id?: string
          reason?: string
          requested_by?: string
          status?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_contact_requests_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_contact_requests_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_contact_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_notes: {
        Row: {
          appointment_id: string | null
          case_id: string
          created_at: string | null
          id: string
          is_appointment_note: boolean | null
          note_content: string
          note_title: string
          provider_id: string
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          case_id: string
          created_at?: string | null
          id?: string
          is_appointment_note?: boolean | null
          note_content: string
          note_title: string
          provider_id: string
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          case_id?: string
          created_at?: string | null
          id?: string
          is_appointment_note?: boolean | null
          note_content?: string
          note_title?: string
          provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "client_appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_ratings: {
        Row: {
          appointment_id: string | null
          client_id: string
          created_at: string
          id: string
          provider_id: string
          rating: number
          review_text: string | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          client_id: string
          created_at?: string
          id?: string
          provider_id: string
          rating: number
          review_text?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          client_id?: string
          created_at?: string
          id?: string
          provider_id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "client_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_ratings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_rn_messages: {
        Row: {
          case_id: string
          created_at: string
          id: string
          message: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_rn_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_rn_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          accepting_patients: boolean | null
          address: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          email: string | null
          fax: string | null
          id: string
          is_active: boolean | null
          name: string
          npi: string | null
          phone: string | null
          practice_name: string | null
          specialty: string
          staff_name: string | null
          staff_text_number: string | null
          state: string | null
          updated_at: string | null
          user_id: string | null
          zip_code: string | null
        }
        Insert: {
          accepting_patients?: boolean | null
          address?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          fax?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          npi?: string | null
          phone?: string | null
          practice_name?: string | null
          specialty: string
          staff_name?: string | null
          staff_text_number?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
          zip_code?: string | null
        }
        Update: {
          accepting_patients?: boolean | null
          address?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          fax?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          npi?: string | null
          phone?: string | null
          practice_name?: string | null
          specialty?: string
          staff_name?: string | null
          staff_text_number?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      quality_improvement_projects: {
        Row: {
          actual_completion: string | null
          barriers: string | null
          baseline_metric: number | null
          category: string
          created_at: string | null
          created_by: string | null
          current_metric: number | null
          description: string | null
          id: string
          improvement_percentage: number | null
          interventions: string | null
          milestones: Json | null
          priority: string
          project_lead: string | null
          project_name: string
          start_date: string
          status: string
          target_completion: string | null
          target_metric: number | null
          team_members: Json | null
          updated_at: string | null
        }
        Insert: {
          actual_completion?: string | null
          barriers?: string | null
          baseline_metric?: number | null
          category: string
          created_at?: string | null
          created_by?: string | null
          current_metric?: number | null
          description?: string | null
          id?: string
          improvement_percentage?: number | null
          interventions?: string | null
          milestones?: Json | null
          priority?: string
          project_lead?: string | null
          project_name: string
          start_date: string
          status?: string
          target_completion?: string | null
          target_metric?: number | null
          team_members?: Json | null
          updated_at?: string | null
        }
        Update: {
          actual_completion?: string | null
          barriers?: string | null
          baseline_metric?: number | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          current_metric?: number | null
          description?: string | null
          id?: string
          improvement_percentage?: number | null
          interventions?: string | null
          milestones?: Json | null
          priority?: string
          project_lead?: string | null
          project_name?: string
          start_date?: string
          status?: string
          target_completion?: string | null
          target_metric?: number | null
          team_members?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          acceptance_status: Database["public"]["Enums"]["referral_status"]
          admin_fee_charged: number
          attorney_id: string
          case_id: string
          client_id: string
          created_at: string
          id: string
          notes: string | null
          payment_date: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          referral_date: string
          reported_by: string | null
          settlement_amount: number | null
          settlement_date: string | null
          updated_at: string
        }
        Insert: {
          acceptance_status?: Database["public"]["Enums"]["referral_status"]
          admin_fee_charged?: number
          attorney_id: string
          case_id: string
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          referral_date?: string
          reported_by?: string | null
          settlement_amount?: number | null
          settlement_date?: string | null
          updated_at?: string
        }
        Update: {
          acceptance_status?: Database["public"]["Enums"]["referral_status"]
          admin_fee_charged?: number
          attorney_id?: string
          case_id?: string
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          referral_date?: string
          reported_by?: string | null
          settlement_amount?: number | null
          settlement_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      report_documents: {
        Row: {
          case_id: string
          created_at: string
          file_path: string | null
          filed_at: string | null
          filed_by: string | null
          filed_status: string
          generated_at: string
          generated_by: string | null
          id: string
          metadata: Json | null
          report_title: string
          report_type: string
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          updated_at: string
        }
        Insert: {
          case_id: string
          created_at?: string
          file_path?: string | null
          filed_at?: string | null
          filed_by?: string | null
          filed_status?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          report_title: string
          report_type: string
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string
        }
        Update: {
          case_id?: string
          created_at?: string
          file_path?: string | null
          filed_at?: string | null
          filed_by?: string | null
          filed_status?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          report_title?: string
          report_type?: string
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      resources_inventory: {
        Row: {
          assigned_to: string | null
          category: string
          cost: number | null
          created_at: string | null
          created_by: string | null
          id: string
          last_maintenance_date: string | null
          location: string | null
          maintenance_schedule: string | null
          metadata: Json | null
          next_maintenance_date: string | null
          notes: string | null
          purchase_date: string | null
          quantity: number | null
          resource_name: string
          resource_type: string
          status: string
          updated_at: string | null
          warranty_expiration: string | null
        }
        Insert: {
          assigned_to?: string | null
          category: string
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_maintenance_date?: string | null
          location?: string | null
          maintenance_schedule?: string | null
          metadata?: Json | null
          next_maintenance_date?: string | null
          notes?: string | null
          purchase_date?: string | null
          quantity?: number | null
          resource_name: string
          resource_type: string
          status?: string
          updated_at?: string | null
          warranty_expiration?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_maintenance_date?: string | null
          location?: string | null
          maintenance_schedule?: string | null
          metadata?: Json | null
          next_maintenance_date?: string | null
          notes?: string | null
          purchase_date?: string | null
          quantity?: number | null
          resource_name?: string
          resource_type?: string
          status?: string
          updated_at?: string | null
          warranty_expiration?: string | null
        }
        Relationships: []
      }
      risk_events: {
        Row: {
          case_id: string | null
          corrective_actions: string | null
          created_at: string | null
          description: string
          event_type: string
          id: string
          immediate_action: string | null
          metadata: Json | null
          preventive_measures: string | null
          reported_by: string | null
          reported_date: string
          resolved_by: string | null
          resolved_date: string | null
          root_cause: string | null
          severity: string
          status: string
          updated_at: string | null
        }
        Insert: {
          case_id?: string | null
          corrective_actions?: string | null
          created_at?: string | null
          description: string
          event_type: string
          id?: string
          immediate_action?: string | null
          metadata?: Json | null
          preventive_measures?: string | null
          reported_by?: string | null
          reported_date?: string
          resolved_by?: string | null
          resolved_date?: string | null
          root_cause?: string | null
          severity?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          case_id?: string | null
          corrective_actions?: string | null
          created_at?: string | null
          description?: string
          event_type?: string
          id?: string
          immediate_action?: string | null
          metadata?: Json | null
          preventive_measures?: string | null
          reported_by?: string | null
          reported_date?: string
          resolved_by?: string | null
          resolved_date?: string | null
          root_cause?: string | null
          severity?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      rn_ai_suggestions: {
        Row: {
          actioned_at: string | null
          case_id: string | null
          confidence_score: number | null
          created_at: string | null
          id: string
          metadata: Json | null
          rn_id: string
          status: string | null
          suggestion_text: string
          suggestion_type: string
        }
        Insert: {
          actioned_at?: string | null
          case_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          rn_id: string
          status?: string | null
          suggestion_text: string
          suggestion_type: string
        }
        Update: {
          actioned_at?: string | null
          case_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          rn_id?: string
          status?: string | null
          suggestion_text?: string
          suggestion_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "rn_ai_suggestions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rn_ai_suggestions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      rn_assessments: {
        Row: {
          assessment_data: Json | null
          assessment_type: string
          case_id: string
          completed_at: string | null
          created_at: string
          due_date: string | null
          followup_due_date: string | null
          followup_reason: string | null
          id: string
          requires_followup: boolean | null
          rn_id: string
          status: string
          updated_at: string
        }
        Insert: {
          assessment_data?: Json | null
          assessment_type: string
          case_id: string
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          followup_due_date?: string | null
          followup_reason?: string | null
          id?: string
          requires_followup?: boolean | null
          rn_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          assessment_data?: Json | null
          assessment_type?: string
          case_id?: string
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          followup_due_date?: string | null
          followup_reason?: string | null
          id?: string
          requires_followup?: boolean | null
          rn_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rn_assessments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rn_assessments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      rn_case_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          case_id: string
          created_at: string
          id: string
          notes: string | null
          rn_id: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          case_id: string
          created_at?: string
          id?: string
          notes?: string | null
          rn_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          case_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          rn_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rn_case_assignments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rn_case_assignments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      rn_cm_service_requests: {
        Row: {
          acknowledged_at: string | null
          assigned_rn: string | null
          attorney_id: string
          completed_at: string | null
          created_at: string
          delivery_files: Json | null
          form_data: Json
          id: string
          price_cents: number
          service_id: string
          service_title: string
          status: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          assigned_rn?: string | null
          attorney_id: string
          completed_at?: string | null
          created_at?: string
          delivery_files?: Json | null
          form_data?: Json
          id?: string
          price_cents: number
          service_id: string
          service_title: string
          status?: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          assigned_rn?: string | null
          attorney_id?: string
          completed_at?: string | null
          created_at?: string
          delivery_files?: Json | null
          form_data?: Json
          id?: string
          price_cents?: number
          service_id?: string
          service_title?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      rn_custom_fields: {
        Row: {
          created_at: string
          created_by: string
          display_order: number | null
          field_name: string
          field_options: Json | null
          field_type: string
          id: string
          is_required: boolean | null
        }
        Insert: {
          created_at?: string
          created_by: string
          display_order?: number | null
          field_name: string
          field_options?: Json | null
          field_type: string
          id?: string
          is_required?: boolean | null
        }
        Update: {
          created_at?: string
          created_by?: string
          display_order?: number | null
          field_name?: string
          field_options?: Json | null
          field_type?: string
          id?: string
          is_required?: boolean | null
        }
        Relationships: []
      }
      rn_daily_metrics: {
        Row: {
          attorney_collaboration_count: number | null
          avg_response_time_hours: number | null
          below_standard_metrics: Json | null
          care_plan_updates: number | null
          cases_closed: number | null
          cases_managed: number | null
          client_checkins_conducted: number | null
          client_messages_responded: number | null
          client_messages_sent: number | null
          client_satisfaction_score: number | null
          created_at: string
          documentation_completion_rate: number | null
          documentation_quality_score: number | null
          emergency_alerts_addressed: number | null
          emergency_alerts_within_sla: number | null
          id: string
          metric_date: string
          new_cases_assigned: number | null
          notes_submitted_at: string | null
          performance_notes: string | null
          rn_user_id: string
          sla_compliance_rate: number | null
          task_completion_rate: number | null
          updated_at: string
        }
        Insert: {
          attorney_collaboration_count?: number | null
          avg_response_time_hours?: number | null
          below_standard_metrics?: Json | null
          care_plan_updates?: number | null
          cases_closed?: number | null
          cases_managed?: number | null
          client_checkins_conducted?: number | null
          client_messages_responded?: number | null
          client_messages_sent?: number | null
          client_satisfaction_score?: number | null
          created_at?: string
          documentation_completion_rate?: number | null
          documentation_quality_score?: number | null
          emergency_alerts_addressed?: number | null
          emergency_alerts_within_sla?: number | null
          id?: string
          metric_date?: string
          new_cases_assigned?: number | null
          notes_submitted_at?: string | null
          performance_notes?: string | null
          rn_user_id: string
          sla_compliance_rate?: number | null
          task_completion_rate?: number | null
          updated_at?: string
        }
        Update: {
          attorney_collaboration_count?: number | null
          avg_response_time_hours?: number | null
          below_standard_metrics?: Json | null
          care_plan_updates?: number | null
          cases_closed?: number | null
          cases_managed?: number | null
          client_checkins_conducted?: number | null
          client_messages_responded?: number | null
          client_messages_sent?: number | null
          client_satisfaction_score?: number | null
          created_at?: string
          documentation_completion_rate?: number | null
          documentation_quality_score?: number | null
          emergency_alerts_addressed?: number | null
          emergency_alerts_within_sla?: number | null
          id?: string
          metric_date?: string
          new_cases_assigned?: number | null
          notes_submitted_at?: string | null
          performance_notes?: string | null
          rn_user_id?: string
          sla_compliance_rate?: number | null
          task_completion_rate?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      rn_diary_attachments: {
        Row: {
          created_at: string
          entry_id: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          entry_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          entry_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "rn_diary_attachments_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "rn_diary_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      rn_diary_comment_mentions: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          mentioned_user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          mentioned_user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          mentioned_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rn_diary_comment_mentions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "rn_diary_entry_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      rn_diary_entries: {
        Row: {
          actual_duration_minutes: number | null
          approval_notes: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          attachments: Json | null
          attendees: Json | null
          case_id: string | null
          completed_at: string | null
          completed_by: string | null
          completion_status: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          custom_fields: Json | null
          description: string | null
          duration_minutes: number | null
          entry_type: string
          estimated_duration_minutes: number | null
          id: string
          is_recurring: boolean | null
          label: string | null
          label_color: string | null
          linked_time_entry_id: string | null
          location: string | null
          metadata: Json | null
          outcome_notes: string | null
          parent_entry_id: string | null
          parent_recurring_id: string | null
          priority: string | null
          recurrence_end_date: string | null
          recurrence_pattern: string | null
          rejection_reason: string | null
          reminder_enabled: boolean | null
          reminder_minutes_before: number | null
          requires_approval: boolean | null
          requires_contact: boolean | null
          rn_id: string
          scheduled_date: string
          scheduled_time: string | null
          shared_with_supervisor: boolean | null
          status: string
          template_name: string | null
          time_tracking_completed_at: string | null
          time_tracking_started_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_duration_minutes?: number | null
          approval_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          attachments?: Json | null
          attendees?: Json | null
          case_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completion_status?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          description?: string | null
          duration_minutes?: number | null
          entry_type: string
          estimated_duration_minutes?: number | null
          id?: string
          is_recurring?: boolean | null
          label?: string | null
          label_color?: string | null
          linked_time_entry_id?: string | null
          location?: string | null
          metadata?: Json | null
          outcome_notes?: string | null
          parent_entry_id?: string | null
          parent_recurring_id?: string | null
          priority?: string | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          rejection_reason?: string | null
          reminder_enabled?: boolean | null
          reminder_minutes_before?: number | null
          requires_approval?: boolean | null
          requires_contact?: boolean | null
          rn_id: string
          scheduled_date: string
          scheduled_time?: string | null
          shared_with_supervisor?: boolean | null
          status?: string
          template_name?: string | null
          time_tracking_completed_at?: string | null
          time_tracking_started_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_duration_minutes?: number | null
          approval_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          attachments?: Json | null
          attendees?: Json | null
          case_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completion_status?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          description?: string | null
          duration_minutes?: number | null
          entry_type?: string
          estimated_duration_minutes?: number | null
          id?: string
          is_recurring?: boolean | null
          label?: string | null
          label_color?: string | null
          linked_time_entry_id?: string | null
          location?: string | null
          metadata?: Json | null
          outcome_notes?: string | null
          parent_entry_id?: string | null
          parent_recurring_id?: string | null
          priority?: string | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          rejection_reason?: string | null
          reminder_enabled?: boolean | null
          reminder_minutes_before?: number | null
          requires_approval?: boolean | null
          requires_contact?: boolean | null
          rn_id?: string
          scheduled_date?: string
          scheduled_time?: string | null
          shared_with_supervisor?: boolean | null
          status?: string
          template_name?: string | null
          time_tracking_completed_at?: string | null
          time_tracking_started_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rn_diary_entries_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rn_diary_entries_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rn_diary_entries_parent_entry_id_fkey"
            columns: ["parent_entry_id"]
            isOneToOne: false
            referencedRelation: "rn_diary_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rn_diary_entries_parent_recurring_id_fkey"
            columns: ["parent_recurring_id"]
            isOneToOne: false
            referencedRelation: "rn_diary_recurring"
            referencedColumns: ["id"]
          },
        ]
      }
      rn_diary_entry_audit: {
        Row: {
          action: string
          change_reason: string | null
          changed_by: string | null
          created_at: string
          entry_id: string
          field_changed: string | null
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          action: string
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          entry_id: string
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          action?: string
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          entry_id?: string
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rn_diary_entry_audit_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "rn_diary_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      rn_diary_entry_comments: {
        Row: {
          author_id: string
          comment_text: string
          created_at: string
          entry_id: string
          id: string
          is_edited: boolean | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          comment_text: string
          created_at?: string
          entry_id: string
          id?: string
          is_edited?: boolean | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          comment_text?: string
          created_at?: string
          entry_id?: string
          id?: string
          is_edited?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rn_diary_entry_comments_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "rn_diary_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      rn_diary_entry_dependencies: {
        Row: {
          created_at: string | null
          created_by: string | null
          dependency_type: string | null
          depends_on_entry_id: string
          entry_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          dependency_type?: string | null
          depends_on_entry_id: string
          entry_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          dependency_type?: string | null
          depends_on_entry_id?: string
          entry_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rn_diary_entry_dependencies_depends_on_entry_id_fkey"
            columns: ["depends_on_entry_id"]
            isOneToOne: false
            referencedRelation: "rn_diary_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rn_diary_entry_dependencies_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "rn_diary_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      rn_diary_entry_tags: {
        Row: {
          created_at: string | null
          entry_id: string
          id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          entry_id: string
          id?: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          entry_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rn_diary_entry_tags_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "rn_diary_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rn_diary_entry_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "rn_diary_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      rn_diary_entry_versions: {
        Row: {
          changed_at: string
          changed_by: string
          changes: Json
          entry_id: string
          id: string
          previous_data: Json
          version_number: number
        }
        Insert: {
          changed_at?: string
          changed_by: string
          changes: Json
          entry_id: string
          id?: string
          previous_data: Json
          version_number: number
        }
        Update: {
          changed_at?: string
          changed_by?: string
          changes?: Json
          entry_id?: string
          id?: string
          previous_data?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "rn_diary_entry_versions_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "rn_diary_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      rn_diary_read_receipts: {
        Row: {
          entry_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          entry_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          entry_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rn_diary_read_receipts_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "rn_diary_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      rn_diary_recurring: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          priority: string | null
          recurrence_days: number[] | null
          recurrence_pattern: string
          rn_id: string
          scheduled_time: string | null
          start_date: string
          template_id: string | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          priority?: string | null
          recurrence_days?: number[] | null
          recurrence_pattern: string
          rn_id: string
          scheduled_time?: string | null
          start_date: string
          template_id?: string | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          priority?: string | null
          recurrence_days?: number[] | null
          recurrence_pattern?: string
          rn_id?: string
          scheduled_time?: string | null
          start_date?: string
          template_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "rn_diary_recurring_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "rn_diary_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      rn_diary_tags: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          id: string
          tag_name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          tag_name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          tag_name?: string
        }
        Relationships: []
      }
      rn_diary_templates: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          description_template: string | null
          estimated_duration_minutes: number | null
          id: string
          is_shared: boolean | null
          priority: string | null
          team_id: string | null
          template_name: string
          title_template: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          description_template?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_shared?: boolean | null
          priority?: string | null
          team_id?: string | null
          template_name: string
          title_template: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          description_template?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_shared?: boolean | null
          priority?: string | null
          team_id?: string | null
          template_name?: string
          title_template?: string
        }
        Relationships: [
          {
            foreignKeyName: "rn_diary_templates_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "rn_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      rn_emergency_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          address_method: string | null
          addressed_at: string | null
          addressed_by: string | null
          alert_details: Json | null
          alert_type: string
          case_id: string
          client_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          resolution_note: string | null
          rn_id: string | null
          severity: string
          shift_start_time: string | null
          sla_deadline: string | null
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          address_method?: string | null
          addressed_at?: string | null
          addressed_by?: string | null
          alert_details?: Json | null
          alert_type: string
          case_id: string
          client_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          resolution_note?: string | null
          rn_id?: string | null
          severity?: string
          shift_start_time?: string | null
          sla_deadline?: string | null
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          address_method?: string | null
          addressed_at?: string | null
          addressed_by?: string | null
          alert_details?: Json | null
          alert_type?: string
          case_id?: string
          client_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          resolution_note?: string | null
          rn_id?: string | null
          severity?: string
          shift_start_time?: string | null
          sla_deadline?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rn_emergency_alerts_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rn_emergency_alerts_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      rn_entry_attachments: {
        Row: {
          entry_id: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          entry_id: string
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          entry_id?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "rn_entry_attachments_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "rn_diary_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      rn_entry_custom_fields: {
        Row: {
          entry_id: string
          field_id: string
          field_value: string | null
          id: string
        }
        Insert: {
          entry_id: string
          field_id: string
          field_value?: string | null
          id?: string
        }
        Update: {
          entry_id?: string
          field_id?: string
          field_value?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rn_entry_custom_fields_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "rn_diary_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rn_entry_custom_fields_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "rn_custom_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      rn_entry_drafts: {
        Row: {
          draft_data: Json
          id: string
          last_saved: string
          rn_id: string
        }
        Insert: {
          draft_data: Json
          id?: string
          last_saved?: string
          rn_id: string
        }
        Update: {
          draft_data?: Json
          id?: string
          last_saved?: string
          rn_id?: string
        }
        Relationships: []
      }
      rn_entry_signatures: {
        Row: {
          entry_id: string
          id: string
          signature_data: string
          signature_type: string
          signed_at: string
          signed_by: string
        }
        Insert: {
          entry_id: string
          id?: string
          signature_data: string
          signature_type?: string
          signed_at?: string
          signed_by: string
        }
        Update: {
          entry_id?: string
          id?: string
          signature_data?: string
          signature_type?: string
          signed_at?: string
          signed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "rn_entry_signatures_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "rn_diary_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      rn_entry_time_tracking: {
        Row: {
          duration_minutes: number | null
          end_time: string | null
          entry_id: string
          id: string
          notes: string | null
          start_time: string
          tracked_by: string
        }
        Insert: {
          duration_minutes?: number | null
          end_time?: string | null
          entry_id: string
          id?: string
          notes?: string | null
          start_time: string
          tracked_by: string
        }
        Update: {
          duration_minutes?: number | null
          end_time?: string | null
          entry_id?: string
          id?: string
          notes?: string | null
          start_time?: string
          tracked_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "rn_entry_time_tracking_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "rn_diary_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      rn_entry_versions: {
        Row: {
          change_description: string | null
          changed_at: string
          changed_by: string
          completion_status: string | null
          description: string | null
          entry_id: string
          entry_type: string | null
          id: string
          priority: string | null
          scheduled_date: string | null
          title: string | null
          version_number: number
        }
        Insert: {
          change_description?: string | null
          changed_at?: string
          changed_by: string
          completion_status?: string | null
          description?: string | null
          entry_id: string
          entry_type?: string | null
          id?: string
          priority?: string | null
          scheduled_date?: string | null
          title?: string | null
          version_number: number
        }
        Update: {
          change_description?: string | null
          changed_at?: string
          changed_by?: string
          completion_status?: string | null
          description?: string | null
          entry_id?: string
          entry_type?: string | null
          id?: string
          priority?: string | null
          scheduled_date?: string | null
          title?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "rn_entry_versions_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "rn_diary_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      rn_goals: {
        Row: {
          created_at: string
          current_value: number | null
          goal_description: string | null
          goal_title: string
          goal_type: string
          id: string
          rn_id: string
          start_date: string
          status: string | null
          target_date: string
          target_value: number
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          goal_description?: string | null
          goal_title: string
          goal_type: string
          id?: string
          rn_id: string
          start_date: string
          status?: string | null
          target_date: string
          target_value: number
        }
        Update: {
          created_at?: string
          current_value?: number | null
          goal_description?: string | null
          goal_title?: string
          goal_type?: string
          id?: string
          rn_id?: string
          start_date?: string
          status?: string | null
          target_date?: string
          target_value?: number
        }
        Relationships: []
      }
      rn_learning_resources: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          resource_type: string
          tags: string[] | null
          title: string
          url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          resource_type: string
          tags?: string[] | null
          title: string
          url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          resource_type?: string
          tags?: string[] | null
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      rn_metadata: {
        Row: {
          after_hours_availability: boolean | null
          alternate_phone: string | null
          available_for_new_cases: boolean | null
          created_at: string | null
          credentials: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          id: string
          license_number: string | null
          license_state: string | null
          max_active_cases: number | null
          office_location: string | null
          phone: string | null
          preferred_shift: string | null
          updated_at: string | null
          user_id: string
          weekend_availability: boolean | null
        }
        Insert: {
          after_hours_availability?: boolean | null
          alternate_phone?: string | null
          available_for_new_cases?: boolean | null
          created_at?: string | null
          credentials?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          license_number?: string | null
          license_state?: string | null
          max_active_cases?: number | null
          office_location?: string | null
          phone?: string | null
          preferred_shift?: string | null
          updated_at?: string | null
          user_id: string
          weekend_availability?: boolean | null
        }
        Update: {
          after_hours_availability?: boolean | null
          alternate_phone?: string | null
          available_for_new_cases?: boolean | null
          created_at?: string | null
          credentials?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          license_number?: string | null
          license_state?: string | null
          max_active_cases?: number | null
          office_location?: string | null
          phone?: string | null
          preferred_shift?: string | null
          updated_at?: string | null
          user_id?: string
          weekend_availability?: boolean | null
        }
        Relationships: []
      }
      rn_metric_notes: {
        Row: {
          created_at: string
          id: string
          metric_date: string
          metric_name: string
          metric_value: number
          note: string
          rn_user_id: string
          target_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metric_date: string
          metric_name: string
          metric_value: number
          note: string
          rn_user_id: string
          target_value: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metric_date?: string
          metric_name?: string
          metric_value?: number
          note?: string
          rn_user_id?: string
          target_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      rn_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          metadata: Json | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          metadata?: Json | null
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      rn_offline_queue: {
        Row: {
          action_type: string
          created_at: string
          id: string
          record_data: Json
          rn_id: string
          synced: boolean | null
          synced_at: string | null
          table_name: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          record_data: Json
          rn_id: string
          synced?: boolean | null
          synced_at?: string | null
          table_name: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          record_data?: Json
          rn_id?: string
          synced?: boolean | null
          synced_at?: string | null
          table_name?: string
        }
        Relationships: []
      }
      rn_performance_reviews: {
        Row: {
          acknowledged_at: string | null
          action_items: Json | null
          areas_for_improvement: string | null
          client_satisfaction_score: number | null
          created_at: string
          documentation_score: number | null
          id: string
          overall_rating: number
          performance_tier: string | null
          quality_score: number | null
          response_time_score: number | null
          review_period_end: string
          review_period_start: string
          reviewer_id: string
          rn_user_id: string
          sla_compliance_score: number | null
          status: string | null
          strengths: string | null
          supervisor_notes: string | null
          task_completion_score: number | null
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          action_items?: Json | null
          areas_for_improvement?: string | null
          client_satisfaction_score?: number | null
          created_at?: string
          documentation_score?: number | null
          id?: string
          overall_rating: number
          performance_tier?: string | null
          quality_score?: number | null
          response_time_score?: number | null
          review_period_end: string
          review_period_start: string
          reviewer_id: string
          rn_user_id: string
          sla_compliance_score?: number | null
          status?: string | null
          strengths?: string | null
          supervisor_notes?: string | null
          task_completion_score?: number | null
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          action_items?: Json | null
          areas_for_improvement?: string | null
          client_satisfaction_score?: number | null
          created_at?: string
          documentation_score?: number | null
          id?: string
          overall_rating?: number
          performance_tier?: string | null
          quality_score?: number | null
          response_time_score?: number | null
          review_period_end?: string
          review_period_start?: string
          reviewer_id?: string
          rn_user_id?: string
          sla_compliance_score?: number | null
          status?: string | null
          strengths?: string | null
          supervisor_notes?: string | null
          task_completion_score?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      rn_predictive_phrases: {
        Row: {
          category: string | null
          created_at: string
          id: string
          last_used: string | null
          phrase: string
          rn_id: string
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          last_used?: string | null
          phrase: string
          rn_id: string
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          last_used?: string | null
          phrase?: string
          rn_id?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      rn_quality_scores: {
        Row: {
          calculated_at: string | null
          calculated_by: string | null
          completeness_score: number | null
          compliance_flags: Json | null
          documentation_quality: number | null
          entry_id: string
          id: string
          required_fields_met: boolean | null
          timeliness_score: number | null
        }
        Insert: {
          calculated_at?: string | null
          calculated_by?: string | null
          completeness_score?: number | null
          compliance_flags?: Json | null
          documentation_quality?: number | null
          entry_id: string
          id?: string
          required_fields_met?: boolean | null
          timeliness_score?: number | null
        }
        Update: {
          calculated_at?: string | null
          calculated_by?: string | null
          completeness_score?: number | null
          compliance_flags?: Json | null
          documentation_quality?: number | null
          entry_id?: string
          id?: string
          required_fields_met?: boolean | null
          timeliness_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rn_quality_scores_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "rn_diary_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      rn_saved_filters: {
        Row: {
          created_at: string | null
          filter_config: Json
          filter_name: string
          id: string
          is_favorite: boolean | null
          rn_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          filter_config?: Json
          filter_name: string
          id?: string
          is_favorite?: boolean | null
          rn_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          filter_config?: Json
          filter_name?: string
          id?: string
          is_favorite?: boolean | null
          rn_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rn_team_handoffs: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          action_items: Json | null
          case_id: string
          created_at: string | null
          from_rn_id: string
          handoff_notes: string
          handoff_type: string
          id: string
          priority: string | null
          to_rn_id: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          action_items?: Json | null
          case_id: string
          created_at?: string | null
          from_rn_id: string
          handoff_notes: string
          handoff_type: string
          id?: string
          priority?: string | null
          to_rn_id: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          action_items?: Json | null
          case_id?: string
          created_at?: string | null
          from_rn_id?: string
          handoff_notes?: string
          handoff_type?: string
          id?: string
          priority?: string | null
          to_rn_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rn_team_handoffs_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rn_team_handoffs_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      rn_team_members: {
        Row: {
          added_at: string
          added_by: string | null
          id: string
          rn_user_id: string
          role: string
          team_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          id?: string
          rn_user_id: string
          role?: string
          team_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          id?: string
          rn_user_id?: string
          role?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rn_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "rn_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      rn_teams: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          supervisor_id: string
          team_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          supervisor_id: string
          team_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          supervisor_id?: string
          team_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      rn_time_entries: {
        Row: {
          activity_description: string | null
          activity_type: string
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          attorney_id: string | null
          case_id: string
          created_at: string
          entry_date: string
          estimated_attorney_time_saved_minutes: number
          hourly_rate_used: number | null
          id: string
          metadata: Json | null
          rejection_reason: string | null
          rn_user_id: string
          submitted_at: string | null
          submitted_for_approval: boolean | null
          time_spent_minutes: number
          updated_at: string
        }
        Insert: {
          activity_description?: string | null
          activity_type: string
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          attorney_id?: string | null
          case_id: string
          created_at?: string
          entry_date?: string
          estimated_attorney_time_saved_minutes?: number
          hourly_rate_used?: number | null
          id?: string
          metadata?: Json | null
          rejection_reason?: string | null
          rn_user_id: string
          submitted_at?: string | null
          submitted_for_approval?: boolean | null
          time_spent_minutes: number
          updated_at?: string
        }
        Update: {
          activity_description?: string | null
          activity_type?: string
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          attorney_id?: string | null
          case_id?: string
          created_at?: string
          entry_date?: string
          estimated_attorney_time_saved_minutes?: number
          hourly_rate_used?: number | null
          id?: string
          metadata?: Json | null
          rejection_reason?: string | null
          rn_user_id?: string
          submitted_at?: string | null
          submitted_for_approval?: boolean | null
          time_spent_minutes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rn_time_entries_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rn_time_entries_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      rn_time_entry_audit: {
        Row: {
          action: string
          change_reason: string | null
          changed_at: string
          changed_by: string
          created_at: string
          field_changed: string | null
          id: string
          new_value: string | null
          old_value: string | null
          time_entry_id: string
        }
        Insert: {
          action: string
          change_reason?: string | null
          changed_at?: string
          changed_by: string
          created_at?: string
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          time_entry_id: string
        }
        Update: {
          action?: string
          change_reason?: string | null
          changed_at?: string
          changed_by?: string
          created_at?: string
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          time_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rn_time_entry_audit_time_entry_id_fkey"
            columns: ["time_entry_id"]
            isOneToOne: false
            referencedRelation: "rn_time_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      rn_workload_analytics: {
        Row: {
          analysis_date: string
          avg_completion_time_minutes: number | null
          by_entry_type: Json | null
          by_priority: Json | null
          completion_rate: number | null
          created_at: string | null
          id: string
          overdue_count: number | null
          peak_hours: Json | null
          rn_id: string
          team_comparison: Json | null
          time_allocation: Json | null
          total_entries: number | null
        }
        Insert: {
          analysis_date: string
          avg_completion_time_minutes?: number | null
          by_entry_type?: Json | null
          by_priority?: Json | null
          completion_rate?: number | null
          created_at?: string | null
          id?: string
          overdue_count?: number | null
          peak_hours?: Json | null
          rn_id: string
          team_comparison?: Json | null
          time_allocation?: Json | null
          total_entries?: number | null
        }
        Update: {
          analysis_date?: string
          avg_completion_time_minutes?: number | null
          by_entry_type?: Json | null
          by_priority?: Json | null
          completion_rate?: number | null
          created_at?: string | null
          id?: string
          overdue_count?: number | null
          peak_hours?: Json | null
          rn_id?: string
          team_comparison?: Json | null
          time_allocation?: Json | null
          total_entries?: number | null
        }
        Relationships: []
      }
      role_change_audit: {
        Row: {
          action: string
          changed_at: string
          changed_by: string
          created_at: string
          id: string
          metadata: Json | null
          role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          target_user_id?: string
        }
        Relationships: []
      }
      round_robin_settings: {
        Row: {
          allow_manual_override: boolean
          check_capacity: boolean
          enabled: boolean
          id: string
          reset_rotation_days: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allow_manual_override?: boolean
          check_capacity?: boolean
          enabled?: boolean
          id?: string
          reset_rotation_days?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allow_manual_override?: boolean
          check_capacity?: boolean
          enabled?: boolean
          id?: string
          reset_rotation_days?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      sdoh_assessments: {
        Row: {
          assessed_by: string | null
          case_id: string
          created_at: string | null
          food: boolean | null
          housing: boolean | null
          id: string
          insurance_gap: boolean | null
          notes: string | null
          resolved: Json | null
          transport: boolean | null
          updated_at: string | null
        }
        Insert: {
          assessed_by?: string | null
          case_id: string
          created_at?: string | null
          food?: boolean | null
          housing?: boolean | null
          id?: string
          insurance_gap?: boolean | null
          notes?: string | null
          resolved?: Json | null
          transport?: boolean | null
          updated_at?: string | null
        }
        Update: {
          assessed_by?: string | null
          case_id?: string
          created_at?: string | null
          food?: boolean | null
          housing?: boolean | null
          id?: string
          insurance_gap?: boolean | null
          notes?: string | null
          resolved?: Json | null
          transport?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sdoh_assessments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdoh_assessments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      simulated_time: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          sim_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          sim_time?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          sim_time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sms_notifications: {
        Row: {
          created_at: string
          entry_id: string | null
          error_message: string | null
          id: string
          message: string
          metadata: Json | null
          notification_type: string
          phone_number: string
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_id?: string | null
          error_message?: string | null
          id?: string
          message: string
          metadata?: Json | null
          notification_type: string
          phone_number: string
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_id?: string | null
          error_message?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string
          phone_number?: string
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_notifications_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "rn_diary_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          caseload_count: number | null
          certifications: Json | null
          created_at: string
          department: string
          email: string
          employment_status: string
          full_name: string
          hire_date: string
          id: string
          notes: string | null
          performance_score: number | null
          phone: string | null
          role: string
          specializations: string[] | null
          supervisor_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          caseload_count?: number | null
          certifications?: Json | null
          created_at?: string
          department: string
          email: string
          employment_status?: string
          full_name: string
          hire_date: string
          id?: string
          notes?: string | null
          performance_score?: number | null
          phone?: string | null
          role: string
          specializations?: string[] | null
          supervisor_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          caseload_count?: number | null
          certifications?: Json | null
          created_at?: string
          department?: string
          email?: string
          employment_status?: string
          full_name?: string
          hire_date?: string
          id?: string
          notes?: string | null
          performance_score?: number | null
          phone?: string | null
          role?: string
          specializations?: string[] | null
          supervisor_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      strategic_goals: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          goal_name: string
          id: string
          initiatives: Json | null
          key_results: Json | null
          metrics: Json | null
          notes: string | null
          owner_id: string | null
          priority: string
          progress_percentage: number | null
          status: string
          target_date: string | null
          time_horizon: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          goal_name: string
          id?: string
          initiatives?: Json | null
          key_results?: Json | null
          metrics?: Json | null
          notes?: string | null
          owner_id?: string | null
          priority?: string
          progress_percentage?: number | null
          status?: string
          target_date?: string | null
          time_horizon: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          goal_name?: string
          id?: string
          initiatives?: Json | null
          key_results?: Json | null
          metrics?: Json | null
          notes?: string | null
          owner_id?: string | null
          priority?: string
          progress_percentage?: number | null
          status?: string
          target_date?: string | null
          time_horizon?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      team_communications: {
        Row: {
          attachments: Json | null
          author_id: string | null
          communication_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_urgent: boolean | null
          message: string
          priority: string
          read_by: Json | null
          target_roles: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          author_id?: string | null
          communication_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_urgent?: boolean | null
          message: string
          priority?: string
          read_by?: Json | null
          target_roles?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          author_id?: string | null
          communication_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_urgent?: boolean | null
          message?: string
          priority?: string
          read_by?: Json | null
          target_roles?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      team_schedule_events: {
        Row: {
          attendees: string[] | null
          case_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string
          event_type: string
          id: string
          is_recurring: boolean | null
          location: string | null
          recurrence_pattern: string | null
          reminder_minutes: number | null
          start_time: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          attendees?: string[] | null
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time: string
          event_type: string
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          recurrence_pattern?: string | null
          reminder_minutes?: number | null
          start_time: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          attendees?: string[] | null
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string
          event_type?: string
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          recurrence_pattern?: string | null
          reminder_minutes?: number | null
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_schedule_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_schedule_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      test_events: {
        Row: {
          actor_id: string | null
          actor_name: string | null
          actor_role: string | null
          created_at: string | null
          event_description: string
          event_type: string
          id: string
          metadata: Json | null
          scenario_id: string | null
          triggered_at: string
        }
        Insert: {
          actor_id?: string | null
          actor_name?: string | null
          actor_role?: string | null
          created_at?: string | null
          event_description: string
          event_type: string
          id?: string
          metadata?: Json | null
          scenario_id?: string | null
          triggered_at: string
        }
        Update: {
          actor_id?: string | null
          actor_name?: string | null
          actor_role?: string | null
          created_at?: string | null
          event_description?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          scenario_id?: string | null
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_events_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "test_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      test_scenarios: {
        Row: {
          attorney_status: string
          client_profile: string
          core_pattern: string
          created_at: string | null
          id: string
          name: string
          timeline: Json
        }
        Insert: {
          attorney_status: string
          client_profile: string
          core_pattern: string
          created_at?: string | null
          id: string
          name: string
          timeline: Json
        }
        Update: {
          attorney_status?: string
          client_profile?: string
          core_pattern?: string
          created_at?: string | null
          id?: string
          name?: string
          timeline?: Json
        }
        Relationships: []
      }
      test_user_accounts: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          full_name: string
          id: string
          notes: string | null
          password: string
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          full_name: string
          id?: string
          notes?: string | null
          password: string
          role: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          password?: string
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      training_records: {
        Row: {
          certification_number: string | null
          completion_date: string
          created_at: string
          document_url: string | null
          expiration_date: string | null
          hours_completed: number | null
          id: string
          notes: string | null
          provider: string | null
          staff_id: string
          status: string
          training_title: string
          training_type: string
          updated_at: string
        }
        Insert: {
          certification_number?: string | null
          completion_date: string
          created_at?: string
          document_url?: string | null
          expiration_date?: string | null
          hours_completed?: number | null
          id?: string
          notes?: string | null
          provider?: string | null
          staff_id: string
          status?: string
          training_title: string
          training_type: string
          updated_at?: string
        }
        Update: {
          certification_number?: string | null
          completion_date?: string
          created_at?: string
          document_url?: string | null
          expiration_date?: string | null
          hours_completed?: number | null
          id?: string
          notes?: string | null
          provider?: string | null
          staff_id?: string
          status?: string
          training_title?: string
          training_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          case_updates: boolean | null
          client_messages: boolean | null
          created_at: string
          dismissed_tips: Json | null
          email_notifications: boolean | null
          id: string
          nav_collapsed: boolean | null
          notification_filter: string | null
          sms_notifications: boolean | null
          theme: string | null
          updated_at: string
          urgent_alerts: boolean | null
          user_id: string
        }
        Insert: {
          case_updates?: boolean | null
          client_messages?: boolean | null
          created_at?: string
          dismissed_tips?: Json | null
          email_notifications?: boolean | null
          id?: string
          nav_collapsed?: boolean | null
          notification_filter?: string | null
          sms_notifications?: boolean | null
          theme?: string | null
          updated_at?: string
          urgent_alerts?: boolean | null
          user_id: string
        }
        Update: {
          case_updates?: boolean | null
          client_messages?: boolean | null
          created_at?: string
          dismissed_tips?: Json | null
          email_notifications?: boolean | null
          id?: string
          nav_collapsed?: boolean | null
          notification_filter?: string | null
          sms_notifications?: boolean | null
          theme?: string | null
          updated_at?: string
          urgent_alerts?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      voice_transcriptions: {
        Row: {
          ai_key_points: string[] | null
          ai_summary: string | null
          audio_file_url: string | null
          case_id: string | null
          confidence_score: number | null
          created_at: string | null
          created_by: string | null
          duration_seconds: number | null
          id: string
          note_type: string | null
          transcription_status: string | null
          transcription_text: string | null
          updated_at: string | null
        }
        Insert: {
          ai_key_points?: string[] | null
          ai_summary?: string | null
          audio_file_url?: string | null
          case_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          duration_seconds?: number | null
          id?: string
          note_type?: string | null
          transcription_status?: string | null
          transcription_text?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_key_points?: string[] | null
          ai_summary?: string | null
          audio_file_url?: string | null
          case_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          duration_seconds?: number | null
          id?: string
          note_type?: string | null
          transcription_status?: string | null
          transcription_text?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_transcriptions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_transcriptions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_acknowledgments: {
        Row: {
          acknowledged_at: string
          attorney_id: string
          id: string
          ip_address: string | null
          message_hash: string
          user_agent: string | null
        }
        Insert: {
          acknowledged_at?: string
          attorney_id: string
          id?: string
          ip_address?: string | null
          message_hash: string
          user_agent?: string | null
        }
        Update: {
          acknowledged_at?: string
          attorney_id?: string
          id?: string
          ip_address?: string | null
          message_hash?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          attorney_id: string
          case_id: string | null
          created_at: string
          description: string
          id: string
          metadata: Json | null
          payment_method: string | null
          processing_fee: number
          status: string
          tax: number
          total_amount: number
          transaction_type: string
        }
        Insert: {
          amount: number
          attorney_id: string
          case_id?: string | null
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          processing_fee?: number
          status?: string
          tax?: number
          total_amount: number
          transaction_type: string
        }
        Update: {
          amount?: number
          attorney_id?: string
          case_id?: string | null
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          processing_fee?: number
          status?: string
          tax?: number
          total_amount?: number
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "management_team_cases"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      management_team_cases: {
        Row: {
          assigned_name: string | null
          assigned_role: Database["public"]["Enums"]["app_role"] | null
          assigned_to: string | null
          client_label: string | null
          client_number: string | null
          completed_tasks: number | null
          created_at: string | null
          id: string | null
          note_count: number | null
          status: string | null
          total_tasks: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_assignment_offer: { Args: { p_offer_id: string }; Returns: Json }
      add_complaint_timeline_entry: {
        Args: {
          p_complaint_id: string
          p_event_type: string
          p_notes?: string
          p_status: string
        }
        Returns: undefined
      }
      add_concern_timeline_entry: {
        Args: {
          p_concern_id: string
          p_event_type: string
          p_notes?: string
          p_status: string
        }
        Returns: undefined
      }
      assign_attorney_round_robin: {
        Args: { p_case_id: string; p_reviewed_by: string }
        Returns: string
      }
      calculate_alert_sla_deadline: {
        Args: { p_alert_type: string; p_shift_start: string }
        Returns: string
      }
      calculate_entry_quality_score: {
        Args: { p_entry_id: string }
        Returns: Json
      }
      calculate_rn_daily_metrics: {
        Args: { p_date?: string }
        Returns: undefined
      }
      check_expiring_items: {
        Args: { days_ahead?: number }
        Returns: {
          case_id: string
          days_until_expiry: number
          expires_at: string
          item_id: string
          item_type: string
        }[]
      }
      check_overdue_tasks: {
        Args: never
        Returns: {
          case_id: string
          days_overdue: number
          due_date: string
          task_id: string
          title: string
        }[]
      }
      check_upcoming_reminders: {
        Args: { days_ahead?: number }
        Returns: {
          case_id: string
          days_until: number
          priority: string
          reminder_date: string
          reminder_id: string
          rn_id: string
          title: string
        }[]
      }
      convert_to_attorney_case: {
        Args: { p_attorney_code: string; p_internal_case_id: string }
        Returns: Json
      }
      decline_assignment_offer: {
        Args: { p_note?: string; p_offer_id: string; p_reason: string }
        Returns: Json
      }
      expire_assignment_offers: { Args: never; Returns: undefined }
      generate_all_attorney_monthly_reports: {
        Args: { p_report_month?: string }
        Returns: Json
      }
      generate_attorney_monthly_report: {
        Args: { p_attorney_id: string; p_report_month: string }
        Returns: Json
      }
      generate_client_id: {
        Args: { p_attorney_code: string; p_client_type: string }
        Returns: string
      }
      generate_recurring_diary_entries:
        | {
            Args: { p_parent_entry_id: string; p_weeks_ahead?: number }
            Returns: number
          }
        | { Args: never; Returns: undefined }
      get_checkin_trends: {
        Args: {
          p_case_id: string
          p_end_date: string
          p_period: string
          p_start_date: string
        }
        Returns: {
          anxiety_avg: number
          bucket: string
          depression_avg: number
          n: number
          pain_avg: number
          physical_avg: number
          psychological_avg: number
          psychosocial_avg: number
          purpose_avg: number
        }[]
      }
      get_client_initials: { Args: { client_uuid: string }; Returns: string }
      get_current_time: { Args: never; Returns: string }
      get_latest_policy_acceptance: {
        Args: { p_attorney_id: string }
        Returns: {
          accepted_at: string
          id: string
          policy_version: string
        }[]
      }
      get_next_client_number: {
        Args: { p_attorney_code: string; p_client_type: string }
        Returns: number
      }
      get_next_round_robin_attorney: { Args: never; Returns: string }
      get_rn_metric_comparison: {
        Args: {
          p_current_date?: string
          p_metric_name: string
          p_rn_user_id: string
        }
        Returns: Json
      }
      get_rn_metrics_history: {
        Args: { p_months?: number; p_rn_user_id: string }
        Returns: {
          avg_response_time_hours: number
          cases_managed: number
          client_satisfaction_score: number
          documentation_completion_rate: number
          metric_date: string
          sla_compliance_rate: number
          task_completion_rate: number
        }[]
      }
      get_rn_performance_snapshot: {
        Args: { p_days?: number; p_rn_user_id: string }
        Returns: Json
      }
      get_short_case_id: { Args: { case_uuid: string }; Returns: string }
      get_tier_recommendation: {
        Args: { p_attorney_id: string }
        Returns: {
          reason: string
          recommended_tier: Database["public"]["Enums"]["subscription_tier"]
          top_features: Json
        }[]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_feature_access: {
        Args: { p_attorney_id: string; p_feature_key: string }
        Returns: boolean
      }
      has_role:
        | { Args: { check_role: string }; Returns: boolean }
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
      log_document_activity: {
        Args: {
          p_action_type: string
          p_document_id: string
          p_metadata?: Json
        }
        Returns: undefined
      }
      log_feature_usage: {
        Args: {
          p_attorney_id: string
          p_feature_key: string
          p_metadata?: Json
          p_session_duration?: number
        }
        Returns: undefined
      }
      notify_roles: {
        Args: {
          notification_link?: string
          notification_message: string
          notification_metadata?: Json
          notification_title: string
          notification_type?: string
          role_names: string[]
        }
        Returns: undefined
      }
      notify_user: {
        Args: {
          notification_link?: string
          notification_message: string
          notification_metadata?: Json
          notification_title: string
          notification_type?: string
          target_user_id: string
        }
        Returns: undefined
      }
      update_attorney_capacity: {
        Args: { p_attorney_id: string; p_new_capacity_available: number }
        Returns: undefined
      }
      update_attorney_performance: {
        Args: { p_attorney_code: string }
        Returns: undefined
      }
      user_has_case_access: {
        Args: { _case_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "CLIENT"
        | "ATTORNEY"
        | "PROVIDER"
        | "RN_CCM"
        | "SUPER_USER"
        | "SUPER_ADMIN"
        | "STAFF"
        | "RN_CM"
        | "CLINICAL_STAFF_EXTERNAL"
        | "RCMS_CLINICAL_MGMT"
        | "RN_CM_DIRECTOR"
        | "COMPLIANCE"
        | "RN_CM_SUPERVISOR"
        | "RN_CM_MANAGER"
        | "RCMS_STAFF"
      assignment_offer_status: "pending" | "accepted" | "declined" | "expired"
      disclosure_scope: "internal" | "minimal" | "full"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      referral_status: "pending" | "accepted" | "declined" | "settled"
      subscription_tier: "trial" | "basic" | "clinical" | "comprehensive"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "CLIENT",
        "ATTORNEY",
        "PROVIDER",
        "RN_CCM",
        "SUPER_USER",
        "SUPER_ADMIN",
        "STAFF",
        "RN_CM",
        "CLINICAL_STAFF_EXTERNAL",
        "RCMS_CLINICAL_MGMT",
        "RN_CM_DIRECTOR",
        "COMPLIANCE",
        "RN_CM_SUPERVISOR",
        "RN_CM_MANAGER",
        "RCMS_STAFF",
      ],
      assignment_offer_status: ["pending", "accepted", "declined", "expired"],
      disclosure_scope: ["internal", "minimal", "full"],
      payment_status: ["pending", "paid", "failed", "refunded"],
      referral_status: ["pending", "accepted", "declined", "settled"],
      subscription_tier: ["trial", "basic", "clinical", "comprehensive"],
    },
  },
} as const
