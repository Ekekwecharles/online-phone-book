import { APP_NAME, CONTACT_EMAIL } from "@phonebook/shared";
import { InfoPage } from "@/components/InfoPage";

export const metadata = {
  title: "Privacy",
  description: "How Online Phone Book keeps your contacts private, in plain words.",
};

// DRAFT in plain words. The owner must review this before the app stores.
export default function Page() {
  return (
    <InfoPage title="Privacy">
      <p className="rounded-2xl bg-amber-50 p-4 font-bold text-amber-900">Draft. This page has not been checked by a lawyer yet.</p>

      <h2>What we keep</h2>
      <ul>
        <li>Your username, and your phone number if you give it.</li>
        <li>Your password. We never keep the password itself. We keep a scrambled copy that cannot be turned back.</li>
        <li>Your contacts: names and phone numbers, if you use the app to save them.</li>
        <li>Your email and a second phone number, only if you add them.</li>
        <li>A list of recent logins: the time, the type of device, and a rough place.</li>
      </ul>

      <h2>Why we keep it</h2>
      <p>To save a safe copy of your contacts, so you can get any number from any phone. And to tell you when someone opens your account.</p>

      <h2>How we protect it</h2>
      <ul>
        <li>Your contacts are locked (encrypted) before we save them.</li>
        <li>You are logged out by itself on the website. We do not keep your contacts on the phone or computer you use to log in.</li>
        <li>We do not sell your data. We do not show ads. We do not share your contacts with anyone.</li>
        <li>We do not write your contacts in our logs.</li>
      </ul>
      <p>No system is perfectly safe. Pick a password that is hard to guess, and keep it to yourself.</p>

      <h2>Phone permission</h2>
      <p>The phone app asks to read your contacts. We ask so we can save a copy online. We use it for nothing else.</p>

      <h2>Emails we send</h2>
      <p>Only login notices and recovery codes. No advertising.</p>

      <h2>Delete your data</h2>
      <p>You can delete your account in Settings, in the website or the app. This deletes your account and all your contacts.</p>

      <h2>Questions</h2>
      <p>Write to us: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
      <p>{APP_NAME}</p>
    </InfoPage>
  );
}
