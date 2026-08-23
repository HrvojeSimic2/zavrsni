import { getTranslations } from "next-intl/server";

import { defaultLocale, locales } from "@/i18n/routing";
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
 * Local wall-clock timestamp. The slot's start time is local to where the guide
 * works, and without a per-guide timezone the honest encoding is a floating
 * time: it means "10:00 where you are standing", which is what a meeting point
 * implies.
 */
function toFloatingStamp(dateISO: string, time: string): string {
  const [hh, mm] = time.split(":");
  return `${dateISO.replace(/-/g, "")}T${hh}${mm}00`;
}

/** HH:MM from a Postgres `time`, or "" when there is nothing usable. */
function readTime(value: unknown): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(value ?? "").trim());
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : "";
}

/**
 * How long to block out. The slot's own start and end are authoritative;
 * `duration_hours` is the fallback for bookings made before slots existed.
 */
function durationMinutes(
  startTime: string,
  endTime: string,
  durationHours: unknown
): number {
  if (startTime && endTime) {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const minutes = eh * 60 + em - (sh * 60 + sm);
    if (minutes > 0) return Math.min(minutes, 12 * 60);
  }

  const hours = Number(durationHours);
  if (Number.isFinite(hours) && hours > 0) {
    return Math.min(Math.round(hours * 60), 12 * 60);
  }
  return DEFAULT_DURATION_HOURS * 60;
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

/**
 * This route sits outside the `[locale]` segment, so the caller passes the
 * locale it is rendering in as a query param.
 */
function resolveLocale(value: string | null) {
  return value && (locales as readonly string[]).includes(value)
    ? value
    : defaultLocale;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  const { reservationId } = await params;
  const locale = resolveLocale(new URL(req.url).searchParams.get("locale"));
  const t = await getTranslations({ locale, namespace: "Calendar" });

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response(t("errSignIn"), { status: 401 });
  }

  // RLS already limits this row to the traveller who booked it and the guide
  // who owns it, so a successful read is the authorization check.
  const { data, error } = await supabase
    .from("reservations")
    .select(
      "id, date, start_time, end_time, duration_hours, party_size, status, customer_name, meeting_point, guide:guides ( id, name, email, phone, location )"
    )
    .eq("id", reservationId)
    .maybeSingle();

  if (error) {
    console.warn("[reservation.calendar] failed to load reservation", error);
    return new Response(t("errLoadFailed"), { status: 500 });
  }
  if (!data) {
    return new Response(t("errNotFound"), { status: 404 });
  }

  const reservation = data as Record<string, unknown>;
  const status = String(reservation.status ?? "pending");

  if (status !== "confirmed" && status !== "completed") {
    return new Response(t("errNotConfirmed"), { status: 409 });
  }

  const guide = firstRelation(
    reservation.guide as
      | Record<string, unknown>
      | Record<string, unknown>[]
      | null
  );

  const dateISO = String(reservation.date);
  const startTime = readTime(reservation.start_time) || DEFAULT_START_TIME;
  const endTime = readTime(reservation.end_time);

  const guideName = String(guide?.name ?? t("fallbackGuideName"));
  // The event is time with a person, so that is what the calendar entry says.
  const title = t("summaryWithGuide", { name: guideName });

  const meetingPoint = String(reservation.meeting_point ?? "").trim();
  const place = [meetingPoint, String(guide?.location ?? "").trim()]
    .filter(Boolean)
    .join(", ");

  const minutes = durationMinutes(
    startTime,
    endTime,
    reservation.duration_hours
  );

  const descriptionLines = [
    t("guide", { name: guideName }),
    t("guests", { count: Number(reservation.party_size ?? 1) }),
    meetingPoint ? t("meetingPoint", { place: meetingPoint }) : null,
    t("durationHours", { count: Math.round((minutes / 60) * 10) / 10 }),
    guide?.email ? t("guideEmail", { email: String(guide.email) }) : null,
    guide?.phone ? t("guidePhone", { phone: String(guide.phone) }) : null,
    "",
    t("bookedThrough"),
  ].filter((line): line is string => line !== null);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Peregrine//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:reservation-${escapeICS(String(reservation.id))}@peregrine`,
    `DTSTAMP:${toUTCStamp(new Date())}`,
    `DTSTART:${toFloatingStamp(dateISO, startTime)}`,
    `DTEND:${addMinutes(dateISO, startTime, minutes)}`,
    `SUMMARY:${escapeICS(title)}`,
    place ? `LOCATION:${escapeICS(place)}` : null,
    `DESCRIPTION:${escapeICS(descriptionLines.join("\n"))}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeICS(t("reminder", { title }))}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line): line is string => line !== null);

  const body = lines.map(foldLine).join("\r\n");
  const filename = `peregrine-${dateISO}.ics`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
