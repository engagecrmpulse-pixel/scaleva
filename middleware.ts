import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const CSRF_EXEMPT = ["/api/webhooks", "/api/auth", "/api/dev"];

function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { method, nextUrl } = request;

  // CSRF: verify Origin on all non-exempt POST requests to /api/
  if (method === "POST" && nextUrl.pathname.startsWith("/api/") && !isCsrfExempt(nextUrl.pathname)) {
    const origin = request.headers.get("origin");
    if (origin) {
      const host = request.headers.get("host") ?? "";
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const allowed = [`https://${host}`, `http://${host}`, ...(appUrl ? [appUrl] : [])];
      if (!allowed.some((a) => origin === a)) {
        return NextResponse.json({ error: "Forbidden", code: "CSRF" }, { status: 403 });
      }
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public asset extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
