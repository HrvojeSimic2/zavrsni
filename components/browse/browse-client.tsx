'use client'

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { GuideCard } from "@/components/cards/guide-card";
import { Tour } from "@/lib/types/tour";

type BrowseClientProps = {
  tours: Tour[];
};

export function BrowseClient({ tours }: BrowseClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popular");

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "food", label: "Food Tours" },
    { value: "nature", label: "Nature & Adventure" },
    { value: "culture", label: "Cultural Experiences" },
    { value: "adventure", label: "Adventure" },
    { value: "history", label: "History" },
  ];

  const countries = [
    { value: "all", label: "All Countries" },
    ...Array.from(new Set(tours.map((tour) => tour.country)))
      .sort((a, b) => a.localeCompare(b))
      .map((country) => ({ value: country, label: country })),
  ];

  const languages = [
    { value: "all", label: "All Languages" },
    ...Array.from(new Set(tours.flatMap((tour) => tour.guide.languages)))
      .sort((a, b) => a.localeCompare(b))
      .map((language) => ({ value: language, label: language })),
  ];

  const filteredTours = useMemo(() => {
    let filtered = [...tours];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tour) =>
          tour.title.toLowerCase().includes(query) ||
          tour.description.toLowerCase().includes(query) ||
          tour.location.toLowerCase().includes(query) ||
          tour.guide.name.toLowerCase().includes(query) ||
          tour.guide.languages.some((language) =>
            language.toLowerCase().includes(query)
          )
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((tour) => tour.category === selectedCategory);
    }

    if (selectedCountry !== "all") {
      filtered = filtered.filter((tour) => tour.country === selectedCountry);
    }

    if (selectedLanguage !== "all") {
      filtered = filtered.filter((tour) =>
        tour.guide.languages.includes(selectedLanguage)
      );
    }

    if (sortBy === "popular") {
      filtered.sort((a, b) => b.reviewCount - a.reviewCount);
    } else if (sortBy === "rating") {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.guide.name.localeCompare(b.guide.name));
    }

    return filtered;
  }, [tours, searchQuery, selectedCategory, selectedCountry, selectedLanguage, sortBy]);

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedCountry("all");
    setSelectedLanguage("all");
    setSearchQuery("");
  };

  return (
    <>
      <section className="bg-linear-to-br from-primary/10 via-background to-secondary/10 border-b">
        <div className="container py-12">
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-balance">
              Meet the Guides Behind the Magic
            </h1>
            <p className="text-lg text-muted-foreground text-pretty">
              Explore passionate storytellers, food experts, and culture keepers
              ready to design a one-of-a-kind visit just for you.
            </p>
          </div>

          <div className="mt-8 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by guide name, city, or language..."
                className="pl-10 h-12"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 bg-muted/30">
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-8">
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
                    <label className="text-sm font-medium">Guide Specialty</label>
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Country</label>
                    <Select
                      value={selectedCountry}
                      onValueChange={setSelectedCountry}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Language</label>
                    <Select
                      value={selectedLanguage}
                      onValueChange={setSelectedLanguage}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((language) => (
                          <SelectItem key={language.value} value={language.value}>
                            {language.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button variant="outline" className="w-full" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            </aside>

            <div className="flex-1 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-semibold text-foreground">
                    {filteredTours.length}
                  </span>{" "}
                  {filteredTours.length === 1 ? "guide" : "guides"}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Sort by:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">Most Recommended</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredTours.length === 0 ? (
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
                      Try adjusting your filters or search query to discover more
                      locals
                    </p>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear All Filters
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredTours.map((tour) => (
                    <GuideCard key={tour.id} tour={tour} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
