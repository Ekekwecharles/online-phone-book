import { useState } from "react";
import { View } from "react-native";
import { api } from "../api";
import { getDeviceId } from "../storage";
import { Button, CodeBox, Field, Link, Note, P, Screen } from "../ui";

export type Route = "login" | "signup" | "recover";

/** Log in with a username or a phone number. */
export function LoginScreen({ go, onDone }: { go: (r: Route) => void; onDone: (token: string, username: string) => void }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    setErr("");
    const r = await api<{ token: string }>("POST", "/auth/login", { identifier: id, password: pw, client: "mobile", deviceId: await getDeviceId() }, { auth: false });
    setBusy(false);
    if (!r.ok) return setErr(r.error);
    onDone(r.data.token, id.trim().toLowerCase());
  }
  return (
    <Screen title="Log in">
      <Field label="Username or phone number" value={id} onChangeText={setId} autoComplete="username" textContentType="username" />
      <Field label="Password" value={pw} onChangeText={setPw} secureTextEntry autoComplete="password" textContentType="password" />
      {err ? <Note kind="error">{err}</Note> : null}
      <Button title="Log in" onPress={submit} busy={busy} disabled={!id || !pw} />
      <Link title="I forgot my password" onPress={() => go("recover")} />
      <Link title="Make a new account" onPress={() => go("signup")} />
    </Screen>
  );
}

/** Make an account. Then show the recovery code one time. */
export function SignupScreen({ go, onDone }: { go: (r: Route) => void; onDone: (token: string, username: string) => void }) {
  const [username, setU] = useState("");
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ token: string; code: string } | null>(null);
  const [wrote, setWrote] = useState(false);

  async function submit() {
    setBusy(true);
    setErr("");
    const body: Record<string, string> = { username, password: pw, client: "mobile", deviceId: await getDeviceId() };
    if (phone) body.phone = phone;
    if (email) body.email = email;
    const r = await api<{ token: string; recoveryCode: string }>("POST", "/auth/signup", body, { auth: false });
    setBusy(false);
    if (!r.ok) return setErr(r.error);
    setDone({ token: r.data.token, code: r.data.recoveryCode });
  }

  if (done) {
    return (
      <Screen title="Write this code down">
        <P>If you forget your password, this code lets you get back in. We show it only one time.</P>
        <CodeBox code={done.code} />
        <Note>Write it on paper. Keep the paper safe. Do not take a photo of it on this phone.</Note>
        <Button kind="light" title={wrote ? "Yes, I wrote it down ✓" : "I wrote it down"} onPress={() => setWrote(true)} />
        <Button title="Continue" disabled={!wrote} onPress={() => onDone(done.token, username.trim().toLowerCase())} />
      </Screen>
    );
  }
  return (
    <Screen title="Make an account">
      <Field label="Username" value={username} onChangeText={setU} hint="Letters, numbers and _ only." />
      <Field label="Phone number (you can skip this)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" hint="You can also log in with it." />
      <Field label="Password" value={pw} onChangeText={setPw} secureTextEntry textContentType="newPassword" hint="At least 8 characters." />
      <Field label="Email (you can skip this)" value={email} onChangeText={setEmail} keyboardType="email-address" hint="So we can tell you if someone opens your account." />
      {err ? <Note kind="error">{err}</Note> : null}
      <Button title="Make my account" onPress={submit} busy={busy} disabled={!username || !pw} />
      <Link title="I already have an account" onPress={() => go("login")} />
    </Screen>
  );
}

/** Forgot password: use the recovery code from the paper. */
export function RecoverScreen({ go }: { go: (r: Route) => void }) {
  const [id, setId] = useState("");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [wrote, setWrote] = useState(false);

  async function submit() {
    setBusy(true);
    setErr("");
    const r = await api<{ recoveryCode: string }>("POST", "/auth/recover/code", { identifier: id, code, newPassword: pw }, { auth: false });
    setBusy(false);
    if (!r.ok) return setErr(r.error);
    setNewCode(r.data.recoveryCode);
  }

  if (newCode) {
    return (
      <Screen title="Your password is changed">
        <P>You were logged out everywhere. Your old code is used up. Write down this new code:</P>
        <CodeBox code={newCode} />
        <Button kind="light" title={wrote ? "Yes, I wrote it down ✓" : "I wrote it down"} onPress={() => setWrote(true)} />
        <Button title="Go to log in" disabled={!wrote} onPress={() => go("login")} />
      </Screen>
    );
  }
  return (
    <Screen title="Forgot password">
      <P>Type the recovery code you wrote down when you made your account.</P>
      <Field label="Username or phone number" value={id} onChangeText={setId} />
      <Field label="Recovery code" value={code} onChangeText={setCode} autoCapitalize="characters" hint="It looks like XXXX-XXXX-XXXX-XXXX-XXXX" />
      <Field label="New password" value={pw} onChangeText={setPw} secureTextEntry textContentType="newPassword" hint="At least 8 characters." />
      {err ? <Note kind="error">{err}</Note> : null}
      <Button title="Change my password" onPress={submit} busy={busy} disabled={!id || !code || !pw} />
      <View />
      <Link title="Back to log in" onPress={() => go("login")} />
    </Screen>
  );
}
