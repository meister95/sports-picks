"use client";

import { useState, type InputHTMLAttributes } from "react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return <span className="password-field">
    <input {...props} type={visible ? "text" : "password"} />
    <button
      className="password-toggle"
      type="button"
      aria-label={visible ? "Passwort verbergen" : "Passwort anzeigen"}
      aria-pressed={visible}
      title={visible ? "Passwort verbergen" : "Passwort anzeigen"}
      onClick={() => setVisible((current) => !current)}
    >
      {visible ? <svg viewBox="0 0 24 24" aria-hidden="true" fill="none"><path d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 5.2A10.8 10.8 0 0112 5c5.2 0 9.2 4.8 10 7-.3.8-1.1 2-2.3 3.1M6.2 6.3C3.7 7.8 2.4 10.4 2 12c.8 2.2 4.8 7 10 7 1.2 0 2.3-.2 3.3-.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
        : <svg viewBox="0 0 24 24" aria-hidden="true" fill="none"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/></svg>}
    </button>
  </span>;
}
