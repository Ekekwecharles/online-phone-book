import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Linking, Text, TextInput, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { requestPermissionsAsync } from "expo-contacts";
import { formatPhone, matchesQuery } from "@phonebook/shared";
import { api } from "../api";
import { getStatus, onStatus, runSync, type SyncStatus } from "../sync";
import { Button, Card, Field, Note, P, Screen, c } from "../ui";

const when = (ms: number) => new Date(ms).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

function useStatus() {
  const [s, setS] = useState<SyncStatus>(getStatus());
  useEffect(() => onStatus(setS), []);
  return s;
}

/** One short line that says if your contacts are safe. */
function StatusLine({ s }: { s: SyncStatus }) {
  let text = "";
  let kind: "ok" | "info" | "error" = "ok";
  if (s.state === "saving") {
    text = "Saving…";
    kind = "info";
  } else if (s.state === "offline") {
    text = "No internet. We will save your contacts later.";
    kind = "info";
  } else if (s.state === "error") {
    text = s.message ?? "We could not save your contacts. We will try again.";
    kind = "error";
  } else if (s.state === "paused") {
    text = s.message ?? "";
    kind = "info";
  } else if (s.state === "saved") {
    text = "All saved";
  }
  if (!text && !s.lastSaved) return null;
  return (
    <View style={{ gap: 6 }}>
      {text ? <Note kind={kind}>{text}</Note> : null}
      {s.lastSaved ? <Text style={{ fontSize: 15, color: c.muted }}>Last saved: {when(s.lastSaved)}</Text> : null}
    </View>
  );
}

type Row = { id: string; name: string; phone: string };

export function ContactsScreen({ goSettings }: { goSettings: () => void }) {
  const status = useStatus();
  const [all, setAll] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState("");
  const [askEmail, setAskEmail] = useState(false);
  const [denied, setDenied] = useState(false);

  const load = useCallback(async () => {
    setErr("");
    const got: Row[] = [];
    let cursor: number | null = 0;
    while (cursor !== null) {
      const r: Awaited<ReturnType<typeof api<{ contacts: Row[]; next: number | null }>>> = await api("GET", `/contacts?cursor=${cursor}&limit=200`);
      if (!r.ok) {
        setErr(r.error);
        break;
      }
      got.push(...r.data.contacts);
      cursor = r.data.next;
      setAll([...got]);
      setLoading(false);
    }
    setLoading(false);
  }, []);

  // Load now, and again each time a save finishes.
  useEffect(() => {
    void load();
  }, [load, status.lastSaved]);
  useEffect(() => {
    void api<{ email: string | null }>("GET", "/me").then((r) => r.ok && setAskEmail(!r.data.email));
  }, []);

  const rows = useMemo(() => all.filter((x) => matchesQuery(x.name, x.phone, q)), [all, q]);

  async function allow() {
    const r = await requestPermissionsAsync();
    if (!r.granted) return setDenied(true);
    setDenied(false);
    void runSync();
  }
  async function copy(x: Row) {
    await Clipboard.setStringAsync(x.phone);
    setCopied(`Copied ${x.name}'s number.`);
    setTimeout(() => setCopied(""), 2500);
  }

  return (
    <FlatList
      data={rows}
      keyExtractor={(x) => x.id}
      keyboardShouldPersistTaps="handled"
      initialNumToRender={12}
      windowSize={7}
      contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 48 }}
      ListHeaderComponent={
        <View style={{ gap: 14 }}>
          {status.state === "no-permission" ? (
            <Card title="Save your contacts online">
              <P>We read your contacts so we can keep a safe copy online. You can get them from any phone.</P>
              {denied ? <Note kind="error">Contacts are blocked. Open your phone Settings, find this app, and allow Contacts.</Note> : null}
              <Button title={denied ? "Open phone settings" : "Allow contacts"} onPress={denied ? () => void Linking.openSettings() : allow} />
            </Card>
          ) : (
            <StatusLine s={status} />
          )}
          {status.state !== "no-permission" && status.state !== "saving" ? <Button kind="light" title="Save now" onPress={() => void runSync()} /> : null}
          {askEmail ? (
            <Card>
              <P>Add your email so we can tell you if someone opens your account.</P>
              <Button kind="light" title="Add my email" onPress={goSettings} />
            </Card>
          ) : null}
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search a name or number"
            placeholderTextColor="#6b7280"
            accessibilityLabel="Search by name or number"
            autoCapitalize="none"
            autoCorrect={false}
            style={{ minHeight: 52, borderRadius: 14, borderWidth: 2, borderColor: c.border, paddingHorizontal: 14, fontSize: 18, color: c.text, backgroundColor: "#fff" }}
          />
          {copied ? <Note kind="ok">{copied}</Note> : null}
          {err ? <Note kind="error">{err}</Note> : null}
          {loading && all.length === 0 ? <P>Loading your contacts…</P> : <Text style={{ fontSize: 15, color: c.muted }}>{rows.length} {rows.length === 1 ? "contact" : "contacts"}</Text>}
        </View>
      }
      ListEmptyComponent={loading ? undefined : <P>{all.length === 0 ? "No contacts online yet." : "No contact found."}</P>}
      renderItem={({ item }) => (
        <View style={{ borderWidth: 1, borderColor: c.line, borderRadius: 18, padding: 14, gap: 10, backgroundColor: "#fff" }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: c.text }}>{item.name}</Text>
          <Text style={{ fontSize: 20, color: c.muted }}>{formatPhone(item.phone)}</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}><Button kind="light" title="Copy" onPress={() => void copy(item)} /></View>
            <View style={{ flex: 1 }}><Button title="Call" onPress={() => void Linking.openURL(`tel:${item.phone}`)} /></View>
          </View>
        </View>
      )}
    />
  );
}

