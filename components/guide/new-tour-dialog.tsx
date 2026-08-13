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
  { value: "food", label: "Food" },
  { value: "nature", label: "Nature" },
  { value: "culture", label: "Culture" },
  { value: "adventure", label: "Adventure" },
  { value: "history", label: "History" },
] as const;

export function NewTourDialog({
  locale,
  disabled,
  defaultOpen,
  triggerLabel = "New tour",
  triggerSize = "lg",
  triggerVariant = "default",
  triggerClassName,
}: Props) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const [submitError, setSubmitError] = useState<string | null>(null);
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
        {triggerLabel}
      </Button>
    );
  }, [disabled, triggerClassName, triggerLabel, triggerSize, triggerVariant]);

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
          throw new Error("Please sign in to upload tour images.");
        }

        const uploaded = await uploadTourImageFile(supabase, user.id, imageFile);
        if (uploaded.error || !uploaded.publicUrl) {
          throw new Error("Failed to upload image. Please try again.");
        }

        formData.set("image", uploaded.publicUrl);
      }

      formData.delete("imageFile");
      await createTourAction(formData);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      setSubmitError(message);
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl p-0">
        <div className="max-h-[85vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>Create a new tour</DialogTitle>
            <DialogDescription>
              Add the basics now - you can refine details later.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="image" value="" />

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="title">
                Title
              </label>
              <Input
                id="title"
                name="title"
                required
                placeholder="e.g. Sunset Food Walk in Dubrovnik"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="description">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                required
                placeholder="What will guests experience? What's included?"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="category">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  className="border-input dark:bg-input/30 flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  defaultValue="culture"
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="price">
                  Price (EUR)
                </label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="e.g. 59"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="location">
                  City / Area
                </label>
                <Input
                  id="location"
                  name="location"
                  required
                  placeholder="e.g. Dubrovnik Old Town"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="country">
                  Country
                </label>
                <Input
                  id="country"
                  name="country"
                  required
                  placeholder="e.g. Croatia"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="duration">
                  Duration
                </label>
                <Input
                  id="duration"
                  name="duration"
                  required
                  placeholder="e.g. 2.5 hours"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="groupSize">
                  Group size
                </label>
                <Input
                  id="groupSize"
                  name="groupSize"
                  required
                  placeholder="e.g. Up to 10 people"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="meetingPoint">
                  Meeting point
                </label>
                <Input
                  id="meetingPoint"
                  name="meetingPoint"
                  maxLength={200}
                  placeholder="e.g. Kod Mandusevca, ispred fontane"
                />
                <p className="text-xs text-muted-foreground">
                  Shown to travellers once you confirm their booking.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="startTime">
                  Start time
                </label>
                <Input id="startTime" name="startTime" type="time" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="imageFile">
                Image (optional)
              </label>
              <Input id="imageFile" name="imageFile" type="file" accept="image/*" />
              <p className="text-xs text-muted-foreground">
                Upload a JPG/PNG/WebP. This will be used as the tour cover image.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="highlights">
                Highlights (optional)
              </label>
              <Textarea
                id="highlights"
                name="highlights"
                placeholder="Add 3-6 key points (comma or newline separated)."
              />
              <p className="text-xs text-muted-foreground">
                Example: Local tastings, Hidden alleys, Small groups
              </p>
            </div>

            {submitError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {submitError}
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create tour"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
