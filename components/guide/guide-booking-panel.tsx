"use client";

import { useMemo, useState, useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/routing";
import {
  createGuideBookingAction,
  type BookingErrorCode,
} from "@/lib/actions/reservation-actions";
import { formatMoney } from "@/lib/format/money";
import { formatScheduleDate } from "@/lib/guide/reservation-status";

export type BookableSlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  note: string | null;
  durationHours: number;
};

type Props = {
  locale: string;
  guideFirstName: string;
  slots: BookableSlot[];
  hourlyRate: number | null;
  maxGroupSize: number;
  signedIn: boolean;
  isOwnProfile: boolean;
  signInHref: string;
};

/**
 * The request panel: pick a block of this guide's time, say how many of you
 * there are, and send it.
 *
 * The unit is the slot, so there is no date-versus-product picker and no
 * per-person maths. Party size is a constraint the guide set, not a multiplier —
 * stated once, in `groupNote`, because it is the thing travellers most expect to
 * work the other way.
 */
export function GuideBookingPanel({
  locale,
  guideFirstName,
  slots,
  hourlyRate,
  maxGroupSize,
  signedIn,
  isOwnProfile,
  signInHref,
}: Props) {
  const t = useTranslations("GuideProfile.booking");

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [guests, setGuests] = useState(1);
  const [note, setNote] = useState("");
  const [errorCode, setErrorCode] = useState<BookingErrorCode | null>(null);
  const [sentSlotId, setSentSlotId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const byDate = useMemo(() => {
    const groups = new Map<string, BookableSlot[]>();
    for (const slot of slots) {
      const list = groups.get(slot.date) ?? [];
      list.push(slot);
      groups.set(slot.date, list);
    }
    return Array.from(groups.entries());
  }, [slots]);

  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId) ?? null;

  const total =
    selectedSlot && hourlyRate !== null
      ? hourlyRate * selectedSlot.durationHours
      : null;

  const submit = () => {
    if (!selectedSlot) return;
    setErrorCode(null);

    startTransition(async () => {
      const result = await createGuideBookingAction({
        slotId: selectedSlot.id,
        guests,
        note: note.trim() || undefined,
        locale,
      });

      if (result.ok) {
        setSentSlotId(selectedSlot.id);
        setSelectedSlotId(null);
        setNote("");
        return;
      }
      setErrorCode(result.code);
    });
  };

  if (isOwnProfile) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
        {t("ownProfile")}
      </div>
    );
  }

  if (sentSlotId) {
    return (
      <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
        <p className="text-sm font-medium">
          {t("sentTitle", { name: guideFirstName })}
        </p>
        <p className="text-sm text-muted-foreground">{t("sentBody")}</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/bookings">{t("viewRequests")}</Link>
        </Button>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t("noSlots", { name: guideFirstName })}
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/browse">{t("browseOthers")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* The calendar reads as "when they are free", not as a fare grid. */}
      <div className="space-y-4">
        {byDate.map(([date, daySlots]) => (
          <div key={date} className="space-y-2">
            <div className="text-sm font-medium">
              {formatScheduleDate(locale, date)}
            </div>
            <div className="flex flex-wrap gap-2">
              {daySlots.map((slot) => {
                const isSelected = slot.id === selectedSlotId;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() =>
                      setSelectedSlotId(isSelected ? null : slot.id)
                    }
                    aria-pressed={isSelected}
                    className={
                      isSelected
                        ? "rounded-lg border border-primary bg-primary/10 px-3 py-2 text-left text-sm transition-colors"
                        : "rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:border-primary/50"
                    }
                  >
                    <span className="block font-medium">
                      {slot.startTime} – {slot.endTime}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {t("hours", { count: slot.durationHours })}
                      {slot.note ? ` · ${slot.note}` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedSlot ? (
        <div className="space-y-4 rounded-lg border bg-muted/10 p-4">
          <div className="space-y-1 text-sm">
            <div className="font-medium">
              {formatScheduleDate(locale, selectedSlot.date)} ·{" "}
              {selectedSlot.startTime} – {selectedSlot.endTime}
            </div>
            <div className="text-muted-foreground">
              {total !== null && hourlyRate !== null
                ? t("priceLine", {
                    hours: selectedSlot.durationHours,
                    rate: formatMoney(locale, hourlyRate),
                    total: formatMoney(locale, total),
                  })
                : t("priceOnRequest")}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guests">{t("guestsLabel")}</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={t("guestsDecrease")}
                disabled={guests <= 1}
                onClick={() => setGuests((value) => Math.max(1, value - 1))}
              >
                <Minus className="size-4" />
              </Button>
              <span id="guests" className="w-8 text-center text-sm font-medium">
                {guests}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={t("guestsIncrease")}
                disabled={guests >= maxGroupSize}
                onClick={() =>
                  setGuests((value) => Math.min(maxGroupSize, value + 1))
                }
              >
                <Plus className="size-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {t("groupNote", { max: maxGroupSize })}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="request-note">{t("noteLabel")}</Label>
            <Textarea
              id="request-note"
              value={note}
              maxLength={600}
              rows={3}
              placeholder={t("notePlaceholder", { name: guideFirstName })}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>

          {errorCode ? (
            <p className="text-sm text-destructive">
              {t.has(`errors.${errorCode}`)
                ? t(`errors.${errorCode}`)
                : t("errors.FAILED")}
            </p>
          ) : null}

          {signedIn ? (
            <Button className="w-full" disabled={isPending} onClick={submit}>
              {isPending ? t("sending") : t("send", { name: guideFirstName })}
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t("signInFirst")}</p>
              <Button className="w-full" asChild>
                <Link href={signInHref}>{t("signInAction")}</Link>
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">{t("confirmNote")}</p>
        </div>
      ) : null}
    </div>
  );
}
