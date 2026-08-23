import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { getTranslations } from "next-intl/server";

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

function statusVariant(status: ApplicationRow["status"]) {
  switch (status) {
    case "declined":
      return "destructive" as const;
    case "pending":
      return "secondary" as const;
    default:
      return "default" as const;
  }
}

export default async function GuideApplicationsAdminPage({ params }: PageProps) {
  const { locale } = await Promise.resolve(params);
  const t = await getTranslations("Admin");
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
          <h1 className="text-3xl font-semibold">{t("listTitle")}</h1>
          <p className="text-muted-foreground">{t("listSubtitle")}</p>
        </div>
        <Badge variant="secondary">
          {t("total", { n: applications.length })}
        </Badge>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {t("loadFailed")}
        </div>
      ) : null}

      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const variant = statusVariant(app.status);
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
                          {t("languages", { languages: app.languages })}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={variant}>
                          {t(`status.${app.status}`)}
                        </Badge>
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

