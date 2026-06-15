import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/utils/database.types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const publicRoutes = ["/", "/login", "/signup", "/auth", "/pricing", "/privacy", "/terms"];
  const webhookRoutes = ["/api/webhooks/", "/api/cron/"];
  const isPublicRoute =
    publicRoutes.some((r) => pathname === r || pathname.startsWith(`${r}/`)) ||
    webhookRoutes.some((r) => pathname.startsWith(r));

  if (!user && !isPublicRoute && !pathname.startsWith("/api/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Subscription gate: /dashboard and /settings require an active subscription.
  if (user && (pathname === "/dashboard" || pathname.startsWith("/settings"))) {
    const { data: businesses } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1);

    const businessId = businesses?.[0]?.id;

    if (businessId) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("business_id", businessId)
        .maybeSingle();

      const hasActiveSub =
        sub?.status === "active" ||
        sub?.status === "trialing" ||
        sub?.status === "past_due";

      if (!hasActiveSub) {
        const url = request.nextUrl.clone();
        url.pathname = "/pricing";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
