import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

// Light and simple on purpose: system fonts, no images, big tap targets, high contrast.
export const c = {
  brand: "#0f766e",
  brandDark: "#134e4a",
  brandLight: "#f0fdfa",
  text: "#111827",
  muted: "#374151",
  border: "#6b7280",
  line: "#e5e7eb",
  error: "#991b1b",
  errorBg: "#fef2f2",
  info: "#78350f",
  infoBg: "#fffbeb",
};

export function Button({ title, onPress, kind = "primary", disabled, busy }: { title: string; onPress: () => void; kind?: "primary" | "light" | "danger"; disabled?: boolean; busy?: boolean }) {
  const bg = kind === "primary" ? c.brand : "#fff";
  const fg = kind === "primary" ? "#fff" : kind === "danger" ? c.error : c.brand;
  const border = kind === "danger" ? c.error : c.brand;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [s.btn, { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }]}
    >
      {busy ? <ActivityIndicator color={fg} /> : <Text style={[s.btnText, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

export function Field({ label, hint, ...p }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput {...p} accessibilityLabel={label} style={s.input} placeholderTextColor="#6b7280" autoCapitalize="none" autoCorrect={false} />
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Note({ kind = "info", children }: { kind?: "info" | "error" | "ok"; children: ReactNode }) {
  const col = kind === "error" ? { bg: c.errorBg, fg: c.error } : kind === "ok" ? { bg: c.brandLight, fg: c.brandDark } : { bg: c.infoBg, fg: c.info };
  return (
    <View style={[s.note, { backgroundColor: col.bg, borderColor: col.fg }]} accessibilityRole={kind === "error" ? "alert" : undefined}>
      <Text style={{ color: col.fg, fontSize: 16, fontWeight: "700" }}>{children}</Text>
    </View>
  );
}

export function Screen({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <ScrollView contentContainerStyle={s.screen} keyboardShouldPersistTaps="handled">
      {title ? <Text style={s.h1} accessibilityRole="header">{title}</Text> : null}
      {children}
    </ScrollView>
  );
}

export const Link = ({ title, onPress }: { title: string; onPress: () => void }) => (
  <Pressable onPress={onPress} accessibilityRole="link" style={{ minHeight: 48, justifyContent: "center" }}>
    <Text style={{ color: c.brand, fontSize: 17, fontWeight: "700", textDecorationLine: "underline" }}>{title}</Text>
  </Pressable>
);

export const Card = ({ title, children }: { title?: string; children: ReactNode }) => (
  <View style={s.card}>
    {title ? <Text style={s.h2}>{title}</Text> : null}
    {children}
  </View>
);

export const P = ({ children, bold }: { children: ReactNode; bold?: boolean }) => (
  <Text style={{ fontSize: 17, color: c.text, lineHeight: 24, fontWeight: bold ? "700" : "400" }}>{children}</Text>
);

/** The one-time recovery code, shown big. */
export function CodeBox({ code }: { code: string }) {
  return (
    <View style={s.codeBox}>
      <Text style={{ color: c.brandDark, fontWeight: "700", fontSize: 16 }}>Your recovery code</Text>
      <Text selectable style={s.code}>{code}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { padding: 20, gap: 16, paddingBottom: 48 },
  h1: { fontSize: 30, fontWeight: "800", color: c.brandDark },
  h2: { fontSize: 22, fontWeight: "800", color: c.brandDark },
  btn: { minHeight: 52, borderRadius: 14, borderWidth: 2, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  btnText: { fontSize: 18, fontWeight: "800" },
  label: { fontSize: 17, fontWeight: "700", color: c.text },
  hint: { fontSize: 15, color: c.muted },
  input: { minHeight: 52, borderRadius: 14, borderWidth: 2, borderColor: c.border, paddingHorizontal: 14, fontSize: 18, color: c.text, backgroundColor: "#fff" },
  note: { borderWidth: 2, borderRadius: 14, padding: 14 },
  card: { borderWidth: 1, borderColor: c.line, borderRadius: 20, padding: 16, gap: 14, backgroundColor: "#fff" },
  codeBox: { borderWidth: 4, borderColor: c.brand, backgroundColor: c.brandLight, borderRadius: 20, padding: 16, alignItems: "center", gap: 8 },
  code: { fontSize: 22, fontWeight: "800", color: c.text, letterSpacing: 1, textAlign: "center" },
});
