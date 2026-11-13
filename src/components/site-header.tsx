import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { signOutAction } from "@/app/login/actions";
import { UserAvatar } from "@/components/user-avatar";

const navItems = [
  { href: "/tipps", label: "Tipps" },
  { href: "/scheine", label: "Scheine" },
  { href: "/statistik", label: "Statistik" },
];

export async function SiteHeader({ currentPath }: { currentPath: string }) {
  const { supabase, user, profile } = await getCurrentUser();
  const username = profile?.username ?? user?.email ?? "Profil";
  const avatarResult = profile?.avatar_path && supabase
    ? await supabase.storage.from("prediq-avatars").createSignedUrl(profile.avatar_path, 86400)
    : null;
  const avatarUrl = avatarResult?.data?.signedUrl ?? null;
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/tipps" prefetch aria-label="PREDIQ Tipps">
          <span className="brand-mark"><Image src="/brand/prediq-mark.png" alt="" aria-hidden="true" width={500} height={400} priority /></span>
          <span className="brand-name">PREDIQ</span>
        </Link>
        {user && <nav className="main-nav" aria-label="Hauptnavigation">
          {navItems.map((item) => (
            <Link
              aria-current={currentPath === item.href ? "page" : undefined}
              className={currentPath === item.href ? "nav-link active" : "nav-link"}
              href={item.href}
              key={item.href}
              prefetch
            >
              {item.label}
            </Link>
          ))}
        </nav>}
        {user ? <div className="header-account"><Link className="header-profile-link" href="/profil" aria-label="Profil bearbeiten"><UserAvatar src={avatarUrl} name={username} className="header-avatar"/><span>{username}</span></Link><form action={signOutAction}><button type="submit">Abmelden</button></form></div> : <Link className="header-login" href="/login">Einloggen</Link>}
      </div>
    </header>
  );
}
