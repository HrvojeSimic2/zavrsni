import type { SupabaseClient, User } from "@supabase/supabase-js";

import { getGuideForUser } from "@/lib/guide/get-guide-for-user";

export type NotificationKind =
  /** Guide side: a traveller is waiting on a yes/no. */
  | "reservation_request"
  /** Traveller side: the guide has not answered yet. */
  | "reservation_pending"
  /** Traveller side: the guide approved the request. */
  | "reservation_confirmed"
  /** Traveller side: the guide declined or cancelled the request. */
  | "reservation_declined"
  /** Traveller side: status of a "become a guide" application. */
  | "guide_application";

export type NotificationAudience = "guide" | "traveller";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  audience: NotificationAudience;
  /** Drives unread state; the moment the status last changed. */
  timestamp: string;
  href: string;
  tourTitle: string | null;
  /** Traveller name for guides, guide name for travellers. */
  personName: string | null;
  date: string | null;
  partySize: number | null;
  status: string | null;
};

const MAX_PER_SOURCE = 15;

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function timestampOf(row: { updated_at?: unknown; created_at?: unknown }): string {
  const updated = typeof row.updated_at === "string" ? row.updated_at : "";
  const created = typeof row.created_at === "string" ? row.created_at : "";
  return updated || created || new Date(0).toISOString();
}

async function fetchGuideRequests(
  supabase: SupabaseClient,
  user: User,
  today: string
): Promise<AppNotification[]> {
  const { guide } = await getGuideForUser(supabase, user);
  if (!guide) return [];

  const { data, error } = await supabase
    .from("reservations")
    .select(
      "id, date, party_size, status, customer_name, created_at, updated_at, tour:tours ( id, title )"
    )
    .eq("guide_id", guide.id)
    .eq("status", "pending")
    .gte("date", today)
    .order("created_at", { ascending: false })
    .limit(MAX_PER_SOURCE);

  if (error) {
    console.warn("[notifications] failed to load guide requests", error);
    return [];
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const tour = firstRelation(
      row.tour as { id: string; title: string } | { id: string; title: string }[] | null
    );

    return {
      id: `request:${String(row.id)}`,
      kind: "reservation_request" as const,
      audience: "guide" as const,
      timestamp: timestampOf(row),
      href: "/guide/reservations",
      tourTitle: tour?.title ?? null,
      personName: (row.customer_name as string | null) ?? null,
      date: (row.date as string | null) ?? null,
      partySize: row.party_size === null ? null : Number(row.party_size),
      status: "pending",
    };
  });
}

async function fetchTravellerUpdates(
  supabase: SupabaseClient,
  user: User,
  today: string
): Promise<AppNotification[]> {
  const email = String(user.email ?? "").trim().toLowerCase();
  if (!email) return [];

  const { data, error } = await supabase
    .from("reservations")
    .select(
      "id, date, party_size, status, created_at, updated_at, tour:tours ( id, title ), guide:guides ( id, name )"
    )
    .ilike("customer_email", email)
    .gte("date", today)
    .order("updated_at", { ascending: false })
    .limit(MAX_PER_SOURCE);

  if (error) {
    console.warn("[notifications] failed to load traveller updates", error);
    return [];
  }

  return ((data ?? []) as Array<Record<string, unknown>>)
    .map((row): AppNotification | null => {
      const tour = firstRelation(
        row.tour as { id: string; title: string } | { id: string; title: string }[] | null
      );
      const guide = firstRelation(
        row.guide as { id: string; name: string } | { id: string; name: string }[] | null
      );
      const status = String(row.status ?? "pending");

      const kind: NotificationKind =
        status === "confirmed"
          ? "reservation_confirmed"
          : status === "cancelled"
            ? "reservation_declined"
            : "reservation_pending";

      // A completed tour is history, not something awaiting approval.
      if (status === "completed") return null;

      return {
        id: `booking:${String(row.id)}`,
        kind,
        audience: "traveller" as const,
        timestamp: timestampOf(row),
        href: "/bookings",
        tourTitle: tour?.title ?? null,
        personName: guide?.name ?? null,
        date: (row.date as string | null) ?? null,
        partySize: row.party_size === null ? null : Number(row.party_size),
        status,
      };
    })
    .filter((item): item is AppNotification => item !== null);
}

async function fetchApplicationStatus(
  supabase: SupabaseClient,
  user: User
): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("guide_applications")
    .select("id, status, created_at, updated_at, reviewed_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.warn("[notifications] failed to load guide application", error);
    return [];
  }

  const application = (data ?? [])[0] as Record<string, unknown> | undefined;
  if (!application) return [];

  const status = String(application.status ?? "pending");
  const reviewedAt =
    typeof application.reviewed_at === "string" ? application.reviewed_at : "";

  return [
    {
      id: `application:${String(application.id)}`,
      kind: "guide_application",
      audience: "traveller",
      timestamp: reviewedAt || timestampOf(application),
      href: status === "accepted" ? "/guide" : "/become-guide",
      tourTitle: null,
      personName: null,
      date: null,
      partySize: null,
      status,
    },
  ];
}

/**
 * Everything the notifications bar shows for the signed-in user.
 *
 * A user can be both a guide and a traveller, so both sides are collected and
 * merged; each source degrades to an empty list rather than failing the whole
 * bar when a query is rejected.
 */
export async function fetchNotifications(
  supabase: SupabaseClient,
  user: User
): Promise<AppNotification[]> {
  const today = new Date().toISOString().slice(0, 10);

  const [requests, updates, application] = await Promise.all([
    fetchGuideRequests(supabase, user, today),
    fetchTravellerUpdates(supabase, user, today),
    fetchApplicationStatus(supabase, user),
  ]);

  return [...requests, ...updates, ...application].sort((a, b) =>
    a.timestamp < b.timestamp ? 1 : -1
  );
}
