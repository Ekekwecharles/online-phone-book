"use client";
import { useState } from "react";
import { Alert, Field } from "@/components/ui";
import { api } from "@/lib/client";
import { btnDanger, btnPrimary } from "@/lib/ui";

export default function WasntMeForm({ token }: { token: string }) {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await api("POST", "/auth/wasnt-me", { token, newPassword });
    if (r.ok) setDone(true);
    else setError(r.error);
    setBusy(false);
  }

  if (done) {
    return (
      <div className="space-y-4">
        <Alert kind="ok">Done. Everyone was logged out, and your new password is saved.</Alert>
        <a href="/login" className={`${btnPrimary} w-full`}>Log in</a>
      </div>
    );
  }
  return (
    <form method="post" onSubmit={submit} className="space-y-4">
      <p>We will log out every phone and browser. Then pick a new password that only you know.</p>
      <Field id="newPassword" label="New password" type="password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" hint="At least 8 characters." required />
      {error && <Alert>{error}</Alert>}
      <button type="submit" disabled={busy || !token} className={`${btnDanger} w-full`}>{busy ? "Please wait…" : "Log everyone out and save"}</button>
    </form>
  );
}
