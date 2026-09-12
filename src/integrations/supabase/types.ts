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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      action_items: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          episode_id: string | null
          id: string
          member_id: string | null
          priority: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          episode_id?: string | null
          id?: string
          member_id?: string | null
          priority?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          episode_id?: string | null
          id?: string
          member_id?: string | null
          priority?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_items_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          role: string
          thread_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          thread_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          thread_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          member_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          member_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          member_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          accepted_at: string | null
          ai_processing_consent: boolean
          analytics_consent: boolean
          consent_type: string
          created_at: string
          granted: boolean
          granted_at: string | null
          id: string
          revoked_at: string | null
          storage_consent: boolean
          updated_at: string
          user_id: string
          version: string | null
        }
        Insert: {
          accepted_at?: string | null
          ai_processing_consent?: boolean
          analytics_consent?: boolean
          consent_type: string
          created_at?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          revoked_at?: string | null
          storage_consent?: boolean
          updated_at?: string
          user_id: string
          version?: string | null
        }
        Update: {
          accepted_at?: string | null
          ai_processing_consent?: boolean
          analytics_consent?: boolean
          consent_type?: string
          created_at?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          revoked_at?: string | null
          storage_consent?: boolean
          updated_at?: string
          user_id?: string
          version?: string | null
        }
        Relationships: []
      }
      doc_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          member_id: string | null
          metadata: Json
          user_id: string
        }
        Insert: {
          chunk_index?: number
          content: string
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
          member_id?: string | null
          metadata?: Json
          user_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
          member_id?: string | null
          metadata?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doc_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doc_chunks_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          document_date: string | null
          document_type: string | null
          episode_id: string | null
          file_size_bytes: number | null
          id: string
          member_id: string | null
          mime_type: string | null
          processing_status: string | null
          storage_path: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_date?: string | null
          document_type?: string | null
          episode_id?: string | null
          file_size_bytes?: number | null
          id?: string
          member_id?: string | null
          mime_type?: string | null
          processing_status?: string | null
          storage_path: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_date?: string | null
          document_type?: string | null
          episode_id?: string | null
          file_size_bytes?: number | null
          id?: string
          member_id?: string | null
          mime_type?: string | null
          processing_status?: string | null
          storage_path?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      email_preferences: {
        Row: {
          created_at: string
          last_sent_at: string | null
          timezone: string
          unsubscribe_token: string
          updated_at: string
          user_id: string
          weekly_enabled: boolean
        }
        Insert: {
          created_at?: string
          last_sent_at?: string | null
          timezone?: string
          unsubscribe_token?: string
          updated_at?: string
          user_id: string
          weekly_enabled?: boolean
        }
        Update: {
          created_at?: string
          last_sent_at?: string | null
          timezone?: string
          unsubscribe_token?: string
          updated_at?: string
          user_id?: string
          weekly_enabled?: boolean
        }
        Relationships: []
      }
      episodes: {
        Row: {
          created_at: string
          description: string | null
          doctor_name: string | null
          end_date: string | null
          episode_type: string | null
          hospital_name: string | null
          id: string
          member_id: string | null
          start_date: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          doctor_name?: string | null
          end_date?: string | null
          episode_type?: string | null
          hospital_name?: string | null
          id?: string
          member_id?: string | null
          start_date?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          doctor_name?: string | null
          end_date?: string | null
          episode_type?: string | null
          hospital_name?: string | null
          id?: string
          member_id?: string | null
          start_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      extractions: {
        Row: {
          confidence: number | null
          created_at: string
          document_id: string
          extraction_type: string | null
          id: string
          member_id: string | null
          model_name: string | null
          raw_text: string | null
          structured_data: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          document_id: string
          extraction_type?: string | null
          id?: string
          member_id?: string | null
          model_name?: string | null
          raw_text?: string | null
          structured_data?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          document_id?: string
          extraction_type?: string | null
          id?: string
          member_id?: string | null
          model_name?: string | null
          raw_text?: string | null
          structured_data?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extractions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          avatar_color: string | null
          created_at: string
          dob: string | null
          id: string
          is_default: boolean
          name: string
          relation: string | null
          segment: Database["public"]["Enums"]["family_segment"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_color?: string | null
          created_at?: string
          dob?: string | null
          id?: string
          is_default?: boolean
          name: string
          relation?: string | null
          segment?: Database["public"]["Enums"]["family_segment"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_color?: string | null
          created_at?: string
          dob?: string | null
          id?: string
          is_default?: boolean
          name?: string
          relation?: string | null
          segment?: Database["public"]["Enums"]["family_segment"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lab_results: {
        Row: {
          created_at: string
          document_id: string | null
          episode_id: string | null
          flag: string | null
          id: string
          member_id: string | null
          reference_high: number | null
          reference_low: number | null
          test_date: string | null
          test_name: string
          unit: string | null
          updated_at: string
          user_id: string
          value: number | null
          value_text: string | null
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          episode_id?: string | null
          flag?: string | null
          id?: string
          member_id?: string | null
          reference_high?: number | null
          reference_low?: number | null
          test_date?: string | null
          test_name: string
          unit?: string | null
          updated_at?: string
          user_id: string
          value?: number | null
          value_text?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string | null
          episode_id?: string | null
          flag?: string | null
          id?: string
          member_id?: string | null
          reference_high?: number | null
          reference_low?: number | null
          test_date?: string | null
          test_name?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
          value?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_results_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      lifestyle_goals: {
        Row: {
          created_at: string
          exercise_days_per_week: number | null
          exercise_min_per_day: number | null
          id: string
          sleep_hours_target: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_days_per_week?: number | null
          exercise_min_per_day?: number | null
          id?: string
          sleep_hours_target?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_days_per_week?: number | null
          exercise_min_per_day?: number | null
          id?: string
          sleep_hours_target?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lifestyle_logs: {
        Row: {
          created_at: string
          exercise_minutes: number | null
          exercise_type: string | null
          id: string
          log_date: string
          meals: string | null
          mood: number | null
          sleep_hours: number | null
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_minutes?: number | null
          exercise_type?: string | null
          id?: string
          log_date?: string
          meals?: string | null
          mood?: number | null
          sleep_hours?: number | null
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_minutes?: number | null
          exercise_type?: string | null
          id?: string
          log_date?: string
          meals?: string | null
          mood?: number | null
          sleep_hours?: number | null
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      medications: {
        Row: {
          active: boolean
          created_at: string
          dosage: string | null
          end_date: string | null
          episode_id: string | null
          frequency: string | null
          id: string
          member_id: string | null
          name: string
          notes: string | null
          prescribed_by: string | null
          route: string | null
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          episode_id?: string | null
          frequency?: string | null
          id?: string
          member_id?: string | null
          name: string
          notes?: string | null
          prescribed_by?: string | null
          route?: string | null
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          episode_id?: string | null
          frequency?: string | null
          id?: string
          member_id?: string | null
          name?: string
          notes?: string | null
          prescribed_by?: string | null
          route?: string | null
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medications_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_log: {
        Row: {
          body: string | null
          channel: string
          created_at: string
          id: string
          metadata: Json | null
          notification_type: string | null
          sent_at: string
          status: string
          subject: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          channel: string
          created_at?: string
          id?: string
          metadata?: Json | null
          notification_type?: string | null
          sent_at?: string
          status?: string
          subject?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          channel?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          notification_type?: string | null
          sent_at?: string
          status?: string
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          blood_group: string | null
          created_at: string
          date_of_birth: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string | null
          gender: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          blood_group?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          blood_group?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      summaries: {
        Row: {
          content: string
          created_at: string
          document_id: string | null
          episode_id: string | null
          id: string
          member_id: string | null
          model_name: string | null
          summary_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          document_id?: string | null
          episode_id?: string | null
          id?: string
          member_id?: string | null
          model_name?: string | null
          summary_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          document_id?: string | null
          episode_id?: string | null
          id?: string
          member_id?: string | null
          model_name?: string | null
          summary_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "summaries_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "summaries_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "summaries_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      summary_shares: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          member_id: string | null
          payload: Json
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          member_id?: string | null
          payload: Json
          token?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          member_id?: string | null
          payload?: Json
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "summary_shares_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_doc_chunks: {
        Args: {
          match_count?: number
          p_member_id?: string
          query_embedding: string
        }
        Returns: {
          content: string
          document_id: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      owns_member: { Args: { _member: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "doctor" | "patient"
      family_segment: "kids" | "parents" | "me"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "doctor", "patient"],
      family_segment: ["kids", "parents", "me"],
    },
  },
} as const
