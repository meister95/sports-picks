"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";
import { PasswordInput } from "@/components/password-input";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return <form action={action} className="auth-form">
    <label>E-Mail<input name="email" type="email" autoComplete="email" required /></label>
    <label>Passwort<PasswordInput name="password" autoComplete="current-password" required /></label>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    <button className="auth-submit" disabled={pending}>{pending ? "Melde an …" : "Einloggen"}</button>
  </form>;
}
