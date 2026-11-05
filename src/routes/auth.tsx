import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { GraduationCap, Megaphone } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_ACCOUNTS, demoLogin } from "@/lib/demo-auth.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Student Event Hub" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<string | null>(null);

  const signIn = async (email: string) => {
    setPending(email);
    try {
      const { tokenHash } = await demoLogin({ data: { email } });
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["auth"] });
      toast.success("Signed in");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container-page py-16">
        <div className="mx-auto max-w-xl">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Sign in</h1>
          <p className="mt-2 text-muted-foreground">
            Demo login with fictional accounts. Students can register for events, organizers manage their own events.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {DEMO_ACCOUNTS.map((a) => {
              const Icon = a.role === "Student" ? GraduationCap : Megaphone;
              return (
                <li key={a.email} className="flex flex-col rounded-2xl border bg-card p-5 shadow-soft">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <p className="mt-3 font-semibold">{a.name}</p>
                  <p className="text-sm text-muted-foreground">{a.role}</p>
                  <Button className="mt-4" disabled={pending !== null} onClick={() => void signIn(a.email)}>
                    {pending === a.email ? "Signing in…" : `Demo login as ${a.name.split(" ")[0]}`}
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      </main>
    </div>
  );
}
