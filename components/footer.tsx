import Link from "next/link";
import { MapPin, Facebook, Instagram, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <MapPin className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">LocalPath</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Connecting travelers with authentic local experiences around the
              world.
            </p>
            <div className="flex gap-3">
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/browse"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Browse Tours
                </Link>
              </li>
              <li>
                <Link
                  href="/browse?category=food"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Food Tours
                </Link>
              </li>
              <li>
                <Link
                  href="/browse?category=nature"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Nature Tours
                </Link>
              </li>
              <li>
                <Link
                  href="/browse?category=culture"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cultural Experiences
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">For Guides</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/become-guide"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Become a Guide
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Guide Resources
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Success Stories
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Community
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Safety Guidelines
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            © 2025 LocalPath. All rights reserved. Discover the world through
            local eyes.
          </p>
        </div>
      </div>
    </footer>
  );
}
