import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";
import { REMEMBER_ME_COOKIE, sessionCookieOptions, shouldRememberSession } from "./session-cookies";

async function createSupabaseClient(rememberMeOverride?: boolean) {
  const env = getSupabaseEnv();
  if (!env) return null;

  const cookieStore = await cookies();
  const rememberMe = rememberMeOverride ?? shouldRememberSession(cookieStore.get(REMEMBER_ME_COOKIE)?.value);
  return createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, sessionCookieOptions(options, rememberMe)));
        } catch {
          // Server Components cannot write cookies; src/proxy.ts refreshes them.
        }
      },
    },
  });
}

export const createClient = cache(createSupabaseClient);