type Login = { id: string; at: string; kind: string; deviceType: string; place: string };

export function LoginsScreen({ onLogoutAll }: { onLogoutAll: () => void }) {
  const [rows, setRows] = useState<Login[] | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    void api<{ logins: Login[] }>("GET", "/logins").then((r) => (r.ok ? setRows(r.data.logins) : setErr(r.error)));
  }, []);
  const what = (k: string) => (k === "recovery" ? "Password reset" : k === "mobile" ? "Phone app" : "Website");
  return (
    <Screen title="Recent logins">
      <P>These are the latest times someone opened your account. Do you not know one of them?</P>
      <Button kind="danger" title="Log out everywhere" onPress={onLogoutAll} />
      {err ? <Note kind="error">{err}</Note> : null}
      {rows === null && !err ? <P>Loading…</P> : null}
      {rows?.map((l) => (
        <Card key={l.id}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: c.text }}>{when(new Date(l.at).getTime())}</Text>
          <Text style={{ fontSize: 16, color: c.muted }}>{what(l.kind)} · {l.deviceType} · {l.place}</Text>
        </Card>
      ))}
    </Screen>
  );
}

export function SettingsScreen({ username, onLogout, onLogoutAll, onDeleted }: { username: string; onLogout: () => void; onLogoutAll: () => void; onDeleted: () => void }) {
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState("");
  const [checked, setChecked] = useState(false);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(false);
  const [pw, setPw] = useState("");
  const [delErr, setDelErr] = useState("");

  useEffect(() => {
    void api<{ email: string | null; emailChecked: boolean }>("GET", "/me").then((r) => {
      if (r.ok) {
        setEmail(r.data.email ?? "");
        setSaved(r.data.email ?? "");
        setChecked(r.data.emailChecked);
      }
    });
  }, []);

  async function saveEmail() {
    setBusy(true);
    const r = await api<{ codeSent?: boolean }>("PATCH", "/me", { email });
    setBusy(false);
    if (!r.ok) return setMsg({ kind: "error", text: r.error });
    const e = email.trim().toLowerCase();
    if (e !== saved) {
      setSaved(e);
      setChecked(false);
      setCode("");
    }
    setMsg({ kind: "ok", text: e && r.data.codeSent ? "Saved. We sent a code to your email. Type it below." : "Saved." });
  }
  async function confirm() {
    setBusy(true);
    const r = await api("POST", "/me/email/confirm", { code });
    setBusy(false);
    if (r.ok) {
      setChecked(true);
      setMsg({ kind: "ok", text: "Your email is checked. Thank you." });
    } else setMsg({ kind: "error", text: r.error });
  }
  async function resend() {
    const r = await api("POST", "/me/email/send");
    setMsg(r.ok ? { kind: "ok", text: "We sent a new code." } : { kind: "error", text: r.error });
  }
  async function remove() {
    setDelErr("");
    const r = await api("DELETE", "/me", { password: pw });
    if (r.ok) onDeleted();
    else setDelErr(r.error);
  }

  return (
    <Screen title="Settings">
      <P>Logged in as <Text style={{ fontWeight: "800" }}>{username}</Text>.</P>
      <Card title="Email">
        {saved && !checked ? (
          <>
            <Note>Your email is not checked yet. Type the 6-number code we sent to {saved}.</Note>
            <Field label="Code from your email" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
            <Button title="Check my email" onPress={confirm} busy={busy} disabled={code.length !== 6} />
            <Button kind="light" title="Send the code again" onPress={resend} />
          </>
        ) : null}
        {saved && checked ? <Note kind="ok">Your email is checked.</Note> : null}
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" hint="So we can tell you if someone opens your account. To remove it, clear the box and save." />
        {msg ? <Note kind={msg.kind}>{msg.text}</Note> : null}
        <Button kind="light" title="Save email" onPress={saveEmail} busy={busy} />
      </Card>
      <Card title="Log out">
        <Button kind="light" title="Log out on this phone" onPress={onLogout} />
        <Button kind="light" title="Log out everywhere" onPress={onLogoutAll} />
      </Card>
      <Card title="Delete my account">
        <P>This deletes your account and all your saved contacts online. Contacts on this phone stay. It cannot be undone.</P>
        {!del ? (
          <Button kind="danger" title="I want to delete my account" onPress={() => setDel(true)} />
        ) : (
          <>
            <Field label="Type your password to confirm" value={pw} onChangeText={setPw} secureTextEntry />
            {delErr ? <Note kind="error">{delErr}</Note> : null}
            <Button kind="danger" title="Delete everything" onPress={remove} disabled={!pw} />
            <Button kind="light" title="No, keep my account" onPress={() => setDel(false)} />
          </>
        )}
      </Card>
    </Screen>
  );
}
