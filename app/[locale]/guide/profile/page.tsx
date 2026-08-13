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
import { getInitials } from "@/lib/guide/get-initials";
import { updateGuideProfileAction } from "./actions";

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
};

export default async function GuideProfileSettingsPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await Promise.resolve(params);
  const resolvedSearch = (await Promise.resolve(searchParams)) ?? {};

  const { supabase, guide, needsClaim } = await requireGuide(
    locale,
    "/guide/profile"
  );

  const { data, error } = await supabase
    .from("guides")
    .select(
      "id, name, avatar, headline, bio, location, languages, years_experience, website, phone, email, verified"
    )
    .eq("id", guide.id)
    .maybeSingle();

  if (error) {
    console.warn("[guide.profile] failed to load guide profile", error);
  }

  const profile = (data ?? null) as GuideProfileRow | null;

  const name = profile?.name ?? guide.name;
  const languages = (profile?.languages ?? guide.languages ?? []).join(", ");
  const saved = resolvedSearch.status === "saved";
  const errorMessage = resolvedSearch.error;

  return (
    <PageShell variant="contained" contentClassName="max-w-5xl space-y-8">
      <GuidePageHeader
        title="Profile"
        description="This is what travellers see when they find you on LocalPath."
        badge={
          <Badge variant={guide.verified ? "default" : "secondary"}>
            {guide.verified ? "Verified" : "Not verified"}
          </Badge>
        }
        actions={
          <Button asChild variant="outline">
            <Link href={`/guides/${guide.id}`}>View public profile</Link>
          </Button>
        }
      />

      <GuideDashboardNav active="profile" />

      {needsClaim ? (
        <ClaimGuideProfileCard
          locale={locale}
          guideId={guide.id}
          description="Claim your guide profile before you can edit it."
        />
      ) : null}

      {saved ? (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          Your profile has been updated.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Could not load the profile fields. If this is the first run, apply the
          latest Supabase migration (
          <code>20260812120000_add_guide_profile_fields.sql</code>).
        </div>
      ) : null}

      <form action={updateGuideProfileAction} className="space-y-6">
        <input type="hidden" name="locale" value={locale} />

        <Card>
          <CardHeader>
            <CardTitle>Photo and name</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar ?? undefined} alt={name} />
                <AvatarFallback>{getInitials(name)}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Label htmlFor="photo">Profile photo</Label>
                <Input
                  id="photo"
                  name="photo"
                  type="file"
                  accept="image/*"
                  disabled={needsClaim}
                />
                <p className="text-xs text-muted-foreground">
                  JPG or PNG, up to 5MB.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Display name</Label>
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
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  name="headline"
                  defaultValue={profile?.headline ?? ""}
                  maxLength={120}
                  placeholder="Food-obsessed local showing you the real Zagreb"
                  disabled={needsClaim}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About you</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                rows={6}
                maxLength={2000}
                defaultValue={profile?.bio ?? ""}
                placeholder="Tell travellers who you are, what you love showing people, and what a day with you feels like."
                disabled={needsClaim}
              />
              <p className="text-xs text-muted-foreground">
                Up to 2000 characters.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Based in</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={profile?.location ?? ""}
                  maxLength={120}
                  placeholder="Zagreb, Hrvatska"
                  disabled={needsClaim}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsExperience">Years of experience</Label>
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
                <Label htmlFor="languages">Languages</Label>
                <Input
                  id="languages"
                  name="languages"
                  defaultValue={languages}
                  maxLength={200}
                  placeholder="Hrvatski, English, Deutsch"
                  disabled={needsClaim}
                />
                <p className="text-xs text-muted-foreground">
                  Separate with commas.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  name="website"
                  defaultValue={profile?.website ?? ""}
                  maxLength={200}
                  placeholder="yoursite.com"
                  disabled={needsClaim}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={profile?.phone ?? ""}
                  maxLength={40}
                  disabled={needsClaim}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile?.email ?? "—"} readOnly disabled />
                <p className="text-xs text-muted-foreground">
                  Your account email is used for bookings and cannot be changed
                  here.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={needsClaim}>
            Save profile
          </Button>
          <Button asChild variant="outline">
            <Link href="/guide">Back to overview</Link>
          </Button>
        </div>
      </form>
    </PageShell>
  );
}
