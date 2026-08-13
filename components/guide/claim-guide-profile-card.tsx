import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";

import { claimGuideProfileAction } from "@/app/[locale]/guide/actions";

type Props = {
  locale: string;
  guideId: string;
  description: string;
  secondaryAction?: ReactNode;
};

export function ClaimGuideProfileCard({
  locale,
  guideId,
  description,
  secondaryAction,
}: Props) {
  return (
    <Card className="border-l-4 border-l-primary bg-muted/10">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Claim your guide profile</CardTitle>
          <Badge variant="secondary">Action required</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{description}</p>
        <form action={claimGuideProfileAction} className="flex flex-wrap gap-2">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="guideId" value={guideId} />
          <Button type="submit">Claim Profile</Button>
          {secondaryAction}
        </form>
      </CardContent>
    </Card>
  );
}
