"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatPhone, isCallable, matchesQuery } from "@phonebook/shared";
import { Alert, Field } from "@/components/ui";
import { api, goToLogin, useAutoLogout, type ApiResult } from "@/lib/client";
import { btn, btnLight, btnPrimary, input } from "@/lib/ui";

type C = { id: string; name: string; phone: string };
const SHOW = 60; // rows drawn at once, to keep old phones fast

// Contacts live only in this page's memory. Nothing goes to localStorage, IndexedDB or any cache.
export default function ContactsView() {
  useAutoLogout();
  const [all, setAll] = useState<C[]>([]);
  const [loading, setLoading] = useState(true); // waiting for the first page
  const [more, setMore] = useState(false); // more pages still coming
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(SHOW);
  const [online, setOnline] = useState(true);
  const [edit, setEdit] = useState<{ id?: string; name: string; phone: string } | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const slowTimer = setTimeout(() => setSlow(true), 3000);
    let cursor: number | null = 0;
    const got: C[] = [];
    while (cursor !== null) {
      const r: ApiResult<{ contacts: C[]; next: number | null }> = await api("GET", `/contacts?cursor=${cursor}&limit=200`);
      if (!r.ok) {
        if (r.status === 401) return goToLogin(true);
        setError(r.error);
        break;
      }
      got.push(...r.data.contacts);
      cursor = r.data.next;
      setAll([...got]); // show the first page quickly
      setLoading(false);
      setMore(cursor !== null);
    }
    clearTimeout(slowTimer);
    setSlow(false);
    setLoading(false);
    setMore(false);
  }, []);

  useEffect(() => {
    void load();
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    setOnline(navigator.onLine);
    // When you come back to this tab, load the newest contacts (for example, ones just saved on the phone).
    let last = Date.now();
    const back = () => {
      if (document.visibilityState === "visible" && Date.now() - last > 15000) {
        last = Date.now();
        void load();
      }
    };
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    document.addEventListener("visibilitychange", back);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      document.removeEventListener("visibilitychange", back);
    };
  }, [load]);

  const rows = useMemo(() => all.filter((c) => matchesQuery(c.name, c.phone, q)), [all, q]);

  async function copy(c: C) {
    try {
      await navigator.clipboard.writeText(c.phone);
    } catch {
      const t = document.createElement("textarea");
      t.value = c.phone;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setNote(`Copied ${c.name}'s number.`);
    setTimeout(() => setNote(""), 2500);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setError("");
    const r = await api("POST", "/contacts", edit.id ? edit : { name: edit.name, phone: edit.phone });
    if (!r.ok) {
      if (r.status === 401) return goToLogin(true);
      return setError(r.error);
    }
    setEdit(null);
    await load();
  }

  async function remove(c: C) {
    if (!window.confirm(`Delete ${c.name}?`)) return;
    const r = await api("DELETE", "/contacts/" + c.id);
    if (!r.ok) return r.status === 401 ? goToLogin(true) : setError(r.error);
    setAll((a) => a.filter((x) => x.id !== c.id));
  }

  if (edit) {
    return (
      <form method="post" onSubmit={save} className="space-y-4 rounded-3xl border border-gray-200 p-5">
        <h2 className="text-2xl font-extrabold text-brand-900">{edit.id ? "Change contact" : "Add a contact"}</h2>
        <Field id="name" label="Name" value={edit.name} onChange={(v) => setEdit({ ...edit, name: v })} required maxLength={100} />
        <Field id="phone" label="Phone number or code" value={edit.phone} onChange={(v) => setEdit({ ...edit, phone: v })} required />
        {error && <Alert>{error}</Alert>}
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => { setEdit(null); setError(""); }} className={btnLight}>Cancel</button>
          <button type="submit" className={btnPrimary}>Save</button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      {!online && <Alert kind="info">No internet. You can see what is already on this page, but changes will not save.</Alert>}
      <div className="flex gap-3">
        <input
          type="search"
          aria-label="Search by name or number"
          placeholder="Search a name or number"
          className={input}
          value={q}
          onChange={(e) => { setQ(e.target.value); setShown(SHOW); }}
          autoComplete="off"
          suppressHydrationWarning
        />
      </div>
      <button type="button" onClick={() => setEdit({ name: "", phone: "" })} className={`${btnPrimary} w-full`}>Add a contact</button>

      {note && <Alert kind="ok">{note}</Alert>}
      {error && <Alert>{error} <button type="button" className="underline" onClick={load}>Try again</button></Alert>}

      {loading && all.length === 0 ? (
        <p role="status" className="py-6 text-center">
          Loading your contacts…
          {slow && <span className="mt-2 block text-base text-gray-700">This is slower the first time. Please wait.</span>}
        </p>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-gray-700">{all.length === 0 ? "You have no contacts here yet. Save contacts in the phone app, or add one above." : "No contact found."}</p>
      ) : (
        <>
          <p className="text-base text-gray-700">{rows.length} {rows.length === 1 ? "contact" : "contacts"}{more ? " (still loading…)" : ""}</p>
          <ul className="divide-y divide-gray-200 rounded-3xl border border-gray-200">
            {rows.slice(0, shown).map((c) => (
              <li key={c.id} className="space-y-3 p-4">
                <div className="min-w-0">
                  <p className="break-words text-xl font-bold text-gray-900">{c.name}</p>
                  <p className="text-xl text-gray-800">{formatPhone(c.phone)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => copy(c)} className={`${btn} border-2 border-brand-600 text-brand-700 hover:bg-brand-50`}>Copy</button>
                  {isCallable(c.phone) && <a href={`tel:${c.phone}`} className={`${btn} bg-brand-600 text-white hover:bg-brand-700`}>Call</a>}
                </div>
                <div className="flex gap-5 text-base">
                  <button type="button" onClick={() => setEdit({ id: c.id, name: c.name, phone: c.phone })} className="min-h-11 font-bold text-brand-700 underline">Change</button>
                  <button type="button" onClick={() => remove(c)} className="min-h-11 font-bold text-red-800 underline">Delete</button>
                </div>
              </li>
            ))}
          </ul>
          {rows.length > shown && (
            <button type="button" onClick={() => setShown(shown + SHOW)} className={`${btnLight} w-full`}>Show more</button>
          )}
        </>
      )}
    </div>
  );
}
