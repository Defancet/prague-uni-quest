import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { EventItem, Category } from "@/lib/events";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

const toItem = (e: EventRow, registered: number): EventItem => ({
  id: e.id,
  title: e.title,
  category: e.category as Category,
  date: e.date,
  time: e.time,
  venue: e.venue,
  priceCzk: e.price_czk,
  description: e.description,
  organizer: e.organizer,
  agenda: e.agenda,
  image: e.image_url ?? "",
  capacity: e.capacity,
  registered,
});

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listEvents = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const [{ data: events, error }, { data: counts }] = await Promise.all([
    supabase.from("events").select("*").order("date"),
    supabase.rpc("get_registration_counts"),
  ]);
  if (error) throw new Error(error.message);
  const countMap = new Map((counts ?? []).map((c) => [c.event_id, c.registered]));
  return (events ?? []).map((e) => toItem(e, countMap.get(e.id) ?? 0));
});

export const registerForEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { eventId: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("register_for_event", { _event_id: data.eventId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cancelRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { eventId: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("registrations")
      .delete()
      .eq("event_id", data.eventId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyRegistrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("registrations")
      .select("event_id, created_at, events(*)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const { data: counts } = await context.supabase.rpc("get_registration_counts");
    const countMap = new Map((counts ?? []).map((c) => [c.event_id, c.registered]));
    return (data ?? [])
      .filter((r) => r.events)
      .map((r) => ({ registeredAt: r.created_at, event: toItem(r.events as EventRow, countMap.get(r.event_id) ?? 0) }));
  });

export interface Attendee {
  fullName: string;
  registeredAt: string;
}

export const listMyEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: events, error } = await context.supabase
      .from("events")
      .select("*")
      .eq("owner_id", context.userId)
      .order("date");
    if (error) throw new Error(error.message);
    const { data: regs, error: regError } = await context.supabase
      .from("registrations")
      .select("event_id, created_at, profiles(full_name)")
      .in("event_id", (events ?? []).map((e) => e.id));
    if (regError) throw new Error(regError.message);
    const byEvent = new Map<string, Attendee[]>();
    for (const r of regs ?? []) {
      const list = byEvent.get(r.event_id) ?? [];
      const p = r.profiles as { full_name: string } | null;
      list.push({ fullName: p?.full_name ?? "Unknown", registeredAt: r.created_at });
      byEvent.set(r.event_id, list);
    }
    return (events ?? []).map((e) => ({
      event: toItem(e, (byEvent.get(e.id) ?? []).length),
      attendees: byEvent.get(e.id) ?? [],
    }));
  });

export const updateEventCapacity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { eventId: string; capacity: number }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("events")
      .update({ capacity: data.capacity })
      .eq("id", data.eventId)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
