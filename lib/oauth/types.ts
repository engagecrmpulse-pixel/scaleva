export interface ExtractedCustomer {
  name: string;
  phone: string | null;
  email: string | null;
  last_purchase: string | null;
  spend_history: { date: string; amount: number; description?: string; items?: string[] }[];
  return_visit_count: number;
  last_return_date: string | null;
  status: string | null;
  visit_count?: number;
  total_spend?: number;
  avg_order_value?: number;
  favorite_items?: string[];
  birthday?: string | null;
  customer_since?: string | null;
}
