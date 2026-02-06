import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function isDebugEnabled() {
  return process.env.SUPABASE_DEBUG === "1";
}

export async function GET(
  req: NextRequest,
  { params }: { params: { locale: string } | Promise<{ locale: string }> }
) {
  const { locale } = await Promise.resolve(params);
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const errorParam = url.searchParams.get("error");
  const errorCode = url.searchParams.get("error_code");
  const errorDescription = url.searchParams.get("error_description");

  if (isDebugEnabled()) {
    const cookieHeader = req.headers.get("cookie") ?? "";
    console.log("[auth.callback] query", {
      locale,
      hasCode: Boolean(code),
      error: errorParam,
      errorCode,
      errorDescription,
      next: url.searchParams.get("next"),
    });
    console.log("[auth.callback] cookieHeader", {
      length: cookieHeader.length,
      preview: cookieHeader.slice(0, 500),
    });
  }

  if (!code && (errorParam || errorDescription)) {
    const errorUrl = new URL(`/${locale}/auth/sign-in`, req.url);
    errorUrl.searchParams.set(
      "error",
      errorDescription ?? errorParam ?? "Could not authenticate. Please try again."
    );
    return NextResponse.redirect(errorUrl);
  }

  const nextParam = url.searchParams.get("next") ?? `/${locale}`;
  const nextPath = nextParam.startsWith("/") ? nextParam : `/${locale}`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const errorUrl = new URL(`/${locale}/auth/sign-in`, req.url);
      errorUrl.searchParams.set(
        "error",
        error.message || "Could not authenticate. Please try again."
      );
      return NextResponse.redirect(errorUrl);
    }
  }

  return NextResponse.redirect(new URL(nextPath, req.url));
}
