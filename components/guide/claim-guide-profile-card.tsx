import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";

import { claimGuideProfileAction } from "@/app/[locale]/guide/actions";

/** Message key under `GuideDashboard.claimCard`. */
export type ClaimDescriptionKey =
  | "descriptionFull"
  | "descriptionAvailability"
  | "descriptionReservations"
  | "descriptionProfile";

type Props = {
  locale: string;
  guideId: string;
  descriptionKey: ClaimDescriptionKey;
  secondaryAction?: ReactNode;
};

export async function ClaimGuideProfileCard({
  locale,
  guideId,
  descriptionKey,
  secondaryAction,
}: Props) {
  const t = await getTranslations("GuideDashboard.claimCard");

  return (
    <Card className="border-l-4 border-l-primary bg-muted/10">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{t("title")}</CardTitle>
          <Badge variant="secondary">{t("badge")}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{t(descriptionKey)}</p>
        <form action={claimGuideProfileAction} className="flex flex-wrap gap-2">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="guideId" value={guideId} />
          <Button type="submit">{t("submit")}</Button>
          {secondaryAction}
        </form>
      </CardContent>
    </Card>
  );
}
