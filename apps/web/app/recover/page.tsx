import { PlainPage } from "@/components/AppShell";
import RecoverForm from "./RecoverForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Get back into my account" };

export default function Page() {
  return (
    <PlainPage title="Get back into my account">
      <RecoverForm />
    </PlainPage>
  );
}
