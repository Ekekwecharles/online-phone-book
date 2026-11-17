"use client";
import { useState } from "react";
import { Alert, Field, RecoveryCodeBox } from "@/components/ui";
import { api } from "@/lib/client";
import { btnPrimary } from "@/lib/ui";

export default function SignupForm() {
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [wrote, setWrote] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await api<{ recoveryCode: string }>("POST", "/auth/signup", { username, phone, password, email, client: "web" });
    if (r.ok) setCode(r.data.recoveryCode);
    else setError(r.error);
    setBusy(false);
  }

  if (code) {
    return (
      <div className="space-y-4">
        <Alert kind="ok">Your account is ready.</Alert>
        <p>This code can save your account if you forget your password. We show it only one time.</p>
        <RecoveryCodeBox code={code} />
        <p className="font-bold">Write it on paper now. Keep the paper safe.</p>
        <label className="flex min-h-14 items-center gap-3 text-lg font-bold">
          <input type="checkbox" className="h-7 w-7" checked={wrote} onChange={(e) => setWrote(e.target.checked)} />
          I wrote it down
        </label>
        <button type="button" disabled={!wrote} onClick={() => window.location.replace("/contacts")} className={`${btnPrimary} w-full`}>
          Continue
        </button>
      </div>
    );
  }

  return (
    <form method="post" onSubmit={submit} className="space-y-4">
      <Field id="username" label="Username" value={username} onChange={setUsername} autoComplete="username" hint="Letters, numbers and _. At least 3." required />
      <Field id="phone" label="Phone number (if you want)" type="tel" inputMode="tel" value={phone} onChange={setPhone} autoComplete="tel" hint="You can log in with it. For example 0803 123 4567." />
      <Field id="password" label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" hint="At least 8 characters." required />
      <Field id="email" label="Email (if you want)" type="email" inputMode="email" value={email} onChange={setEmail} autoComplete="email" hint="So we can tell you if someone opens your account. You can add it later." />
      {error && <Alert>{error}</Alert>}
      <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>{busy ? "Please wait…" : "Make my account"}</button>
      <p className="text-center">
        Already have one? <a href="/login" className="font-bold text-brand-700 underline">Log in</a>
      </p>
    </form>
  );
}
