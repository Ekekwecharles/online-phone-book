"use client";
import { useState } from "react";
import { Alert, Field } from "@/components/ui";
import { api } from "@/lib/client";
import { btnPrimary } from "@/lib/ui";

export default function LoginForm({ expired }: { expired: boolean }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await api("POST", "/auth/login", { identifier, password, client: "web" });
    if (r.ok) {
      window.location.replace("/contacts");
      return;
    }
    setError(r.error);
    setBusy(false);
  }

  return (
    <form method="post" onSubmit={submit} className="space-y-4">
      {expired && <Alert kind="info">You were logged out to keep your contacts safe. Please log in again.</Alert>}
      <Field id="identifier" label="Username or phone number" value={identifier} onChange={setIdentifier} autoComplete="username" required />
      <Field id="password" label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" required />
      {error && <Alert>{error}</Alert>}
      {busy && <p className="text-base text-gray-700">Please wait. This can take a few seconds.</p>}
      <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>{busy ? "Please wait…" : "Log in"}</button>
      <p className="text-center">
        <a href="/recover" className="font-bold text-brand-700 underline">I forgot my password</a>
      </p>
      <p className="text-center">
        New here? <a href="/signup" className="font-bold text-brand-700 underline">Make an account</a>
      </p>
    </form>
  );
}
