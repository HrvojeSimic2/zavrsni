'use client';

import { useEffect } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Browse.error");

  useEffect(() => {
    // Keep for debugging; error boundaries shouldn't swallow errors silently.
    console.error("[browse] failed to render", error);
  }, [error]);

  return (
    <PageShell variant="full">
      <div className="container py-12">
        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {process.env.NODE_ENV === "development" ? (
              <pre className="max-h-48 overflow-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                {error.message}
              </pre>
            ) : null}
            {error.digest ? (
              <p className="text-xs text-muted-foreground">
                {t("reference", { digest: error.digest })}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button onClick={reset}>{t("retry")}</Button>
            <Button variant="outline" asChild>
              <Link href="/">{t("goHome")}</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </PageShell>
  );
}
