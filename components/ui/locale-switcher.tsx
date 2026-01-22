"use client";

import { Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { locales, type Locale, usePathname, useRouter } from "@/i18n/routing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const localeLabels: Record<Locale, string> = {
  en: "English",
  hr: "Hrvatski",
};

const localeOptions = locales as readonly Locale[];

type LocaleSwitcherProps = {
  className?: string;
  size?: "sm" | "default";
};

export function LocaleSwitcher({
  className,
  size = "sm",
}: LocaleSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (nextLocale: string) => {
    const targetLocale = nextLocale as Locale;
    if (targetLocale === locale) return;
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- params always match the current pathname
        { pathname, params },
        { locale: targetLocale }
      );
    });
  };

  if (!mounted) {
    return null;
  }

  return (
    <Select value={locale} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger
        size={size}
        aria-label="Select language"
        className={cn("gap-2", className)}
      >
        <Globe className="size-4" />
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent align="end">
        {localeOptions.map((option) => (
          <SelectItem key={option} value={option}>
            {localeLabels[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
