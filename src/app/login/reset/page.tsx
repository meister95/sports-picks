import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ResetForm } from "./reset-form";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const linkExpired = params.error === "expired" || params.error === "otp_expired";
  return <><SiteHeader currentPath=""/><main className="auth-page page-wrap"><section className="auth-card"><span className="auth-kicker">KONTO-ZUGANG</span><h1>Passwort zurücksetzen</h1><p>Gib deine E-Mail-Adresse ein. Wir senden dir einen neuen Link, mit dem du dein Passwort ändern kannst.</p><ResetForm linkExpired={linkExpired}/><Link className="auth-back" href="/login">Zurück zum Login</Link></section></main><SiteFooter/></>;
}
