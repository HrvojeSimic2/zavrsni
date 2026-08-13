'use client'

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import {
  createReservationAction,
  type ReservationErrorCode,
} from "@/lib/actions/reservation-actions";

import { useTranslations } from "next-intl";

import { PageShell } from "@/components/layout/page-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Tour } from "@/lib/types/tour";
import type { Review } from "@/lib/types/review";
import { formatMoney } from "@/lib/format/money";
import {
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Globe,
  Heart,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  Quote,
  Share2,
  Shield,
  Sparkles,
  Star,
  ThumbsUp,
  Users,
} from "lucide-react";

type TourAvailabilityDay = {
  date: string;
  availableSpots: number;
};

type Props = {
  locale: string;
  tour: Tour;
  similarTours: Tour[];
  reviews: Review[];
};

function formatLocalISODate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function TourDetailClient({
  locale,
  tour,
  similarTours,
  reviews,
}: Props) {
  const tBooking = useTranslations("Booking");

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [guestCount, setGuestCount] = useState<number>(1);
  const [availabilityStatus, setAvailabilityStatus] = useState<
    "idle" | "loading" | "loaded" | "error"
  >("idle");
  const [availabilityByDate, setAvailabilityByDate] = useState<
    Record<string, number>
  >({});
  /** Bumped after a successful booking to re-read availability. */
  const [availabilityRefresh, setAvailabilityRefresh] = useState(0);
  const [bookingError, setBookingError] = useState<ReservationErrorCode | null>(
    null
  );
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [isBooking, startBooking] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setSelectedDate("");
    setGuestCount(1);
    setAvailabilityByDate({});
    setAvailabilityStatus("idle");
    setBookingError(null);
    setBookingConfirmed(false);
  }, [tour.id]);

  const formatPrice = useCallback(
    (amount: number) => formatMoney(locale, amount),
    [locale]
  );

  const shortDateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }),
    [locale]
  );

  const todayLocalISO = useMemo(() => formatLocalISODate(new Date()), []);
  const availabilityEndLocalISO = useMemo(() => {
    const end = new Date();
    end.setDate(end.getDate() + 180);
    return formatLocalISODate(end);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAvailability() {
      setAvailabilityStatus("loading");
      try {
        const res = await fetch(
          `/api/tours/${tour.id}/availability?start=${todayLocalISO}&end=${availabilityEndLocalISO}`,
          { signal: controller.signal }
        );
        if (!res.ok) {
          throw new Error(`Availability request failed: ${res.status}`);
        }
        const days = (await res.json()) as TourAvailabilityDay[];
        const next: Record<string, number> = {};
        for (const day of days) {
          if (typeof day?.date === "string") {
            next[day.date] = Math.max(0, Number(day.availableSpots) || 0);
          }
        }
        setAvailabilityByDate(next);
        setAvailabilityStatus("loaded");
      } catch (error) {
        if ((error as { name?: string } | null)?.name === "AbortError") return;
        setAvailabilityByDate({});
        setAvailabilityStatus("error");
      }
    }

    loadAvailability();
    return () => controller.abort();
  }, [availabilityEndLocalISO, todayLocalISO, tour.id, availabilityRefresh]);

  const handleBooking = () => {
    if (!selectedDate || isBooking) return;

    setBookingError(null);
    setBookingConfirmed(false);

    startBooking(async () => {
      const result = await createReservationAction({
        tourId: tour.id,
        date: selectedDate,
        guests: guestCount,
        locale,
      });

      if (result.ok) {
        setBookingConfirmed(true);
        setAvailabilityRefresh((current) => current + 1);
        return;
      }

      if (result.code === "SIGN_IN_REQUIRED") {
        const query = new URLSearchParams();
        query.set("next", `/${locale}/tour/${tour.id}`);
        query.set("message", "Sign in to request a booking.");
        router.push(`/${locale}/auth/sign-in?${query.toString()}`);
        return;
      }

      setBookingError(result.code);
      // The date may have filled up while the form sat open.
      setAvailabilityRefresh((current) => current + 1);
    });
  };

  const bookingErrorMessage = (() => {
    switch (bookingError) {
      case "NOT_OFFERED":
        return "This tour doesn't run on that date.";
      case "NOT_ENOUGH_SPOTS":
        return "That date just filled up. Pick another date.";
      case "ALREADY_BOOKED":
        return "You already have a request for this date.";
      case "TOUR_NOT_FOUND":
        return "This tour is no longer available.";
      case "INVALID_INPUT":
        return "Please check the date and number of guests.";
      case "FAILED":
        return "Something went wrong. Please try again.";
      default:
        return null;
    }
  })();

  const maxGuests = (() => {
    const match = tour.groupSize.match(/\d+/);
    const parsed = match ? Number.parseInt(match[0], 10) : Number.NaN;
    if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed < 1) return 10;
    return Math.min(parsed, 50);
  })();

  /**
   * Dates the guide has actually opened, in order. A tour only runs on the days
   * it has an availability row, so everything else is "not offered" rather than
   * sold out — the two look identical in the raw lookup and must not be
   * reported the same way.
   */
  const openDates = useMemo(
    () =>
      Object.entries(availabilityByDate)
        .filter(([, spots]) => spots > 0)
        .map(([date]) => date)
        .sort(),
    [availabilityByDate]
  );

  const isDateOffered =
    Boolean(selectedDate) &&
    Object.prototype.hasOwnProperty.call(availabilityByDate, selectedDate);

  const availableSpotsForSelectedDate =
    availabilityStatus === "loaded" && selectedDate && isDateOffered
      ? availabilityByDate[selectedDate]
      : undefined;

  const spotsForSelectedDate = availableSpotsForSelectedDate ?? 0;

  const maxGuestsForSelectedDate =
    selectedDate && availabilityStatus === "loaded"
      ? Math.min(maxGuests, spotsForSelectedDate)
      : maxGuests;

  const guestStepperCap =
    selectedDate && availabilityStatus === "loaded"
      ? Math.max(1, maxGuestsForSelectedDate)
      : maxGuests;

  useEffect(() => {
    if (!selectedDate || availabilityStatus !== "loaded") return;

    setGuestCount((current) => Math.min(current, guestStepperCap));
  }, [availabilityStatus, guestStepperCap, selectedDate]);

  const totalPrice = Math.max(0, tour.price) * guestCount;

  const isBookingDisabled =
    !selectedDate ||
    availabilityStatus !== "loaded" ||
    spotsForSelectedDate < guestCount;

  const categoryColors: Record<string, string> = {
    food: "bg-linear-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-200",
    nature:
      "bg-linear-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200",
    culture:
      "bg-linear-to-r from-primary/15 to-secondary/15 text-primary border-primary/20",
    adventure:
      "bg-linear-to-r from-rose-100 to-pink-100 text-rose-700 border-rose-200",
    history:
      "bg-linear-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-200",
  };

  const galleryImages = [
    tour.image,
    "/traditional-food-market-with-colorful-spices.jpg",
    "/hidden-waterfall-in-lush-forest.jpg",
    "/sunset-view-from-secret-local-viewpoint.jpg",
  ];

  return (
    <PageShell variant="full">

      {/* Hero Section - Organic Scattered Gallery */}
      <section className="relative py-8 md:py-12 overflow-hidden">
        {/* Organic background blobs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-[10%] w-[400px] h-[400px] bg-primary/6 rounded-[40%_60%_70%_30%/30%_50%_70%_60%] blur-3xl" />
          <div className="absolute bottom-0 left-[5%] w-[500px] h-[500px] bg-secondary/5 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] blur-3xl" />
        </div>

        <div className="container">
          {/* Title and badges - Floating above gallery */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                className={`${categoryColors[tour.category]} rounded-full px-4 py-1.5 text-sm font-medium border`}
              >
                {tour.category.charAt(0).toUpperCase() + tour.category.slice(1)}
              </Badge>
              <Badge className="bg-linear-to-r from-primary/10 to-secondary/10 text-primary border-primary/20 rounded-full px-4 py-1.5">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Local Favorite
              </Badge>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance leading-tight">
              {tour.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">
                  {tour.location}, {tour.country}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-secondary/10 rounded-full px-3 py-1">
                  <Star className="h-4 w-4 fill-secondary text-secondary" />
                  <span className="font-bold text-foreground">
                    {tour.rating}
                  </span>
                </div>
                <span>({tour.reviewCount} reviews)</span>
              </div>
            </div>
          </div>

          {/* Organic Image Gallery */}
          <div className="relative h-[400px] md:h-[500px] lg:h-[550px]">
            {/* Main large image */}
            <div className="absolute top-0 left-0 w-[65%] h-[70%] group z-10">
              <Card className="overflow-hidden h-full border-2 border-primary/20 hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:-rotate-1 hover:scale-[1.02] rounded-[2.5rem] shadow-xl">
                <div className="relative h-full">
                  <Image
                    src={galleryImages[0] || "/placeholder.svg"}
                    alt={tour.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    priority
                  />
                  <div className="absolute bottom-4 left-4">
                    <Badge className="bg-background/90 backdrop-blur-sm text-foreground rounded-full px-4 py-2">
                      <Camera className="h-4 w-4 mr-2" />
                      Tour Highlights
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>

            {/* Top right image */}
            <div className="absolute top-0 right-0 w-[32%] h-[45%] group">
              <Card className="overflow-hidden h-full border-2 border-secondary/20 hover:border-secondary/40 transition-all duration-500 hover:shadow-2xl hover:rotate-2 hover:scale-105 rounded-2rem shadow-lg">
                <div className="relative h-full">
                  <Image
                    src={galleryImages[1] || "/placeholder.svg"}
                    alt="Tour experience"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
              </Card>
            </div>

            {/* Bottom right image */}
            <div className="absolute bottom-0 right-[5%] w-[35%] h-[50%] group">
              <Card className="overflow-hidden h-full border-2 border-primary/20 hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:-rotate-2 hover:scale-105 rounded-4xl shadow-lg">
                <div className="relative h-full">
                  <Image
                    src={galleryImages[2] || "/placeholder.svg"}
                    alt="Tour scenery"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
              </Card>
            </div>

            {/* Bottom left small image */}
            <div className="absolute bottom-0 left-[10%] w-[28%] h-[28%] group z-20">
              <Card className="overflow-hidden h-full border-2 border-secondary/20 hover:border-secondary/40 transition-all duration-500 hover:shadow-2xl hover:rotate-3 hover:scale-105 rounded-3xl shadow-lg">
                <div className="relative h-full">
                  <Image
                    src={galleryImages[3] || "/placeholder.svg"}
                    alt="Tour moment"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
              </Card>
            </div>

            {/* Floating action buttons */}
            <div className="absolute top-4 right-4 flex gap-2 z-30">
              <Button
                size="icon"
                className="rounded-full bg-background/90 backdrop-blur-sm text-foreground hover:bg-background shadow-lg h-12 w-12"
              >
                <Heart className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                className="rounded-full bg-background/90 backdrop-blur-sm text-foreground hover:bg-background shadow-lg h-12 w-12"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 relative overflow-hidden">
        <div className="absolute right-[5%] top-1/3 w-96 h-96 bg-primary/3 rounded-[50%_50%_40%_60%] blur-3xl -z-10" />

        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-10">
              {/* Quick Info - Organic Cards */}
              <div className="flex flex-wrap gap-4">
                <Card className="flex-1 min-w-[140px] border-2 border-primary/10 hover:border-primary/30 rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
                  <CardContent className="pt-6 pb-5 px-5 flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-primary/15 to-primary/5 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Duration
                      </div>
                      <div className="font-bold text-lg">{tour.duration}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="flex-1 min-w-[140px] border-2 border-secondary/10 hover:border-secondary/30 rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
                  <CardContent className="pt-6 pb-5 px-5 flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-secondary/15 to-secondary/5 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                      <Users className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Group Size
                      </div>
                      <div className="font-bold text-lg">{tour.groupSize}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="flex-1 min-w-[140px] border-2 border-primary/10 hover:border-primary/30 rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
                  <CardContent className="pt-6 pb-5 px-5 flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-primary/15 to-secondary/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <Globe className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Languages
                      </div>
                      <div className="font-bold text-base">
                        {tour.guide.languages.slice(0, 2).join(", ")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* About Section */}
              <Card className="border-2 border-muted hover:border-primary/20 rounded-4xl transition-all duration-300 overflow-hidden">
                <CardContent className="pt-8 pb-8 px-8 space-y-5">
                  <h2 className="text-2xl md:text-3xl font-bold">
                    About This Experience
                  </h2>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {tour.description}
                  </p>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    This unique journey takes you beyond typical tourist paths
                    to discover the authentic heart of {tour.location}. Explore
                    hidden locations, meet local people, and gain insights that
                    only someone who truly knows this place can provide.
                  </p>
                </CardContent>
              </Card>

              {/* Highlights - Organic scattered tags */}
              <div className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold">
                  What's Included
                </h2>
                <div className="flex flex-wrap gap-3">
                  {tour.highlights.map((highlight, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-2 bg-linear-to-r from-primary/10 to-secondary/10 border-2 border-primary/15 rounded-full px-5 py-3 hover:border-primary/30 hover:scale-105 transition-all duration-300 cursor-default"
                    >
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span className="font-medium">{highlight}</span>
                    </div>
                  ))}
                  <div className="inline-flex items-center gap-2 bg-linear-to-r from-secondary/10 to-primary/10 border-2 border-secondary/15 rounded-full px-5 py-3 hover:border-secondary/30 hover:scale-105 transition-all duration-300 cursor-default">
                    <CheckCircle2 className="h-5 w-5 text-secondary" />
                    <span className="font-medium">Expert local guide</span>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-linear-to-r from-primary/10 to-secondary/10 border-2 border-primary/15 rounded-full px-5 py-3 hover:border-primary/30 hover:scale-105 transition-all duration-300 cursor-default">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="font-medium">Small group experience</span>
                  </div>
                </div>
              </div>

              {/* Meet Your Guide - Organic Card */}
              <Card className="border-2 border-secondary/20 hover:border-secondary/40 rounded-[2.5rem] transition-all duration-500 hover:shadow-xl overflow-hidden bg-linear-to-br from-secondary/5 to-transparent">
                <CardContent className="pt-8 pb-8 px-8 space-y-6">
                  <h2 className="text-2xl md:text-3xl font-bold">
                    Meet Your Guide
                  </h2>

                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="relative">
                      <Avatar className="h-28 w-28 border-4 border-secondary/20 shadow-xl">
                        <AvatarImage
                          src={tour.guide.avatar || "/placeholder.svg"}
                          alt={tour.guide.name}
                        />
                        <AvatarFallback className="text-2xl bg-linear-to-br from-primary to-secondary text-primary-foreground">
                          {tour.guide.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {tour.guide.verified && (
                        <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                          <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-2xl font-bold">
                          {tour.guide.name}
                        </h3>
                        <p className="text-muted-foreground">
                          Local expert in {tour.location}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <div className="inline-flex items-center gap-2 bg-secondary/10 rounded-full px-4 py-2">
                          <Star className="h-4 w-4 fill-secondary text-secondary" />
                          <span className="font-semibold">{tour.rating}</span>
                          <span className="text-muted-foreground text-sm">
                            ({tour.reviewCount} reviews)
                          </span>
                        </div>
                        <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2">
                          <Globe className="h-4 w-4 text-primary" />
                          <span className="text-sm">
                            {tour.guide.languages.join(", ")}
                          </span>
                        </div>
                      </div>

                      <p className="text-muted-foreground leading-relaxed">
                        Born and raised in {tour.location}, I've spent my entire
                        life exploring every corner of this incredible place.
                        What started as showing friends around has become my
                        passion—sharing the hidden gems and authentic
                        experiences that make my home so special.
                      </p>

                      <Button
                        className="rounded-full px-6 bg-transparent"
                        variant="outline"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Message Guide
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reviews Section - Organic Layout */}
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl md:text-3xl font-bold">
                    What Travelers Say
                  </h2>
                  <div className="flex items-center gap-2 bg-linear-to-r from-secondary/15 to-primary/15 rounded-full px-5 py-2">
                    <Star className="h-5 w-5 fill-secondary text-secondary" />
                    <span className="text-xl font-bold">{tour.rating}</span>
                    <span className="text-muted-foreground">
                      ({tour.reviewCount})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reviews.length > 0 ? (
                    reviews.map((review, index) => (
                      <Card
                        key={review.id}
                        className={`border-2 hover:border-primary/30 rounded-4xl transition-all duration-500 hover:shadow-lg hover:-translate-y-1 ${
                          index === 0
                            ? "md:col-span-2 bg-linear-to-br from-primary/5 to-secondary/5"
                            : ""
                        }`}
                      >
                        <CardContent className="pt-6 pb-6 px-6 space-y-4">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12 border-2 border-primary/10">
                              <AvatarImage
                                src={review.avatar || "/placeholder.svg"}
                                alt={review.author}
                              />
                              <AvatarFallback className="bg-linear-to-br from-primary/20 to-secondary/20">
                                {review.author
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-semibold">
                                    {review.author}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {new Date(review.date).toLocaleDateString(
                                      "en-US",
                                      {
                                        year: "numeric",
                                        month: "long",
                                      },
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: review.rating }).map(
                                    (_, i) => (
                                      <Star
                                        key={i}
                                        className="h-4 w-4 fill-secondary text-secondary"
                                      />
                                    ),
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="relative pl-4 border-l-2 border-primary/20">
                            <Quote className="absolute -left-3 -top-1 h-6 w-6 text-primary/30 fill-primary/10" />
                            <p className="text-muted-foreground leading-relaxed">
                              {review.comment}
                            </p>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full text-xs"
                          >
                            <ThumbsUp className="mr-1.5 h-3.5 w-3.5" />
                            Helpful ({review.helpful})
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="md:col-span-2 border-2 border-dashed border-muted-foreground/20 rounded-4xl">
                      <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">
                          No reviews yet. Be the first to share your experience!
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {reviews.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full rounded-full bg-transparent"
                  >
                    Show All {tour.reviewCount} Reviews
                  </Button>
                )}
              </div>
            </div>

            {/* Right Column - Booking Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-2 border-primary/20 hover:border-primary/40 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden bg-linear-to-br from-background to-muted/30">
                <CardContent className="pt-8 pb-8 px-8 space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">
                        {formatPrice(tour.price)}
                      </span>
                      <span className="text-muted-foreground text-lg">
                        / person
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < Math.floor(tour.rating) ? "fill-secondary text-secondary" : "text-muted"}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {tour.reviewCount} reviews
                      </span>
                    </div>
                  </div>

                  <div className="h-px bg-linear-to-r from-transparent via-border to-transparent" />

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Select Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                        <Input
                          id="tour-date"
                          type="date"
                          min={todayLocalISO}
                          max={openDates.length > 0 ? openDates[openDates.length - 1] : undefined}
                          list="tour-open-dates"
                          className="w-full rounded-xl h-12 border-2 bg-transparent pl-11"
                          value={selectedDate}
                          onChange={(event) => setSelectedDate(event.target.value)}
                        />
                        <datalist id="tour-open-dates">
                          {openDates.map((date) => (
                            <option key={date} value={date} />
                          ))}
                        </datalist>
                      </div>
                      <p
                        className={`mt-2 text-xs ${
                          availabilityStatus === "error" ||
                          (availabilityStatus === "loaded" &&
                            selectedDate &&
                            spotsForSelectedDate === 0)
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }`}
                      >
                        {!selectedDate
                          ? availabilityStatus === "loaded" && openDates.length === 0
                            ? "This tour has no open dates right now."
                            : "Select a date to check availability."
                          : availabilityStatus === "loading"
                            ? "Checking availability..."
                            : availabilityStatus === "error"
                              ? "Couldn't load availability."
                              : !isDateOffered
                                ? "This tour doesn't run on that date. Pick one of the dates below."
                                : spotsForSelectedDate === 0
                                  ? "Fully booked for this date."
                                  : spotsForSelectedDate < guestCount
                                    ? `Only ${spotsForSelectedDate} ${
                                        spotsForSelectedDate === 1 ? "spot" : "spots"
                                      } left.`
                                    : `${spotsForSelectedDate} ${
                                        spotsForSelectedDate === 1 ? "spot" : "spots"
                                      } available.`}
                      </p>

                      {availabilityStatus === "loaded" && openDates.length > 0 ? (
                        <div className="mt-3">
                          <p className="mb-2 text-xs font-medium text-muted-foreground">
                            Next available dates
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {openDates.slice(0, 6).map((date) => (
                              <Button
                                key={date}
                                type="button"
                                size="sm"
                                variant={date === selectedDate ? "default" : "outline"}
                                className="rounded-full text-xs"
                                onClick={() => setSelectedDate(date)}
                              >
                                {shortDateFormatter.format(
                                  new Date(`${date}T00:00:00`)
                                )}
                                <span className="ml-1 opacity-70">
                                  · {availabilityByDate[date]}
                                </span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Guests
                      </label>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-xl h-12 w-12 border-2 bg-transparent"
                          onClick={() =>
                            setGuestCount((current) => Math.max(1, current - 1))
                          }
                          disabled={guestCount <= 1}
                          aria-label="Decrease guests"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 flex items-center justify-between rounded-xl h-12 border-2 bg-transparent px-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="font-medium">
                              {guestCount} {guestCount === 1 ? "guest" : "guests"}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {selectedDate && availabilityStatus === "loaded" ? (
                              maxGuestsForSelectedDate > 0 ? (
                                <>Max {maxGuestsForSelectedDate}</>
                              ) : isDateOffered ? (
                                <>Fully booked</>
                              ) : (
                                <>Not offered</>
                              )
                            ) : (
                              <>Max {maxGuests}</>
                            )}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-xl h-12 w-12 border-2 bg-transparent"
                          onClick={() =>
                            setGuestCount((current) =>
                              Math.min(guestStepperCap, current + 1)
                            )
                          }
                          disabled={guestCount >= guestStepperCap}
                          aria-label="Increase guests"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-muted/40 p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {formatPrice(tour.price)} × {guestCount}{" "}
                        {guestCount === 1 ? "guest" : "guests"}
                      </span>
                      <span className="font-medium">
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-base font-semibold">
                      <span>Total</span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full rounded-full h-14 text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40"
                    size="lg"
                    onClick={handleBooking}
                    disabled={isBookingDisabled || isBooking}
                  >
                    {isBooking
                      ? "Sending request..."
                      : !selectedDate
                        ? "Select a date"
                        : availabilityStatus !== "loaded"
                          ? "Checking availability..."
                          : !isDateOffered
                            ? "Not available on this date"
                            : spotsForSelectedDate === 0
                              ? "Fully booked"
                              : spotsForSelectedDate < guestCount
                                ? "Not enough spots"
                                : `Book for ${formatPrice(totalPrice)}`}
                  </Button>

                  {bookingErrorMessage ? (
                    <p className="text-xs text-center text-destructive">
                      {bookingErrorMessage}
                    </p>
                  ) : null}

                  <p className="text-xs text-center text-muted-foreground">
                    Free cancellation up to 24 hours before
                  </p>

                  <div className="h-px bg-linear-to-r from-transparent via-border to-transparent" />

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-muted-foreground">
                        Secure booking & payment
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-secondary" />
                      </div>
                      <span className="text-muted-foreground">
                        Instant confirmation
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-muted-foreground">
                        Direct guide contact
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Similar Experiences - Organic Grid */}
      <section className="py-16 lg:py-24 bg-linear-to-b from-muted/30 to-transparent relative overflow-hidden">
        <div className="absolute left-[10%] top-1/3 w-[400px] h-[400px] bg-secondary/4 rounded-[50%_50%_40%_60%] blur-3xl -z-10" />

        <div className="container">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Similar Experiences
            </h2>
            <p className="text-lg text-muted-foreground">
              More adventures you might love
            </p>
          </div>

          {similarTours.length === 0 ? (
            <Card className="border-2 border-dashed rounded-[2.5rem] bg-background/60">
              <CardContent className="pt-10 pb-10 px-10 text-center space-y-3">
                <h3 className="text-xl font-semibold">No similar tours yet</h3>
                <p className="text-muted-foreground">
                  Check back later, or explore more experiences in your
                  destination.
                </p>
                <Button asChild className="rounded-full">
                  <Link href={`/${locale}/browse`}>Browse tours</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarTours.slice(0, 3).map((similarTour, index) => (
                <Link
                  key={similarTour.id}
                  href={`/${locale}/tour/${similarTour.id}`}
                >
                  <Card
                    className={`overflow-hidden h-full border-2 hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 rounded-2rem group ${
                      index === 1
                        ? "hover:rotate-1"
                        : index === 0
                          ? "hover:-rotate-1"
                          : "hover:rotate-2"
                    }`}
                  >
                    <div className="relative aspect-4/3">
                      <Image
                        src={similarTour.image || "/placeholder.svg"}
                        alt={similarTour.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge
                          className={`${categoryColors[similarTour.category]} rounded-full`}
                        >
                          {similarTour.category}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="pt-5 pb-6 space-y-3">
                      <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {similarTour.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {similarTour.location}, {similarTour.country}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1 bg-secondary/10 rounded-full px-3 py-1">
                          <Star className="h-4 w-4 fill-secondary text-secondary" />
                          <span className="font-semibold">
                            {similarTour.rating}
                          </span>
                        </div>
                        <div className="text-2xl font-bold">
                          {formatPrice(similarTour.price)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Dialog open={bookingConfirmed} onOpenChange={setBookingConfirmed}>
        <DialogContent className="max-w-sm text-center sm:max-w-md">
          <DialogHeader className="items-center gap-3">
            <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="size-12 text-primary" strokeWidth={2.2} />
            </div>
            <DialogTitle className="text-2xl">
              {tBooking("sentTitle")}
            </DialogTitle>
            <DialogDescription className="text-balance">
              {tBooking("sentBody", { guide: tour.guide.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              className="w-full rounded-full sm:w-40"
              onClick={() => setBookingConfirmed(false)}
            >
              {tBooking("sentAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
