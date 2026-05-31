/**
 * Supabase database types.
 *
 * Regenerate with:
 *   npx supabase gen types typescript --project-id <id> --schema public > src/types/database.ts
 *
 * This file is the hand-written baseline used until the project is linked.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Relationships: [];
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      babies: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          name: string;
          birth_date: string;
          gender: 'girl' | 'boy' | 'other' | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          birth_date: string;
          gender?: 'girl' | 'boy' | 'other' | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          birth_date?: string;
          gender?: 'girl' | 'boy' | 'other' | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      log_entries: {
        Relationships: [];
        Row: {
          id: string;
          baby_id: string;
          user_id: string;
          type: LogEntryType;
          started_at: string;
          ended_at: string | null;
          amount: number | null;
          unit: string | null;
          notes: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          user_id: string;
          type: LogEntryType;
          started_at: string;
          ended_at?: string | null;
          amount?: number | null;
          unit?: string | null;
          notes?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          baby_id?: string;
          user_id?: string;
          type?: LogEntryType;
          started_at?: string;
          ended_at?: string | null;
          amount?: number | null;
          unit?: string | null;
          notes?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      activity_shares: {
        Relationships: [];
        Row: {
          id: string;
          baby_id: string;
          user_id: string;
          token: string;
          filter_mode: 'all' | 'categories';
          activity_ids: string[];
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          user_id: string;
          token?: string;
          filter_mode: 'all' | 'categories';
          activity_ids?: string[];
          expires_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          baby_id?: string;
          user_id?: string;
          token?: string;
          filter_mode?: 'all' | 'categories';
          activity_ids?: string[];
          expires_at?: string;
          created_at?: string;
        };
      };
      baby_routines: {
        Relationships: [];
        Row: {
          id: string;
          baby_id: string;
          user_id: string;
          period_days: number;
          summary: string | null;
          schedule: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          user_id: string;
          period_days?: number;
          summary?: string | null;
          schedule: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          baby_id?: string;
          user_id?: string;
          period_days?: number;
          summary?: string | null;
          schedule?: Json;
          created_at?: string;
        };
      };
      subscriptions: {
        Relationships: [];
        Row: {
          user_id: string;
          status: SubscriptionStatus;
          plan: SubscriptionPlan | null;
          provider: string;
          paddle_customer_id: string | null;
          paddle_subscription_id: string | null;
          free_ai_generations_used: number;
          current_period_end: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          status?: SubscriptionStatus;
          plan?: SubscriptionPlan | null;
          provider?: string;
          paddle_customer_id?: string | null;
          paddle_subscription_id?: string | null;
          free_ai_generations_used?: number;
          current_period_end?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          status?: SubscriptionStatus;
          plan?: SubscriptionPlan | null;
          provider?: string;
          paddle_customer_id?: string | null;
          paddle_subscription_id?: string | null;
          free_ai_generations_used?: number;
          current_period_end?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type LogEntryType =
  | 'feeding'
  | 'sleep'
  | 'diaper'
  | 'pump'
  | 'medication'
  | 'note';

export type SubscriptionStatus =
  | 'free'
  | 'trialing'
  | 'active'
  | 'canceled'
  | 'past_due';

export type SubscriptionPlan = 'monthly' | 'annual' | 'lifetime';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Baby = Database['public']['Tables']['babies']['Row'];
export type LogEntry = Database['public']['Tables']['log_entries']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
