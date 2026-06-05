import twilio from "twilio";

/**
 * Server-side Twilio client. Lazily instantiated so that builds and tests
 * without credentials don't throw at import time.
 */
let cachedClient: twilio.Twilio | null = null;

export function getTwilioClient(): twilio.Twilio {
  if (cachedClient) return cachedClient;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error(
      "Twilio credentials are not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN."
    );
  }

  cachedClient = twilio(accountSid, authToken);
  return cachedClient;
}

export interface SendSmsParams {
  /** Destination phone number in E.164 format, e.g. +14155551234. */
  to: string;
  /** Message body. */
  body: string;
  /** Optional override of the sending number. */
  from?: string;
}

export interface SendSmsResult {
  sid: string;
  status: string;
}

/**
 * Sends an SMS via Twilio and returns the message SID and status.
 */
export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  const { to, body } = params;
  const from = params.from ?? process.env.TWILIO_PHONE_NUMBER;

  if (!from) {
    throw new Error(
      "No sending number configured. Set TWILIO_PHONE_NUMBER or pass `from`."
    );
  }

  const client = getTwilioClient();
  const message = await client.messages.create({ to, from, body });

  return { sid: message.sid, status: message.status };
}
