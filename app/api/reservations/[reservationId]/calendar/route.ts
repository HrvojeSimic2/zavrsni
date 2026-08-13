import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const DEFAULT_START_TIME = "10:00";
const DEFAULT_DURATION_HOURS = 3;

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/** Escapes the characters iCalendar treats as structure. */
function escapeICS(value: string): string {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** RFC 5545 caps lines at 75 octets; continuations start with a space. */
function foldLine(line: string): string {
  if (line.length <= 73) return line;
  const chunks: string[] = [];
  let rest = line;
  chunks.push(rest.slice(0, 73));
  rest = rest.slice(73);
  while (rest.length > 72) {
    chunks.push(` ${rest.slice(0, 72)}`);
    rest = rest.slice(72);
  }
  if (rest.length > 0) chunks.push(` ${rest}`);
  return chunks.join("\r\n");
}

function toUTCStamp(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`;
}

/**
 * Local wall-clock timestamp. The tour's start time is local to where the tour
 * runs, and without a per-tour timezone the honest encoding is a floating time:
 * it means "10:00 where you are standing", which is what a meeting point implies.
 */
function toFloatingStamp(dateISO: string, time: string): string {
  const [hh, mm] = time.split(":");
  return `${dateISO.replace(/-/g, "")}T${hh}${mm}00`;
}

/**
 * Turns free-text duration ("4-6 sati", "2.5 hours", "90 min") into minutes.
 *
 * For a range the longer end wins: a calendar block that ends before the tour
 * does is worse than one that reserves a little too much.
 */
function parseDurationMinutes(raw: string | null | undefined): number {
  const text = String(raw ?? "").trim();
  const matches = text.match(/\d+(?:[.,]\d+)?/g);
  if (!matches) return DEFAULT_DURATION_HOURS * 60;

  const values = matches
    .map((value) => Number(value.replace(",", ".")))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (values.length === 0) return DEFAULT_DURATION_HOURS * 60;

  const longest = Math.max(...values);
  const isMinutes = /\bmin/i.test(text) && !/\b(h|hour|sat)/i.test(text);
  const minutes = isMinutes ? longest : longest * 60;

  // Guard against a stray number in the text producing a week-long event.
  return Math.min(Math.max(Math.round(minutes), 30), 12 * 60);
}

function addMinutes(dateISO: string, time: string, minutes: number): string {
  const [hh, mm] = time.split(":").map(Number);
  const end = new Date(`${dateISO}T00:00:00Z`);
  end.setUTCHours(hh, mm + minutes, 0, 0);

  const endTime = `${String(end.getUTCHours()).padStart(2, "0")}:${String(
    end.getUTCMinutes()
  ).padStart(2, "0")}`;

  return toFloatingStamp(end.toISOString().slice(0, 10), endTime);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  const { reservationId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response("Sign in to download this booking.", { status: 401 });
  }

  // RLS already limits this row to the traveller who booked it and the guide
  // who owns it, so a successful read is the authorization check.
  const { data, error } = await supabase
    .from("reservations")
    .select(
      "id, date, party_size, status, customer_name, tour:tours ( id, title, description, location, country, meeting_point, start_time, duration ), guide:guides ( id, name, email, phone )"
    )
    .eq("id", reservationId)
    .maybeSingle();

  if (error) {
    console.warn("[reservation.calendar] failed to load reservation", error);
    return new Response("Failed to load the booking.", { status: 500 });
  }
  if (!data) {
    return new Response("Booking not found.", { status: 404 });
  }

  const reservation = data as Record<string, unknown>;
  const status = String(reservation.status ?? "pending");

  if (status !== "confirmed" && status !== "completed") {
    return new Response(
      "This booking is not confirmed yet, so there is nothing to add to a calendar.",
      { status: 409 }
    );
  }

  const tour = firstRelation(
    reservation.tour as
      | Record<string, unknown>
      | Record<string, unknown>[]
      | null
  );
  const guide = firstRelation(
    reservation.guide as
      | Record<string, unknown>
      | Record<string, unknown>[]
      | null
  );

  const dateISO = String(reservation.date);
  const rawStart = tour?.start_time ? String(tour.start_time) : "";
  const startTime = /^\d{2}:\d{2}/.test(rawStart)
    ? rawStart.slice(0, 5)
    : DEFAULT_START_TIME;

  const title = String(tour?.title ?? "Tour");
  const guideName = String(guide?.name ?? "your guide");

  const place = [tour?.meeting_point, tour?.location, tour?.country]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(", ");

  const descriptionLines = [
    `Guide: ${guideName}`,
    `Guests: ${Number(reservation.party_size ?? 1)}`,
    tour?.meeting_point ? `Meeting point: ${String(tour.meeting_point)}` : null,
    tour?.duration ? `Duration: ${String(tour.duration)}` : null,
    guide?.email ? `Guide email: ${String(guide.email)}` : null,
    guide?.phone ? `Guide phone: ${String(guide.phone)}` : null,
    "",
    "Booked through LocalPath.",
  ].filter((line): line is string => line !== null);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LocalPath//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:reservation-${escapeICS(String(reservation.id))}@localpath`,
    `DTSTAMP:${toUTCStamp(new Date())}`,
    `DTSTART:${toFloatingStamp(dateISO, startTime)}`,
    `DTEND:${addMinutes(
      dateISO,
      startTime,
      parseDurationMinutes(tour?.duration as string | null)
    )}`,
    `SUMMARY:${escapeICS(title)}`,
    place ? `LOCATION:${escapeICS(place)}` : null,
    `DESCRIPTION:${escapeICS(descriptionLines.join("\n"))}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeICS(`${title} starts in 2 hours`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line): line is string => line !== null);

  const body = lines.map(foldLine).join("\r\n");
  const filename = `localpath-${dateISO}.ics`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
