"use client";

import { useActionState } from "react";
import { requestPasswordReset, type ResetState } from "./actions";

export function ResetForm({ linkExpired = false }: { linkExpired?: boolean }) {
  const [state, action, pending] = useActionState<ResetState, FormData>(requestPasswordReset, {});
  if (state.sent) return <p className="reset-success" role="status">Falls für diese Adresse ein Konto besteht, wurde eine E-Mail zum Passwort festlegen gesendet.</p>;
  return <form action={action} className="auth-form">{linkExpired && <p className="form-error" role="alert">Der Link ist abgelaufen oder wurde bereits verwendet. Fordere hier einen neuen an.</p>}<label>E-Mail-Adresse<input name="email" type="email" autoComplete="email" required /></label>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    <button className="auth-submit" disabled={pending}>{pending ? "Sende …" : "E-Mail anfordern"}</button>
  </form>;
}
