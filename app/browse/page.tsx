'use client'

import { useState, useMemo } from 'react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mockTours, type Tour } from '@/lib/mock-data'
import { Search, MapPin, Star, Clock, Users, ChevronDown, SlidersHorizontal, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [priceRange, setPriceRange] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('popular')

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'food', label: 'Food Tours' },
    { value: 'nature', label: 'Nature & Adventure' },
    { value: 'culture', label: 'Cultural Experiences' },
    { value: 'adventure', label: 'Adventure' },
    { value: 'history', label: 'History' },
  ]

  const countries = [
    { value: 'all', label: 'All Countries' },
    ...Array.from(new Set(mockTours.map(t => t.country))).map(c => ({ value: c, label: c }))
  ]

  const filteredTours = useMemo(() => {
    let filtered = [...mockTours]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(tour =>
        tour.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tour.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tour.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tour => tour.category === selectedCategory)
    }

    // Country filter
    if (selectedCountry !== 'all') {
      filtered = filtered.filter(tour => tour.country === selectedCountry)
    }

    // Price range filter
    if (priceRange !== 'all') {
      if (priceRange === 'budget') {
        filtered = filtered.filter(tour => tour.price < 50)
      } else if (priceRange === 'mid') {
        filtered = filtered.filter(tour => tour.price >= 50 && tour.price < 70)
      } else if (priceRange === 'premium') {
        filtered = filtered.filter(tour => tour.price >= 70)
      }
    }

    // Sort
    if (sortBy === 'popular') {
      filtered.sort((a, b) => b.reviewCount - a.reviewCount)
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating)
    } else if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price)
    }

    return filtered
  }, [searchQuery, selectedCategory, selectedCountry, priceRange, sortBy])

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      {/* Header */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-b">
        <div className="container py-12">
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-balance">
              Discover Authentic Local Experiences
            </h1>
            <p className="text-lg text-muted-foreground text-pretty">
              Browse tours led by passionate local guides who share their hidden gems and cultural insights
            </p>
          </div>

          {/* Search Bar */}
          <div className="mt-8 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by destination, activity, or keyword..."
                className="pl-10 h-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Results */}
      <section className="py-8 bg-muted/30">
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:w-64 space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">Filters</h3>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Country</label>
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map(country => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price Range</label>
                    <Select value={priceRange} onValueChange={setPriceRange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Prices</SelectItem>
                        <SelectItem value="budget">Budget (&lt; $50)</SelectItem>
                        <SelectItem value="mid">Mid-range ($50-70)</SelectItem>
                        <SelectItem value="premium">Premium ($70+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedCategory('all')
                      setSelectedCountry('all')
                      setPriceRange('all')
                      setSearchQuery('')
                    }}
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            </aside>

            {/* Results */}
            <div className="flex-1 space-y-6">
              {/* Sort & Count */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{filteredTours.length}</span> {filteredTours.length === 1 ? 'experience' : 'experiences'}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Sort by:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tour Grid */}
              {filteredTours.length === 0 ? (
                <Card className="p-12">
                  <div className="text-center space-y-3">
                    <div className="flex justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <Search className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold">No tours found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your filters or search query
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedCategory('all')
                        setSelectedCountry('all')
                        setPriceRange('all')
                        setSearchQuery('')
                      }}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredTours.map(tour => (
                    <TourCard key={tour.id} tour={tour} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function TourCard({ tour }: { tour: Tour }) {
  const categoryColors = {
    food: 'bg-secondary/10 text-secondary border-secondary/20',
    nature: 'bg-primary/10 text-primary border-primary/20',
    culture: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
    adventure: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
    history: 'bg-chart-5/10 text-chart-5 border-chart-5/20',
  }

  return (
    <Link href={`/tour/${tour.id}`}>
      <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow group">
        <div className="relative h-48 overflow-hidden">
          <Image
            src={tour.image || "/placeholder.svg"}
            alt={tour.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <Badge className={`absolute top-3 right-3 ${categoryColors[tour.category]}`}>
            {tour.category.charAt(0).toUpperCase() + tour.category.slice(1)}
          </Badge>
        </div>

        <CardContent className="pt-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {tour.title}
            </h3>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{tour.location}, {tour.country}</span>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {tour.description}
          </p>

          <div className="flex items-center gap-3 pt-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={tour.guide.avatar || "/placeholder.svg"} alt={tour.guide.name} />
              <AvatarFallback>{tour.guide.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium truncate">{tour.guide.name}</p>
                {tour.guide.verified && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {tour.guide.languages.join(', ')}
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-secondary text-secondary" />
              <span className="font-semibold">{tour.rating}</span>
              <span className="text-sm text-muted-foreground">({tour.reviewCount})</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{tour.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>{tour.groupSize.split(' ')[1]}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">${tour.price}</div>
            <div className="text-xs text-muted-foreground">per person</div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
