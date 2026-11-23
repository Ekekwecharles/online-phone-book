import Constants from "expo-constants";
import { getToken } from "./storage";

export const API_URL: string = (Constants.expoConfig?.extra?.apiUrl as string) ?? "https://online-phone-book-moaa.vercel.app";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string; offline?: boolean };

// Called when the server says our login is no longer good.
let onLoggedOut: () => void = () => {};
export const setLoggedOutHandler = (fn: () => void) => {
  onLoggedOut = fn;
};

export async function api<T = unknown>(method: string, path: string, body?: unknown, opts: { auth?: boolean; timeoutMs?: number } = {}): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { "content-type": "application/json", accept: "application/json" };
  if (opts.auth !== false) {
    const t = await getToken();
    if (t) headers.authorization = `Bearer ${t}`;
  }
  try {
    const res = await fetch(API_URL + "/api/v1" + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 30_000),
    });
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {}
    if (res.ok) return { ok: true, data: data as T };
    if (res.status === 401 && opts.auth !== false) onLoggedOut();
    const error = (data as { error?: string } | null)?.error ?? "Something went wrong. Please try again.";
    return { ok: false, status: res.status, error };
  } catch {
    return { ok: false, status: 0, offline: true, error: "No internet. Please check your network and try again." };
  }
}
