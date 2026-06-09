export function sanitizePhone(phone: string): string | null {
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (/^\+1\d{10}$/.test(cleaned)) return cleaned;
  if (/^\+\d{10,15}$/.test(cleaned)) return cleaned;
  if (/^\d{10}$/.test(cleaned)) return `+1${cleaned}`;
  if (/^1\d{10}$/.test(cleaned)) return `+${cleaned}`;
  return null;
}

export function sanitizeText(text: string): string {
  return text.replace(/<[^>]*>/g, "").trim().slice(0, 1000);
}

export function sanitizeEmail(email: string): string | null {
  const cleaned = email.toLowerCase().trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) return cleaned;
  return null;
}
