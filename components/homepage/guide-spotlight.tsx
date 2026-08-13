"use client";

import { useEffect, useMemo, useState } from "react";
import type { GuideBrowseItem } from "@/lib/types/guide";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GuideCard } from "@/components/cards/guide-card";
import { Link } from "@/i18n/routing";

type Props = {
  guides: GuideBrowseItem[];
};

function safeReadLocation(): string {
  try {
    return String(localStorage.getItem("lp.where") ?? "").trim();
  } catch {
    return "";
  }
}

export function GuideSpotlight({ guides }: Props) {
  const [where, setWhere] = useState<string>("");

  useEffect(() => {
    setWhere(safeReadLocation());
  }, []);

  const nearYou = useMemo(() => {
    const needle = where.trim().toLowerCase();
    if (!needle) return [];
    return guides
      .filter((guide) => guide.location.toLowerCase().includes(needle))
      .slice(0, 6);
  }, [guides, where]);

  const availableToday = useMemo(
    () => guides.filter((guide) => guide.availableToday).slice(0, 6),
    [guides]
  );

  const persistWhere = () => {
    const next = where.trim();
    try {
      if (next) localStorage.setItem("lp.where", next);
      else localStorage.removeItem("lp.where");
    } catch {}
    setWhere(next);
  };

  return (
    <section className="py-16 lg:py-24">
      <div className="container space-y-14">
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold text-balance">
                Guides near you
              </h2>
              <p className="text-muted-foreground">
                Set your location and we’ll highlight the best matches in your area.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/browse">See all guides</Link>
            </Button>
          </div>

          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  value={where}
                  onChange={(e) => setWhere(e.target.value)}
                  placeholder="Your location (e.g. Zagreb, Croatia)"
                />
                <Button onClick={persistWhere}>Update</Button>
              </div>
            </CardContent>
          </Card>

          {where.trim() ? (
            nearYou.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {nearYou.map((guide) => (
                  <GuideCard key={guide.id} guide={guide} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  No guides found for “{where}” yet. Try a nearby city or browse all
                  guides.
                </CardContent>
              </Card>
            )
          ) : (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Add your location to see guides near you.
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold text-balance">
                Available today
              </h2>
              <p className="text-muted-foreground">
                Need something last-minute? These guides have availability today.
              </p>
            </div>
            <Button asChild>
              <Link href="/browse?available=today">Browse available today</Link>
            </Button>
          </div>

          {availableToday.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {availableToday.map((guide) => (
                <GuideCard key={guide.id} guide={guide} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No guides marked as available today yet. Try browsing all guides.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}

