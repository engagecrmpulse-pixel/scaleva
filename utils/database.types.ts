export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MessageStatus =
  | "queued"
  | "queued_quiet_hours"
  | "sent"
  | "delivered"
  | "failed"
  | "received"
  | "test_sent";

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
  integrations?: Record<string, { connected: boolean; lastSync?: string; customersSynced?: number }>;
  oauthTokens?: Record<string, string>;
  emailNotifyReply?: boolean;
  emailNotifyFailed?: boolean;
  emailNotifyDailySummary?: boolean;
  // AI Personality controls
  aiTone?: string;
  aiLength?: string;
  aiEmoji?: string;
  aiSignature?: string;
  aiForbiddenWords?: string;
  aiNoCompetitors?: boolean;
  aiIncludeOffers?: boolean;
  aiCurrentOffer?: string;
  aiLanguage?: string;
  aiCustomOpener?: string;
  // Feature flags
  autoReplyEnabled?: boolean;
  reviewRequestEnabled?: boolean;
  reviewLink?: string;
  sequenceEnabled?: boolean;
  // Business profile (set in onboarding + settings)
  businessHours?: Record<string, { open: string; close: string; closed?: boolean }>;
  businessPhone?: string;
  businessAddress?: string;
  businessWebsite?: string;
  faq?: Array<{ question: string; answer: string }>;
  specialOffer?: string;
  bookingLink?: string;
  loyaltyProgram?: string;
  monthlyRevenueGoal?: number;
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
          opted_out: boolean;
          consent_given: boolean;
          consent_date: string | null;
          ltv: number;
          last_review_request_at: string | null;
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
          opted_out?: boolean;
          consent_given?: boolean;
          consent_date?: string | null;
          ltv?: number;
          last_review_request_at?: string | null;
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
          twilio_sid: string | null;
          topic: string | null;
          consent_verified: boolean;
          attributed: boolean;
          attributed_revenue: number;
        };
        Insert: {
          id?: string;
          customer_id: string;
          business_id: string;
          content: string;
          sent_at?: string | null;
          status?: MessageStatus;
          direction?: MessageDirection;
          twilio_sid?: string | null;
          topic?: string | null;
          consent_verified?: boolean;
          attributed?: boolean;
          attributed_revenue?: number;
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
      processed_webhooks: {
        Row: { id: string; event_id: string; processed_at: string };
        Insert: { id?: string; event_id: string; processed_at?: string };
        Update: { event_id?: string; processed_at?: string };
        Relationships: [];
      };
      customer_insights: {
        Row: { id: string; customer_id: string; best_reply_hour: number | null; updated_at: string };
        Insert: { id?: string; customer_id: string; best_reply_hour?: number | null; updated_at?: string };
        Update: { best_reply_hour?: number | null; updated_at?: string };
        Relationships: [];
      };
      sequence_enrollments: {
        Row: {
          id: string;
          customer_id: string;
          business_id: string;
          step: number;
          enrolled_at: string;
          next_step_at: string | null;
          completed: boolean;
          exited_reason: string | null;
        };
        Insert: {
          id?: string;
          customer_id: string;
          business_id: string;
          step?: number;
          enrolled_at?: string;
          next_step_at?: string | null;
          completed?: boolean;
          exited_reason?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["sequence_enrollments"]["Insert"]>;
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          category: string | null;
          price: number | null;
          description: string | null;
          active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          category?: string | null;
          price?: number | null;
          description?: string | null;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["menu_items"]["Insert"]>;
        Relationships: [];
      };
      menu_item_mentions: {
        Row: {
          id: string;
          business_id: string;
          menu_item_id: string;
          message_id: string | null;
          sentiment: "positive" | "negative" | "neutral" | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          menu_item_id: string;
          message_id?: string | null;
          sentiment?: "positive" | "negative" | "neutral" | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["menu_item_mentions"]["Insert"]>;
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
export type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
export type MenuItemMention = Database["public"]["Tables"]["menu_item_mentions"]["Row"];
