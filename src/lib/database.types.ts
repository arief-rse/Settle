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
      analysis_history: {
        Row: {
          id: string
          user_id: string
          timestamp: string
          text: string
          response: string
          url: string | null
        }
        Insert: {
          id?: string
          user_id: string
          timestamp?: string
          text: string
          response: string
          url?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          timestamp?: string
          text?: string
          response?: string
          url?: string | null
        }
      }
      customers: {
        Row: {
          id: string
          stripe_customer_id: string | null
          email: string | null
        }
        Insert: {
          id: string
          stripe_customer_id?: string | null
          email?: string | null
        }
        Update: {
          id?: string
          stripe_customer_id?: string | null
          email?: string | null
        }
      }
      prices: {
        Row: {
          id: string
          product_id: string
          active: boolean
          description: string | null
          unit_amount: number | null
          currency: string | null
          type: string | null
          interval: string | null
          interval_count: number | null
          trial_period_days: number | null
          metadata: Json | null
        }
        Insert: {
          id: string
          product_id: string
          active?: boolean
          description?: string | null
          unit_amount?: number | null
          currency?: string | null
          type?: string | null
          interval?: string | null
          interval_count?: number | null
          trial_period_days?: number | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          product_id?: string
          active?: boolean
          description?: string | null
          unit_amount?: number | null
          currency?: string | null
          type?: string | null
          interval?: string | null
          interval_count?: number | null
          trial_period_days?: number | null
          metadata?: Json | null
        }
      }
      products: {
        Row: {
          id: string
          active: boolean
          name: string
          description: string | null
          image: string | null
          metadata: Json | null
        }
        Insert: {
          id: string
          active?: boolean
          name: string
          description?: string | null
          image?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          active?: boolean
          name?: string
          description?: string | null
          image?: string | null
          metadata?: Json | null
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string | null
          request_count: number | null
          is_subscribed: boolean | null
          subscription_end_date: string | null
          email: string | null
        }
        Insert: {
          id: string
          created_at?: string | null
          request_count?: number | null
          is_subscribed?: boolean | null
          subscription_end_date?: string | null
          email?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          request_count?: number | null
          is_subscribed?: boolean | null
          subscription_end_date?: string | null
          email?: string | null
        }
      }
      request_counts: {
        Row: {
          id: string
          user_id: string
          requests_remaining: number
          last_reset_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          requests_remaining: number
          last_reset_at: string
          created_at: string
          updated_at: string
        }
        Update: {
          id?: string
          user_id?: string
          requests_remaining?: number
          last_reset_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          created_at: string | null
          current_period_end: string | null
          cancel_at: string | null
          canceled_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          user_id: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string | null
          current_period_end?: string | null
          cancel_at?: string | null
          canceled_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string | null
          current_period_end?: string | null
          cancel_at?: string | null
          canceled_at?: string | null
          updated_at?: string | null
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          is_subscribed: boolean
          requests_count: number | null
          requests_limit: number | null
          subscription_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          is_subscribed: boolean
          requests_count?: number | null
          requests_limit?: number | null
          subscription_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          is_subscribed?: boolean
          requests_count?: number | null
          requests_limit?: number | null
          subscription_id?: string | null
          created_at?: string | null
          updated_at?: string | null
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
