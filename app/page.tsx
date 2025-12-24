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
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  const heroSection = (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-[10%] w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-[15%] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 lg:pr-12">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 rounded-full px-4 py-1.5 inline-flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              Authentic Local Experiences
            </Badge>

            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-balance leading-[0.95]">
                Explore
                <br />
                Like a{" "}
                <span className="text-primary relative inline-block">
                  Local
                  <svg
                    className="absolute -bottom-3 left-0 w-full"
                    height="16"
                    viewBox="0 0 200 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 12C25 5 50 3 100 8C150 13 175 11 195 8"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-pretty max-w-lg">
                Connect with passionate locals who reveal authentic,
                off-the-beaten-path experiences you won't find in guidebooks.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="rounded-full text-base px-8" asChild>
                <Link href="/browse">
                  Explore Tours
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full text-base px-8 bg-transparent"
                asChild
              >
                <Link href="/become-guide">Become a Guide</Link>
              </Button>
            </div>
          </div>

          <div className="relative lg:pl-8">
            <div className="grid grid-cols-12 gap-3 auto-rows-[120px]">
              {/* Large card */}
              <div className="col-span-7 row-span-3 group">
                <Card className="overflow-hidden h-full border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-rotate-1 rounded-3xl">
                  <div className="relative h-full">
                    <Image
                      src="/local-guide-showing-hidden-alley-in-old-city.jpg"
                      alt="Local guide"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </Card>
              </div>

              {/* Small square */}
              <div className="col-span-5 row-span-2 group">
                <Card className="overflow-hidden h-full border-2 hover:border-secondary/30 transition-all duration-300 hover:shadow-lg hover:rotate-2 rounded-3xl">
                  <div className="relative h-full">
                    <Image
                      src="/traditional-food-market-with-colorful-spices.jpg"
                      alt="Food market"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </Card>
              </div>

              {/* Tall card */}
              <div className="col-span-5 row-span-3 group">
                <Card className="overflow-hidden h-full border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-rotate-1 rounded-3xl">
                  <div className="relative h-full">
                    <Image
                      src="/sunset-view-from-secret-local-viewpoint.jpg"
                      alt="Secret viewpoint"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </Card>
              </div>

              {/* Wide card */}
              <div className="col-span-7 row-span-2 group">
                <Card className="overflow-hidden h-full border-2 hover:border-secondary/30 transition-all duration-300 hover:shadow-xl hover:rotate-1 rounded-3xl">
                  <div className="relative h-full">
                    <Image
                      src="/hidden-waterfall-in-lush-forest.jpg"
                      alt="Waterfall"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </Card>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-4 lg:left-0 z-10">
              <Card className="bg-background/95 backdrop-blur-md shadow-2xl border-2 rounded-2xl p-4 max-w-[220px] hover:shadow-primary/20 hover:-translate-y-1 transition-all">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-12 h-12 rounded-2xl bg-linear-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <Star className="h-6 w-6 text-primary fill-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">Verified Guides</p>
                    <p className="text-xs text-muted-foreground">
                      Trusted worldwide
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const whySection = (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute right-0 top-1/3 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />

      <div className="container">
        <div className="text-center mb-16 space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold text-balance">
            Why LocalPath?
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            Experience tourism the way it should beƒ?"personal, authentic, and
            sustainable
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
                  <h3 className="font-bold text-2xl">Hidden Gems</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Discover places only locals know, far from tourist crowds
                    and guidebook clichAcs.
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
                  <h3 className="font-bold text-2xl">Verified & Safe</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    All guides are reviewed and verified, so you can explore
                    with complete peace of mind.
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
                  <h3 className="font-bold text-2xl">Passionate Guides</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Connect with locals who genuinely love sharing their
                    culture, stories, and traditions.
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
                  <h3 className="font-bold text-2xl">Direct Impact</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Support local communities directly while exploring
                    responsibly and sustainably.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );

  const howItWorksSection = (
    <section className="py-24 lg:py-32 bg-muted/30 relative overflow-hidden">
      <div className="absolute left-0 top-1/4 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl" />

      <div className="container">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-4xl md:text-6xl font-bold text-balance">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Start your adventure in three simple steps
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
                  Browse & Discover
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Search for experiences by location, interests, or guide
                  specialties. Filter by food tours, nature hikes, cultural
                  walks, and more.
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
                  Connect with Guides
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Read authentic reviews, check guide profiles, and message
                  them directly to customize your perfect experience.
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
                  Experience & Explore
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Meet your guide and embark on an authentic journey through
                  hidden spots and local stories you'll never forget.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 text-center">
          <Button size="lg" className="rounded-full px-8 text-base" asChild>
            <Link href="/browse">
              Start Exploring
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
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
              For Local Guides
            </Badge>

            <div className="space-y-6">
              <h2 className="text-4xl md:text-6xl font-bold text-primary-foreground text-balance leading-tight">
                Share Your World, Earn Income
              </h2>
              <p className="text-xl text-primary-foreground/90 leading-relaxed text-pretty max-w-2xl mx-auto">
                Turn your local knowledge into meaningful connections and
                income. Join guides worldwide who share their passion with
                travelers.
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
                  Flexible Schedule
                </p>
                <p className="text-sm text-primary-foreground/80 mt-1">
                  Work when you want
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 bg-primary-foreground/5 p-6 rounded-3xl backdrop-blur-sm hover:bg-primary-foreground/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="shrink-0 w-16 h-16 rounded-2xl bg-primary-foreground/15 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-primary-foreground text-lg">
                  Global Community
                </p>
                <p className="text-sm text-primary-foreground/80 mt-1">
                  Connect worldwide
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 bg-primary-foreground/5 p-6 rounded-3xl backdrop-blur-sm hover:bg-primary-foreground/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="shrink-0 w-16 h-16 rounded-2xl bg-primary-foreground/15 flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-primary-foreground text-lg">
                  Trusted Platform
                </p>
                <p className="text-sm text-primary-foreground/80 mt-1">
                  Safe & secure
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 bg-primary-foreground/5 p-6 rounded-3xl backdrop-blur-sm hover:bg-primary-foreground/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="shrink-0 w-16 h-16 rounded-2xl bg-primary-foreground/15 flex items-center justify-center">
                <Heart className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-primary-foreground text-lg">
                  Meaningful Impact
                </p>
                <p className="text-sm text-primary-foreground/80 mt-1">
                  Share your culture
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
                Start Guiding Today
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
      <Navigation />
      {heroSection}
      {whySection}
      {howItWorksSection}
      {guideCtaSection}
      <Footer />
    </div>
  );
}
