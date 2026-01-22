import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "hr"],

  defaultLocale: "en",
});

export const locales = routing.locales;
export type Locale = (typeof routing.locales)[number];
export const defaultLocale = routing.defaultLocale;

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
