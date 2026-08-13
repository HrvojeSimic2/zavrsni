"use client";

import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { cn } from "@/lib/utils";

export type PageShellVariant = "contained" | "full";
export type PageShellPadding = "default" | "none";

const DEFAULT_CONTENT_PADDING_Y = "py-10 md:py-12";

type Props = {
  children: React.ReactNode;
  variant?: PageShellVariant;
  paddingY?: PageShellPadding;
  className?: string;
  mainClassName?: string;
  contentClassName?: string;
  showNavigation?: boolean;
  showFooter?: boolean;
};

export function PageShell({
  children,
  variant = "full",
  paddingY = variant === "contained" ? "default" : "none",
  className,
  mainClassName,
  contentClassName,
  showNavigation = true,
  showFooter = true,
}: Props) {
  const paddingClassName =
    paddingY === "default" ? DEFAULT_CONTENT_PADDING_Y : "";

  return (
    <div className={cn("min-h-screen flex flex-col", className)}>
      {showNavigation ? <Navigation /> : null}
      <main className={cn("flex-1", mainClassName)}>
        {variant === "contained" ? (
          <div className={cn("container", paddingClassName, contentClassName)}>
            {children}
          </div>
        ) : (
          <div className={cn(paddingClassName, contentClassName)}>{children}</div>
        )}
      </main>
      {showFooter ? <Footer /> : null}
    </div>
  );
}

