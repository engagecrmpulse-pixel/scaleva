import Anthropic from "@anthropic-ai/sdk";

/**
 * Server-side Anthropic (Claude) client. Never import this into a Client
 * Component — the API key must stay on the server.
 */
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/** Default model used for generating outreach copy. */
export const CLAUDE_MODEL = "claude-sonnet-4-6";

export interface OutreachParams {
  /** The customer's first name (or full name). */
  customerName: string;
  /** Name of the business sending the message. */
  businessName: string;
  /** Industry the business operates in. */
  industry: string;
  /** Brand voice, e.g. "friendly", "professional", "playful". */
  voice: string;
  /** What this outreach is trying to achieve. */
  goal: string;
  /** Optional context about the customer (purchase history, etc.). */
  context?: string;
}

/**
 * Generates a single, personalized SMS message on behalf of a business.
 * Returns plain text suitable for sending over Twilio (kept short for SMS).
 */
export async function generateOutreachMessage(
  params: OutreachParams
): Promise<string> {
  const { customerName, businessName, industry, voice, goal, context } =
    params;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 300,
    system:
      "You are an expert SMS copywriter for small businesses. Write a single, " +
      "concise, personalized text message under 320 characters. Do not use " +
      "markdown, emojis unless on-brand, or placeholders like [Name]. Return " +
      "only the message body with no preamble.",
    messages: [
      {
        role: "user",
        content: [
          `Business: ${businessName} (${industry})`,
          `Brand voice: ${voice}`,
          `Goal of this message: ${goal}`,
          `Customer name: ${customerName}`,
          context ? `Customer context: ${context}` : null,
          "",
          "Write the SMS message now.",
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ],
  });

  const block = response.content[0];
  if (block && block.type === "text") {
    return block.text.trim();
  }
  return "";
}
