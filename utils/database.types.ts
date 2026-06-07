/**
 * Hand-written types describing the Supabase schema. In a production setup
 * these would be generated with `supabase gen types typescript`, but they are
 * authored here so the app is fully typed out of the box.
 */

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
  /** Whether AI outreach is currently enabled for this business. */
  autopilot?: boolean;
  /** Quiet hours during which no messages should be sent. */
  quietHours?: { start: string; end: string };
  cadence?: string;
  goals?: string[];
  customInstructions?: string;
  /** Free-form additional settings. */
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience row aliases used throughout the app.
export type Business = Database["public"]["Tables"]["businesses"]["Row"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Interaction = Database["public"]["Tables"]["interactions"]["Row"];
