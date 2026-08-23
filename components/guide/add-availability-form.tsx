"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addSlotsAction } from "@/app/[locale]/guide/events/actions";
import { useTranslations } from "next-intl";

type Props = {
  locale: string;
  disabled?: boolean;
};

const WEEKDAYS = [
  { value: "1", labelKey: "mon" },
  { value: "2", labelKey: "tue" },
  { value: "3", labelKey: "wed" },
  { value: "4", labelKey: "thu" },
  { value: "5", labelKey: "fri" },
  { value: "6", labelKey: "sat" },
  { value: "0", labelKey: "sun" },
] as const;

/** The blocks guides reach for most, so the common case is two clicks. */
const PRESETS = [
  { labelKey: "morning", start: "09:00", end: "12:00" },
  { labelKey: "afternoon", start: "14:00", end: "17:00" },
  { labelKey: "fullDay", start: "09:00", end: "17:00" },
] as const;

/**
 * Opens slots on the guide's calendar.
 *
 * No tour to pick and no capacity to set: a slot is a block of this guide's
 * time, and whoever books it books all of it.
 */
export function AddAvailabilityForm({ locale, disabled }: Props) {
  const t = useTranslations("GuideDashboard.availabilityForm");
  const today = new Date().toISOString().slice(0, 10);

  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([]);

  const toggleWeekday = (value: string) => {
    setSelectedWeekdays((current) =>
      current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value]
    );
  };

  const timesInvalid = endTime <= startTime;

  return (
    <form action={addSlotsAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {selectedWeekdays.map((value) => (
        <input key={value} type="hidden" name="weekdays" value={value} />
      ))}

      <div className="space-y-2">
        <Label>{t("presetLabel")}</Label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const active =
              preset.start === startTime && preset.end === endTime;
            return (
              <Button
                key={preset.labelKey}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                className="rounded-full"
                disabled={disabled}
                aria-pressed={active}
                onClick={() => {
                  setStartTime(preset.start);
                  setEndTime(preset.end);
                }}
              >
                {t(`presets.${preset.labelKey}`)}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startTime">{t("startTimeLabel")}</Label>
          <Input
            id="startTime"
            name="startTime"
            type="time"
            required
            step={900}
            disabled={disabled}
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endTime">{t("endTimeLabel")}</Label>
          <Input
            id="endTime"
            name="endTime"
            type="time"
            required
            step={900}
            disabled={disabled}
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            aria-invalid={timesInvalid}
          />
          {timesInvalid ? (
            <p className="text-xs text-destructive">{t("endAfterStart")}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">{t("fromLabel")}</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            min={today}
            required
            disabled={disabled}
            defaultValue={today}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">{t("toLabel")}</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            min={today}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">{t("toHelp")}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("weekdaysLabel")}</Label>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => {
            const active = selectedWeekdays.includes(day.value);
            return (
              <Button
                key={day.value}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                className="rounded-full"
                disabled={disabled}
                onClick={() => toggleWeekday(day.value)}
                aria-pressed={active}
              >
                {t(`weekdays.${day.labelKey}`)}
              </Button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">{t("weekdaysHelp")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">{t("noteLabel")}</Label>
        <Input
          id="note"
          name="note"
          type="text"
          maxLength={120}
          disabled={disabled}
          placeholder={t("notePlaceholder")}
        />
        <p className="text-xs text-muted-foreground">{t("noteHelp")}</p>
      </div>

      <Button type="submit" disabled={disabled || timesInvalid}>
        {t("submit")}
      </Button>
    </form>
  );
}
