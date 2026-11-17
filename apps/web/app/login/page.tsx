import { redirect } from "next/navigation";
import { PlainPage } from "@/components/AppShell";
import { currentUser } from "@/lib/session";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Log in" };

export default async function Page({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  if (await currentUser()) redirect("/contacts");
  const sp = await searchParams;
  return (
    <PlainPage title="Log in">
      <LoginForm expired={sp.expired === "1"} />
    </PlainPage>
  );
}
