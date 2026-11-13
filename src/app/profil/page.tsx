import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { requireUser } from "@/lib/supabase/require-user";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const [params, current] = await Promise.all([searchParams, requireUser()]);
  const isInvite = params.invite === "1";
  const { profile } = current;
  const avatarResult = profile?.avatar_path && current.supabase
    ? await current.supabase.storage.from("prediq-avatars").createSignedUrl(profile.avatar_path, 86400)
    : null;
  const avatarUrl = avatarResult?.data?.signedUrl ?? null;
  return <><SiteHeader currentPath=""/><main className="auth-page page-wrap"><section className="auth-card"><span className="auth-kicker">DEIN PROFIL</span><h1>{isInvite ? "Einladung abschließen" : profile ? "Profil bearbeiten" : "Wie sollen wir dich nennen?"}</h1>{isInvite && <p>Lege dein Passwort und deinen Namen für PREDIQ fest.</p>}<ProfileForm defaultValue={profile?.username ?? ""} avatarPath={profile?.avatar_path ?? ""} avatarUrl={avatarUrl} requirePassword={isInvite}/></section></main><SiteFooter/></>;
}
