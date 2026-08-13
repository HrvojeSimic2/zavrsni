import { NextResponse } from "next/server";

import { fetchTourAvailability } from "@/lib/services/tour-service";

function parseISODate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [yyyy, mm, dd] = value.split("-").map((part) => Number(part));
  if (!Number.isFinite(yyyy) || !Number.isFinite(mm) || !Number.isFinite(dd))
    return null;
  if (mm < 1 || mm > 12) return null;
  if (dd < 1 || dd > 31) return null;

  const date = new Date(Date.UTC(yyyy, mm - 1, dd));
  if (
    date.getUTCFullYear() !== yyyy ||
    date.getUTCMonth() !== mm - 1 ||
    date.getUTCDate() !== dd
  ) {
    return null;
  }
  return date;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tourId: string }> }
) {
  const { tourId } = await params;

  const url = new URL(req.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");
  if (!start || !end) {
    return NextResponse.json(
      { error: "Missing required query params: start, end" },
      { status: 400 }
    );
  }

  const startDate = parseISODate(start);
  const endDate = parseISODate(end);
  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "Invalid date format. Expected YYYY-MM-DD." },
      { status: 400 }
    );
  }
  if (startDate.getTime() > endDate.getTime()) {
    return NextResponse.json(
      { error: "Invalid range: start must be <= end." },
      { status: 400 }
    );
  }

  const diffDays = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
  );
  if (diffDays > 366) {
    return NextResponse.json(
      { error: "Range too large. Max 367 days." },
      { status: 400 }
    );
  }

  try {
    const days = await fetchTourAvailability(tourId, start, end);
    return NextResponse.json(days);
  } catch (error) {
    console.warn("[tour.availability] failed to load availability", error);
    return NextResponse.json(
      { error: "Failed to load availability." },
      { status: 500 }
    );
  }
}
