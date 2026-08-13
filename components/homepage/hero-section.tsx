"use client";

import {
  ArrowRight,
  Star,
  Sparkles,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Link } from "@/i18n/routing";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";
export function HeroSection() {
  const t = useTranslations("Home");
  const router = useRouter();
  const [where, setWhere] = useState("");
  const [interest, setInterest] = useState("all");
  const [availableToday, setAvailableToday] = useState(false);

  useEffect(() => {
    try {
      setWhere(String(localStorage.getItem("lp.where") ?? ""));
    } catch {}
  }, []);

  const goToMatches = () => {
    const params = new URLSearchParams();
    const trimmedWhere = where.trim();
    if (trimmedWhere) {
      params.set("where", trimmedWhere);
      try {
        localStorage.setItem("lp.where", trimmedWhere);
      } catch {}
    }
    if (interest && interest !== "all") params.set("interest", interest);
    if (availableToday) params.set("available", "today");
    const query = params.toString();
    router.push(query ? `/browse?${query}` : "/browse");
  };
  return (
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
              {t("localExperienceBadge")}
            </Badge>

            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-balance leading-[0.95]">
                {t("discover")}
                <br />
                {t("likeA")}{" "}
                <span className="text-primary relative inline-block">
                  {t("local")}
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
           {t("connectNote")}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="rounded-full text-base px-8"
                onClick={goToMatches}
              >
                {t("ctaExplore")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full text-base px-8 bg-transparent"
                asChild
              >
                <Link href="/become-guide">{t("ctaGuide")}</Link>
              </Button>
            </div>

            <Card className="p-5 rounded-3xl border-2 bg-background/70 backdrop-blur-md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  value={where}
                  onChange={(e) => setWhere(e.target.value)}
                  placeholder="Where are you?"
                  className="h-12 rounded-2xl bg-background"
                />

                <Select value={interest} onValueChange={setInterest}>
                  <SelectTrigger className="h-12 rounded-2xl bg-background">
                    <SelectValue placeholder="What are you into?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any interest</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="nature">Nature</SelectItem>
                    <SelectItem value="culture">Culture</SelectItem>
                    <SelectItem value="adventure">Adventure</SelectItem>
                    <SelectItem value="history">History</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center justify-between gap-4 rounded-2xl border bg-background px-4 h-12">
                  <label className="text-sm font-medium">
                    Available today
                  </label>
                  <Checkbox
                    checked={availableToday}
                    onCheckedChange={(next) => setAvailableToday(Boolean(next))}
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <Button className="rounded-full" onClick={goToMatches}>
                  Show best matches
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" className="rounded-full" asChild>
                  <Link href="/browse">Browse all guides</Link>
                </Button>
              </div>
            </Card>
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
                    <p className="font-semibold text-sm">{t("verifiedGuides")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("trustedWorldwide")}
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
}
