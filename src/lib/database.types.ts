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
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          role: string
          is_active: boolean
          stripe_customer_id: string | null
          default_timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          role?: string
          is_active?: boolean
          stripe_customer_id?: string | null
          default_timezone?: string
        }
        Update: {
          email?: string | null
          full_name?: string | null
          role?: string
          is_active?: boolean
          stripe_customer_id?: string | null
          default_timezone?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          priority: string
          due_at: string | null
          estimate_minutes: number | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          priority?: string
          due_at?: string | null
          estimate_minutes?: number | null
          completed_at?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          priority?: string
          due_at?: string | null
          estimate_minutes?: number | null
          completed_at?: string | null
        }
      }
      birthday_contacts: {
        Row: {
          id: string
          user_id: string
          display_name: string
          birth_month: number
          birth_day: number
          birth_year: number | null
          timezone: string
          city: string | null
          country: string | null
          notify_email: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          display_name: string
          birth_month: number
          birth_day: number
          birth_year?: number | null
          timezone?: string
          city?: string | null
          country?: string | null
          notify_email?: boolean
        }
        Update: {
          display_name?: string
          birth_month?: number
          birth_day?: number
          birth_year?: number | null
          timezone?: string
          city?: string | null
          country?: string | null
          notify_email?: boolean
        }
      }
      task_timeboxes: {
        Row: {
          id: string
          user_id: string
          task_id: string | null
          title: string | null
          start_at: string
          end_at: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_id?: string | null
          title?: string | null
          start_at: string
          end_at: string
          notes?: string | null
        }
        Update: {
          task_id?: string | null
          title?: string | null
          start_at?: string
          end_at?: string
          notes?: string | null
        }
      }
      calendar_feeds: {
        Row: {
          id: string
          user_id: string
          token: string
          enabled: boolean
          include_birthdays: boolean
          include_tasks: boolean
          include_timeboxes: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          enabled?: boolean
          include_birthdays?: boolean
          include_tasks?: boolean
          include_timeboxes?: boolean
        }
        Update: {
          token?: string
          enabled?: boolean
          include_birthdays?: boolean
          include_tasks?: boolean
          include_timeboxes?: boolean
        }
      }
      monitor_links: {
        Row: {
          id: string
          user_id: string
          name: string
          url: string
          enabled: boolean
          check_interval_minutes: number
          last_checked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          url: string
          enabled?: boolean
          check_interval_minutes?: number
          last_checked_at?: string | null
        }
        Update: {
          name?: string
          url?: string
          enabled?: boolean
          check_interval_minutes?: number
          last_checked_at?: string | null
        }
      }
      monitor_checks: {
        Row: {
          id: string
          monitor_link_id: string
          checked_at: string
          status_code: number | null
          ok: boolean
          latency_ms: number | null
          error: string | null
        }
        Insert: {
          id?: string
          monitor_link_id: string
          checked_at?: string
          status_code?: number | null
          ok?: boolean
          latency_ms?: number | null
          error?: string | null
        }
        Update: {
          status_code?: number | null
          ok?: boolean
          latency_ms?: number | null
          error?: string | null
        }
      }
    }
  }
}
