import { PlainPage } from "@/components/AppShell";
import WasntMeForm from "./WasntMeForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "This wasn't me", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const sp = await searchParams;
  return (
    <PlainPage title="This wasn't me">
      <WasntMeForm token={sp.t ?? ""} />
    </PlainPage>
  );
}
