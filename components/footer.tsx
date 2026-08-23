"use client";

import { Link } from "@/i18n/routing";
import { MapPin, Facebook, Instagram, Twitter } from "lucide-react";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <MapPin className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Peregrine</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("tagline")}
            </p>
            <div className="flex gap-3">
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t("exploreTitle")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/browse"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("exploreFind")}
                </Link>
              </li>
              <li>
                <Link
                  href="/browse?available=today"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("exploreAvailable")}
                </Link>
              </li>
              <li>
                <Link
                  href="/browse?interest=food"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("exploreFood")}
                </Link>
              </li>
              <li>
                <Link
                  href="/browse?interest=culture"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("exploreCulture")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t("guidesTitle")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/become-guide"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("guidesBecome")}
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("guidesResources")}
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("guidesStories")}
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("guidesCommunity")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t("supportTitle")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("supportHelp")}
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("supportSafety")}
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("supportTerms")}
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("supportPrivacy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>{t("rights", { year })}</p>
        </div>
      </div>
    </footer>
  );
}
