"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addAvailabilityAction } from "@/app/[locale]/guide/events/actions";

type TourOption = { id: string; title: string; groupSize: string | null };

type Props = {
  locale: string;
  tours: TourOption[];
  disabled?: boolean;
};

const WEEKDAYS = [
  { value: "1", label: "Mon" },
  { value: "2", label: "Tue" },
  { value: "3", label: "Wed" },
  { value: "4", label: "Thu" },
  { value: "5", label: "Fri" },
  { value: "6", label: "Sat" },
  { value: "0", label: "Sun" },
];

function defaultSpots(groupSize: string | null): number {
  const match = String(groupSize ?? "").match(/\d+/);
  const parsed = match ? Number(match[0]) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 100) : 8;
}

export function AddAvailabilityForm({ locale, tours, disabled }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [tourId, setTourId] = useState(tours[0]?.id ?? "");
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([]);

  const selectedTour = tours.find((tour) => tour.id === tourId) ?? tours[0];

  const toggleWeekday = (value: string) => {
    setSelectedWeekdays((current) =>
      current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value]
    );
  };

  if (tours.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
        Create a tour first, then you can open dates for it.
      </div>
    );
  }

  return (
    <form action={addAvailabilityAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="tourId" value={tourId} />
      {selectedWeekdays.map((value) => (
        <input key={value} type="hidden" name="weekdays" value={value} />
      ))}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tour">Tour</Label>
          <Select value={tourId} onValueChange={setTourId} disabled={disabled}>
            <SelectTrigger id="tour">
              <SelectValue placeholder="Pick a tour" />
            </SelectTrigger>
            <SelectContent>
              {tours.map((tour) => (
                <SelectItem key={tour.id} value={tour.id}>
                  {tour.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="spots">Spots per date</Label>
          <Input
            id="spots"
            name="spots"
            type="number"
            min={1}
            max={100}
            required
            disabled={disabled}
            defaultValue={defaultSpots(selectedTour?.groupSize ?? null)}
            key={selectedTour?.id}
          />
          <p className="text-xs text-muted-foreground">
            Total capacity for the day. Existing bookings stay reserved.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">From</Label>
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
          <Label htmlFor="endDate">To (optional)</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            min={today}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to open a single date.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Only these weekdays (optional)</Label>
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
                {day.label}
              </Button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Nothing selected means every day in the range.
        </p>
      </div>

      <Button type="submit" disabled={disabled}>
        Open dates
      </Button>
    </form>
  );
}
