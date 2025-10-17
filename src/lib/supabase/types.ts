export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: 'ADMIN' | 'MANAGER' | 'AGENT' | 'VIEWER'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          role?: 'ADMIN' | 'MANAGER' | 'AGENT' | 'VIEWER'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: 'ADMIN' | 'MANAGER' | 'AGENT' | 'VIEWER'
          created_at?: string
          updated_at?: string
        }
      }
      practices: {
        Row: {
          id: string
          name: string
          practice_type: string | null
          address: string | null
          phone: string | null
          email: string | null
          website: string | null
          service_level: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          practice_type?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          service_level?: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          practice_type?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          service_level?: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE'
          created_at?: string
          updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          practice_id: string
          name: string
          role: string | null
          email: string | null
          phone: string | null
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          practice_id: string
          name: string
          role?: string | null
          email?: string | null
          phone?: string | null
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          practice_id?: string
          name?: string
          role?: string | null
          email?: string | null
          phone?: string | null
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      calls: {
        Row: {
          id: string
          practice_id: string
          caller_name: string | null
          caller_phone: string | null
          call_type: 'INBOUND' | 'OUTBOUND'
          purpose: string | null
          notes: string | null
          duration_minutes: number | null
          handled_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          practice_id: string
          caller_name?: string | null
          caller_phone?: string | null
          call_type: 'INBOUND' | 'OUTBOUND'
          purpose?: string | null
          notes?: string | null
          duration_minutes?: number | null
          handled_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          practice_id?: string
          caller_name?: string | null
          caller_phone?: string | null
          call_type?: 'INBOUND' | 'OUTBOUND'
          purpose?: string | null
          notes?: string | null
          duration_minutes?: number | null
          handled_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          practice_id: string
          title: string
          description: string | null
          category: 'BILLING' | 'SCHEDULING' | 'INSURANCE' | 'TECHNICAL' | 'GENERAL'
          priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
          status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
          assigned_to: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          practice_id: string
          title: string
          description?: string | null
          category: 'BILLING' | 'SCHEDULING' | 'INSURANCE' | 'TECHNICAL' | 'GENERAL'
          priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
          status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
          assigned_to?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          practice_id?: string
          title?: string
          description?: string | null
          category?: 'BILLING' | 'SCHEDULING' | 'INSURANCE' | 'TECHNICAL' | 'GENERAL'
          priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
          status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
          assigned_to?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      billing: {
        Row: {
          id: string
          practice_id: string
          amount: number
          description: string | null
          due_date: string | null
          paid_date: string | null
          status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          practice_id: string
          amount: number
          description?: string | null
          due_date?: string | null
          paid_date?: string | null
          status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          practice_id?: string
          amount?: number
          description?: string | null
          due_date?: string | null
          paid_date?: string | null
          status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
          created_at?: string
          updated_at?: string
        }
      }
      insurance_claims: {
        Row: {
          id: string
          practice_id: string
          claim_number: string
          patient_name: string | null
          insurance_company: string | null
          claim_amount: number | null
          status: 'SUBMITTED' | 'PENDING' | 'APPROVED' | 'DENIED' | 'PAID'
          submission_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          practice_id: string
          claim_number: string
          patient_name?: string | null
          insurance_company?: string | null
          claim_amount?: number | null
          status?: 'SUBMITTED' | 'PENDING' | 'APPROVED' | 'DENIED' | 'PAID'
          submission_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          practice_id?: string
          claim_number?: string
          patient_name?: string | null
          insurance_company?: string | null
          claim_amount?: number | null
          status?: 'SUBMITTED' | 'PENDING' | 'APPROVED' | 'DENIED' | 'PAID'
          submission_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          practice_id: string | null
          user_id: string
          type: string
          description: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          practice_id?: string | null
          user_id: string
          type: string
          description: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          practice_id?: string | null
          user_id?: string
          type?: string
          description?: string
          metadata?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}