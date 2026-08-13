import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { reviewGuideApplicationAction } from "./actions";

type PageProps = {
  params:
    | { locale: string; id: string }
    | Promise<{ locale: string; id: string }>;
};

type ApplicationRow = {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  location: string;
  languages: string;
  experience: string;
  tour_ideas: string;
  locale: string | null;
  status: "pending" | "accepted" | "declined" | "accepted_verified";
  reviewed_at: string | null;
  review_note: string | null;
};

function statusBadge(status: ApplicationRow["status"]) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "accepted":
      return <Badge>Accepted</Badge>;
    case "accepted_verified":
      return <Badge>Accepted (Verified)</Badge>;
    case "declined":
      return <Badge variant="destructive">Declined</Badge>;
  }
}

export default async function GuideApplicationDetailPage({ params }: PageProps) {
  const { locale, id } = await Promise.resolve(params);
  const nextPath = `/${locale}/admin/guide-applications/${id}`;
  await requireAdminUser(locale, nextPath);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("guide_applications")
    .select(
      "id, created_at, updated_at, first_name, last_name, email, phone, location, languages, experience, tour_ideas, locale, status, reviewed_at, review_note"
    )
    .eq("id", id)
    .maybeSingle();

  const app = (data as ApplicationRow | null) ?? null;

  if (error || !app) {
    return (
      <PageShell variant="contained" contentClassName="max-w-4xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Application not found</h1>
          <p className="text-muted-foreground">
            The application may have been removed or you may not have access.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/guide-applications">Back to list</Link>
        </Button>
      </PageShell>
    );
  }

  const createdAt = new Date(app.created_at).toLocaleString(locale);
  const reviewedAt = app.reviewed_at
    ? new Date(app.reviewed_at).toLocaleString(locale)
    : null;

  return (
    <PageShell variant="contained" contentClassName="max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">
            <Link href="/admin/guide-applications" className="hover:underline">
              Guide Applications
            </Link>{" "}
            / {app.first_name} {app.last_name}
          </div>
          <h1 className="text-3xl font-semibold">
            {app.first_name} {app.last_name}
          </h1>
          <div className="text-sm text-muted-foreground">{createdAt}</div>
        </div>
        <div className="flex items-center gap-2">{statusBadge(app.status)}</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applicant details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Email:</span> {app.email}
          </div>
          <div>
            <span className="text-muted-foreground">Phone:</span> {app.phone}
          </div>
          <div>
            <span className="text-muted-foreground">Location:</span>{" "}
            {app.location}
          </div>
          <div>
            <span className="text-muted-foreground">Languages:</span>{" "}
            {app.languages}
          </div>
          {app.locale ? (
            <div>
              <span className="text-muted-foreground">Locale:</span> {app.locale}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Experience</CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">
            {app.experience}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tour ideas</CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">
            {app.tour_ideas}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Decision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reviewedAt ? (
            <div className="text-sm text-muted-foreground">
              Last reviewed: {reviewedAt}
            </div>
          ) : null}

          <form action={reviewGuideApplicationAction} className="space-y-3">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="applicationId" value={app.id} />

            <div className="space-y-2">
              <div className="text-sm font-medium">Internal note (optional)</div>
              <Textarea
                name="note"
                defaultValue={app.review_note ?? ""}
                placeholder="Add context for the team (not visible to the applicant)"
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" name="decision" value="accepted">
                Accept
              </Button>
              <Button
                type="submit"
                name="decision"
                value="accepted_verified"
                variant="secondary"
              >
                Accept as verified account
              </Button>
              <Button
                type="submit"
                name="decision"
                value="declined"
                variant="destructive"
              >
                Decline
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
}

