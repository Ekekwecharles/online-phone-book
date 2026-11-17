import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import AppShell from "@/components/AppShell";
import { Alert } from "@/components/ui";
import { getDb, t } from "@/lib/db";
import { currentUser } from "@/lib/session";
import AutoLogout from "@/components/AutoLogout";

export const dynamic = "force-dynamic";
export const metadata = { title: "Recent logins", robots: { index: false } };

const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" });
const what: Record<string, string> = { web: "Website", mobile: "Phone app", recovery: "Password reset" };

export default async function Page() {
  const auth = await currentUser();
  if (!auth) redirect("/login");
  const db = await getDb();
  const rows = await db.select().from(t.loginEvents).where(eq(t.loginEvents.userId, auth.user.id)).orderBy(desc(t.loginEvents.at)).limit(30);
  return (
    <AppShell current="/logins">
      <AutoLogout />
      <h1 className="text-3xl font-extrabold text-brand-900">Recent logins</h1>
      <p>These are the times someone opened your account. Times are Nigeria time. Places are a rough guess.</p>
      <Alert kind="info">See one that is not you? Go to Settings and tap &quot;Log out everywhere&quot;. Then change your password.</Alert>
      <ul className="divide-y divide-gray-200 rounded-3xl border border-gray-200">
        {rows.map((r) => (
          <li key={r.id} className="p-4">
            <p className="text-xl font-bold text-gray-900">{what[r.kind] ?? r.kind}</p>
            <p>{when.format(r.at)}</p>
            <p className="text-gray-800">{r.deviceType}</p>
            <p className="text-gray-800">{r.place}</p>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
