// Supabase Database types for FleetGuard
// Structured to match @supabase/supabase-js v2 expectations

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          subdomain: string | null
          custom_domain: string | null
          plan: string
          subscription_status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          subscription_ends_at: string | null
          logo_url: string | null
          favicon_url: string | null
          primary_color: string
          secondary_color: string
          accent_color: string
          background_color: string
          text_color: string
          email_logo_url: string | null
          email_footer_text: string | null
          whatsapp_message_prefix: string | null
          support_email: string | null
          support_phone: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          subdomain?: string | null
          custom_domain?: string | null
          plan?: string
          subscription_status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          subscription_ends_at?: string | null
          logo_url?: string | null
          favicon_url?: string | null
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          background_color?: string
          text_color?: string
          email_logo_url?: string | null
          email_footer_text?: string | null
          whatsapp_message_prefix?: string | null
          support_email?: string | null
          support_phone?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          subdomain?: string | null
          custom_domain?: string | null
          plan?: string
          subscription_status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          subscription_ends_at?: string | null
          logo_url?: string | null
          favicon_url?: string | null
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          background_color?: string
          text_color?: string
          email_logo_url?: string | null
          email_footer_text?: string | null
          whatsapp_message_prefix?: string | null
          support_email?: string | null
          support_phone?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          tenant_id: string
          email: string
          full_name: string | null
          phone_number: string | null
          role: string
          permissions: Json | null
          student_id: string | null
          parent_id: string | null
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          email: string
          full_name?: string | null
          phone_number?: string | null
          role: string
          permissions?: Json | null
          student_id?: string | null
          parent_id?: string | null
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          email?: string
          full_name?: string | null
          phone_number?: string | null
          role?: string
          permissions?: Json | null
          student_id?: string | null
          parent_id?: string | null
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      buses: {
        Row: {
          id: string
          tenant_id: string
          plate_number: string
          name: string | null
          capacity: number
          status: string
          panic_status: boolean
          current_driver_id: string | null
          current_trip_id: string | null
          latitude: number | null
          longitude: number | null
          last_location_update_at: string | null
          last_maintenance_at: string | null
          next_maintenance_due_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          plate_number: string
          name?: string | null
          capacity: number
          status?: string
          panic_status?: boolean
          current_driver_id?: string | null
          current_trip_id?: string | null
          latitude?: number | null
          longitude?: number | null
          last_location_update_at?: string | null
          last_maintenance_at?: string | null
          next_maintenance_due_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          plate_number?: string
          name?: string | null
          capacity?: number
          status?: string
          panic_status?: boolean
          current_driver_id?: string | null
          current_trip_id?: string | null
          latitude?: number | null
          longitude?: number | null
          last_location_update_at?: string | null
          last_maintenance_at?: string | null
          next_maintenance_due_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buses_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      routes: {
        Row: {
          id: string
          tenant_id: string
          name: string
          origin: string
          destination: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          origin: string
          destination: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          origin?: string
          destination?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          id: string
          tenant_id: string
          bus_id: string
          driver_id: string
          route_id: string
          status: string
          actual_start_time: string | null
          actual_end_time: string | null
          current_stop_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          bus_id: string
          driver_id: string
          route_id: string
          status?: string
          actual_start_time?: string | null
          actual_end_time?: string | null
          current_stop_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          bus_id?: string
          driver_id?: string
          route_id?: string
          status?: string
          actual_start_time?: string | null
          actual_end_time?: string | null
          current_stop_index?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          tenant_id: string
          student_id: string
          route_id: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          student_id: string
          route_id: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          student_id?: string
          route_id?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      scan_logs: {
        Row: {
          id: string
          tenant_id: string
          trip_id: string
          student_id: string
          scanned_at: string
          scan_type: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          trip_id: string
          student_id: string
          scanned_at?: string
          scan_type: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          trip_id?: string
          student_id?: string
          scanned_at?: string
          scan_type?: string
          created_at?: string
        }
        Relationships: []
      }
      bus_locations: {
        Row: {
          id: string
          tenant_id: string
          bus_id: string
          latitude: number
          longitude: number
          speed: number | null
          heading: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          bus_id: string
          latitude: number
          longitude: number
          speed?: number | null
          heading?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          bus_id?: string
          latitude?: number
          longitude?: number
          speed?: number | null
          heading?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
