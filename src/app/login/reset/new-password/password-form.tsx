"use client";

import { useActionState } from "react";
import { PasswordInput } from "@/components/password-input";
import { updatePasswordAction, type NewPasswordState } from "./actions";

export function NewPasswordForm() {
  const [state, action, pending] = useActionState<NewPasswordState, FormData>(updatePasswordAction, {});
  return <form action={action} className="auth-form">
    <label>Neues Passwort<PasswordInput name="password" minLength={8} autoComplete="new-password" required /></label>
    <label>Neues Passwort wiederholen<PasswordInput name="confirmPassword" minLength={8} autoComplete="new-password" required /></label>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    <button className="auth-submit" disabled={pending}>{pending ? "Speichere …" : "Passwort speichern"}</button>
  </form>;
}
