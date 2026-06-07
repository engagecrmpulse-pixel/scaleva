export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MessageStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "failed"
  | "received";

export type MessageDirection = "outbound" | "inbound";

export interface BusinessConfig {
  autopilot?: boolean;
  quietHours?: { start: string; end: string };
  cadence?: string;
  goals?: string[];
  customInstructions?: string;
  autopilotSendDay?: string;
  autopilotSendTime?: string;
  autopilotTimezone?: string;
  integrations?: Record<string, { connected: boolean; lastSync?: string }>;
  oauthTokens?: Record<string, string>;
  emailNotifyReply?: boolean;
  emailNotifyFailed?: boolean;
  emailNotifyDailySummary?: boolean;
  [key: string]: Json | undefined;
}

export interface SpendHistoryEntry {
  date: string;
  amount: number;
  description?: string;
}

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          industry: string | null;
          voice: string | null;
          goals: string | null;
          data_source: string | null;
          config: BusinessConfig | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          industry?: string | null;
          voice?: string | null;
          goals?: string | null;
          data_source?: string | null;
          config?: BusinessConfig | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["businesses"]["Insert"]>;
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          phone: string | null;
          email: string | null;
          last_purchase: string | null;
          spend_history: SpendHistoryEntry[];
          next_contact_date: string | null;
          return_visit_count: number;
          last_return_date: string | null;
          status: string | null;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          last_purchase?: string | null;
          spend_history?: SpendHistoryEntry[];
          next_contact_date?: string | null;
          return_visit_count?: number;
          last_return_date?: string | null;
          status?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          customer_id: string;
          business_id: string;
          content: string;
          sent_at: string | null;
          status: MessageStatus;
          direction: MessageDirection;
        };
        Insert: {
          id?: string;
          customer_id: string;
          business_id: string;
          content: string;
          sent_at?: string | null;
          status?: MessageStatus;
          direction?: MessageDirection;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
      interactions: {
        Row: {
          id: string;
          customer_id: string;
          type: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          type: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["interactions"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          business_id: string;
          type: string;
          content: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          type: string;
          content: string;
          read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          business_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan: string;
          status: string;
          current_period_end: string | null;
          message_count_this_period: number;
          customer_limit: number | null;
          message_limit: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: string;
          status?: string;
          current_period_end?: string | null;
          message_count_this_period?: number;
          customer_limit?: number | null;
          message_limit?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Business = Database["public"]["Tables"]["businesses"]["Row"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Interaction = Database["public"]["Tables"]["interactions"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
