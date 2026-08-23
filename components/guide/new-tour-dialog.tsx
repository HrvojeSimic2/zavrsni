"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ComponentProps } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { uploadTourImageFile } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";

import { createTourAction } from "@/app/[locale]/guide/tours/actions";
import { GuideFlashError } from "@/lib/i18n/guide-flash";
import { useTranslations } from "next-intl";

type Props = {
  locale: string;
  disabled?: boolean;
  defaultOpen?: boolean;
  triggerLabel?: string;
  triggerSize?: ComponentProps<typeof Button>["size"];
  triggerVariant?: ComponentProps<typeof Button>["variant"];
  triggerClassName?: string;
};

const categoryOptions = [
  "food",
  "nature",
  "culture",
  "adventure",
  "history",
] as const;

export function NewTourDialog({
  locale,
  disabled,
  defaultOpen,
  triggerLabel,
  triggerSize = "lg",
  triggerVariant = "default",
  triggerClassName,
}: Props) {
  const t = useTranslations("GuideDashboard.newTour");
  const label = triggerLabel ?? t("trigger");
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const [submitError, setSubmitError] = useState<string | null>(null);
  const tGuide = useTranslations("GuideDashboard");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trigger = useMemo(() => {
    const iconClassName = triggerSize === "lg" ? "size-5" : "size-4";
    const emphasisClassName =
      triggerSize === "lg" && triggerVariant === "default"
        ? "h-11 px-6 text-base font-semibold shadow-md hover:shadow-lg"
        : "font-semibold";

    return (
      <Button
        type="button"
        size={triggerSize}
        variant={triggerVariant}
        disabled={disabled}
        className={cn(emphasisClassName, triggerClassName)}
      >
        <Plus className={iconClassName} />
        {label}
      </Button>
    );
  }, [disabled, label, triggerClassName, triggerSize, triggerVariant]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);

      const imageFile = formData.get("imageFile");
      if (imageFile instanceof File && imageFile.size > 0) {
        const supabase = createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error(GuideFlashError.SignInToUploadImages);
        }

        const uploaded = await uploadTourImageFile(supabase, user.id, imageFile);
        if (uploaded.error || !uploaded.publicUrl) {
          throw new Error(GuideFlashError.ImageUploadFailed);
        }

        formData.set("image", uploaded.publicUrl);
      }

      formData.delete("imageFile");
      await createTourAction(formData);
    } catch (error) {
      // Actions surface an error key so it can be shown in the active locale.
      const raw = error instanceof Error ? error.message : "";
      const key = `errors.${raw}`;
      setSubmitError(
        raw && tGuide.has(key) ? tGuide(key) : raw || tGuide("errors.unknown")
      );
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl p-0">
        <div className="max-h-[85vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="image" value="" />

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="title">
                {t("titleLabel")}
              </label>
              <Input
                id="title"
                name="title"
                required
                placeholder={t("titlePlaceholder")}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="description">
                {t("descriptionLabel")}
              </label>
              <Textarea
                id="description"
                name="description"
                required
                placeholder={t("descriptionPlaceholder")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="category">
                  {t("categoryLabel")}
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  className="border-input dark:bg-input/30 flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  defaultValue="culture"
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {t(`categories.${option}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="price">
                  {t("priceLabel")}
                </label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder={t("pricePlaceholder")}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="location">
                  {t("locationLabel")}
                </label>
                <Input
                  id="location"
                  name="location"
                  required
                  placeholder={t("locationPlaceholder")}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="country">
                  {t("countryLabel")}
                </label>
                <Input
                  id="country"
                  name="country"
                  required
                  placeholder={t("countryPlaceholder")}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="duration">
                  {t("durationLabel")}
                </label>
                <Input
                  id="duration"
                  name="duration"
                  required
                  placeholder={t("durationPlaceholder")}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="groupSize">
                  {t("groupSizeLabel")}
                </label>
                <Input
                  id="groupSize"
                  name="groupSize"
                  required
                  placeholder={t("groupSizePlaceholder")}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="meetingPoint">
                  {t("meetingPointLabel")}
                </label>
                <Input
                  id="meetingPoint"
                  name="meetingPoint"
                  maxLength={200}
                  placeholder={t("meetingPointPlaceholder")}
                />
                <p className="text-xs text-muted-foreground">
                  {t("meetingPointHelp")}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="startTime">
                  {t("startTimeLabel")}
                </label>
                <Input id="startTime" name="startTime" type="time" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="imageFile">
                {t("imageLabel")}
              </label>
              <Input id="imageFile" name="imageFile" type="file" accept="image/*" />
              <p className="text-xs text-muted-foreground">
                {t("imageHelp")}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="highlights">
                {t("highlightsLabel")}
              </label>
              <Textarea
                id="highlights"
                name="highlights"
                placeholder={t("highlightsPlaceholder")}
              />
              <p className="text-xs text-muted-foreground">
                {t("highlightsHelp")}
              </p>
            </div>

            {submitError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {submitError}
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("submitting") : t("submit")}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
