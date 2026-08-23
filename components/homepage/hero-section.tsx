"use client";

import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "../ui/button";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const INTERESTS = ["food", "nature", "culture", "adventure", "history"] as const;

const HERO_IMAGES = [
  {
    src: "/local-guide-showing-hidden-alley-in-old-city.jpg",
    altKey: "heroImageAlt1",
  },
  {
    src: "/traditional-food-market-with-colorful-spices.jpg",
    altKey: "heroImageAlt2",
  },
  {
    src: "/sunset-view-from-secret-local-viewpoint.jpg",
    altKey: "heroImageAlt3",
  },
] as const;

export function HeroSection() {
  const t = useTranslations("Home");
  const router = useRouter();
  const [where, setWhere] = useState("");
  const [interest, setInterest] = useState("all");
  const [availableToday, setAvailableToday] = useState(false);

  useEffect(() => {
    try {
      setWhere(String(localStorage.getItem("pg.where") ?? ""));
    } catch {}
  }, []);

  const goToMatches = () => {
    const params = new URLSearchParams();
    const trimmedWhere = where.trim();
    if (trimmedWhere) {
      params.set("where", trimmedWhere);
      try {
        localStorage.setItem("pg.where", trimmedWhere);
      } catch {}
    }
    if (interest && interest !== "all") params.set("interest", interest);
    if (availableToday) params.set("available", "today");
    const query = params.toString();
    router.push(query ? `/browse?${query}` : "/browse");
  };

  return (
    <section className="border-b">
      <div className="container py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center space-y-5">
          <p className="text-sm font-medium uppercase tracking-widest text-brand-deep">
            {t("localExperienceBadge")}
          </p>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-balance leading-[1.05]">
            {t("discover")} {t("likeA")}{" "}
            <span className="text-primary">{t("local")}</span>
          </h1>

          <p className="mx-auto max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed text-pretty">
            {t("connectNote")}
          </p>
        </div>

        <form
          className="mx-auto mt-10 max-w-4xl rounded-xl border bg-card p-4 md:p-5"
          onSubmit={(event) => {
            event.preventDefault();
            goToMatches();
          }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_1fr_auto] md:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="hero-where" className="text-xs text-muted-foreground">
                {t("search.whereLabel")}
              </Label>
              <Input
                id="hero-where"
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                placeholder={t("search.wherePlaceholder")}
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hero-interest" className="text-xs text-muted-foreground">
                {t("search.interestLabel")}
              </Label>
              <Select value={interest} onValueChange={setInterest}>
                {/* The size variant sets h-9 via a data-attribute selector, so
                    plain `h-11` loses on specificity — override the variant. */}
                <SelectTrigger
                  id="hero-interest"
                  className="w-full data-[size=default]:h-11"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("search.interestAny")}</SelectItem>
                  {INTERESTS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`interests.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" size="lg" className="h-11 w-full md:w-auto">
              {t("ctaExplore")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-t pt-4">
            {/* Label wraps the box so the whole 44px row is the tap target. */}
            <Label
              htmlFor="hero-available-today"
              className="flex min-h-11 items-center gap-2.5 text-sm font-normal cursor-pointer"
            >
              <Checkbox
                id="hero-available-today"
                checked={availableToday}
                onCheckedChange={(next) => setAvailableToday(Boolean(next))}
              />
              {t("search.availableToday")}
            </Label>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm md:ml-auto">
              <Link
                href="/browse"
                className="inline-flex min-h-11 items-center text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors duration-200"
              >
                {t("search.browseAll")}
              </Link>
              <Link
                href="/become-guide"
                className="inline-flex min-h-11 items-center text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors duration-200"
              >
                {t("ctaGuide")}
              </Link>
            </div>
          </div>
        </form>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {HERO_IMAGES.map((image, index) => (
            <div
              key={image.src}
              className="relative aspect-4/3 overflow-hidden rounded-xl border bg-muted"
            >
              <Image
                src={image.src}
                alt={t(image.altKey)}
                fill
                priority={index === 0}
                sizes="(min-width: 640px) 33vw, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
