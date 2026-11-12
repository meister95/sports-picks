import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return <><SiteHeader currentPath=""/><main className="auth-page page-wrap"><section className="auth-card"><span className="auth-kicker">NEU BEI PREDIQ</span><h1>Konto erstellen</h1><p>Registriere dich mit deiner E-Mail-Adresse. Nach der Bestätigung wählst du deinen Anzeigenamen.</p><RegisterForm/><div className="auth-links"><Link className="auth-back" href="/login">Du hast schon ein Konto? Einloggen</Link></div></section></main><SiteFooter/></>;
}
