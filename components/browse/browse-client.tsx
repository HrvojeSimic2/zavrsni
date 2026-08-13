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
  const [sortBy, setSortBy] = useState<string>(filters.sort);

  useEffect(() => setSearchQuery(filters.q), [filters.q]);
  useEffect(() => setWhere(filters.where), [filters.where]);
  useEffect(() => setSelectedInterest(filters.interest), [filters.interest]);
  useEffect(() => setSelectedLanguage(filters.language), [filters.language]);
  useEffect(() => setAvailableToday(filters.available === "today"), [filters.available]);
  useEffect(() => setVerifiedOnly(Boolean(filters.verified)), [filters.verified]);
  useEffect(() => setSortBy(filters.sort), [filters.sort]);

  const interestOptions = [
    { value: "all", label: "All interests" },
    { value: "food", label: "Food" },
    { value: "nature", label: "Nature" },
    { value: "culture", label: "Culture" },
    { value: "adventure", label: "Adventure" },
    { value: "history", label: "History" },
  ];

  const languageOptions = useMemo(
    () => [
      { value: "all", label: "Any language" },
      ...languages.map((language) => ({ value: language, label: language })),
    ],
    [languages]
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
        if (where.trim()) localStorage.setItem("lp.where", where.trim());
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
          Previous
        </Button>
        <div className="text-sm text-muted-foreground">
          Page <span className="font-medium text-foreground">{pagination.page}</span>{" "}
          of{" "}
          <span className="font-medium text-foreground">{pagination.totalPages}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages || isPending}
        >
          Next
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
              Find the right local guide for you
            </h1>
            <p className="text-lg text-muted-foreground text-pretty">
              Filter by where you are, what you’re into, and who’s available today.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-4xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, interests, languages…"
                className="pl-12 h-12 rounded-xl bg-background/70"
                disabled={isPending}
              />
            </div>
            <div className="relative">
              <Input
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                placeholder="Where are you? (e.g. Split, Croatia)"
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
                <h2 className="text-xl font-semibold">Filters</h2>
                <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
              </div>

              <Card>
                <CardContent className="pt-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Interests</label>
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
                    <label className="text-sm font-medium">Language</label>
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
                    <label className="text-sm font-medium">Availability</label>
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
                      Available today
                    </label>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">Trust</label>
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
                      Verified guides only
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sort</label>
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
                        <SelectItem value="match">Best match</SelectItem>
                        <SelectItem value="availability">Soonest available</SelectItem>
                        <SelectItem value="rating">Highest rated</SelectItem>
                        <SelectItem value="reviews">Most reviewed</SelectItem>
                        <SelectItem value="name">Name (A–Z)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={clearFilters}
                    disabled={isPending}
                  >
                    Clear filters
                  </Button>
                </CardContent>
              </Card>
            </aside>

            <div className="flex-1 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-semibold text-foreground">{rangeLabel}</span>
                  {pagination.totalCount > 0 ? (
                    <>
                      {" "}
                      of{" "}
                      <span className="font-semibold text-foreground">
                        {pagination.totalCount}
                      </span>{" "}
                    </>
                  ) : (
                    " "
                  )}
                  {pagination.totalCount === 1 ? "guide" : "guides"}
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
                    <h3 className="text-xl font-semibold">
                      No guides match your filters
                    </h3>
                    <p className="text-muted-foreground">
                      Try broadening your interests, removing “available today”, or
                      changing your location.
                    </p>
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      disabled={isPending}
                    >
                      Clear all filters
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

