import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Star,
  Clock,
  Users,
  CheckCircle2,
  Calendar,
  Globe,
  Shield,
  Heart,
  Share2,
  MessageCircle,
  ThumbsUp,
  Award,
  Check,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTourById, getSimilarTours } from "@/lib/actions/tour-actions";
import { getReviewsByTourId } from "@/lib/actions/review-actions";
import { useTranslations } from "next-intl";
export default async function TourDetailPage({
  params,
}: {
  params: { tourID: string };
}) {
  const tour = await getTourById(params.tourID);

  if (!tour) {
    notFound();
  }
  const t = useTranslations("Tours");

  const [reviews, similarTours] = await Promise.all([
    getReviewsByTourId(tour.id),
    getSimilarTours(tour.category, tour.id, 3),
  ]);

  const categoryColors = {
    food: "bg-secondary/10 text-secondary border-secondary/20",
    nature: "bg-primary/10 text-primary border-primary/20",
    culture: "bg-chart-3/10 text-chart-3 border-chart-3/20",
    adventure: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    history: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <section className="relative h-[400px] md:h-[500px]">
        <Image
          src={tour.image || "/placeholder.svg"}
          alt={tour.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0">
          <div className="container py-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="space-y-3">
                <Badge className={categoryColors[tour.category]}>
                  {tour.category.charAt(0).toUpperCase() +
                    tour.category.slice(1)}
                </Badge>
                <h1 className="text-3xl md:text-5xl font-bold text-white text-balance">
                  {tour.title}
                </h1>
                <div className="flex items-center gap-4 text-white/90">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-5 w-5" />
                    <span className="font-medium">
                      {tour.location}, {tour.country}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-secondary text-secondary" />
                    <span className="font-semibold">{tour.rating}</span>
                    <span>({tour.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="secondary">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="secondary">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center space-y-2">
                    <Clock className="h-6 w-6 mx-auto text-primary" />
                    <div className="text-sm text-muted-foreground">
                      {t("duration")}
                    </div>
                    <div className="font-semibold">{tour.duration}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center space-y-2">
                    <Users className="h-6 w-6 mx-auto text-primary" />
                    <div className="text-sm text-muted-foreground">
                      Group Size
                    </div>
                    <div className="font-semibold">{tour.groupSize}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center space-y-2">
                    <Globe className="h-6 w-6 mx-auto text-primary" />
                    <div className="text-sm text-muted-foreground">
                      Languages
                    </div>
                    <div className="font-semibold text-sm">
                      {tour.guide.languages.join(", ")}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center space-y-2">
                    <Calendar className="h-6 w-6 mx-auto text-primary" />
                    <div className="text-sm text-muted-foreground">
                      Availability
                    </div>
                    <div className="font-semibold text-sm">Daily</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h2 className="text-2xl font-bold">About This Experience</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {tour.description}
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    This unique experience takes you beyond the typical tourist
                    paths to discover the authentic heart of {tour.location}.
                    You'll explore hidden locations, meet local people, and gain
                    insights that only someone who truly knows this place can
                    provide.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Perfect for travelers who want to experience the real
                    culture and connect with the local community in a meaningful
                    way. This is sustainable tourism at its bestƒ?"supporting
                    local guides and economies while having an unforgettable
                    adventure.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h2 className="text-2xl font-bold">What's Included</h2>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tour.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">
                          {highlight}
                        </span>
                      </li>
                    ))}
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">
                        Expert local guide
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">
                        Small group experience
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-6">
                  <h2 className="text-2xl font-bold">Meet Your Guide</h2>

                  <div className="flex items-start gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage
                        src={tour.guide.avatar || "/placeholder.svg"}
                        alt={tour.guide.name}
                      />
                      <AvatarFallback>
                        {tour.guide.name
                          .split(" ")
                          .map((name) => name[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold">
                          {tour.guide.name}
                        </h3>
                        {tour.guide.verified && (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-secondary text-secondary" />
                          <span className="font-semibold text-foreground">
                            {tour.rating}
                          </span>
                          <span>({tour.reviewCount} reviews)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          <span>Experienced Guide</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Speaks: {tour.guide.languages.join(", ")}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <p className="text-muted-foreground leading-relaxed">
                      Born and raised in {tour.location}, I've spent my entire
                      life exploring every corner of this incredible place. What
                      started as showing friends around has become my passionƒ?"
                      sharing the hidden gems and authentic experiences that
                      make my home so special.
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      I believe that the best way to experience a place is
                      through the eyes of someone who truly knows and loves it.
                      I'm excited to show you the real {tour.location} and share
                      stories that you won't find in any guidebook.
                    </p>
                  </div>

                  <Button variant="outline" className="w-full md:w-auto">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contact Guide
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Reviews</h2>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-secondary text-secondary" />
                      <span className="text-xl font-bold">{tour.rating}</span>
                      <span className="text-muted-foreground">
                        ({tour.reviewCount} reviews)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {reviews.length > 0 ? (
                      reviews.map((review) => {
                        const formattedDate = review.date
                          ? new Date(review.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "Date pending";

                        return (
                          <div key={review.id} className="space-y-3">
                            <div className="flex items-start gap-3">
                              <Avatar>
                                <AvatarImage
                                  src={review.avatar || "/placeholder.svg"}
                                  alt={review.author}
                                />
                                <AvatarFallback>
                                  {review.author
                                    .split(" ")
                                    .map((name) => name[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-semibold">
                                      {review.author}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {formattedDate}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {Array.from({
                                      length: review.rating,
                                    }).map((_, index) => (
                                      <Star
                                        key={index}
                                        className="h-4 w-4 fill-secondary text-secondary"
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                  {review.comment}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs"
                                >
                                  <ThumbsUp className="mr-1 h-3 w-3" />
                                  Helpful ({review.helpful})
                                </Button>
                              </div>
                            </div>
                            <Separator />
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No reviews yet. Be the first to share your experience!
                      </p>
                    )}
                  </div>

                  {reviews.length > 0 && (
                    <Button variant="outline" className="w-full">
                      Show All {tour.reviewCount} Reviews
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">${tour.price}</span>
                      <span className="text-muted-foreground">per person</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-secondary text-secondary" />
                      <span className="font-semibold">{tour.rating}</span>
                      <span className="text-muted-foreground">
                        ({tour.reviewCount} reviews)
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Select Date
                      </label>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Choose a date
                      </Button>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Guests
                      </label>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Users className="mr-2 h-4 w-4" />1 guest
                      </Button>
                    </div>
                  </div>

                  <Button className="w-full" size="lg">
                    Book Now
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    You won't be charged yet
                  </p>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="h-5 w-5 text-primary" />
                      <span className="text-muted-foreground">
                        Free cancellation up to 24 hours
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span className="text-muted-foreground">
                        Instant confirmation
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MessageCircle className="h-5 w-5 text-primary" />
                      <span className="text-muted-foreground">
                        Direct contact with guide
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-muted/30">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            Similar Experiences
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similarTours.map((similarTour) => (
              <Link key={similarTour.id} href={`/tour/${similarTour.id}`}>
                <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow group">
                  <div className="relative h-48">
                    <Image
                      src={similarTour.image || "/placeholder.svg"}
                      alt={similarTour.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="pt-4 space-y-2">
                    <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {similarTour.title}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {similarTour.location}, {similarTour.country}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-secondary text-secondary" />
                        <span className="font-semibold">
                          {similarTour.rating}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({similarTour.reviewCount})
                        </span>
                      </div>
                      <div className="text-xl font-bold">
                        ${similarTour.price}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
