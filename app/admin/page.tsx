import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { formatDate } from "@/utils/helpers";
import type { Business } from "@/utils/database.types";

/**
 * Comma-separated allowlist of admin emails, e.g.
 * ADMIN_EMAILS="me@scaleva.com,ops@scaleva.com"
 */
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
      <div className="min-h-screen bg-gray-50">
        <Navbar email={user.email} />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-xl font-semibold text-gray-900">
            Admin access required
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Your account isn&apos;t on the admin allowlist. Add your email to the
            <code className="mx-1 rounded bg-gray-100 px-1">ADMIN_EMAILS</code>
            environment variable to view this page.
          </p>
        </main>
      </div>
    );
  }

  // Admins can see across businesses (RLS should grant this via a policy
  // keyed on the admin allowlist, or use a service role on the server).
  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false });

  const businessList = (businesses ?? []) as Business[];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar email={user.email} isAdmin />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">
          Admin overview
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Businesses ({businessList.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {businessList.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-500">
                No businesses have signed up yet.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
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
                      className="border-b border-gray-50 last:border-0"
                    >
                      <td className="px-5 py-3 font-medium text-gray-900">
                        {business.name}
                      </td>
                      <td className="px-5 py-3 text-gray-700">
                        {business.industry ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-gray-700">
                        {business.voice ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-gray-700">
                        {business.config?.autopilot ? "On" : "Off"}
                      </td>
                      <td className="px-5 py-3 text-gray-700">
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
