import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { locale: string } | Promise<{ locale: string }> }
) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const { locale } = await Promise.resolve(params);

  return NextResponse.redirect(new URL(`/${locale}`, req.url), {
    status: 303,
  });
}
