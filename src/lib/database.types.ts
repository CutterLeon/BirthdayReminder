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
          completed_at?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          priority?: string
          due_at?: string | null
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
    }
  }
}
