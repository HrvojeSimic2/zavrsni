"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Shield,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function BecomeGuidePage() {
  const t = useTranslations("BecomeGuide");
  const params = useParams<{ locale?: string }>();
  const locale = typeof params?.locale === "string" ? params.locale : undefined;

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

  const [submitState, setSubmitState] = useState<
    | { status: "idle" }
    | { status: "submitting" }
    | { status: "success"; message: string }
    | { status: "error"; message: string }
  >({ status: "idle" });

  // The API answers with an error key so it can be rendered in the active
  // locale; anything unrecognised is shown as-is.
  const translateError = (key: string) =>
    t.has(`errors.${key}`) ? t(`errors.${key}`) : key;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agreedToTerms) {
      setSubmitState({
        status: "error",
        message: t("errors.termsRequired"),
      });
      return;
    }

    setSubmitState({ status: "submitting" });

    try {
      const res = await fetch("/api/guide-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, locale }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message =
          typeof body?.error === "string"
            ? translateError(body.error)
            : t("errors.submitFailed");
        setSubmitState({ status: "error", message });
        return;
      }

      setSubmitState({
        status: "success",
        message: t("successMessage"),
      });
      setFormData({
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
    } catch (error) {
      setSubmitState({
        status: "error",
        message: error instanceof Error ? error.message : t("errors.unknown"),
      });
    }
  };

  return (
    <PageShell variant="full">

      {/* Hero Section */}
      <section className="bg-brand-deep text-brand-deep-foreground">
        <div className="container py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <p className="text-sm font-medium uppercase tracking-widest text-brand-deep-foreground/80">
              {t("heroBadge")}
            </p>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-balance leading-tight">
              {t("heroTitle")}
            </h1>
            <p className="mx-auto max-w-2xl text-base md:text-lg leading-relaxed text-brand-deep-foreground/90 text-pretty">
              {t("heroBody")}
            </p>

            <div className="pt-2">
              <Button size="lg" variant="secondary" asChild>
                <Link href="#apply">
                  {t("heroCta")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-balance">
              {t("benefitsTitle")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              {t("benefitsSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                  <DollarSign className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-semibold text-xl">
                  {t("benefitPricesTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("benefitPricesBody")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-xl">
                  {t("benefitScheduleTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("benefitScheduleBody")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-xl">
                  {t("benefitPeopleTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("benefitPeopleBody")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                  <Heart className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-semibold text-xl">
                  {t("benefitPassionTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("benefitPassionBody")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-xl">
                  {t("benefitDashboardTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("benefitDashboardBody")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                  <Shield className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-semibold text-xl">
                  {t("benefitReviewedTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("benefitReviewedBody")}
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
              {t("stepsTitle")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              {t("stepsSubtitle")}
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold shrink-0">
                1
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-semibold">{t("step1Title")}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t("step1Body")}
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold shrink-0">
                2
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-semibold">{t("step2Title")}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t("step2Body")}
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold shrink-0">
                3
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-semibold">{t("step3Title")}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t("step3Body")}
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold shrink-0">
                4
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-semibold">{t("step4Title")}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t("step4Body")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="apply" className="py-20 scroll-mt-20">
        <div className="container max-w-3xl">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-balance">
              {t("formTitle")}
            </h2>
            <p className="text-lg text-muted-foreground text-pretty">
              {t("formSubtitle")}
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t("firstNameLabel")}</Label>
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
                    <Label htmlFor="lastName">{t("lastNameLabel")}</Label>
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
                    <Label htmlFor="email">{t("emailLabel")}</Label>
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
                    <Label htmlFor="phone">{t("phoneLabel")}</Label>
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
                  <Label htmlFor="location">{t("locationLabel")}</Label>
                  <Input
                    id="location"
                    placeholder={t("locationPlaceholder")}
                    required
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="languages">{t("languagesLabel")}</Label>
                  <Input
                    id="languages"
                    placeholder={t("languagesPlaceholder")}
                    required
                    value={formData.languages}
                    onChange={(e) =>
                      setFormData({ ...formData, languages: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">{t("experienceLabel")}</Label>
                  <Select
                    value={formData.experience}
                    onValueChange={(value) =>
                      setFormData({ ...formData, experience: value })
                    }
                  >
                    <SelectTrigger id="experience">
                      <SelectValue placeholder={t("experiencePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">
                        {t("experienceBeginner")}
                      </SelectItem>
                      <SelectItem value="some">
                        {t("experienceSome")}
                      </SelectItem>
                      <SelectItem value="experienced">
                        {t("experienceExperienced")}
                      </SelectItem>
                      <SelectItem value="professional">
                        {t("experienceProfessional")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tourIdeas">{t("tourIdeasLabel")}</Label>
                  <Textarea
                    id="tourIdeas"
                    placeholder={t("tourIdeasPlaceholder")}
                    rows={5}
                    required
                    value={formData.tourIdeas}
                    onChange={(e) =>
                      setFormData({ ...formData, tourIdeas: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("tourIdeasHelp")}
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
                    {t("termsLabel")}
                  </label>
                </div>

                {submitState.status === "error" ? (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {submitState.message}
                  </div>
                ) : null}
                {submitState.status === "success" ? (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {submitState.message}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={
                    !formData.agreedToTerms || submitState.status === "submitting"
                  }
                >
                  {submitState.status === "submitting"
                    ? t("submitting")
                    : t("submit")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

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
              {t("faqTitle")}
            </h2>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {t("faq1Question")}
                </h3>
                <p className="text-muted-foreground leading-relaxed pl-7">
                  {t("faq1Answer")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {t("faq2Question")}
                </h3>
                <p className="text-muted-foreground leading-relaxed pl-7">
                  {t("faq2Answer")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {t("faq3Question")}
                </h3>
                <p className="text-muted-foreground leading-relaxed pl-7">
                  {t("faq3Answer")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {t("faq4Question")}
                </h3>
                <p className="text-muted-foreground leading-relaxed pl-7">
                  {t("faq4Answer")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

    </PageShell>
  );
}
