import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  /** Overrides the default "Guide dashboard" eyebrow. */
  eyebrow?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export async function GuidePageHeader({
  title,
  description,
  eyebrow,
  badge,
  actions,
  className,
}: Props) {
  const t = await getTranslations("GuideDashboard");

  return (
    <section
      className={cn(
        "rounded-xl border bg-gradient-to-b from-muted/30 to-background p-6",
        className
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            {eyebrow ?? t("eyebrow")}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {badge || actions ? (
          <div className="flex flex-col items-start gap-2 sm:items-end">
            {badge ? <div>{badge}</div> : null}
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
