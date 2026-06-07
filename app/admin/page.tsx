import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { formatDate } from "@/utils/helpers";
import type { Business } from "@/utils/database.types";

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export default async function AdminPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminEmails = getAdminEmails();
  const isAdmin =
    adminEmails.length > 0 &&
    !!user.email &&
    adminEmails.includes(user.email.toLowerCase());

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-base">
        <Navbar email={user.email} />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="font-heading text-xl font-semibold text-content">
            Admin access required
          </h1>
          <p className="mt-2 text-sm text-content-muted">
            Your account isn&apos;t on the admin allowlist. Add your email to
            the{" "}
            <code className="mx-1 rounded border border-line bg-surface px-1 font-mono text-xs text-content">
              ADMIN_EMAILS
            </code>{" "}
            environment variable to view this page.
          </p>
        </main>
      </div>
    );
  }

  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false });

  const businessList = (businesses ?? []) as Business[];

  return (
    <div className="min-h-screen bg-base">
      <Navbar email={user.email} isAdmin />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 font-heading text-2xl font-semibold tracking-tight text-content">
          Admin overview
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Businesses ({businessList.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {businessList.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-content-muted">
                No businesses have signed up yet.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-content-muted">
                    <th className="px-5 py-2 font-medium">Name</th>
                    <th className="px-5 py-2 font-medium">Industry</th>
                    <th className="px-5 py-2 font-medium">Voice</th>
                    <th className="px-5 py-2 font-medium">Autopilot</th>
                    <th className="px-5 py-2 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {businessList.map((business) => (
                    <tr
                      key={business.id}
                      className="border-b border-line last:border-0 transition-colors hover:bg-surface/50"
                    >
                      <td className="px-5 py-3 font-medium text-content">
                        {business.name}
                      </td>
                      <td className="px-5 py-3 text-content-muted">
                        {business.industry ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-content-muted">
                        {business.voice ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-content-muted">
                        {business.config?.autopilot ? "On" : "Off"}
                      </td>
                      <td className="px-5 py-3 text-content-muted">
                        {formatDate(business.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
