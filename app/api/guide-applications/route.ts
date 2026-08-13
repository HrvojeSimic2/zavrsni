import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAdminEmail } from "@/lib/email/send-admin-email";
import {
  guideApplicationCreateSchema,
  type GuideApplicationCreateInput,
} from "@/lib/validation/guide-application";

function formatApplicationEmail(
  input: GuideApplicationCreateInput,
  applicationId: string
) {
  const name = `${input.firstName} ${input.lastName}`.trim();
  const subject = `New guide application: ${name}`;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") ??
    "http://localhost:3000";
  const locale = input.locale ?? "en";
  const reviewUrl = `${siteUrl}/${locale}/admin/guide-applications/${applicationId}`;

  const lines = [
    `Name: ${name}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone}`,
    `Location: ${input.location}`,
    `Languages: ${input.languages}`,
    "",
    `Review: ${reviewUrl}`,
    "",
    "Experience:",
    input.experience,
    "",
    "Tour ideas:",
    input.tourIdeas,
    "",
    input.locale ? `Locale: ${input.locale}` : null,
  ].filter((value): value is string => Boolean(value));

  const text = lines.join("\n");
  const html = `<pre style="font: 14px/1.4 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; white-space: pre-wrap;">${escapeHtml(
    text
  )}</pre>`;

  return { subject, text, html };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = guideApplicationCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const normalizedEmail = input.email.trim().toLowerCase();

  const insertPayload = {
    user_id: user?.id ?? null,
    first_name: input.firstName,
    last_name: input.lastName,
    email: normalizedEmail,
    phone: input.phone,
    location: input.location,
    languages: input.languages,
    experience: input.experience,
    tour_ideas: input.tourIdeas,
    agreed_to_terms: input.agreedToTerms,
    locale: input.locale ?? null,
    status: "pending",
  };

  const primaryInsert = await supabase
    .from("guide_applications")
    .insert(insertPayload)
    .select("id, created_at")
    .single();

  const rlsBlocked =
    primaryInsert.error?.code === "42501" ||
    primaryInsert.error?.message?.toLowerCase().includes("row-level security");

  let fallbackInsert: typeof primaryInsert | null = null;
  if (primaryInsert.error && rlsBlocked) {
    try {
      fallbackInsert = await createAdminClient()
        .from("guide_applications")
        .insert(insertPayload)
        .select("id, created_at")
        .single();
    } catch (adminError) {
      console.warn(
        "[guide-applications] admin insert unavailable (check SUPABASE_SERVICE_ROLE_KEY)",
        adminError
      );
    }
  }

  const application = fallbackInsert?.data ?? primaryInsert.data;
  const error = fallbackInsert?.error ?? primaryInsert.error;

  if (error || !application) {
    console.warn("[guide-applications] failed to store application", error);
    return NextResponse.json(
      { error: "Failed to submit application." },
      { status: 500 }
    );
  }

  const email = formatApplicationEmail(input, application.id);
  const mailResult = await sendAdminEmail(email);
  if (!mailResult.ok) {
    console.warn("[guide-applications] failed to email admin", mailResult.error);
  }

  return NextResponse.json({
    ok: true,
    id: application.id,
    createdAt: application.created_at,
    mailedAdmin: mailResult.ok && !mailResult.skipped,
    mailSkippedReason:
      mailResult.ok && mailResult.skipped ? mailResult.reason : undefined,
  });
}
