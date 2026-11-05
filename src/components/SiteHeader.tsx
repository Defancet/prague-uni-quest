import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function SiteHeader() {
  const { auth, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Ticket className="size-4" aria-hidden />
          </span>
          Student Event Hub
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground sm:flex" aria-label="Main">
          <Link to="/" hash="events" className="hover:text-foreground">Events</Link>
          <Link to="/" hash="how" className="hover:text-foreground">How it works</Link>
          {auth?.role === "student" && (
            <Link to="/my-registrations" className="hover:text-foreground">My registrations</Link>
          )}
          {auth?.role === "organizer" && (
            <Link to="/my-events" className="hover:text-foreground">My events</Link>
          )}
        </nav>
        {auth ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm sm:block">
              <span className="font-semibold">{auth.fullName}</span>{" "}
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold capitalize text-primary">{auth.role}</span>
            </span>
            <Button size="sm" variant="outline" onClick={() => void signOut()}>
              <LogOut className="size-4" aria-hidden /> Sign out
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={() => navigate({ to: "/auth" })}>Sign in</Button>
        )}
      </div>
    </header>
  );
}
