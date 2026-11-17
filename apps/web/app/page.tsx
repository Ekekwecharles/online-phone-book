import { APP_NAME as APP } from "@phonebook/shared";
import { btn, btnLight, btnPrimary, h2, wrap } from "@/lib/ui";

// Where "Get the app" goes until the store pages exist.
const GET_APP_HREF = "/get-the-app";

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const icons = {
  phone: "M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM11 18h2",
  sync: "M21 12a9 9 0 0 1-15.5 6.2M3 12A9 9 0 0 1 18.5 5.8M18 2v4h-4M6 22v-4h4",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",
  key: "M15 7a4 4 0 1 1-3.5 6L3 21v-3l2-2h2v-2l3.5-3.5A4 4 0 0 1 15 7z",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7l1-8z",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4",
};

const steps = [
  { icon: icons.phone, title: "Get the app", text: `Install the ${APP} app on your phone. Make an account with a username or phone number and a password. No email needed.` },
  { icon: icons.sync, title: "Your contacts save online", text: "They save by themselves. Every time you save a new contact, it goes online too." },
  { icon: icons.globe, title: "Phone lost? Use any phone", text: `Borrow any phone or use any computer. Open the ${APP} website and log in. Find the contact. Copy or call the number. Done.` },
];

const features = [
  { icon: icons.globe, title: "Works in any browser", text: "No app needed when you borrow someone's phone." },
  { icon: icons.key, title: "No email. No OTP.", text: "Log in with your username or phone number and your password. OTP codes go to your dead phone, so we don't use them." },
  { icon: icons.sync, title: "Saves by itself", text: "You don't need to remember to back up." },
  { icon: icons.bolt, title: "Quick", text: "Log in. Search a name. Tap to copy or call." },
  { icon: icons.shield, title: "Safe on borrowed phones", text: "You are logged out by itself. Nothing is saved on that phone. You get a notice when anyone logs into your account." },
];

const faqs = [
  { q: "Do I need an email?", a: "No. You only need a username or phone number, and a password." },
  { q: "What if I use someone else's phone?", a: "It is safe. You are logged out by itself, and nothing is kept on that phone. We also tell you whenever someone logs into your account." },
  { q: "Does it work on iPhone?", a: "Yes. On Android, your contacts save by themselves. On iPhone, they save when you open the app. So open it often." },
  { q: "Is my data safe?", a: "Yes. Your contacts are kept behind your password. Only you can see them. Pick a password that is hard to guess, and keep it to yourself." },
];

const contacts = ["Mama", "Chidi Mechanic", "Landlord"];

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/95">
        <div className={`${wrap} flex h-16 items-center justify-between`}>
          <a href="/" className="text-2xl font-extrabold text-brand-600">{APP}</a>
          <a href="/login" className="inline-flex min-h-11 items-center rounded-xl border-2 border-brand-600 px-5 font-bold text-brand-700 hover:bg-brand-50">Log in</a>
        </div>
      </header>

      <main>
        <section className="bg-brand-50 py-14 sm:py-20">
          <div className={`${wrap} text-center`}>
            <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-tight text-brand-900 sm:text-5xl">
              Your phone can spoil. Your contacts shouldn&apos;t disappear.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-xl text-gray-700">
              {APP} is an online phone book. It keeps a safe copy of your contacts online. Get any number from any phone.
            </p>
            <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
              <a href={GET_APP_HREF} className={btnPrimary}>Get the app</a>
              <a href="/contacts" className={`${btnLight} bg-white`}>Open my contacts</a>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className={`${wrap} max-w-2xl`}>
            <h2 className={h2}>This can happen to you</h2>
            <div className="mt-6 space-y-4 text-gray-700">
              <p>You are travelling to meet someone far away. Heavy rain falls. Your phone gets soaked and stops working.</p>
              <p>You arrive. But you cannot call the person to ask for directions. All your numbers were on that phone.</p>
              <p>Now you are stuck. It is evening. You are far from home, looking for a phone repairer.</p>
              <p className="rounded-2xl bg-brand-50 p-5 font-bold text-brand-900">
                Most people do not remember phone numbers anymore. When the phone goes, the numbers go too.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-14 sm:py-20">
          <div className={wrap}>
            <h2 className={h2}>How it works</h2>
            <ol className="mt-8 grid gap-4 sm:grid-cols-3">
              {steps.map((s, i) => (
                <li key={s.title} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-lg font-extrabold text-white">{i + 1}</span>
                    <span className="text-brand-600"><Icon d={s.icon} /></span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-brand-900">{s.title}</h3>
                  <p className="mt-2 text-gray-700">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className={wrap}>
            <h2 className={h2}>Why {APP}?</h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <li key={f.title} className="rounded-3xl border border-gray-200 p-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700"><Icon d={f.icon} /></span>
                  <h3 className="mt-4 text-xl font-bold text-brand-900">{f.title}</h3>
                  <p className="mt-2 text-gray-700">{f.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-brand-50 py-14 sm:py-20">
          <div className={`${wrap} text-center`}>
            <h2 className={h2}>This is what you will see</h2>
            <p className="mt-3 text-gray-700">Log in on any phone. Your contacts are there.</p>
            <div className="mx-auto mt-8 w-full max-w-xs rounded-[2.5rem] border-8 border-brand-900 bg-white p-4 text-left shadow-lg" role="img" aria-label="Example of the contacts screen">
              <p className="text-center text-sm font-bold text-brand-600">{APP}</p>
              <div className="mt-3 rounded-xl bg-gray-100 px-4 py-3 text-base text-gray-600">Search a name…</div>
              <ul className="mt-3 divide-y divide-gray-100">
                {contacts.map((c) => (
                  <li key={c} className="flex items-center justify-between gap-2 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-gray-900">{c}</p>
                      <p className="text-sm text-gray-600">0803 000 0000</p>
                    </div>
                    <span className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-bold text-white">Copy</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className={`${wrap} max-w-2xl`}>
            <h2 className={h2}>Questions</h2>
            <div className="mt-8 space-y-3">
              {faqs.map((f) => (
                <details key={f.q} className="group rounded-2xl border border-gray-200 p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-lg font-bold text-brand-900">
                    {f.q}
                    <span className="text-2xl text-brand-600 group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="mt-3 text-gray-700">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-brand-600 py-14 text-center text-white sm:py-20">
          <div className={`${wrap} max-w-2xl`}>
            <h2 className="text-3xl font-extrabold sm:text-4xl">Don&apos;t wait until your phone spoils.</h2>
            <p className="mt-3 text-xl text-brand-100">Back up your contacts today.</p>
            <a href={GET_APP_HREF} className={`${btn} mt-8 w-full max-w-sm bg-white text-brand-700 hover:bg-brand-50`}>Get the app</a>
          </div>
        </section>
      </main>

      <footer className="py-8">
        <div className={`${wrap} flex flex-col items-center gap-3 text-base text-gray-700 sm:flex-row sm:justify-between`}>
          <p>© {new Date().getFullYear()} {APP}</p>
          <nav className="flex gap-6">
            <a href="/privacy" className="underline">Privacy</a>
            <a href="/contact" className="underline">Contact</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
