"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { card, input, label } from "@/lib/ui";

function Eye({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M3 3l18 18" />}
    </svg>
  );
}

export function Field(props: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  required?: boolean;
  maxLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = props.type === "password";
  return (
    <div>
      <label htmlFor={props.id} className={label}>{props.label}</label>
      <div className="relative">
      <input
        id={props.id}
        name={props.id}
        type={isPassword && visible ? "text" : props.type ?? "text"}
        className={isPassword ? `${input} pr-14` : input}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        autoComplete={props.autoComplete ?? "off"}
        inputMode={props.inputMode}
        required={props.required}
        maxLength={props.maxLength}
        aria-describedby={props.hint ? props.id + "-hint" : undefined}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        suppressHydrationWarning
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-1 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-xl text-gray-700 hover:text-brand-700"
        >
          <Eye off={visible} />
        </button>
      )}
      </div>
      {props.hint && <p id={props.id + "-hint"} className="mt-1 text-base text-gray-700">{props.hint}</p>}
    </div>
  );
}

/** A box that asks "are you sure?". Replaces the browser's pop-up. Esc or Cancel closes it. */
export function ConfirmDialog(props: {
  title: string;
  children: ReactNode;
  confirmText: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const cancel = useRef(props.onCancel);
  cancel.current = props.onCancel;
  useEffect(() => {
    ref.current?.focus(); // the safe choice is highlighted first
    const esc = (e: KeyboardEvent) => e.key === "Escape" && cancel.current();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={props.onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-2xl font-extrabold text-brand-900">{props.title}</h2>
        <div className="text-gray-700">{props.children}</div>
        <div className="grid grid-cols-2 gap-3">
          <button ref={ref} type="button" onClick={props.onCancel} className="inline-flex min-h-14 items-center justify-center rounded-2xl border-2 border-brand-600 px-4 text-lg font-bold text-brand-700 hover:bg-brand-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={props.onConfirm}
            disabled={props.busy}
            className={`inline-flex min-h-14 items-center justify-center rounded-2xl px-4 text-lg font-bold text-white disabled:opacity-60 ${props.danger ? "bg-red-800 hover:bg-red-900" : "bg-brand-600 hover:bg-brand-700"}`}
          >
            {props.busy ? "Please wait…" : props.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Alert({ kind = "error", children }: { kind?: "error" | "ok" | "info"; children: ReactNode }) {
  const c = kind === "error" ? "border-red-700 bg-red-50 text-red-900" : kind === "ok" ? "border-brand-600 bg-brand-50 text-brand-900" : "border-amber-600 bg-amber-50 text-amber-900";
  return (
    <p role={kind === "error" ? "alert" : "status"} className={`rounded-2xl border-2 p-4 font-bold ${c}`}>
      {children}
    </p>
  );
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className={`${card} space-y-4`}>
      {title && <h2 className="text-2xl font-extrabold text-brand-900">{title}</h2>}
      {children}
    </section>
  );
}

/** The one-time recovery code, shown big. */
export function RecoveryCodeBox({ code }: { code: string }) {
  return (
    <div className="rounded-3xl border-4 border-brand-600 bg-brand-50 p-5 text-center">
      <p className="font-bold text-brand-900">Your recovery code</p>
      <p className="mt-2 text-2xl font-extrabold tracking-wider text-gray-900 select-all sm:text-3xl" aria-label={code.split("").join(" ")}>
        {code.split("-").map((g, i, a) => (
          <span key={i} className="inline-block">{g}{i < a.length - 1 ? "-" : ""}&#8203;</span>
        ))}
      </p>
    </div>
  );
}
