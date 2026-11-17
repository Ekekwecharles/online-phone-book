import { APP_NAME } from "@phonebook/shared";
import { InfoPage } from "@/components/InfoPage";

export const metadata = { title: "Get the app", description: "Get the Online Phone Book app for Android and iPhone." };

export default function Page() {
  return (
    <InfoPage title="Get the app">
      <p>The {APP_NAME} app is coming soon to Android and iPhone.</p>
      <p>You do not need the app to use your contacts from another phone. You can <a href="/login">log in on the website</a>.</p>
    </InfoPage>
  );
}
