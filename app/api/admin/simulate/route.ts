import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServiceSupabase } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase/server";
import { anthropic, CLAUDE_MODEL } from "@/lib/claude";
import { formatCurrency, totalSpend } from "@/utils/helpers";
import type { SpendHistoryEntry } from "@/utils/database.types";

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

function serviceClient() {
  return createServiceSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export async function POST(request: NextRequest) {
  const authClient = createAuthClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user?.email || !getAdminEmails().includes(user.email.toLowerCase())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { businessId, customerId } = (await request.json()) as {
    businessId: string; customerId: string;
  };

  const supabase = serviceClient();

  const [{ data: business }, { data: customer }] = await Promise.all([
    supabase.from("businesses").select("*").eq("id", businessId).maybeSingle(),
    supabase.from("customers").select("*").eq("id", customerId).maybeSingle(),
  ]);

  if (!business || !customer) {
    return NextResponse.json({ error: "Business or customer not found" }, { status: 404 });
  }

  const history: SpendHistoryEntry[] = customer.spend_history ?? [];
  const totalSpendAmount = totalSpend(history);
  const avgSpend = history.length > 0 ? totalSpendAmount / history.length : 0;
  const days = daysSince(customer.last_purchase);
  const firstName = customer.name.split(" ")[0];
  const customInstructions = business.config?.customInstructions ?? "";

  const systemPrompt =
    `You are an expert SMS copywriter. Write ONE personalized SMS under 160 characters. ` +
    `Voice: ${business.voice ?? "friendly"}. Address customer as ${firstName} only. ` +
    `Industry: ${business.industry ?? "small business"}. Goals: ${business.goals ?? "re-engage"}. ` +
    `${days !== null ? `Days since last visit: ${days}. ` : ""}` +
    `Avg transaction: ${formatCurrency(avgSpend)}. Total spend: ${formatCurrency(totalSpendAmount)}. ` +
    `${customInstructions ? `Extra rules: ${customInstructions}. ` : ""}` +
    `Return ONLY the message body.`;

  const userContent = [
    `Business: ${business.name}`,
    `Customer: ${firstName}`,
    `Last purchase: ${customer.last_purchase ?? "unknown"}`,
    `Write the message now:`,
  ].join("\n");

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 200,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    });
    const block = response.content[0];
    const message = block?.type === "text" ? block.text.trim() : "";
    return NextResponse.json({
      message,
      customerName: customer.name,
      businessName: business.name,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Generation failed", detail }, { status: 502 });
  }
}
