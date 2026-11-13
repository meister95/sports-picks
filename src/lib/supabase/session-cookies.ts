import type { CookieOptions } from "@supabase/ssr";

export const REMEMBER_ME_COOKIE = "prediq-remember-me";
export const REMEMBER_ME_MAX_AGE = 400 * 24 * 60 * 60;

export function shouldRememberSession(value?: string) {
  // Keep existing sessions persistent unless a user explicitly opted out.
  return value !== "session";
}

export function sessionCookieOptions(options: CookieOptions, rememberMe: boolean): CookieOptions {
  if (rememberMe || options.maxAge === 0) return options;

  const sessionOnlyOptions = { ...options };
  delete sessionOnlyOptions.maxAge;
  delete sessionOnlyOptions.expires;
  return sessionOnlyOptions;
}

export function rememberMeCookieOptions(rememberMe: boolean): CookieOptions {
  return {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    ...(rememberMe ? { maxAge: REMEMBER_ME_MAX_AGE } : {}),
  };
}

export function browserSessionCookieMethods() {
  return {
    getAll() {
      return document.cookie.split(";").flatMap((cookie) => {
        const separator = cookie.indexOf("=");
        if (separator < 0) return [];
        return [{ name: cookie.slice(0, separator).trim(), value: cookie.slice(separator + 1).trim() }];
      });
    },
    setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
      const preference = document.cookie.split(";").map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${REMEMBER_ME_COOKIE}=`));
      const rememberMe = shouldRememberSession(preference?.slice(REMEMBER_ME_COOKIE.length + 1));

      cookiesToSet.forEach(({ name, value, options }) => {
        const cookieOptions = sessionCookieOptions(options, rememberMe);
        const parts = [`${name}=${encodeURIComponent(value)}`];
        if (cookieOptions.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(cookieOptions.maxAge)}`);
        if (cookieOptions.domain) parts.push(`Domain=${cookieOptions.domain}`);
        if (cookieOptions.path) parts.push(`Path=${cookieOptions.path}`);
        if (cookieOptions.expires) parts.push(`Expires=${cookieOptions.expires.toUTCString()}`);
        if (cookieOptions.sameSite) parts.push(`SameSite=${cookieOptions.sameSite}`);
        if (cookieOptions.secure) parts.push("Secure");
        document.cookie = parts.join("; ");
      });
    },
  };
}
