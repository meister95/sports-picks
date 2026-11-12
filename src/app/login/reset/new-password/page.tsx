import { redirect } from "next/navigation";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { NewPasswordForm } from "./password-form";

export default async function NewPasswordPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login/reset?error=expired");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login/reset?error=expired");

  return <><SiteHeader currentPath=""/><main className="auth-page page-wrap"><section className="auth-card"><span className="auth-kicker">KONTO-ZUGANG</span><h1>Neues Passwort</h1><p>Lege ein neues Passwort fest und gib es zur Kontrolle zweimal ein.</p><NewPasswordForm/><Link className="auth-back" href="/login">Zurück zum Login</Link></section></main><SiteFooter/></>;
}
