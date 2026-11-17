import { CONTACT_EMAIL } from "@phonebook/shared";
import { InfoPage } from "@/components/InfoPage";

export const metadata = { title: "Contact", description: "How to reach the Online Phone Book team." };

export default function Page() {
  return (
    <InfoPage title="Contact us">
      <p>Have a question or a problem? Write to us.</p>
      <p><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
      <p>Please do not send your password or recovery code. We will never ask for them.</p>
      <p>If you cannot log in, try <a href="/recover">getting back into your account</a> first.</p>
    </InfoPage>
  );
}
