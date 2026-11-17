"use client";
import { useEffect } from "react";
import { SESSION_IDLE_MINUTES, SESSION_MAX_MINUTES } from "@phonebook/shared";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

/** Calls our API. Gives plain-English errors, also when the internet is slow or gone. */
export async function api<T = Record<string, unknown>>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { ok: false, status: 0, error: "No internet. Please try again when you are online." };
  }
  try {
    const res = await fetch("/api/v1" + path, {
      method,
      headers: body === undefined ? {} : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
      cache: "no-store",
      signal: AbortSignal.timeout(25000),
    });
    let data: any = {};
    try {
      data = await res.json();
    } catch {}
    if (res.ok) return { ok: true, data };
    return { ok: false, status: res.status, error: data.error ?? "Something went wrong. Please try again." };
  } catch {
    return { ok: false, status: 0, error: "The internet is slow or not working. Please try again." };
  }
}

/** If the server says we are logged out, go to the login page. */
export function goToLogin(expired = true) {
  window.location.replace("/login" + (expired ? "?expired=1" : ""));
}

/**
 * On a borrowed phone or computer: log out when nobody touches the page,
 * and never show an old page from the back button after logging out.
 */
export function useAutoLogout() {
  useEffect(() => {
    const start = Date.now();
    let last = Date.now();
    const touch = () => (last = Date.now());
    const events = ["pointerdown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const timer = setInterval(() => {
      const idle = Date.now() - last > SESSION_IDLE_MINUTES * 60_000;
      const old = Date.now() - start > SESSION_MAX_MINUTES * 60_000;
      if (idle || old) {
        clearInterval(timer);
        void api("POST", "/auth/logout").finally(() => goToLogin(true));
      }
    }, 20_000);
    const onShow = (e: PageTransitionEvent) => e.persisted && window.location.reload();
    window.addEventListener("pageshow", onShow);
    return () => {
      clearInterval(timer);
      events.forEach((e) => window.removeEventListener(e, touch));
      window.removeEventListener("pageshow", onShow);
    };
  }, []);
}
