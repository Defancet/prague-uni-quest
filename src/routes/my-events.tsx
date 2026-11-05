import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Calendar, MapPin, Users } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, formatPrice, type EventItem } from "@/lib/events";
import { listMyEvents, updateEventCapacity, type Attendee } from "@/lib/events.functions";

export const Route = createFileRoute("/my-events")({
  head: () => ({ meta: [{ title: "My events — Student Event Hub" }] }),
  component: MyEventsPage,
});

function MyEventsPage() {
  const { auth, isLoading: authLoading } = useAuth();
  const { data = [], isLoading } = useQuery({
    queryKey: ["my-events", auth?.userId],
    queryFn: () => listMyEvents(),
    enabled: auth?.role === "organizer",
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container-page py-16">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">My events</h1>
        {authLoading ? (
          <p className="mt-6 text-muted-foreground">Loading…</p>
        ) : !auth ? (
          <p className="mt-6 text-muted-foreground">
            Please <Link to="/auth" className="font-semibold text-primary underline">sign in</Link> as an organizer.
          </p>
        ) : auth.role !== "organizer" ? (
          <p className="mt-6 text-muted-foreground">This page is for organizers only.</p>
        ) : isLoading ? (
          <p className="mt-6 text-muted-foreground">Loading…</p>
        ) : data.length === 0 ? (
          <p className="mt-6 text-muted-foreground">You don't own any events yet.</p>
        ) : (
          <ul className="mt-8 grid gap-6">
            {data.map(({ event, attendees }) => (
              <EventCard key={event.id} event={event} attendees={attendees} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function EventCard({ event: e, attendees }: { event: EventItem; attendees: Attendee[] }) {
  const queryClient = useQueryClient();
  const [capacity, setCapacity] = useState(String(e.capacity));
  const save = useMutation({
    mutationFn: (value: number) => updateEventCapacity({ data: { eventId: e.id, capacity: value } }),
    onSuccess: () => {
      toast.success("Capacity updated");
      void queryClient.invalidateQueries({ queryKey: ["my-events"] });
      void queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setCapacity(String(e.capacity));
    },
  });

  return (
    <li className="rounded-2xl border bg-card p-6 shadow-soft">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{e.category}</span>
          <h2 className="mt-3 font-display text-xl font-semibold">{e.title}</h2>
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            <p className="flex items-center gap-2"><Calendar className="size-4" aria-hidden />{formatDate(e.date).full} · {e.time}</p>
            <p className="flex items-center gap-2"><MapPin className="size-4" aria-hidden />{e.venue} · {formatPrice(e.priceCzk)}</p>
          </div>
        </div>
        <form
          className="flex items-end gap-2"
          onSubmit={(ev) => {
            ev.preventDefault();
            const value = Number(capacity);
            if (!Number.isInteger(value) || value < 1) {
              toast.error("Capacity must be a whole number of at least 1");
              return;
            }
            save.mutate(value);
          }}
        >
          <label className="text-sm font-medium">
            Capacity
            <Input type="number" min={1} value={capacity} onChange={(ev) => setCapacity(ev.target.value)} className="mt-1 w-28" />
          </label>
          <Button type="submit" disabled={save.isPending}>Save</Button>
        </form>
      </div>
      <h3 className="mt-6 flex items-center gap-2 font-semibold">
        <Users className="size-4 text-primary" aria-hidden /> Attendees ({attendees.length} / {e.capacity})
      </h3>
      {attendees.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No registrations yet.</p>
      ) : (
        <ul className="mt-2 divide-y rounded-xl border">
          {attendees.map((a) => (
            <li key={a.fullName + a.registeredAt} className="flex justify-between px-4 py-2 text-sm">
              <span className="font-medium">{a.fullName}</span>
              <span className="text-muted-foreground">{new Date(a.registeredAt).toLocaleString("en-GB")}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
