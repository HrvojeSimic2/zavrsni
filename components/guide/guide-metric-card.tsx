import type { ComponentType, ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  className?: string;
};

export function GuideMetricCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: Props) {
  return (
    <Card className={cn("gap-0", className)}>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-muted-foreground">{label}</div>
          <div className="mt-1 text-3xl font-semibold tabular-nums">{value}</div>
          {hint ? (
            <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
          ) : null}
        </div>
        {Icon ? (
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted/40">
            <Icon className="size-5 text-muted-foreground" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
