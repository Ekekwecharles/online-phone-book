import type { ReactNode } from "react";
import { card, input, label } from "@/lib/ui";

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
  return (
    <div>
      <label htmlFor={props.id} className={label}>{props.label}</label>
      <input
        id={props.id}
        name={props.id}
        type={props.type ?? "text"}
        className={input}
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
