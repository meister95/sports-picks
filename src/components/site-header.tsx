import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/login/actions";

const navItems = [
  { href: "/tipps", label: "Tipps" },
  { href: "/scheine", label: "Scheine" },
  { href: "/statistik", label: "Statistik" },
];

export async function SiteHeader({ currentPath }: { currentPath: string }) {
  const supabase = await createClient();
  const authResult = supabase ? await supabase.auth.getUser() : null;
  const user = authResult?.data.user ?? null;
  const { data: profile } = user && supabase ? await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle() : { data: null };
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/tipps" aria-label="PREDIQ Tipps">
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
            >
              {item.label}
            </Link>
          ))}
        </nav>}
        {user ? <div className="header-account"><span>{profile?.username ?? user.email}</span><form action={signOutAction}><button type="submit">Abmelden</button></form></div> : <Link className="header-login" href="/login">Einloggen</Link>}
      </div>
    </header>
  );
}
