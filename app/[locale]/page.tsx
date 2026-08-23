import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Users,
  Shield,
  Heart,
  ArrowRight,
  Compass,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { HeroSection } from "@/components/homepage/hero-section";
import { getHomepageGuidesData } from "@/lib/actions/guide-actions";
import { GuideSpotlight } from "@/components/homepage/guide-spotlight";

const VALUE_PROPS: { icon: LucideIcon; titleKey: string; bodyKey: string }[] = [
  { icon: Compass, titleKey: "whyHiddenTitle", bodyKey: "whyHiddenBody" },
  { icon: Shield, titleKey: "whyVerifiedTitle", bodyKey: "whyVerifiedBody" },
  { icon: Users, titleKey: "whyPassionateTitle", bodyKey: "whyPassionateBody" },
  { icon: Heart, titleKey: "whyImpactTitle", bodyKey: "whyImpactBody" },
];

const GUIDE_BENEFITS: {
  icon: LucideIcon;
  titleKey: string;
  bodyKey: string;
}[] = [
  {
    icon: CalendarCheck,
    titleKey: "guideFeature1Title",
    bodyKey: "guideFeature1Body",
  },
  { icon: MapPin, titleKey: "guideFeature2Title", bodyKey: "guideFeature2Body" },
  { icon: Shield, titleKey: "guideFeature3Title", bodyKey: "guideFeature3Body" },
  { icon: Heart, titleKey: "guideFeature4Title", bodyKey: "guideFeature4Body" },
];


export default async function HomePage() {
  const t = await getTranslations("Home");
  const spotlightGuides = await getHomepageGuidesData();

  const whySection = (
    <section className="border-b py-16 md:py-24">
      <div className="container">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-balance">
            {t("whyChooseUs")}
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed text-pretty">
            {t("whySubtitle")}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUE_PROPS.map(({ icon: Icon, titleKey, bodyKey }) => (
            <div
              key={titleKey}
              className="rounded-xl border bg-card p-6 hover:border-primary/50 transition-colors duration-200"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{t(titleKey)}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {t(bodyKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const guideCtaSection = (
    <section className="bg-brand-deep text-brand-deep-foreground">
      <div className="container py-16 md:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 lg:items-start">
          <div className="space-y-5">
            <p className="text-sm font-medium uppercase tracking-widest text-brand-deep-foreground/80">
              {t("guideBadge")}
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-balance leading-tight">
              {t("guideTitle")}
            </h2>
            <p className="max-w-xl text-base md:text-lg text-brand-deep-foreground/90 leading-relaxed text-pretty">
              {t("guideBody")}
            </p>
            <div className="pt-2">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/become-guide">
                  {t("guideCta")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
            {GUIDE_BENEFITS.map(({ icon: Icon, titleKey, bodyKey }) => (
              <div key={titleKey} className="border-t border-brand-deep-foreground/25 pt-5">
                <Icon
                  className="h-5 w-5 text-brand-deep-foreground/80"
                  aria-hidden="true"
                />
                <dt className="mt-3 font-semibold">{t(titleKey)}</dt>
                <dd className="mt-1 text-sm text-brand-deep-foreground/90 leading-relaxed">
                  {t(bodyKey)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );

  return (
    <PageShell variant="full">
      <HeroSection />
      <GuideSpotlight guides={spotlightGuides} />
      {whySection}
      {guideCtaSection}
    </PageShell>
  );
}
