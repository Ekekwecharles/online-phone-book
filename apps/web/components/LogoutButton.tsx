"use client";
import { useState } from "react";
import { api } from "@/lib/client";

export default function LogoutButton() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await api("POST", "/auth/logout");
        window.location.replace("/login");
      }}
      className="inline-flex min-h-11 items-center rounded-xl border-2 border-brand-600 px-5 font-bold text-brand-700 hover:bg-brand-50"
    >
      {busy ? "Please wait…" : "Log out"}
    </button>
  );
}
