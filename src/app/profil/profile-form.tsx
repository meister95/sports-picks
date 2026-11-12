"use client";

import { useActionState } from "react";
import { saveProfileAction, type ProfileState } from "./actions";
import { PasswordInput } from "@/components/password-input";

export function ProfileForm({ defaultValue = "", requirePassword = false }: { defaultValue?: string; requirePassword?: boolean }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfileAction, {});
  return <form action={action} className="auth-form">{requirePassword && <><input type="hidden" name="invited" value="1"/><label>Passwort festlegen<PasswordInput name="password" minLength={8} autoComplete="new-password" required /></label></>}<label>Öffentlicher Nutzername<input name="username" defaultValue={defaultValue} minLength={2} maxLength={24} autoComplete="nickname" required /></label>
    <span className="field-hint">Dieser Name wird neben deinen Kommentaren angezeigt.</span>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    <button className="auth-submit" disabled={pending}>{pending ? "Speichere …" : "Profil speichern"}</button>
  </form>;
}
