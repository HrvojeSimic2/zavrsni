import { PageShell } from "@/components/layout/page-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/routing";
import { GuideDashboardNav } from "@/components/guide/guide-dashboard-nav";
import { GuidePageHeader } from "@/components/guide/guide-page-header";
import { ClaimGuideProfileCard } from "@/components/guide/claim-guide-profile-card";
import { requireGuide } from "@/lib/guide/require-guide";
import { SPECIALTIES, toSpecialties } from "@/lib/types/specialty";
import { getInitials } from "@/lib/guide/get-initials";
import { updateGuideProfileAction } from "./actions";
import { getTranslations } from "next-intl/server";
import { resolveFlash } from "@/lib/i18n/flash";

type PageProps = {
  params: { locale: string } | Promise<{ locale: string }>;
  searchParams?:
    | { status?: string; error?: string }
    | Promise<{ status?: string; error?: string } | undefined>;
};

type GuideProfileRow = {
  id: string;
  name: string;
  avatar: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  languages: string[] | null;
  years_experience: number | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  verified: boolean | null;
  hourly_rate: number | null;
  specialties: string[] | null;
  max_group_size: number | null;
  default_meeting_point: string | null;
};

export default async function GuideProfileSettingsPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await Promise.resolve(params);
  const resolvedSearch = (await Promise.resolve(searchParams)) ?? {};
  const t = await getTranslations("GuideDashboard");
  const tPage = await getTranslations("GuideDashboard.profile");

  const { supabase, guide, needsClaim } = await requireGuide(
    locale,
    "/guide/profile"
  );

  const { data, error } = await supabase
    .from("guides")
    .select(
      "id, name, avatar, headline, bio, location, languages, years_experience, website, phone, email, verified, hourly_rate, specialties, max_group_size, default_meeting_point"
    )
    .eq("id", guide.id)
    .maybeSingle();

  if (error) {
    console.warn("[guide.profile] failed to load guide profile", error);
  }

  const profile = (data ?? null) as GuideProfileRow | null;

  const name = profile?.name ?? guide.name;
  const languages = (profile?.languages ?? guide.languages ?? []).join(", ");
  const selectedSpecialties = toSpecialties(profile?.specialties);
  const saved = resolvedSearch.status === "saved";
  const errorMessage = resolveFlash(t, "errors", resolvedSearch.error);

  return (
    <PageShell variant="contained" contentClassName="max-w-5xl space-y-8">
      <GuidePageHeader
        title={tPage("title")}
        description={tPage("description")}
        badge={
          <Badge variant={guide.verified ? "default" : "secondary"}>
            {guide.verified ? t("verified") : t("notVerified")}
          </Badge>
        }
        actions={
          <Button asChild variant="outline">
            <Link href={`/guides/${guide.id}`}>{tPage("viewPublic")}</Link>
          </Button>
        }
      />

      <GuideDashboardNav active="profile" />

      {needsClaim ? (
        <ClaimGuideProfileCard
          locale={locale}
          guideId={guide.id}
          descriptionKey="descriptionProfile"
        />
      ) : null}

      {saved ? (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          {t("status.saved")}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {tPage("loadFieldsError", {
            migration: "20260812120000_add_guide_profile_fields.sql",
          })}
        </div>
      ) : null}

      <form action={updateGuideProfileAction} className="space-y-6">
        <input type="hidden" name="locale" value={locale} />

        <Card>
          <CardHeader>
            <CardTitle>{tPage("photoAndNameTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar ?? undefined} alt={name} />
                <AvatarFallback>{getInitials(name)}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Label htmlFor="photo">{tPage("photoLabel")}</Label>
                <Input
                  id="photo"
                  name="photo"
                  type="file"
                  accept="image/*"
                  disabled={needsClaim}
                />
                <p className="text-xs text-muted-foreground">
                  {tPage("photoHelp")}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{tPage("nameLabel")}</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={name}
                  required
                  maxLength={80}
                  disabled={needsClaim}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="headline">{tPage("headlineLabel")}</Label>
                <Input
                  id="headline"
                  name="headline"
                  defaultValue={profile?.headline ?? ""}
                  maxLength={120}
                  placeholder={tPage("headlinePlaceholder")}
                  disabled={needsClaim}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tPage("aboutTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">{tPage("bioLabel")}</Label>
              <Textarea
                id="bio"
                name="bio"
                rows={6}
                maxLength={2000}
                defaultValue={profile?.bio ?? ""}
                placeholder={tPage("bioPlaceholder")}
                disabled={needsClaim}
              />
              <p className="text-xs text-muted-foreground">
                {tPage("bioHelp")}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">{tPage("locationLabel")}</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={profile?.location ?? ""}
                  maxLength={120}
                  placeholder={tPage("locationPlaceholder")}
                  disabled={needsClaim}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsExperience">{tPage("yearsLabel")}</Label>
                <Input
                  id="yearsExperience"
                  name="yearsExperience"
                  type="number"
                  min={0}
                  max={80}
                  defaultValue={profile?.years_experience ?? ""}
                  disabled={needsClaim}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="languages">{tPage("languagesLabel")}</Label>
                <Input
                  id="languages"
                  name="languages"
                  defaultValue={languages}
                  maxLength={200}
                  placeholder={tPage("languagesPlaceholder")}
                  disabled={needsClaim}
                />
                <p className="text-xs text-muted-foreground">
                  {tPage("languagesHelp")}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">{tPage("websiteLabel")}</Label>
                <Input
                  id="website"
                  name="website"
                  defaultValue={profile?.website ?? ""}
                  maxLength={200}
                  placeholder={tPage("websitePlaceholder")}
                  disabled={needsClaim}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/*
          * What used to be spread across tour rows — price, group size, the
          * kind of thing they do — now belongs to the guide, in one place.
          */}
        <Card>
          <CardHeader>
            <CardTitle>{tPage("workTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">{tPage("rateLabel")}</Label>
                <Input
                  id="hourlyRate"
                  name="hourlyRate"
                  type="number"
                  min={0}
                  max={10000}
                  step="0.5"
                  inputMode="decimal"
                  defaultValue={profile?.hourly_rate ?? ""}
                  placeholder={tPage("ratePlaceholder")}
                  disabled={needsClaim}
                />
                <p className="text-xs text-muted-foreground">
                  {tPage("rateHelp")}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxGroupSize">{tPage("groupSizeLabel")}</Label>
                <Input
                  id="maxGroupSize"
                  name="maxGroupSize"
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={profile?.max_group_size ?? 6}
                  disabled={needsClaim}
                />
                <p className="text-xs text-muted-foreground">
                  {tPage("groupSizeHelp")}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultMeetingPoint">
                {tPage("meetingPointLabel")}
              </Label>
              <Input
                id="defaultMeetingPoint"
                name="defaultMeetingPoint"
                defaultValue={profile?.default_meeting_point ?? ""}
                maxLength={200}
                placeholder={tPage("meetingPointPlaceholder")}
                disabled={needsClaim}
              />
              <p className="text-xs text-muted-foreground">
                {tPage("meetingPointHelp")}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{tPage("specialtiesLabel")}</Label>
              <div className="flex flex-wrap gap-3">
                {SPECIALTIES.map((specialty) => (
                  <label
                    key={specialty}
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="specialties"
                      value={specialty}
                      defaultChecked={selectedSpecialties.includes(specialty)}
                      disabled={needsClaim}
                      className="size-4 accent-primary"
                    />
                    {t.has(`interests.${specialty}`)
                      ? t(`interests.${specialty}`)
                      : specialty}
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {tPage("specialtiesHelp")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tPage("contactTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">{tPage("phoneLabel")}</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={profile?.phone ?? ""}
                  maxLength={40}
                  disabled={needsClaim}
                />
              </div>
              <div className="space-y-2">
                <Label>{tPage("emailLabel")}</Label>
                <Input
                  value={profile?.email ?? t("empty")}
                  readOnly
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  {tPage("emailHelp")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={needsClaim}>
            {tPage("save")}
          </Button>
          <Button asChild variant="outline">
            <Link href="/guide">{tPage("backToOverview")}</Link>
          </Button>
        </div>
      </form>
    </PageShell>
  );
}
