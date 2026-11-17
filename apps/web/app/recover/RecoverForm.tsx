"use client";
import { useState } from "react";
import { Alert, Field, RecoveryCodeBox } from "@/components/ui";
import { api } from "@/lib/client";
import { btnLight, btnPrimary } from "@/lib/ui";

export default function RecoverForm() {
  const [how, setHow] = useState<"code" | "email">("code");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [wrote, setWrote] = useState(false);

  async function sendEmail() {
    setBusy(true);
    setError("");
    const r = await api<{ message: string }>("POST", "/auth/recover/email-request", { identifier });
    if (r.ok) {
      setSent(true);
      setInfo(r.data.message);
    } else setError(r.error);
    setBusy(false);
  }

  async function reset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await api<{ recoveryCode: string }>("POST", how === "code" ? "/auth/recover/code" : "/auth/recover/email-confirm", { identifier, code, newPassword });
    if (r.ok) setNewCode(r.data.recoveryCode);
    else setError(r.error);
    setBusy(false);
  }

  if (newCode) {
    return (
      <div className="space-y-4">
        <Alert kind="ok">Your new password is saved. Everyone else was logged out.</Alert>
        <p>Your old recovery code is finished. Here is your new one. We show it only one time.</p>
        <RecoveryCodeBox code={newCode} />
        <p className="font-bold">Write it on paper now.</p>
        <label className="flex min-h-14 items-center gap-3 text-lg font-bold">
          <input type="checkbox" className="h-7 w-7" checked={wrote} onChange={(e) => setWrote(e.target.checked)} />
          I wrote it down
        </label>
        <button type="button" disabled={!wrote} onClick={() => window.location.replace("/login")} className={`${btnPrimary} w-full`}>Go to log in</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="How do you want to get back in?">
        <button type="button" aria-pressed={how === "code"} onClick={() => setHow("code")} className={how === "code" ? btnPrimary : btnLight}>Recovery code</button>
        <button type="button" aria-pressed={how === "email"} onClick={() => setHow("email")} className={how === "email" ? btnPrimary : btnLight}>My email</button>
      </div>

      <Field id="identifier" label="Username or phone number" value={identifier} onChange={setIdentifier} autoComplete="username" required />

      {how === "email" && !sent ? (
        <>
          <p>We will send a 6 number code to the email on your account.</p>
          {error && <Alert>{error}</Alert>}
          <button type="button" disabled={busy || !identifier} onClick={sendEmail} className={`${btnPrimary} w-full`}>{busy ? "Please wait…" : "Send me a code"}</button>
        </>
      ) : (
        <form method="post" onSubmit={reset} className="space-y-4">
          {info && <Alert kind="info">{info}</Alert>}
          <Field
            id="code"
            label={how === "code" ? "Recovery code" : "Code from your email"}
            value={code}
            onChange={setCode}
            inputMode={how === "code" ? "text" : "numeric"}
            hint={how === "code" ? "The code you wrote down when you made your account." : undefined}
            required
          />
          <Field id="newPassword" label="New password" type="password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" hint="At least 8 characters." required />
          {error && <Alert>{error}</Alert>}
          <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>{busy ? "Please wait…" : "Save new password"}</button>
        </form>
      )}
      <p className="text-center">
        <a href="/login" className="font-bold text-brand-700 underline">Back to log in</a>
      </p>
    </div>
  );
}
