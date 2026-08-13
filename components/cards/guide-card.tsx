import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import type { GuideBrowseItem } from "@/lib/types/guide";
import { CheckCircle2, MapPin, Star } from "lucide-react";

function getInitials(name: string) {
  const parts = String(name ?? "")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean)
    .join("");
}

const interestLabels: Record<string, string> = {
  food: "Food",
  nature: "Nature",
  culture: "Culture",
  adventure: "Adventure",
  history: "History",
};

export function GuideCard({ guide }: { guide: GuideBrowseItem }) {
  const languagesLabel =
    guide.languages.length > 0 ? guide.languages.join(" · ") : "—";

  const nextLabel =
    guide.nextAvailableDate && !guide.availableToday
      ? `Next available: ${guide.nextAvailableDate}`
      : null;

  return (
    <Card className="overflow-hidden h-full hover:shadow-xl transition-all rounded-3xl">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-12 w-12">
              <AvatarImage src={guide.avatar ?? undefined} alt={guide.name} />
              <AvatarFallback>{getInitials(guide.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/guides/${guide.id}`}
                  className="font-semibold text-lg leading-tight hover:underline truncate"
                >
                  {guide.name}
                </Link>
                {guide.verified ? (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Verified
                  </Badge>
                ) : null}
                {guide.availableToday ? (
                  <Badge className="bg-secondary/15 text-secondary border-secondary/30">
                    Available today
                  </Badge>
                ) : null}
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{guide.location}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {guide.interests.length > 0 ? (
            guide.interests.slice(0, 4).map((interest) => (
              <Badge key={interest} variant="outline" className="rounded-full">
                {interestLabels[interest] ?? interest}
              </Badge>
            ))
          ) : (
            <Badge variant="outline" className="rounded-full">
              Customizable tours
            </Badge>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Languages:</span>{" "}
          {languagesLabel}
        </div>

        {nextLabel ? (
          <div className="text-xs text-muted-foreground">{nextLabel}</div>
        ) : null}
      </CardContent>

      <CardFooter className="pt-0 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 text-sm">
          <Star className="h-4 w-4 fill-secondary text-secondary" />
          <span className="font-semibold">{guide.rating.toFixed(1)}</span>
          <span className="text-muted-foreground">
            ({guide.reviewCount} reviews)
          </span>
        </div>
        <Button size="sm" asChild>
          <Link href={`/guides/${guide.id}`}>Connect</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
