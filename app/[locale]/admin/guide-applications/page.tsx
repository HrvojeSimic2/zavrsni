import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/auth/require-admin";

type PageProps = {
  params: { locale: string } | Promise<{ locale: string }>;
};

type ApplicationRow = {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  location: string;
  languages: string;
  status: "pending" | "accepted" | "declined" | "accepted_verified";
};

function statusLabel(status: ApplicationRow["status"]) {
  switch (status) {
    case "pending":
      return { text: "Pending", variant: "secondary" as const };
    case "accepted":
      return { text: "Accepted", variant: "default" as const };
    case "accepted_verified":
      return { text: "Accepted (Verified)", variant: "default" as const };
    case "declined":
      return { text: "Declined", variant: "destructive" as const };
  }
}

export default async function GuideApplicationsAdminPage({ params }: PageProps) {
  const { locale } = await Promise.resolve(params);
  const nextPath = `/${locale}/admin/guide-applications`;
  await requireAdminUser(locale, nextPath);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("guide_applications")
    .select(
      "id, created_at, first_name, last_name, email, location, languages, status"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[admin.guide-applications] failed to load applications", error);
  }

  const applications = (data as ApplicationRow[] | null) ?? [];

  return (
    <PageShell variant="contained" contentClassName="max-w-4xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Guide Applications</h1>
          <p className="text-muted-foreground">
            Review new guide applications and decide whether to approve them.
          </p>
        </div>
        <Badge variant="secondary">{applications.length} total</Badge>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Failed to load applications.
        </div>
      ) : null}

      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No applications yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const status = statusLabel(app.status);
            const createdAt = new Date(app.created_at).toLocaleString(locale);
            return (
              <Link
                key={app.id}
                href={`/admin/guide-applications/${app.id}`}
                className="block"
              >
                <Card className="transition-colors hover:bg-muted/30">
                  <CardContent className="py-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <div className="font-semibold">
                          {app.first_name} {app.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {app.email} • {app.location}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Languages: {app.languages}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={status.variant}>{status.text}</Badge>
                        <div className="text-xs text-muted-foreground">
                          {createdAt}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

