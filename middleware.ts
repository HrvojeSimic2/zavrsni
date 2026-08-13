import { routing } from "./i18n/routing";
import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { refreshSupabaseSession } from "./lib/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
  const res = intlMiddleware(req);
  return refreshSupabaseSession(req, res);
}

export const config = {
  matcher: ["/", "/(hr|en)/:path*", "/profile"],
};
