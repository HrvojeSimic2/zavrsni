import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { fetchNotifications } from "@/lib/notifications/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ notifications: [] }, { status: 401 });
  }

  try {
    const notifications = await fetchNotifications(supabase, user);
    return NextResponse.json(
      { notifications },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.warn("[notifications] failed to build notifications", error);
    return NextResponse.json(
      { error: "Failed to load notifications." },
      { status: 500 }
    );
  }
}
