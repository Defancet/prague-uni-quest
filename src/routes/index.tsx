import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Calendar, Clock, MapPin, Search, Ticket, User, Compass, MousePointerClick, PartyPopper, CalendarX } from "lucide-react";
import heroImg from "@/assets/hero-prague.jpg";
import { categories, events, formatDate, type EventItem } from "@/lib/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Student Event Hub — Student events in Prague" },
      { name: "description", content: "Discover workshops, meetups, career nights and parties at Prague universities." },
      { property: "og:title", content: "Student Event Hub — Student events in Prague" },
      { property: "og:description", content: "Discover workshops, meetups, career nights and parties at Prague universities." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

function Index() {
  const [cat, setCat] = useState<(typeof categories)[number]>("All");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<EventItem | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return events.filter(
      (e) =>
        (cat === "All" || e.category === cat) &&
        (!s || e.title.toLowerCase().includes(s) || e.venue.toLowerCase().includes(s)),
    );
  }, [cat, q]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <a href="#top" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Ticket className="size-4" aria-hidden />
            </span>
            Student Event Hub
          </a>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground sm:flex" aria-label="Main">
            <a href="#events" className="hover:text-foreground">Events</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
          </nav>
          <Button size="sm" onClick={() => scrollTo("events")}>Explore events</Button>
        </div>
      </header>

      <main id="top">
        <section className="relative isolate overflow-hidden">
          <img src={heroImg} alt="Prague at dusk with Charles Bridge and the castle lit up" width={1920} height={1088} className="absolute inset-0 -z-10 size-full object-cover" />
          <div className="absolute inset-0 -z-10 bg-hero-overlay" />
          <div className="container-page py-24 sm:py-32 lg:py-40">
            <p className="mb-4 inline-block rounded-full bg-on-hero/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-on-hero">Prague · Nov – Dec 2026</p>
            <h1 className="max-w-3xl font-display text-4xl font-bold leading-tight text-on-hero sm:text-5xl lg:text-6xl">
              Your next great story starts at an event.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-on-hero/85">
              Workshops, meetups, career nights and parties across Prague's universities — all in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => scrollTo("events")}>Find your event</Button>
              <Button size="lg" variant="heroOutline" onClick={() => scrollTo("how")}>How it works</Button>
            </div>
            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 text-on-hero">
              {[[`${events.length}`, "Events"], ["4", "Categories"], ["Prague", "Wide"]].map(([v, l]) => (
                <div key={l}>
                  <dt className="text-xs uppercase tracking-wider text-on-hero/75">{l}</dt>
                  <dd className="font-display text-2xl font-bold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="events" className="container-page scroll-mt-20 py-20">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Upcoming events</h2>
          <p className="mt-2 text-muted-foreground">Filter by category or search by title and venue.</p>

          <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  aria-pressed={cat === c}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${cat === c ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground hover:border-primary hover:text-primary"}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="relative w-full lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or venue…" aria-label="Search events" className="h-11 rounded-full pl-9" />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="mt-12 rounded-2xl border border-dashed p-12 text-center">
              <CalendarX className="mx-auto size-10 text-primary" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold">No events match that — yet!</h3>
              <p className="mt-1 text-muted-foreground">Try another category or a different search term.</p>
              <Button variant="outline" className="mt-5" onClick={() => { setQ(""); setCat("All"); }}>Reset filters</Button>
            </div>
          ) : (
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((e) => {
                const d = formatDate(e.date);
                return (
                  <li key={e.id} className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img src={e.image} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <span className="absolute left-3 top-3 rounded-full bg-card/95 px-3 py-1 text-xs font-semibold text-primary">{e.category}</span>
                      <span className="absolute right-3 top-3 rounded-xl bg-primary px-3 py-1.5 text-center text-primary-foreground">
                        <span className="block text-lg font-bold leading-none">{d.day}</span>
                        <span className="block text-[11px] uppercase">{d.month}</span>
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-display text-lg font-semibold leading-snug">{e.title}</h3>
                      <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2"><Clock className="size-4" aria-hidden />{e.time}</p>
                        <p className="flex items-center gap-2"><MapPin className="size-4" aria-hidden />{e.venue}</p>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-5">
                        <span className="font-semibold text-foreground">{e.price}</span>
                        <Button size="sm" variant="outline" onClick={() => setSelected(e)} aria-label={`View details for ${e.title}`}>View details</Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section id="how" className="scroll-mt-20 bg-secondary py-20">
          <div className="container-page">
            <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">How it works</h2>
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                [Compass, "Discover", "Browse events from universities and student groups across Prague."],
                [MousePointerClick, "Choose", "Filter by what you love and check the details and agenda."],
                [PartyPopper, "Show up", "Register in one click, then just turn up and enjoy."],
              ].map(([Icon, t, d], i) => {
                const I = Icon as typeof Compass;
                return (
                  <li key={t as string} className="rounded-2xl bg-card p-7 shadow-soft">
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><I className="size-5" aria-hidden /></span>
                      <span className="text-sm font-semibold text-muted-foreground">Step {i + 1}</span>
                    </div>
                    <h3 className="mt-4 font-display text-xl font-semibold">{t as string}</h3>
                    <p className="mt-2 text-muted-foreground">{d as string}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      </main>

      <footer className="border-t py-10">
        <div className="container-page flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
          <p className="font-semibold text-foreground">Student Event Hub</p>
          <p>Made for students in Prague · © 2026</p>
        </div>
      </footer>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-lg">
          {selected && (
            <>
              <img src={selected.image} alt="" className="aspect-video w-full object-cover" />
              <div className="p-6">
                <DialogHeader className="text-left">
                  <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{selected.category}</span>
                  <DialogTitle className="font-display text-2xl">{selected.title}</DialogTitle>
                  <DialogDescription>{selected.description}</DialogDescription>
                </DialogHeader>
                <div className="mt-5 grid gap-2 text-sm">
                  <p className="flex items-center gap-2"><Calendar className="size-4 text-primary" aria-hidden />{formatDate(selected.date).full}</p>
                  <p className="flex items-center gap-2"><Clock className="size-4 text-primary" aria-hidden />{selected.time}</p>
                  <p className="flex items-center gap-2"><MapPin className="size-4 text-primary" aria-hidden />{selected.venue}</p>
                  <p className="flex items-center gap-2"><User className="size-4 text-primary" aria-hidden />{selected.organizer}</p>
                </div>
                <h4 className="mt-6 font-semibold">Agenda</h4>
                <ol className="mt-2 space-y-2">
                  {selected.agenda.map((a, i) => (
                    <li key={a} className="flex gap-3 text-sm"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>{a}</li>
                  ))}
                </ol>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-lg font-bold">{selected.price}</span>
                  <Button onClick={() => { toast.success("You're on the list!", { description: selected.title }); setSelected(null); }}>Register</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
