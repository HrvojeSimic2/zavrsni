import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Users,
  Shield,
  Heart,
  ArrowRight,
  Compass,
  Star,
  Sparkles,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { HeroSection } from "@/components/homepage/hero-section";

export default async function HomePage() {
  const t = await getTranslations("Home");
  const whySection = (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute right-0 top-1/3 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />

      <div className="container">
        <div className="text-center mb-16 space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold text-balance">
            {t("whyChooseUs")}
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            {t("whySubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="space-y-8">
            <Card className="relative overflow-hidden border-2 hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 rounded-3xl group">
              <CardContent className="pt-10 pb-8 px-8 space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-linear-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300">
                  <Compass className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold text-2xl">{t("whyHiddenTitle")}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("whyHiddenBody")}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 hover:border-secondary/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 rounded-3xl group md:ml-8">
              <CardContent className="pt-10 pb-8 px-8 space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-linear-to-br from-secondary/10 to-secondary/5 group-hover:from-secondary/20 group-hover:to-secondary/10 transition-all duration-300">
                  <Shield className="h-8 w-8 text-secondary" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold text-2xl">
                    {t("whyVerifiedTitle")}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("whyVerifiedBody")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8 md:pt-12">
            <Card className="relative overflow-hidden border-2 hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 rounded-3xl group">
              <CardContent className="pt-10 pb-8 px-8 space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-linear-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold text-2xl">
                    {t("whyPassionateTitle")}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("whyPassionateBody")}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 hover:border-secondary/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 rounded-3xl group md:mr-8">
              <CardContent className="pt-10 pb-8 px-8 space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-linear-to-br from-secondary/10 to-primary/10 group-hover:from-secondary/20 group-hover:to-primary/20 transition-all duration-300">
                  <Heart className="h-8 w-8 text-secondary" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold text-2xl">{t("whyImpactTitle")}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("whyImpactBody")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );

  const guideCtaSection = (
    <section className="relative overflow-hidden bg-linear-to-br from-primary via-primary to-primary/90">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-48 top-0 h-96 w-96 rounded-full bg-primary-foreground/5 blur-3xl" />
        <div className="absolute -left-48 bottom-0 h-[600px] w-[600px] rounded-full bg-primary-foreground/5 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-primary-foreground/3 blur-2xl" />
      </div>

      <div className="container relative py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-8">
            <Badge className="bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 border-primary-foreground/20 rounded-full px-4 py-1.5 inline-flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              {t("guideBadge")}
            </Badge>

            <div className="space-y-6">
              <h2 className="text-4xl md:text-6xl font-bold text-primary-foreground text-balance leading-tight">
                {t("guideTitle")}
              </h2>
              <p className="text-xl text-primary-foreground/90 leading-relaxed text-pretty max-w-2xl mx-auto">
                {t("guideBody")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            <div className="flex flex-col items-center gap-4 bg-primary-foreground/5 p-6 rounded-3xl backdrop-blur-sm hover:bg-primary-foreground/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="shrink-0 w-16 h-16 rounded-2xl bg-primary-foreground/15 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-primary-foreground text-lg">
                  {t("guideFeature1Title")}
                </p>
                <p className="text-sm text-primary-foreground/80 mt-1">
                  {t("guideFeature1Body")}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 bg-primary-foreground/5 p-6 rounded-3xl backdrop-blur-sm hover:bg-primary-foreground/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="shrink-0 w-16 h-16 rounded-2xl bg-primary-foreground/15 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-primary-foreground text-lg">
                  {t("guideFeature2Title")}
                </p>
                <p className="text-sm text-primary-foreground/80 mt-1">
                  {t("guideFeature2Body")}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 bg-primary-foreground/5 p-6 rounded-3xl backdrop-blur-sm hover:bg-primary-foreground/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="shrink-0 w-16 h-16 rounded-2xl bg-primary-foreground/15 flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-primary-foreground text-lg">
                  {t("guideFeature3Title")}
                </p>
                <p className="text-sm text-primary-foreground/80 mt-1">
                  {t("guideFeature3Body")}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 bg-primary-foreground/5 p-6 rounded-3xl backdrop-blur-sm hover:bg-primary-foreground/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="shrink-0 w-16 h-16 rounded-2xl bg-primary-foreground/15 flex items-center justify-center">
                <Heart className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-primary-foreground text-lg">
                  {t("guideFeature4Title")}
                </p>
                <p className="text-sm text-primary-foreground/80 mt-1">
                  {t("guideFeature4Body")}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full text-base px-8"
              asChild
            >
              <Link href="/become-guide">
                {t("guideCta")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />{" "}
      {/*TODO: AFTER COMPLETING THE AUTH FLOW, MOVE THIS BACK TO LAYOUT*/}
      <HeroSection />
      {whySection}
      {guideCtaSection}
      <Footer />
    </div>
  );
}
