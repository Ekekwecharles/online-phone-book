import { redirect } from "next/navigation";
import { PlainPage } from "@/components/AppShell";
import { currentUser } from "@/lib/session";
import SignupForm from "./SignupForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Make an account" };

export default async function Page() {
  if (await currentUser()) redirect("/contacts");
  return (
    <PlainPage title="Make an account">
      <SignupForm />
    </PlainPage>
  );
}
