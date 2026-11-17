import type { ReactNode } from "react";
import { APP_NAME } from "@phonebook/shared";
import { wrap } from "@/lib/ui";
import LogoutButton from "./LogoutButton";

const links = [
  { href: "/contacts", text: "Contacts" },
  { href: "/logins", text: "Recent logins" },
  { href: "/settings", text: "Settings" },
];

export default function AppShell({ current, children }: { current: string; children: ReactNode }) {
  return (
    <>
      <header className="border-b border-gray-200 bg-white">
        <div className={`${wrap} flex h-16 items-center justify-between`}>
          <a href="/contacts" className="text-2xl font-extrabold text-brand-600">{APP_NAME}</a>
          <LogoutButton />
        </div>
        <nav aria-label="Main" className={`${wrap} flex gap-2 pb-3`}>
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              aria-current={l.href === current ? "page" : undefined}
              className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-xl px-3 text-base font-bold ${l.href === current ? "bg-brand-600 text-white" : "text-brand-700 hover:bg-brand-50"}`}
            >
              {l.text}
            </a>
          ))}
        </nav>
      </header>
      <main className={`${wrap} max-w-2xl space-y-5 py-6`}>{children}</main>
    </>
  );
}

/** Simple page for sign up, log in, and similar. */
export function PlainPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <header className="border-b border-gray-100 bg-white">
        <div className={`${wrap} flex h-16 items-center`}>
          <a href="/" className="text-2xl font-extrabold text-brand-600">{APP_NAME}</a>
        </div>
      </header>
      <main className={`${wrap} max-w-md space-y-5 py-8`}>
        <h1 className="text-3xl font-extrabold text-brand-900">{title}</h1>
        {children}
      </main>
    </>
  );
}
