'use client'

import { use } from 'react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { mockTours, mockReviews } from '@/lib/mock-data'
import { MapPin, Star, Clock, Users, CheckCircle2, Calendar, Globe, Shield, Heart, Share2, MessageCircle, ThumbsUp, Sparkles, Camera, Quote } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default function TourDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const tour = mockTours.find(t => t.id === id)
  const reviews = mockReviews[id] || []

  if (!tour) {
    notFound()
  }

  const categoryColors: Record<string, string> = {
    food: 'bg-linear-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-200',
    nature: 'bg-linear-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200',
    culture: 'bg-linear-to-r from-primary/15 to-secondary/15 text-primary border-primary/20',
    adventure: 'bg-linear-to-r from-rose-100 to-pink-100 text-rose-700 border-rose-200',
    history: 'bg-linear-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-200',
  }

  const galleryImages = [
    tour.image,
    '/traditional-food-market-with-colorful-spices.jpg',
    '/hidden-waterfall-in-lush-forest.jpg',
    '/sunset-view-from-secret-local-viewpoint.jpg',
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

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
              <Badge className={`${categoryColors[tour.category]} rounded-full px-4 py-1.5 text-sm font-medium border`}>
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
                <span className="font-medium text-foreground">{tour.location}, {tour.country}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-secondary/10 rounded-full px-3 py-1">
                  <Star className="h-4 w-4 fill-secondary text-secondary" />
                  <span className="font-bold text-foreground">{tour.rating}</span>
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
              <Card className="overflow-hidden h-full border-2 border-secondary/20 hover:border-secondary/40 transition-all duration-500 hover:shadow-2xl hover:rotate-2 hover:scale-105 rounded-4xl shadow-lg">
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
              <Button size="icon" className="rounded-full bg-background/90 backdrop-blur-sm text-foreground hover:bg-background shadow-lg h-12 w-12">
                <Heart className="h-5 w-5" />
              </Button>
              <Button size="icon" className="rounded-full bg-background/90 backdrop-blur-sm text-foreground hover:bg-background shadow-lg h-12 w-12">
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
                      <div className="text-sm text-muted-foreground">Duration</div>
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
                      <div className="text-sm text-muted-foreground">Group Size</div>
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
                      <div className="text-sm text-muted-foreground">Languages</div>
                      <div className="font-bold text-base">{tour.guide.languages.slice(0, 2).join(', ')}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* About Section */}
              <Card className="border-2 border-muted hover:border-primary/20 rounded-4xl transition-all duration-300 overflow-hidden">
                <CardContent className="pt-8 pb-8 px-8 space-y-5">
                  <h2 className="text-2xl md:text-3xl font-bold">About This Experience</h2>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {tour.description}
                  </p>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    This unique journey takes you beyond typical tourist paths to discover the authentic heart 
                    of {tour.location}. Explore hidden locations, meet local people, and gain insights that only 
                    someone who truly knows this place can provide.
                  </p>
                </CardContent>
              </Card>

              {/* Highlights - Organic scattered tags */}
              <div className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold">What's Included</h2>
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
                  <h2 className="text-2xl md:text-3xl font-bold">Meet Your Guide</h2>
                  
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="relative">
                      <Avatar className="h-28 w-28 border-4 border-secondary/20 shadow-xl">
                        <AvatarImage src={tour.guide.avatar || "/placeholder.svg"} alt={tour.guide.name} />
                        <AvatarFallback className="text-2xl bg-linear-to-br from-primary to-secondary text-primary-foreground">
                          {tour.guide.name.split(' ').map(n => n[0]).join('')}
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
                        <h3 className="text-2xl font-bold">{tour.guide.name}</h3>
                        <p className="text-muted-foreground">Local expert in {tour.location}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        <div className="inline-flex items-center gap-2 bg-secondary/10 rounded-full px-4 py-2">
                          <Star className="h-4 w-4 fill-secondary text-secondary" />
                          <span className="font-semibold">{tour.rating}</span>
                          <span className="text-muted-foreground text-sm">({tour.reviewCount} reviews)</span>
                        </div>
                        <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2">
                          <Globe className="h-4 w-4 text-primary" />
                          <span className="text-sm">{tour.guide.languages.join(', ')}</span>
                        </div>
                      </div>

                      <p className="text-muted-foreground leading-relaxed">
                        Born and raised in {tour.location}, I've spent my entire life exploring every corner of this 
                        incredible place. What started as showing friends around has become my passion—sharing the hidden 
                        gems and authentic experiences that make my home so special.
                      </p>

                      <Button className="rounded-full px-6 bg-transparent" variant="outline">
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
                  <h2 className="text-2xl md:text-3xl font-bold">What Travelers Say</h2>
                  <div className="flex items-center gap-2 bg-linear-to-r from-secondary/15 to-primary/15 rounded-full px-5 py-2">
                    <Star className="h-5 w-5 fill-secondary text-secondary" />
                    <span className="text-xl font-bold">{tour.rating}</span>
                    <span className="text-muted-foreground">({tour.reviewCount})</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reviews.length > 0 ? (
                    reviews.map((review, index) => (
                      <Card 
                        key={review.id} 
                        className={`border-2 hover:border-primary/30 rounded-4xl transition-all duration-500 hover:shadow-lg hover:-translate-y-1 ${
                          index === 0 ? 'md:col-span-2 bg-linear-to-br from-primary/5 to-secondary/5' : ''
                        }`}
                      >
                        <CardContent className="pt-6 pb-6 px-6 space-y-4">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12 border-2 border-primary/10">
                              <AvatarImage src={review.avatar || "/placeholder.svg"} alt={review.author} />
                              <AvatarFallback className="bg-linear-to-br from-primary/20 to-secondary/20">
                                {review.author.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-semibold">{review.author}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {new Date(review.date).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'long'
                                    })}
                                  </div>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: review.rating }).map((_, i) => (
                                    <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="relative pl-4 border-l-2 border-primary/20">
                            <Quote className="absolute -left-3 -top-1 h-6 w-6 text-primary/30 fill-primary/10" />
                            <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
                          </div>

                          <Button variant="ghost" size="sm" className="rounded-full text-xs">
                            <ThumbsUp className="mr-1.5 h-3.5 w-3.5" />
                            Helpful ({review.helpful})
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="md:col-span-2 border-2 border-dashed border-muted-foreground/20 rounded-4xl">
                      <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">No reviews yet. Be the first to share your experience!</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {reviews.length > 0 && (
                  <Button variant="outline" className="w-full rounded-full bg-transparent">
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
                      <span className="text-5xl font-bold">${tour.price}</span>
                      <span className="text-muted-foreground text-lg">/ person</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < Math.floor(tour.rating) ? 'fill-secondary text-secondary' : 'text-muted'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">{tour.reviewCount} reviews</span>
                    </div>
                  </div>

                  <div className="h-px bg-linear-to-r from-transparent via-border to-transparent" />

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Select Date</label>
                      <Button variant="outline" className="w-full justify-start rounded-xl h-12 border-2 bg-transparent">
                        <Calendar className="mr-2 h-4 w-4 text-primary" />
                        Choose a date
                      </Button>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Guests</label>
                      <Button variant="outline" className="w-full justify-start rounded-xl h-12 border-2 bg-transparent">
                        <Users className="mr-2 h-4 w-4 text-primary" />
                        1 guest
                      </Button>
                    </div>
                  </div>

                  <Button className="w-full rounded-full h-14 text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40" size="lg">
                    Book Now
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Free cancellation up to 24 hours before
                  </p>

                  <div className="h-px bg-linear-to-r from-transparent via-border to-transparent" />

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-muted-foreground">Secure booking & payment</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-secondary" />
                      </div>
                      <span className="text-muted-foreground">Instant confirmation</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-muted-foreground">Direct guide contact</span>
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
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">Similar Experiences</h2>
            <p className="text-lg text-muted-foreground">More adventures you might love</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockTours
              .filter(t => t.id !== id && t.category === tour.category)
              .slice(0, 3)
              .map((similarTour, index) => (
                <Link key={similarTour.id} href={`/tour/${similarTour.id}`}>
                  <Card className={`overflow-hidden h-full border-2 hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 rounded-4xl group ${
                    index === 1 ? 'hover:rotate-1' : index === 0 ? 'hover:-rotate-1' : 'hover:rotate-2'
                  }`}>
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={similarTour.image || "/placeholder.svg"}
                        alt={similarTour.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className={`${categoryColors[similarTour.category]} rounded-full`}>
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
                        <span>{similarTour.location}, {similarTour.country}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1 bg-secondary/10 rounded-full px-3 py-1">
                          <Star className="h-4 w-4 fill-secondary text-secondary" />
                          <span className="font-semibold">{similarTour.rating}</span>
                        </div>
                        <div className="text-2xl font-bold">${similarTour.price}</div>
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
  )
}
