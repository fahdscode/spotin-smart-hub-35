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
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          password_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          password_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          password_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      check_in_logs: {
        Row: {
          action: string
          client_id: string
          id: string
          notes: string | null
          scanned_barcode: string
          scanned_by_user_id: string | null
          timestamp: string
        }
        Insert: {
          action: string
          client_id: string
          id?: string
          notes?: string | null
          scanned_barcode: string
          scanned_by_user_id?: string | null
          timestamp?: string
        }
        Update: {
          action?: string
          client_id?: string
          id?: string
          notes?: string | null
          scanned_barcode?: string
          scanned_by_user_id?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_in_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          checked_in_at: string
          checked_out_at: string | null
          client_id: string | null
          created_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          checked_in_at?: string
          checked_out_at?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          checked_in_at?: string
          checked_out_at?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_memberships: {
        Row: {
          client_id: string
          created_at: string | null
          discount_percentage: number
          end_date: string | null
          id: string
          is_active: boolean
          perks: string[] | null
          plan_name: string
          start_date: string
          total_savings: number | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          discount_percentage?: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          perks?: string[] | null
          plan_name: string
          start_date?: string
          total_savings?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          discount_percentage?: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          perks?: string[] | null
          plan_name?: string
          start_date?: string
          total_savings?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_memberships_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          active: boolean
          barcode: string
          client_code: string
          created_at: string
          email: string | null
          first_name: string
          full_name: string
          how_did_you_find_us: string
          id: string
          is_active: boolean
          job_title: string
          last_name: string
          password_hash: string
          phone: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          barcode: string
          client_code: string
          created_at?: string
          email?: string | null
          first_name: string
          full_name: string
          how_did_you_find_us: string
          id?: string
          is_active?: boolean
          job_title: string
          last_name: string
          password_hash: string
          phone: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          barcode?: string
          client_code?: string
          created_at?: string
          email?: string | null
          first_name?: string
          full_name?: string
          how_did_you_find_us?: string
          id?: string
          is_active?: boolean
          job_title?: string
          last_name?: string
          password_hash?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      drinks: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          ingredients: string[] | null
          is_available: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          is_available?: boolean
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          is_available?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          capacity: number
          category: string
          created_at: string
          description: string | null
          end_time: string
          event_date: string
          id: string
          image_url: string | null
          is_active: boolean
          location: string | null
          price: number
          registered_attendees: number
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          category?: string
          created_at?: string
          description?: string | null
          end_time: string
          event_date: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          location?: string | null
          price?: number
          registered_attendees?: number
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          category?: string
          created_at?: string
          description?: string | null
          end_time?: string
          event_date?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          location?: string | null
          price?: number
          registered_attendees?: number
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          comment: string | null
          created_at: string
          emoji: string
          feedback_type: string
          id: string
          rating: number
          user_id: string
          visit_date: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          emoji: string
          feedback_type?: string
          id?: string
          rating: number
          user_id: string
          visit_date: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          emoji?: string
          feedback_type?: string
          id?: string
          rating?: number
          user_id?: string
          visit_date?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          created_at: string
          discount_percentage: number
          id: string
          is_active: boolean
          perks: string[] | null
          plan_name: string
          total_savings: number
          user_id: string
        }
        Insert: {
          created_at?: string
          discount_percentage?: number
          id?: string
          is_active?: boolean
          perks?: string[] | null
          plan_name: string
          total_savings?: number
          user_id: string
        }
        Update: {
          created_at?: string
          discount_percentage?: number
          id?: string
          is_active?: boolean
          perks?: string[] | null
          plan_name?: string
          total_savings?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          barcode: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_admin: boolean | null
          phone: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          barcode?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          phone?: string | null
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          barcode?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      receipts: {
        Row: {
          amount: number
          id: string
          line_items: Json | null
          payment_method: string
          receipt_date: string
          receipt_number: string
          total_amount: number
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          id?: string
          line_items?: Json | null
          payment_method?: string
          receipt_date?: string
          receipt_number: string
          total_amount: number
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          id?: string
          line_items?: Json | null
          payment_method?: string
          receipt_date?: string
          receipt_number?: string
          total_amount?: number
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string
          end_time: string
          id: string
          room_id: string
          start_time: string
          status: string
          total_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          room_id: string
          start_time: string
          status?: string
          total_amount: number
          user_id: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          room_id?: string
          start_time?: string
          status?: string
          total_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          amenities: string[] | null
          capacity: number
          created_at: string
          description: string | null
          hourly_rate: number
          id: string
          image_url: string | null
          is_available: boolean
          name: string
        }
        Insert: {
          amenities?: string[] | null
          capacity?: number
          created_at?: string
          description?: string | null
          hourly_rate?: number
          id?: string
          image_url?: string | null
          is_available?: boolean
          name: string
        }
        Update: {
          amenities?: string[] | null
          capacity?: number
          created_at?: string
          description?: string | null
          hourly_rate?: number
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: string
        }
        Relationships: []
      }
      session_line_items: {
        Row: {
          created_at: string
          id: string
          item_name: string
          price: number
          quantity: number
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_name: string
          price: number
          quantity?: number
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_name?: string
          price?: number
          quantity?: number
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      traffic_data: {
        Row: {
          area: string
          current_occupancy: number
          id: string
          max_capacity: number
          peak_hours: Json | null
          timestamp: string
        }
        Insert: {
          area?: string
          current_occupancy?: number
          id?: string
          max_capacity?: number
          peak_hours?: Json | null
          timestamp?: string
        }
        Update: {
          area?: string
          current_occupancy?: number
          id?: string
          max_capacity?: number
          peak_hours?: Json | null
          timestamp?: string
        }
        Relationships: []
      }
      user_analytics: {
        Row: {
          check_ins: number
          created_at: string
          date: string
          events_attended: number
          favorite_items: Json | null
          id: string
          orders_placed: number
          rooms_booked: number
          time_spent_minutes: number
          total_spent: number
          user_id: string
        }
        Insert: {
          check_ins?: number
          created_at?: string
          date: string
          events_attended?: number
          favorite_items?: Json | null
          id?: string
          orders_placed?: number
          rooms_booked?: number
          time_spent_minutes?: number
          total_spent?: number
          user_id: string
        }
        Update: {
          check_ins?: number
          created_at?: string
          date?: string
          events_attended?: number
          favorite_items?: Json | null
          id?: string
          orders_placed?: number
          rooms_booked?: number
          time_spent_minutes?: number
          total_spent?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_client_membership: {
        Args: {
          p_client_id: string
          p_discount_percentage: number
          p_perks: string[]
          p_plan_name: string
        }
        Returns: Json
      }
      authenticate_client: {
        Args: { client_password: string; client_phone: string }
        Returns: Json
      }
      checkout_client: {
        Args: { p_checkout_by_user_id?: string; p_client_id: string }
        Returns: Json
      }
      generate_barcode: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_barcode_for_client: {
        Args: { client_code: string }
        Returns: string
      }
      generate_client_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_unique_barcode: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_client_by_id: {
        Args: { client_id: string }
        Returns: Json
      }
      get_client_check_in_status: {
        Args: { p_client_id: string }
        Returns: string
      }
      get_client_memberships: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_client_status: {
        Args: { client_id: string }
        Returns: string
      }
      get_receptionist_active_sessions: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_receptionist_daily_registrations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_or_staff: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      search_clients_for_membership: {
        Args: { search_term: string }
        Returns: Json
      }
      test_client_registration: {
        Args:
          | {
              p_barcode: string
              p_client_code: string
              p_email: string
              p_full_name: string
              p_password_hash: string
              p_phone: string
            }
          | {
              p_email: string
              p_first_name: string
              p_how_did_you_find_us: string
              p_job_title: string
              p_last_name: string
              p_password_hash: string
              p_phone: string
            }
          | {
              p_email: string
              p_full_name: string
              p_password_hash: string
              p_phone: string
            }
        Returns: Json
      }
      toggle_client_checkin_status: {
        Args: { p_barcode: string; p_scanned_by_user_id?: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
