import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { locale: string } | Promise<{ locale: string }> }
) {
  const { locale } = await Promise.resolve(params);
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? `/${locale}`;
  const nextPath = nextParam.startsWith("/") ? nextParam : `/${locale}`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const errorUrl = new URL(`/${locale}/auth/sign-in`, req.url);
      errorUrl.searchParams.set(
        "error",
        "Could not authenticate. Please try again."
      );
      return NextResponse.redirect(errorUrl);
    }
  }

  return NextResponse.redirect(new URL(nextPath, req.url));
}
