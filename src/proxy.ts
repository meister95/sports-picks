import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { REMEMBER_ME_COOKIE, sessionCookieOptions, shouldRememberSession } from "@/lib/supabase/session-cookies";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPublicAuthRoute = ["/login", "/registrieren", "/auth/confirm"].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const env = getSupabaseEnv();
  if (!env) {
    return isPublicAuthRoute
      ? NextResponse.next({ request })
      : NextResponse.redirect(new URL("/login", request.url));
  }

  let response = NextResponse.next({ request });
  const rememberMe = shouldRememberSession(request.cookies.get(REMEMBER_ME_COOKIE)?.value);
  const supabase = createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, cacheHeaders) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, sessionCookieOptions(options, rememberMe)));
        Object.entries(cacheHeaders).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims && !isPublicAuthRoute) {
    const redirectResponse = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
