import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Alert } from "@/components/ui";
import { currentUser } from "@/lib/session";
import ContactsView from "./ContactsView";

export const dynamic = "force-dynamic";
export const metadata = { title: "My contacts", robots: { index: false } };

export default async function Page() {
  const auth = await currentUser();
  if (!auth) redirect("/login");
  return (
    <AppShell current="/contacts">
      {!auth.user.email && (
        <Alert kind="info">
          Add an email so we can tell you if someone opens your account. <a href="/settings" className="underline">Add email</a>
        </Alert>
      )}
      <ContactsView />
    </AppShell>
  );
}
