"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const hash = new URLSearchParams(currentUrl.hash.replace(/^#/, ""));
    const errorCode = hash.get("error_code");
    if (errorCode) {
      window.history.replaceState(null, "", currentUrl.pathname + currentUrl.search);
      router.replace(`/login/reset?error=${encodeURIComponent(errorCode)}`);
      return;
    }
    const isAuthCallback = hash.has("access_token") || hash.has("code") || currentUrl.searchParams.has("code") || currentUrl.searchParams.has("token_hash");
    if (!isAuthCallback) return;
    const callbackType = hash.get("type") ?? currentUrl.searchParams.get("type");

    const supabase = createClient();
    if (!supabase) return;
    let active = true;

    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active || !session) return;
      const { data: profile } = await supabase.from("profiles").select("id").eq("id", session.user.id).maybeSingle();
      if (!active) return;
      window.history.replaceState(null, "", currentUrl.pathname);
      if (profile) router.replace("/tipps");
      else router.replace(callbackType === "invite" || callbackType === "recovery" ? "/profil?invite=1" : "/profil");
    });

    return () => { active = false; };
  }, [router]);

  return null;
}
