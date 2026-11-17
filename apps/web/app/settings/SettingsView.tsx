"use client";
import { useState } from "react";
import { Alert, Card, Field, RecoveryCodeBox } from "@/components/ui";
import { api, goToLogin } from "@/lib/client";
import { btnDanger, btnLight, btnPrimary } from "@/lib/ui";

type Msg = { kind: "ok" | "error"; text: string } | null;
const Show = ({ m }: { m: Msg }) => (m ? <Alert kind={m.kind}>{m.text}</Alert> : null);

function Recovery({ initialEmail, hasRecoveryPhone }: { initialEmail: string; hasRecoveryPhone: boolean }) {
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const body: Record<string, string> = { email };
    if (phone) body.recoveryPhone = phone;
    const r = await api("PATCH", "/me", body);
    setMsg(r.ok ? { kind: "ok", text: "Saved." } : { kind: "error", text: r.error });
    if (r.ok) setPhone("");
    setBusy(false);
  }
  return (
    <Card title="Email and recovery">
      <form method="post" onSubmit={save} className="space-y-4">
        <Field id="email" label="Email" type="email" inputMode="email" value={email} onChange={setEmail} autoComplete="email" hint="So we can tell you if someone opens your account. We also use it if you forget your password. To remove it, clear the box and save." />
        <Field
          id="rphone"
          label="Second phone number"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={setPhone}
          hint={hasRecoveryPhone ? "A number is saved. Type a new one to change it." : "Use the number of someone you trust, like a parent or a friend."}
        />
        <Alert kind="info">Do not use the phone that can get lost. Use someone else&apos;s number. We only keep it for later. We do not send messages to it yet.</Alert>
        <Show m={msg} />
        <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>{busy ? "Please wait…" : "Save"}</button>
      </form>
    </Card>
  );
}

function Password() {
  const [current, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await api("POST", "/me/password", { current, newPassword });
    setMsg(r.ok ? { kind: "ok", text: "Your new password is saved. Other phones and browsers were logged out." } : { kind: "error", text: r.error });
    if (r.ok) {
      setCurrent("");
      setNew("");
    }
    setBusy(false);
  }
  return (
    <Card title="Change password">
      <form method="post" onSubmit={save} className="space-y-4">
        <Field id="current" label="Old password" type="password" value={current} onChange={setCurrent} autoComplete="current-password" required />
        <Field id="new" label="New password" type="password" value={newPassword} onChange={setNew} autoComplete="new-password" hint="At least 8 characters." required />
        <Show m={msg} />
        <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>{busy ? "Please wait…" : "Change password"}</button>
      </form>
    </Card>
  );
}

function NewCode() {
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<Msg>(null);
  async function make(e: React.FormEvent) {
    e.preventDefault();
    const r = await api<{ recoveryCode: string }>("POST", "/me/recovery-code", { password: pw });
    if (r.ok) {
      setCode(r.data.recoveryCode);
      setMsg(null);
    } else setMsg({ kind: "error", text: r.error });
    setPw("");
  }
  return (
    <Card title="New recovery code">
      <p>Lost your recovery code? Make a new one. The old one will stop working.</p>
      {code ? (
        <>
          <RecoveryCodeBox code={code} />
          <p className="font-bold">Write it on paper now. We show it only one time.</p>
          <button type="button" className={`${btnLight} w-full`} onClick={() => setCode("")}>I wrote it down</button>
        </>
      ) : (
        <form method="post" onSubmit={make} className="space-y-4">
          <Field id="pw1" label="Your password" type="password" value={pw} onChange={setPw} autoComplete="current-password" required />
          <Show m={msg} />
          <button type="submit" className={`${btnLight} w-full`}>Make a new code</button>
        </form>
      )}
    </Card>
  );
}

function LogoutAll() {
  const [busy, setBusy] = useState(false);
  return (
    <Card title="Log out everywhere">
      <p>This logs you out on every phone and browser, including this one.</p>
      <button
        type="button"
        disabled={busy}
        className={`${btnLight} w-full`}
        onClick={async () => {
          setBusy(true);
          await api("POST", "/auth/logout-all");
          goToLogin(false);
        }}
      >
        {busy ? "Please wait…" : "Log out everywhere"}
      </button>
    </Card>
  );
}

function Delete() {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<Msg>(null);
  async function del(e: React.FormEvent) {
    e.preventDefault();
    const r = await api("DELETE", "/me", { password: pw });
    if (r.ok) window.location.replace("/");
    else setMsg({ kind: "error", text: r.error });
  }
  return (
    <Card title="Delete my account">
      <p>This deletes your account and all your saved contacts. It cannot be undone.</p>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className={`${btnLight} w-full border-red-700 text-red-800`}>I want to delete my account</button>
      ) : (
        <form method="post" onSubmit={del} className="space-y-4">
          <Field id="delpw" label="Type your password to confirm" type="password" value={pw} onChange={setPw} autoComplete="current-password" required />
          <Show m={msg} />
          <button type="submit" className={`${btnDanger} w-full`}>Delete everything</button>
          <button type="button" onClick={() => setOpen(false)} className={`${btnLight} w-full`}>No, keep my account</button>
        </form>
      )}
    </Card>
  );
}

export default function SettingsView({ username, email, hasRecoveryPhone }: { username: string; email: string; hasRecoveryPhone: boolean }) {
  return (
    <div className="space-y-5">
      <p>Logged in as <b>{username}</b>.</p>
      <Recovery initialEmail={email} hasRecoveryPhone={hasRecoveryPhone} />
      <Password />
      <NewCode />
      <LogoutAll />
      <Delete />
    </div>
  );
}
