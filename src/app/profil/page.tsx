import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const params = await searchParams;
  const isInvite = params.invite === "1";
  const supabase = await createClient();
  if (!supabase) redirect("/login");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
  if (profile && !isInvite) redirect("/tipps");
  return <><SiteHeader currentPath=""/><main className="auth-page page-wrap"><section className="auth-card"><span className="auth-kicker">DEIN PROFIL</span><h1>{isInvite ? "Einladung abschließen" : "Wie sollen wir dich nennen?"}</h1><p>{isInvite ? "Lege dein Passwort und deinen Namen für PREDIQ fest." : "Einmalig festlegen, damit Freunde dich in der Diskussion erkennen."}</p><ProfileForm defaultValue={profile?.username ?? ""} requirePassword={isInvite}/></section></main><SiteFooter/></>;
}
