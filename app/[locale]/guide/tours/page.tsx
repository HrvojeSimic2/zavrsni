import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GuideDashboardNav } from "@/components/guide/guide-dashboard-nav";
import { ClaimGuideProfileCard } from "@/components/guide/claim-guide-profile-card";
import { formatMoney } from "@/lib/format/money";
import { GuidePageHeader } from "@/components/guide/guide-page-header";
import { NewTourDialog } from "@/components/guide/new-tour-dialog";
import { Link } from "@/i18n/routing";
import { getGuideForUser } from "@/lib/guide/get-guide-for-user";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ImageIcon } from "lucide-react";
import { AuthFlashMessage } from "@/lib/i18n/auth-flash";
import { getTranslations } from "next-intl/server";

type PageProps = {
  params: { locale: string } | Promise<{ locale: string }>;
  searchParams?:
    | { created?: string; new?: string }
    | Promise<{ created?: string; new?: string }>;
};

type TourRow = {
  id: string;
  title: string;
  category: string;
  location: string;
  country: string;
  price: number | null;
  image: string | null;
};

function formatCategory(value: string, fallback: string) {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return `${trimmed.slice(0, 1).toUpperCase()}${trimmed.slice(1)}`;
}

export default async function GuideToursPage({ params, searchParams }: PageProps) {
  const { locale } = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const t = await getTranslations("GuideDashboard");
  const tPage = await getTranslations("GuideDashboard.tours");

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const next = `/${locale}/guide/tours`;
    const query = new URLSearchParams();
    query.set("next", next);
    query.set("message", AuthFlashMessage.SignInForGuideDashboard);
    redirect(`/${locale}/auth/sign-in?${query.toString()}`);
  }

  const { guide, needsClaim } = await getGuideForUser(supabase, user);

  if (!guide) {
    const query = new URLSearchParams();
    query.set("message", AuthFlashMessage.ApplyToBecomeGuide);
    redirect(`/${locale}/become-guide?${query.toString()}`);
  }

  const { data: tours, error: toursError } = await supabase
    .from("tours")
    .select("id, title, category, location, country, price, image")
    .eq("guide_id", guide.id)
    .order("title", { ascending: true });

  if (toursError) {
    console.warn("[guide.tours] failed to load tours", toursError);
  }

  const tourRows = (tours as TourRow[] | null) ?? [];
  const createdId = String(resolvedSearchParams?.created ?? "").trim() || null;
  const shouldOpenNewDialog =
    String(resolvedSearchParams?.new ?? "").trim() === "1";

  return (
    <PageShell variant="contained" contentClassName="max-w-6xl space-y-8">
      <GuidePageHeader
        title={tPage("title")}
        description={tPage("description")}
        badge={
          <Badge variant={guide.verified ? "default" : "secondary"}>
            {guide.verified ? t("verified") : t("notVerified")}
          </Badge>
        }
        actions={
          <>
            <NewTourDialog
              locale={locale}
              disabled={needsClaim}
              defaultOpen={shouldOpenNewDialog}
            />
            <Button asChild variant="outline">
              <Link href="/browse">{tPage("viewMarketplace")}</Link>
            </Button>
          </>
        }
      />

      <GuideDashboardNav active="tours" />

      {createdId ? (
        <Card className="bg-muted/10">
          <CardHeader className="border-b">
            <CardTitle>{tPage("createdTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {tPage("createdBody")}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm">
                <Link href={`/tour/${createdId}`}>{tPage("viewTour")}</Link>
              </Button>
              <NewTourDialog
                locale={locale}
                disabled={needsClaim}
                triggerLabel={tPage("createAnother")}
                triggerVariant="outline"
                triggerSize="sm"
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {needsClaim ? (
        <ClaimGuideProfileCard
          locale={locale}
          guideId={guide.id}
          descriptionKey="descriptionTours"
        />
      ) : null}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>{tPage("yourToursTitle")}</CardTitle>
          <CardAction>
            <Badge variant="secondary">
              {tPage("total", { n: tourRows.length })}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {tourRows.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed bg-muted/10 p-4">
              <p className="text-sm text-muted-foreground">{tPage("empty")}</p>
              <NewTourDialog
                locale={locale}
                disabled={needsClaim}
                triggerLabel={tPage("createFirst")}
              />
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              {tourRows.map((tour) => (
                <div
                  key={tour.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between [&:not(:last-child)]:border-b"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {tour.image ? (
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg border">
                        <Image
                          src={tour.image}
                          alt=""
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-muted/20">
                        <ImageIcon className="size-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium truncate">{tour.title}</div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <span className="capitalize">
                          {formatCategory(
                            tour.category,
                            tPage("fallbackCategory")
                          )}
                        </span>
                        <span className="text-muted-foreground/60">|</span>
                        <span className="truncate">
                          {tour.location}, {tour.country}
                        </span>
                        <span className="text-muted-foreground/60">|</span>
                        <span>{formatMoney(locale, tour.price ?? 0)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/tour/${tour.id}`}>{tPage("preview")}</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
