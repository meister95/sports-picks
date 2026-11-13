"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";
import { browserSessionCookieMethods } from "./session-cookies";

export function createClient() {
  const env = getSupabaseEnv();
  return env ? createBrowserClient(env.url, env.publishableKey, { cookies: browserSessionCookieMethods() }) : null;
}
