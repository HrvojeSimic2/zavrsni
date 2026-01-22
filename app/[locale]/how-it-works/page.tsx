import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {

  ArrowRight,

} from "lucide-react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Navigation } from "@/components/navigation";


export default async function HowItWorks() {
  const t = await getTranslations("HowItWorks");
return (
  <div className="w-full">
    <Navigation></Navigation>
    <div className="absolute left-0 top-1/4 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl" />

    <div className="container">
      <div className="text-center mb-20 space-y-4">
        <h2 className="text-4xl md:text-6xl font-bold text-balance">
          {t("title")}
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
          {t("subtitle")}
        </p>
      </div>

      <div className="max-w-6xl mx-auto space-y-16 lg:space-y-24">
        {/* Step 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="order-2 lg:order-1 group">
            <Card className="overflow-hidden border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:-rotate-1 rounded-4xl">
              <div className="relative aspect-4/3">
                <Image
                  src="/bangkok-street-food-market.jpg"
                  alt="Browse experiences"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </Card>
          </div>

          <div className="space-y-6 order-1 lg:order-2">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-primary to-primary/80 text-primary-foreground text-4xl font-bold shadow-lg shadow-primary/30">
              1
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl lg:text-4xl font-bold">
                {t("step1Title")}
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t("step1Body")}
              </p>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-secondary to-secondary/80 text-secondary-foreground text-4xl font-bold shadow-lg shadow-secondary/30">
              2
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl lg:text-4xl font-bold">
                {t("step2Title")}
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t("step2Body")}
              </p>
            </div>
          </div>

          <div className="group">
            <Card className="overflow-hidden border-2 hover:border-secondary/30 transition-all duration-300 hover:shadow-2xl hover:rotate-1 rounded-4xl">
              <div className="relative aspect-4/3">
                <Image
                  src="/jazz-club-interior.jpg"
                  alt="Connect with guides"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </Card>
          </div>
        </div>

        {/* Step 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="order-2 lg:order-1 group">
            <Card className="overflow-hidden border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:-rotate-1 rounded-4xl">
              <div className="relative aspect-4/3">
                <Image
                  src="/hidden-waterfall-bali.jpg"
                  alt="Experience adventure"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </Card>
          </div>

          <div className="space-y-6 order-1 lg:order-2">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-primary to-primary/80 text-primary-foreground text-4xl font-bold shadow-lg shadow-primary/30">
              3
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl lg:text-4xl font-bold">
                {t("step3Title")}
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t("step3Body")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-20 text-center">
        <Button size="lg" className="rounded-full px-8 text-base" asChild>
          <Link href="/browse">
            {t("ctaButton")}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  </div>
);};
