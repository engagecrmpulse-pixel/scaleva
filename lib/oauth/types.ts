export interface ExtractedCustomer {
  name: string;
  phone: string | null;
  email: string | null;
  last_purchase: string | null;
  spend_history: { date: string; amount: number; description?: string }[];
  return_visit_count: number;
  last_return_date: string | null;
  status: string | null;
}
