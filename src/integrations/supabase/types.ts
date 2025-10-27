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
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          role: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          role: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bill_line_items: {
        Row: {
          bill_id: string
          created_at: string
          id: string
          quantity: number
          stock_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          bill_id: string
          created_at?: string
          id?: string
          quantity: number
          stock_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          bill_id?: string
          created_at?: string
          id?: string
          quantity?: number
          stock_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "bill_line_items_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_line_items_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stock"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          amount: number
          bill_number: string
          category: string | null
          created_at: string
          created_by: string
          due_date: string
          id: string
          notes: string | null
          status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          amount?: number
          bill_number: string
          category?: string | null
          created_at?: string
          created_by: string
          due_date: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          amount?: number
          bill_number?: string
          category?: string | null
          created_at?: string
          created_by?: string
          due_date?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          actual_amount: number
          budget_type: string
          category: string
          created_at: string
          id: string
          month_year: string
          notes: string | null
          planned_amount: number
          updated_at: string
        }
        Insert: {
          actual_amount?: number
          budget_type: string
          category: string
          created_at?: string
          id?: string
          month_year: string
          notes?: string | null
          planned_amount?: number
          updated_at?: string
        }
        Update: {
          actual_amount?: number
          budget_type?: string
          category?: string
          created_at?: string
          id?: string
          month_year?: string
          notes?: string | null
          planned_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      cashier_sessions: {
        Row: {
          card_sales: number | null
          cash_difference: number | null
          cash_sales: number | null
          closing_cash: number | null
          created_at: string
          end_time: string | null
          expected_cash: number | null
          id: string
          is_active: boolean
          notes: string | null
          opening_cash: number
          staff_id: string
          staff_name: string
          start_time: string
          total_sales: number | null
          updated_at: string
        }
        Insert: {
          card_sales?: number | null
          cash_difference?: number | null
          cash_sales?: number | null
          closing_cash?: number | null
          created_at?: string
          end_time?: string | null
          expected_cash?: number | null
          id?: string
          is_active?: boolean
          notes?: string | null
          opening_cash?: number
          staff_id: string
          staff_name: string
          start_time?: string
          total_sales?: number | null
          updated_at?: string
        }
        Update: {
          card_sales?: number | null
          cash_difference?: number | null
          cash_sales?: number | null
          closing_cash?: number | null
          created_at?: string
          end_time?: string | null
          expected_cash?: number | null
          id?: string
          is_active?: boolean
          notes?: string | null
          opening_cash?: number
          staff_id?: string
          staff_name?: string
          start_time?: string
          total_sales?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          products_count: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          products_count?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          products_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      check_in_logs: {
        Row: {
          action: string
          client_id: string | null
          id: string
          notes: string | null
          scanned_barcode: string
          scanned_by_user_id: string | null
          timestamp: string
        }
        Insert: {
          action: string
          client_id?: string | null
          id?: string
          notes?: string | null
          scanned_barcode: string
          scanned_by_user_id?: string | null
          timestamp?: string
        }
        Update: {
          action?: string
          client_id?: string | null
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
          user_id: string | null
        }
        Insert: {
          checked_in_at?: string
          checked_out_at?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          checked_in_at?: string
          checked_out_at?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          status?: string
          user_id?: string | null
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
      client_tickets: {
        Row: {
          checked_in_at: string | null
          client_id: string
          created_at: string | null
          expiry_date: string
          id: string
          is_active: boolean
          payment_method: string
          purchase_date: string
          ticket_id: string
          updated_at: string | null
          used_at: string | null
        }
        Insert: {
          checked_in_at?: string | null
          client_id: string
          created_at?: string | null
          expiry_date: string
          id?: string
          is_active?: boolean
          payment_method?: string
          purchase_date?: string
          ticket_id: string
          updated_at?: string | null
          used_at?: string | null
        }
        Update: {
          checked_in_at?: string | null
          client_id?: string
          created_at?: string | null
          expiry_date?: string
          id?: string
          is_active?: boolean
          payment_method?: string
          purchase_date?: string
          ticket_id?: string
          updated_at?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_tickets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_tickets_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "drinks"
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
          email_verified: boolean | null
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
          email_verified?: boolean | null
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
          email_verified?: boolean | null
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
          prep_time_minutes: number | null
          price: number
          ticket_type: string | null
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
          prep_time_minutes?: number | null
          price: number
          ticket_type?: string | null
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
          prep_time_minutes?: number | null
          price?: number
          ticket_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          attendance_status: string
          attendee_email: string
          attendee_name: string
          attendee_phone: string
          client_id: string | null
          created_at: string
          event_id: string
          id: string
          registration_date: string
          special_requests: string | null
          updated_at: string
        }
        Insert: {
          attendance_status?: string
          attendee_email: string
          attendee_name: string
          attendee_phone: string
          client_id?: string | null
          created_at?: string
          event_id: string
          id?: string
          registration_date?: string
          special_requests?: string | null
          updated_at?: string
        }
        Update: {
          attendance_status?: string
          attendee_email?: string
          attendee_name?: string
          attendee_phone?: string
          client_id?: string | null
          created_at?: string
          event_id?: string
          id?: string
          registration_date?: string
          special_requests?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
      expense_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
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
      financial_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_recurring: boolean | null
          payment_method: string | null
          recurring_frequency: string | null
          reference_number: string | null
          tags: string[] | null
          transaction_date: string
          transaction_type: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          payment_method?: string | null
          recurring_frequency?: string | null
          reference_number?: string | null
          tags?: string[] | null
          transaction_date?: string
          transaction_type: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          payment_method?: string | null
          recurring_frequency?: string | null
          reference_number?: string | null
          tags?: string[] | null
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempted_at: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          phone: string
          success: boolean | null
        }
        Insert: {
          attempted_at?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          phone: string
          success?: boolean | null
        }
        Update: {
          attempted_at?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          phone?: string
          success?: boolean | null
        }
        Relationships: []
      }
      membership_plans: {
        Row: {
          created_at: string
          description: string | null
          discount_percentage: number
          duration_months: number
          id: string
          is_active: boolean
          perks: string[] | null
          plan_name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percentage?: number
          duration_months?: number
          id?: string
          is_active?: boolean
          perks?: string[] | null
          plan_name: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percentage?: number
          duration_months?: number
          id?: string
          is_active?: boolean
          perks?: string[] | null
          plan_name?: string
          price?: number
          updated_at?: string
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
      password_reset_tokens: {
        Row: {
          client_id: string
          created_at: string | null
          expires_at: string
          id: string
          token: string
          used: boolean | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          used?: boolean | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ingredients: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity_needed: number
          stock_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity_needed?: number
          stock_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity_needed?: number
          stock_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_ingredients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "drinks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_ingredients_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stock"
            referencedColumns: ["id"]
          },
        ]
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
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          id: string
          line_items: Json | null
          payment_method: string
          receipt_date: string
          receipt_number: string
          status: string
          total_amount: number
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          id?: string
          line_items?: Json | null
          payment_method?: string
          receipt_date?: string
          receipt_number: string
          status?: string
          total_amount: number
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          id?: string
          line_items?: Json | null
          payment_method?: string
          receipt_date?: string
          receipt_number?: string
          status?: string
          total_amount?: number
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          client_id: string
          client_name: string | null
          created_at: string
          end_time: string
          id: string
          room_id: string
          start_time: string
          status: string
          total_amount: number
        }
        Insert: {
          client_id: string
          client_name?: string | null
          created_at?: string
          end_time: string
          id?: string
          room_id: string
          start_time: string
          status?: string
          total_amount: number
        }
        Update: {
          client_id?: string
          client_name?: string | null
          created_at?: string
          end_time?: string
          id?: string
          room_id?: string
          start_time?: string
          status?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "reservations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
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
      stock: {
        Row: {
          category: string
          cost_per_unit: number
          created_at: string
          current_quantity: number
          id: string
          is_active: boolean
          min_quantity: number
          name: string
          supplier: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string
          cost_per_unit?: number
          created_at?: string
          current_quantity?: number
          id?: string
          is_active?: boolean
          min_quantity?: number
          name: string
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string
          cost_per_unit?: number
          created_at?: string
          current_quantity?: number
          id?: string
          is_active?: boolean
          min_quantity?: number
          name?: string
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          client_id: string | null
          created_at: string | null
          event_type: string
          id: string
          ip_address: unknown
          log_level: string
          message: string
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          log_level: string
          message: string
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          log_level?: string
          message?: string
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
      vendors: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
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
      assign_ticket_to_client: {
        Args: {
          p_client_id: string
          p_duration_hours?: number
          p_payment_method?: string
          p_ticket_id: string
        }
        Returns: Json
      }
      authenticate_client: {
        Args: { client_password: string; client_phone: string }
        Returns: Json
      }
      authenticate_client_secure: {
        Args: {
          client_password: string
          client_phone: string
          p_ip_address?: unknown
        }
        Returns: Json
      }
      authenticate_client_simple: {
        Args: { client_password: string; client_phone: string }
        Returns: Json
      }
      check_admin_exists: { Args: never; Returns: boolean }
      check_rate_limit: {
        Args: { p_ip_address?: unknown; p_phone: string }
        Returns: boolean
      }
      checkout_client: {
        Args: { p_checkout_by_user_id?: string; p_client_id: string }
        Returns: Json
      }
      create_super_admin: {
        Args: { p_email: string; p_full_name: string; p_password: string }
        Returns: Json
      }
      generate_barcode: { Args: never; Returns: string }
      generate_barcode_for_client: {
        Args: { client_code: string }
        Returns: string
      }
      generate_client_code: { Args: never; Returns: string }
      generate_reset_token: { Args: { p_phone: string }; Returns: Json }
      generate_unique_barcode: { Args: never; Returns: string }
      get_available_tickets: { Args: never; Returns: Json }
      get_client_active_ticket: { Args: { p_client_id: string }; Returns: Json }
      get_client_by_id: { Args: { client_id: string }; Returns: Json }
      get_client_check_in_status: {
        Args: { p_client_id: string }
        Returns: string
      }
      get_client_last_orders: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: Json
      }
      get_client_memberships: { Args: never; Returns: Json }
      get_client_status: { Args: { client_id: string }; Returns: string }
      get_current_user_role: { Args: never; Returns: string }
      get_event_analytics: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: Json
      }
      get_receptionist_active_sessions: { Args: never; Returns: Json }
      get_receptionist_daily_registrations: { Args: never; Returns: number }
      get_user_role: { Args: { check_user_id?: string }; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_admin_or_staff: { Args: never; Returns: boolean }
      is_admin_user: { Args: { check_user_id?: string }; Returns: boolean }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_current_user_staff: { Args: never; Returns: boolean }
      is_valid_client_id: { Args: { check_user_id: string }; Returns: boolean }
      log_login_attempt: {
        Args: { p_ip_address?: unknown; p_phone: string; p_success: boolean }
        Returns: undefined
      }
      log_system_event: {
        Args: {
          p_client_id?: string
          p_event_type: string
          p_log_level: string
          p_message: string
          p_metadata?: Json
          p_user_id?: string
        }
        Returns: string
      }
      search_clients_for_membership: {
        Args: { search_term: string }
        Returns: Json
      }
      setup_super_admin_profile: {
        Args: { p_email: string; p_full_name: string; p_user_id: string }
        Returns: Json
      }
      test_client_registration:
        | {
            Args: {
              p_barcode: string
              p_client_code: string
              p_email: string
              p_full_name: string
              p_password_hash: string
              p_phone: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_email: string
              p_full_name: string
              p_password_hash: string
              p_phone: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_email: string
              p_first_name: string
              p_how_did_you_find_us: string
              p_job_title: string
              p_last_name: string
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
