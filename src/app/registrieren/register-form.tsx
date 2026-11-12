"use client";

import { useActionState } from "react";
import { registerAction, type RegisterState } from "./actions";
import { PasswordInput } from "@/components/password-input";

export function RegisterForm() {
  const [state, action, pending] = useActionState<RegisterState, FormData>(registerAction, {});
  if (state.sent) return <p className="reset-success" role="status">Prüfe dein Postfach und bestätige deine E-Mail-Adresse. Danach kannst du deinen Anzeigenamen festlegen.</p>;
  return <form action={action} className="auth-form">
    <label>E-Mail<input name="email" type="email" autoComplete="email" required /></label>
    <label>Passwort<PasswordInput name="password" minLength={8} autoComplete="new-password" required /></label>
    <label>Passwort wiederholen<PasswordInput name="confirmPassword" minLength={8} autoComplete="new-password" required /></label>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    <button className="auth-submit" disabled={pending}>{pending ? "Konto wird erstellt …" : "Konto erstellen"}</button>
  </form>;
}
