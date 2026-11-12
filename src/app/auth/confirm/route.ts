import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const flow = request.nextUrl.searchParams.get("flow");
  const allowedTypes = ["signup", "invite", "recovery", "email"] as const;
  const supabase = await createClient();
  if (!supabase || (!code && (!tokenHash || !allowedTypes.includes(type as typeof allowedTypes[number])))) {
    return NextResponse.redirect(new URL("/login/reset?error=expired", request.url));
  }
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: type as typeof allowedTypes[number] });
  const isRecovery = flow === "recovery" || type === "recovery";
  const destination = isRecovery ? "/login/reset/new-password" : type === "invite" ? "/profil?invite=1" : "/profil";
  return NextResponse.redirect(new URL(error ? "/login/reset?error=expired" : destination, request.url));
}
