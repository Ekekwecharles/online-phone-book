import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import AutoLogout from "@/components/AutoLogout";
import { currentUser } from "@/lib/session";
import SettingsView from "./SettingsView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings", robots: { index: false } };

export default async function Page() {
  const auth = await currentUser();
  if (!auth) redirect("/login");
  return (
    <AppShell current="/settings">
      <AutoLogout />
      <h1 className="text-3xl font-extrabold text-brand-900">Settings</h1>
      <SettingsView username={auth.user.username} email={auth.user.email ?? ""} hasRecoveryPhone={!!auth.user.recoveryPhoneEnc} />
    </AppShell>
  );
}
