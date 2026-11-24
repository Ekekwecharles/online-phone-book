"use client";
import { useState, type ReactNode } from "react";
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
