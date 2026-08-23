'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { GuideCard } from "@/components/cards/guide-card";
import type { GuideBrowseItem } from "@/lib/types/guide";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

type BrowseClientProps = {
  guides: GuideBrowseItem[];
  languages: string[];
  filters: {
    q: string;
    interest: string;
    where: string;
    language: string;
    available: string;
    verified: boolean;
    maxRate: number | null;
    sort: string;
  };
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    from: number;
    to: number;
  };
};

export function BrowseClient({
  guides,
  languages,
  filters,
  pagination,
}: BrowseClientProps) {
  const t = useTranslations("Browse");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const searchParamsRef = useRef(searchParamsString);
  const didMountRef = useRef(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    searchParamsRef.current = searchParamsString;
  }, [searchParamsString]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    router.refresh();
  }, [router, searchParamsString]);

  const [searchQuery, setSearchQuery] = useState(filters.q);
  const [where, setWhere] = useState(filters.where);
  const [selectedInterest, setSelectedInterest] = useState<string>(filters.interest);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(filters.language);
  const [availableToday, setAvailableToday] = useState(filters.available === "today");
  const [verifiedOnly, setVerifiedOnly] = useState(Boolean(filters.verified));
  const [maxRate, setMaxRate] = useState<string>(
    filters.maxRate === null ? "any" : String(filters.maxRate)
  );
  const [sortBy, setSortBy] = useState<string>(filters.sort);

  useEffect(() => setSearchQuery(filters.q), [filters.q]);
  useEffect(() => setWhere(filters.where), [filters.where]);
  useEffect(() => setSelectedInterest(filters.interest), [filters.interest]);
  useEffect(() => setSelectedLanguage(filters.language), [filters.language]);
  useEffect(() => setAvailableToday(filters.available === "today"), [filters.available]);
  useEffect(() => setVerifiedOnly(Boolean(filters.verified)), [filters.verified]);
  useEffect(
    () => setMaxRate(filters.maxRate === null ? "any" : String(filters.maxRate)),
    [filters.maxRate]
  );
  useEffect(() => setSortBy(filters.sort), [filters.sort]);

  const interestOptions = [
    { value: "all", label: t("interestAll") },
    { value: "food", label: t("interests.food") },
    { value: "nature", label: t("interests.nature") },
    { value: "culture", label: t("interests.culture") },
    { value: "adventure", label: t("interests.adventure") },
    { value: "history", label: t("interests.history") },
  ];

  // Coarse steps rather than a slider: the point is "roughly what do they
  // charge", and a guide who has not published a rate is never filtered out.
  const rateOptions = [
    { value: "any", label: t("rateAny") },
    { value: "20", label: t("rateUpTo", { rate: 20 }) },
    { value: "35", label: t("rateUpTo", { rate: 35 }) },
    { value: "50", label: t("rateUpTo", { rate: 50 }) },
    { value: "80", label: t("rateUpTo", { rate: 80 }) },
  ];

  const languageOptions = useMemo(
    () => [
      { value: "all", label: t("languageAny") },
      ...languages.map((language) => ({ value: language, label: language })),
    ],
    [languages, t]
  );

  const updateUrl = (params: URLSearchParams, replace = false) => {
    const nextQuery = params.toString();
    const href = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    searchParamsRef.current = nextQuery;
    startTransition(() => {
      if (replace) router.replace(href);
      else router.push(href);
    });
  };

  const setParam = (
    key: string,
    value: string,
    defaultValue: string,
    replace = false
  ) => {
    const params = new URLSearchParams(searchParamsRef.current);
    if (key !== "page") params.delete("page");
    const nextValue = value.trim();
    if (!nextValue || nextValue === defaultValue) params.delete(key);
    else params.set(key, nextValue);
    updateUrl(params, replace);
  };

  const setBooleanParam = (key: string, next: boolean) => {
    const params = new URLSearchParams(searchParamsRef.current);
    params.delete("page");
    if (!next) params.delete(key);
    else params.set(key, "1");
    updateUrl(params, true);
  };

  const setPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParamsRef.current);
    const clamped = Math.max(1, Math.min(nextPage, pagination.totalPages));
    if (clamped <= 1) params.delete("page");
    else params.set("page", String(clamped));
    updateUrl(params);
  };

  const qDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchQuery === filters.q) return;
    if (qDebounceRef.current) clearTimeout(qDebounceRef.current);
    qDebounceRef.current = setTimeout(() => {
      setParam("q", searchQuery, "", true);
    }, 350);
    return () => {
      if (qDebounceRef.current) clearTimeout(qDebounceRef.current);
    };
  }, [searchQuery, filters.q]);

  const whereDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (where === filters.where) return;
    if (whereDebounceRef.current) clearTimeout(whereDebounceRef.current);
    whereDebounceRef.current = setTimeout(() => {
      setParam("where", where, "", true);
      try {
        if (where.trim()) localStorage.setItem("pg.where", where.trim());
      } catch {}
    }, 350);
    return () => {
      if (whereDebounceRef.current) clearTimeout(whereDebounceRef.current);
    };
  }, [where, filters.where]);

  const clearFilters = () => {
    const params = new URLSearchParams();
    updateUrl(params, true);
  };

  function PaginationControls() {
    if (pagination.totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(pagination.page - 1)}
          disabled={pagination.page <= 1 || isPending}
        >
          {t("previous")}
        </Button>
        <div className="text-sm text-muted-foreground">
          {t.rich("pageOf", {
            page: pagination.page,
            total: pagination.totalPages,
            strong: (chunks) => (
              <span className="font-medium text-foreground">{chunks}</span>
            ),
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages || isPending}
        >
          {t("next")}
        </Button>
      </div>
    );
  }

  const rangeLabel =
    pagination.totalCount === 0
      ? "0"
      : pagination.from === pagination.to
        ? String(pagination.from)
        : `${pagination.from}–${pagination.to}`;

  return (
    <>
      <section className="bg-linear-to-br from-primary/10 via-background to-secondary/10 border-b">
        <div className="container py-12">
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
              {t("title")}
            </h1>
            <p className="text-lg text-muted-foreground text-pretty">
              {t("subtitle")}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-4xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="pl-12 h-12 rounded-xl bg-background/70"
                disabled={isPending}
              />
            </div>
            <div className="relative">
              <Input
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                placeholder={t("wherePlaceholder")}
                className="h-12 rounded-xl bg-background/70"
                disabled={isPending}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 bg-muted/30">
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-72 space-y-6">
              <div className="flex items-center justify-between lg:hidden">
                <h2 className="text-xl font-semibold">{t("filters")}</h2>
                <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
              </div>

              <Card>
                <CardContent className="pt-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("interestsLabel")}</label>
                    <Select
                      value={selectedInterest}
                      onValueChange={(value) => {
                        setSelectedInterest(value);
                        setParam("interest", value, "all");
                      }}
                      disabled={isPending}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {interestOptions.map((interest) => (
                          <SelectItem key={interest.value} value={interest.value}>
                            {interest.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("languageLabel")}</label>
                    <Select
                      value={selectedLanguage}
                      onValueChange={(value) => {
                        setSelectedLanguage(value);
                        setParam("language", value, "all");
                      }}
                      disabled={isPending}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languageOptions.map((language) => (
                          <SelectItem key={language.value} value={language.value}>
                            {language.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">{t("availabilityLabel")}</label>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={availableToday}
                        onCheckedChange={(next) => {
                          const checked = Boolean(next);
                          setAvailableToday(checked);
                          setParam("available", checked ? "today" : "", "any", true);
                        }}
                        disabled={isPending}
                      />
                      {t("availableToday")}
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("rateLabel")}</label>
                    <Select
                      value={maxRate}
                      onValueChange={(value) => {
                        setMaxRate(value);
                        setParam("maxRate", value === "any" ? "" : value, "any");
                      }}
                      disabled={isPending}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {rateOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">{t("trustLabel")}</label>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={verifiedOnly}
                        onCheckedChange={(next) => {
                          const checked = Boolean(next);
                          setVerifiedOnly(checked);
                          setBooleanParam("verified", checked);
                        }}
                        disabled={isPending}
                      />
                      {t("verifiedOnly")}
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("sortLabel")}</label>
                    <Select
                      value={sortBy}
                      onValueChange={(value) => {
                        setSortBy(value);
                        setParam("sort", value, "match");
                      }}
                      disabled={isPending}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="match">{t("sortMatch")}</SelectItem>
                        <SelectItem value="availability">
                          {t("sortAvailability")}
                        </SelectItem>
                        <SelectItem value="rating">{t("sortRating")}</SelectItem>
                        <SelectItem value="reviews">{t("sortReviews")}</SelectItem>
                        <SelectItem value="rate">{t("sortRate")}</SelectItem>
                        <SelectItem value="name">{t("sortName")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={clearFilters}
                    disabled={isPending}
                  >
                    {t("clearFilters")}
                  </Button>
                </CardContent>
              </Card>
            </aside>

            <div className="flex-1 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  {pagination.totalCount > 0
                    ? t.rich("showingRange", {
                        range: rangeLabel,
                        total: pagination.totalCount,
                        count: pagination.totalCount,
                        strong: (chunks) => (
                          <span className="font-semibold text-foreground">
                            {chunks}
                          </span>
                        ),
                      })
                    : t.rich("showingNone", {
                        strong: (chunks) => (
                          <span className="font-semibold text-foreground">
                            {chunks}
                          </span>
                        ),
                      })}
                </p>
              </div>

              <PaginationControls />

              {guides.length === 0 ? (
                <Card className="p-12">
                  <div className="text-center space-y-3">
                    <div className="flex justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <Search className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold">{t("emptyTitle")}</h3>
                    <p className="text-muted-foreground">{t("emptyBody")}</p>
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      disabled={isPending}
                    >
                      {t("clearAllFilters")}
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {guides.map((guide) => (
                      <GuideCard key={guide.id} guide={guide} />
                    ))}
                  </div>
                  <PaginationControls />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

