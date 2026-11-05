import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Calendar, Clock, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, formatPrice } from "@/lib/events";
import { cancelRegistration, listMyRegistrations } from "@/lib/events.functions";

export const Route = createFileRoute("/my-registrations")({
  head: () => ({ meta: [{ title: "My registrations — Student Event Hub" }] }),
  component: MyRegistrationsPage,
});

function MyRegistrationsPage() {
  const { auth, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["my-registrations", auth?.userId],
    queryFn: () => listMyRegistrations(),
    enabled: auth?.role === "student",
  });
  const cancel = useMutation({
    mutationFn: (eventId: string) => cancelRegistration({ data: { eventId } }),
    onSuccess: () => {
      toast.success("Registration cancelled");
      void queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
      void queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Something went wrong"),
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container-page py-16">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">My registrations</h1>
        {authLoading ? (
          <p className="mt-6 text-muted-foreground">Loading…</p>
        ) : !auth ? (
          <p className="mt-6 text-muted-foreground">
            Please <Link to="/auth" className="font-semibold text-primary underline">sign in</Link> to see your registrations.
          </p>
        ) : auth.role !== "student" ? (
          <p className="mt-6 text-muted-foreground">This page is for students. Organizers see attendees under My events.</p>
        ) : isLoading ? (
          <p className="mt-6 text-muted-foreground">Loading…</p>
        ) : data.length === 0 ? (
          <p className="mt-6 text-muted-foreground">
            You are not registered for any event yet. <Link to="/" hash="events" className="font-semibold text-primary underline">Browse events</Link>
          </p>
        ) : (
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {data.map(({ event: e, registeredAt }) => (
              <li key={e.id} className="flex flex-col rounded-2xl border bg-card p-5 shadow-soft">
                <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{e.category}</span>
                <h2 className="mt-3 font-display text-lg font-semibold">{e.title}</h2>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><Calendar className="size-4" aria-hidden />{formatDate(e.date).full}</p>
                  <p className="flex items-center gap-2"><Clock className="size-4" aria-hidden />{e.time}</p>
                  <p className="flex items-center gap-2"><MapPin className="size-4" aria-hidden />{e.venue}</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm">
                    <span className="font-semibold">{formatPrice(e.priceCzk)}</span>
                    <span className="text-muted-foreground"> · registered {new Date(registeredAt).toLocaleDateString("en-GB")}</span>
                  </span>
                  <Button size="sm" variant="outline" disabled={cancel.isPending} onClick={() => cancel.mutate(e.id)}>
                    Cancel
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
