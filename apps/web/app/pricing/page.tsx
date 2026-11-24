import { APP_NAME } from "@phonebook/shared";
import { btnLight, btnPrimary, wrap } from "@/lib/ui";

export const metadata = { title: "Pricing", description: "Phone Book is free to start. Pro is coming soon." };

// Edit the plans here. Nothing else on the page needs to change.
// Prices are not decided yet, so none are shown.
const plans = [
  {
    name: "Free",
    tag: "Available now",
    price: "₦0",
    note: "No card. No payment.",
    items: [
      "Save up to 5,000 contacts",
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
      "Save more than 5,000 contacts",
      "Save things that are not phone numbers, like important codes",
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
        <p className="mt-3 max-w-xl text-xl text-gray-700">{APP_NAME} is free to start. You do not need to pay to keep a safe copy of your contacts.</p>

        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {plans.map((p) => (
            <li key={p.name} className={`flex flex-col rounded-3xl border-2 p-6 ${p.cta ? "border-brand-600" : "border-gray-200"}`}>
              <p className="text-base font-bold text-brand-700">{p.tag}</p>
              <h2 className="mt-1 text-3xl font-extrabold text-brand-900">{p.name}</h2>
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
