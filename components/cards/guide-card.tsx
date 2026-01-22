import Link from "next/link";
import Image from "next/image";
import { Tour } from "@/lib/types/tour";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MapPin, Star, Users } from "lucide-react";

export function GuideCard({ tour }: { tour: Tour }) {
  const categoryColors = {
    food: "bg-amber-800/50 text-white border-amber-800",
    nature: "bg-emerald-600/50 text-white border-emerald-600",
    culture: "bg-fuchsia-400/50 text-white border-fuchsia-400",
    adventure: "bg-rose-700/50 text-white border-rose-700",
    history: "bg-yellow-400/50 text-white border-yellow-400",
    other: "bg-gray-600/50 text-white border-gray-600",
  };
  const firstName = tour.guide.name.split(" ")[0] || tour.guide.name;
  const languageList = tour.guide.languages.join(" / ");

  return (
    <Link href={`/tour/${tour.id}`}>
      <Card className="overflow-hidden h-full hover:shadow-xl transition-all group">
        <div className="relative h-56 overflow-hidden">
          <Image
            src={tour.image || "/placeholder.svg"}
            alt={tour.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
          <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
            <Badge className={categoryColors[tour.category]}>
              {tour.category.charAt(0).toUpperCase() + tour.category.slice(1)}
            </Badge>
            {tour.guide.verified && (
              <Badge className="bg-primary/80 text-primary-foreground border-primary/50 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Verified
              </Badge>
            )}
          </div>
          <div className="absolute bottom-4 left-4 flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
              <AvatarImage
                src={tour.guide.avatar || "/placeholder.svg"}
                alt={tour.guide.name}
              />
              <AvatarFallback>
                {tour.guide.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="text-white">
              <p className="text-lg font-semibold leading-tight">
                {tour.guide.name}
              </p>
              <p className="text-xs text-white/80">
                {tour.location}, {tour.country}
              </p>
            </div>
          </div>
        </div>

        <CardContent className="pt-5 space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Signature experience
            </p>
            <h3 className="font-semibold text-xl leading-tight">
              {tour.title}
            </h3>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {tour.description}
          </p>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
              <MapPin className="h-3 w-3" />
              {tour.location}, {tour.country}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
              <Users className="h-3 w-3" />
              {languageList}
            </span>
          </div>
        </CardContent>

        <CardFooter className="pt-0 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-secondary text-secondary" />
              <span className="font-semibold">{tour.rating}</span>
              <span className="text-muted-foreground">
                ({tour.reviewCount} reviews)
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Experiences from{" "}
              <span className="font-semibold text-foreground">
                ${tour.price}
              </span>{" "}
              per guest
            </p>
          </div>
          <Button size="sm" variant="outline">
            Meet {firstName}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
