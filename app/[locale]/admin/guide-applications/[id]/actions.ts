"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminUser } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const reviewSchema = z.object({
  locale: z.string().min(2),
  applicationId: z.string().uuid(),
  decision: z.enum(["accepted", "declined", "accepted_verified"]),
  note: z.string().trim().max(2000).optional(),
});

function parseLanguages(value: string) {
  return value
    .split(/[,\n]/g)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 10);
}

export async function reviewGuideApplicationAction(formData: FormData) {
  const raw = {
    locale: String(formData.get("locale") ?? ""),
    applicationId: String(formData.get("applicationId") ?? ""),
    decision: String(formData.get("decision") ?? ""),
    note: String(formData.get("note") ?? "").trim() || undefined,
  };

  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Invalid review action.");
  }

  const { locale, applicationId, decision, note } = parsed.data;
  const nextPath = `/${locale}/admin/guide-applications/${applicationId}`;
  const reviewer = await requireAdminUser(locale, nextPath);

  const admin = createAdminClient();

  const { data: application, error: loadError } = await admin
    .from("guide_applications")
    .select(
      "id, user_id, first_name, last_name, email, phone, location, languages"
    )
    .eq("id", applicationId)
    .single();

  if (loadError || !application) {
    console.warn(
      "[admin.guide-applications] failed to load application",
      loadError
    );
    throw new Error("Failed to load application.");
  }

  const email = String(application.email ?? "").trim().toLowerCase();

  const { error: updateError } = await admin
    .from("guide_applications")
    .update({
      status: decision,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewer.id,
      review_note: note ?? null,
    })
    .eq("id", applicationId);

  if (updateError) {
    console.warn(
      "[admin.guide-applications] failed to update application",
      updateError
    );
    throw new Error("Failed to update application.");
  }

  if (decision === "accepted" || decision === "accepted_verified") {
    const guideName = `${application.first_name} ${application.last_name}`.trim();
    const verified = decision === "accepted_verified";

    const { error: guideError } = await admin.from("guides").upsert(
      {
        email,
        user_id: application.user_id ?? null,
        name: guideName || email || "Guide",
        avatar: "/placeholder.svg",
        phone: application.phone,
        location: application.location,
        languages: parseLanguages(application.languages ?? ""),
        verified,
      },
      { onConflict: "email" }
    );

    if (guideError) {
      console.warn("[admin.guide-applications] failed to upsert guide", guideError);
      throw new Error("Application saved, but failed to create guide record.");
    }
  }

  revalidatePath(`/${locale}/admin/guide-applications`);
  revalidatePath(`/${locale}/admin/guide-applications/${applicationId}`);
  redirect(`/${locale}/admin/guide-applications/${applicationId}`);
}
