import type { ReactNode } from "react";
import { APP_NAME } from "@phonebook/shared";
import { wrap } from "@/lib/ui";

export function InfoPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <header className="border-b border-gray-100 bg-white">
        <div className={`${wrap} flex h-16 items-center justify-between`}>
          <a href="/" className="text-2xl font-extrabold text-brand-600">{APP_NAME}</a>
          <a href="/login" className="inline-flex min-h-11 items-center rounded-xl border-2 border-brand-600 px-5 font-bold text-brand-700 hover:bg-brand-50">Log in</a>
        </div>
      </header>
      <main className={`${wrap} max-w-2xl space-y-4 py-8 [&_a]:font-bold [&_a]:text-brand-700 [&_a]:underline [&_h2]:pt-4 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-brand-900 [&_li]:ml-6 [&_li]:list-disc`}>
        <h1 className="text-4xl font-extrabold text-brand-900">{title}</h1>
        {children}
      </main>
    </>
  );
}
