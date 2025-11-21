"use client";

import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DollarSign,
  Users,
  Calendar,
  Heart,
  TrendingUp,
  Award,
  Globe,
  Shield,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Clock,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";

export default function BecomeGuidePage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    languages: "",
    experience: "",
    tourIdeas: "",
    agreedToTerms: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Handle form submission
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50"></div>
        </div>
        <div className="container py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <Badge className="bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30 border-primary-foreground/30">
                <Sparkles className="mr-1 h-3 w-3" />
                Join Our Community
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
                Share Your City, Earn Your Way
              </h1>
              <p className="text-xl leading-relaxed text-primary-foreground/90 text-pretty">
                Turn your local knowledge into a rewarding experience. Join
                thousands of passionate guides sharing authentic experiences
                with travelers worldwide.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-base">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base border-primary-foreground/20 bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground"
              >
                Watch Video
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 pt-8 text-primary-foreground/90">
              <div>
                <div className="text-3xl font-bold">$2,500</div>
                <div className="text-sm">Avg Monthly Income</div>
              </div>
              <div className="h-12 w-px bg-primary-foreground/20" />
              <div>
                <div className="text-3xl font-bold">5,000+</div>
                <div className="text-sm">Active Guides</div>
              </div>
              <div className="h-12 w-px bg-primary-foreground/20" />
              <div>
                <div className="text-3xl font-bold">4.9</div>
                <div className="text-sm">Avg Guide Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-balance">
              Why Become a LocalPath Guide
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Join a platform designed to support you in sharing your passion
              while building a sustainable income
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                  <DollarSign className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-semibold text-xl">Earn Good Income</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Set your own prices and keep 85% of your earnings. Many guides
                  make $2,000-5,000/month part-time.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-xl">Flexible Schedule</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Work when you want. Set your availability and accept bookings
                  that fit your schedule.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-xl">Meet Amazing People</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Connect with curious travelers from around the world and make
                  lasting friendships.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                  <Heart className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-semibold text-xl">Share Your Passion</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Show off the places you love and share the stories that make
                  your city special.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-xl">Grow Your Business</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Access marketing tools, analytics, and support to help you
                  succeed and scale.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                  <Shield className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-semibold text-xl">Protected Platform</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Insurance coverage, secure payments, and 24/7 support keep you
                  and your guests safe.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-balance">
              Getting Started is Easy
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              From application to your first tour in just a few simple steps
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold shrink-0">
                1
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-semibold">Apply Online</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Fill out a simple application telling us about yourself, your
                  city, and the experiences you want to share. It takes just 10
                  minutes.
                </p>
              </div>
              <div className="hidden md:block w-48 h-32 relative rounded-lg overflow-hidden shrink-0">
                <Image
                  src="/placeholder.svg?key=step1"
                  alt="Apply online"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold shrink-0">
                2
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-semibold">Get Verified</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Complete our quick verification process and identity check. We
                  review applications within 48 hours and provide feedback to
                  help you succeed.
                </p>
              </div>
              <div className="hidden md:block w-48 h-32 relative rounded-lg overflow-hidden shrink-0">
                <Image
                  src="/placeholder.svg?key=step2"
                  alt="Get verified"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold shrink-0">
                3
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-semibold">Create Your Tours</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Design your experiences with our easy-to-use tools. Add
                  photos, set prices, and describe what makes your tours
                  special. Our team helps optimize your listings.
                </p>
              </div>
              <div className="hidden md:block w-48 h-32 relative rounded-lg overflow-hidden shrink-0">
                <Image
                  src="/placeholder.svg?key=step3"
                  alt="Create tours"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold shrink-0">
                4
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-semibold">Welcome Guests</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Start receiving bookings! Manage your calendar, communicate
                  with guests, and share unforgettable experiences while earning
                  income doing what you love.
                </p>
              </div>
              <div className="hidden md:block w-48 h-32 relative rounded-lg overflow-hidden shrink-0">
                <Image
                  src="/placeholder.svg?key=step4"
                  alt="Welcome guests"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-balance">
              Guide Success Stories
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Real guides sharing their experiences with LocalPath
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Image
                    src="/thai-man-portrait.png"
                    alt="Somchai"
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                  <div>
                    <div className="font-semibold">Somchai P.</div>
                    <div className="text-sm text-muted-foreground">
                      Bangkok, Thailand
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  "I started with just one food tour. Now I'm fully booked every
                  week and making more than my previous office job. Best
                  decision I ever made!"
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4 text-secondary" />
                    <span className="font-semibold">4.9 rating</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>500+ guests</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Image
                    src="/irish-woman-portrait.jpg"
                    alt="Siobhan"
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                  <div>
                    <div className="font-semibold">Siobhan M.</div>
                    <div className="text-sm text-muted-foreground">
                      Galway, Ireland
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  "Being a guide lets me share my coastal heritage while
                  supplementing my income. The flexibility is perfect for my
                  lifestyle."
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4 text-secondary" />
                    <span className="font-semibold">5.0 rating</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>200+ guests</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Image
                    src="/chilean-artist-portrait.jpg"
                    alt="Diego"
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                  <div>
                    <div className="font-semibold">Diego R.</div>
                    <div className="text-sm text-muted-foreground">
                      Valparaíso, Chile
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  "As an artist, sharing Valpo's street art scene was natural.
                  LocalPath gave me the platform to turn my passion into a
                  thriving business."
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4 text-secondary" />
                    <span className="font-semibold">4.8 rating</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>350+ guests</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-20">
        <div className="container max-w-3xl">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-balance">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground text-pretty">
              Fill out the application below and we'll be in touch within 48
              hours
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Your City *</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Barcelona, Spain"
                    required
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="languages">Languages You Speak *</Label>
                  <Input
                    id="languages"
                    placeholder="e.g., English, Spanish, Catalan"
                    required
                    value={formData.languages}
                    onChange={(e) =>
                      setFormData({ ...formData, languages: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Your Experience *</Label>
                  <Select
                    value={formData.experience}
                    onValueChange={(value) =>
                      setFormData({ ...formData, experience: value })
                    }
                  >
                    <SelectTrigger id="experience">
                      <SelectValue placeholder="Select your experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">New to guiding</SelectItem>
                      <SelectItem value="some">
                        Some experience (1-2 years)
                      </SelectItem>
                      <SelectItem value="experienced">
                        Experienced (3+ years)
                      </SelectItem>
                      <SelectItem value="professional">
                        Professional guide
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tourIdeas">
                    What tours would you like to offer? *
                  </Label>
                  <Textarea
                    id="tourIdeas"
                    placeholder="Tell us about the experiences you want to share with travelers..."
                    rows={5}
                    required
                    value={formData.tourIdeas}
                    onChange={(e) =>
                      setFormData({ ...formData, tourIdeas: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Describe the unique experiences, hidden spots, or cultural
                    insights you can offer
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreedToTerms}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        agreedToTerms: checked as boolean,
                      })
                    }
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-muted-foreground leading-relaxed"
                  >
                    I agree to the LocalPath Terms of Service and Guide
                    Agreement. I confirm that I am at least 18 years old and
                    have the right to offer tours in my city.
                  </label>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={!formData.agreedToTerms}
                >
                  Submit Application
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Questions?{" "}
                  <Link href="#" className="text-primary hover:underline">
                    Contact our guide support team
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-3xl">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-balance">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  How much can I earn as a guide?
                </h3>
                <p className="text-muted-foreground leading-relaxed pl-7">
                  Earnings vary based on your pricing, availability, and
                  location. Most active guides earn $2,000-5,000 per month. You
                  keep 85% of your tour price, and you set your own rates.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Do I need professional guiding experience?
                </h3>
                <p className="text-muted-foreground leading-relaxed pl-7">
                  No! We welcome passionate locals of all experience levels.
                  What matters most is your knowledge of your city and
                  enthusiasm for sharing it. We provide training and resources
                  to help you succeed.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  How long does the application process take?
                </h3>
                <p className="text-muted-foreground leading-relaxed pl-7">
                  We review applications within 48 hours. The entire onboarding
                  process, including verification and tour setup, typically
                  takes 5-7 days before you're ready to accept your first
                  bookings.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  What support do you provide to guides?
                </h3>
                <p className="text-muted-foreground leading-relaxed pl-7">
                  We offer 24/7 support, marketing tools, insurance coverage,
                  payment processing, and a community of experienced guides.
                  Plus, our team helps optimize your listings and provides
                  ongoing training.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
