import { APP_NAME, FREE_CONTACT_LIMIT } from "@phonebook/shared";
import { btnLight, btnPrimary, wrap } from "@/lib/ui";

export const metadata = { title: "Pricing", description: "Phone Book is free now. Here is what the Free and Pro plans will be." };

const limit = FREE_CONTACT_LIMIT.toLocaleString("en-US");

// Edit the plans here. Nothing else on the page needs to change.
// Prices are not decided yet, so none are shown.
const plans = [
  {
    name: "Free",
    tag: "Free now",
    price: "₦0",
    note: "No card. No payment.",
    items: [
      `Up to ${limit} contacts`,
      "Real phone numbers only. Codes and random numbers are not saved",
      "Your contacts save online by themselves (Android)",
      "Log in from any phone or browser",
      "Search, copy and call any number",
      "Login notices, so you know when someone logs in",
    ],
    cta: { text: "Create a new account", href: "/signup", primary: true },
  },
  {
    name: "Pro",
    tag: "Coming soon",
    price: "Price not set yet",
    note: "We will tell you the price before Pro starts.",
    items: [
      `More than ${limit} contacts`,
      "Save codes and other numbers that are not phone numbers",
      "Everything in Free",
    ],
    cta: null,
  },
];

export default function Page() {
  return (
    <>
      <header className="border-b border-gray-100 bg-white">
        <div className={`${wrap} flex h-16 items-center justify-between`}>
          <a href="/" className="text-2xl font-extrabold text-brand-600">{APP_NAME}</a>
          <a href="/login" className="inline-flex min-h-11 items-center rounded-xl border-2 border-brand-600 px-5 font-bold text-brand-700 hover:bg-brand-50">Log in</a>
        </div>
      </header>

      <main className={`${wrap} py-10`}>
        <h1 className="text-4xl font-extrabold text-brand-900">Pricing</h1>
        <p className="mt-3 max-w-xl text-xl text-gray-700">{APP_NAME} is free. You do not need to pay to keep a safe copy of your contacts.</p>

        <p className="mt-6 max-w-xl rounded-2xl border-2 border-brand-600 bg-brand-50 p-5 font-bold text-brand-900">
          Everything is free for now, with no limits. Save as many contacts as you like. Foreign numbers like +1 and +49 are fine too.
        </p>

        <h2 className="mt-10 text-2xl font-extrabold text-brand-900">The plans we are planning</h2>
        <p className="mt-2 max-w-xl text-gray-700">
          Later, we will add a Pro plan. When that happens, the Free plan will have the limits below. We will tell you before any limit starts.
        </p>

        <ul className="mt-6 grid gap-5 sm:grid-cols-2">
          {plans.map((p) => (
            <li key={p.name} className={`flex flex-col rounded-3xl border-2 p-6 ${p.cta ? "border-brand-600" : "border-gray-200"}`}>
              <p className="text-base font-bold text-brand-700">{p.tag}</p>
              <h3 className="mt-1 text-3xl font-extrabold text-brand-900">{p.name}</h3>
              <p className="mt-2 text-2xl font-extrabold text-gray-900">{p.price}</p>
              <p className="text-base text-gray-700">{p.note}</p>
              <ul className="mt-5 flex-1 space-y-3">
                {p.items.map((t) => (
                  <li key={t} className="flex gap-3">
                    <span aria-hidden="true" className="font-extrabold text-brand-600">✓</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              {p.cta ? (
                <a href={p.cta.href} className={`${p.cta.primary ? btnPrimary : btnLight} mt-6 w-full`}>{p.cta.text}</a>
              ) : (
                <p className="mt-6 rounded-2xl bg-gray-100 p-4 text-center font-bold text-gray-700">Not open yet</p>
              )}
            </li>
          ))}
        </ul>

        <p className="mt-8 max-w-xl text-base text-gray-700">
          Questions about pricing? <a href="/contact" className="font-bold text-brand-700 underline">Contact us</a>.
        </p>
      </main>

      <footer className="py-8">
        <div className={`${wrap} flex flex-col items-center gap-3 text-base text-gray-700 sm:flex-row sm:justify-between`}>
          <p>© {new Date().getFullYear()} {APP_NAME}</p>
          <nav className="flex gap-6">
            <a href="/" className="underline">Home</a>
            <a href="/privacy" className="underline">Privacy</a>
            <a href="/contact" className="underline">Contact</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
