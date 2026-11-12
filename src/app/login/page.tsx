import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  const configured = isSupabaseConfigured();
  return <><SiteHeader currentPath=""/><main className="auth-page page-wrap">
    <section className="auth-card"><span className="auth-kicker">PREDIQ</span><h1>Willkommen zurück</h1>
      <p>Melde dich an, um Tipps und Statistiken anzusehen und mit anderen zu diskutieren.</p>
      {configured ? <LoginForm/> : <div className="setup-notice"><strong>Login noch nicht verbunden</strong><span>Die Supabase-Zugangsdaten fehlen. Folge der Anleitung in README.md, um den Login zu aktivieren.</span></div>}
      <div className="auth-links">
        {configured && <Link className="auth-back" href="/login/reset">Passwort festlegen oder vergessen?</Link>}
        <Link className="auth-back" href="/registrieren">Noch kein Konto? Registrieren</Link>
      </div>
    </section>
  </main><SiteFooter/></>;
}
