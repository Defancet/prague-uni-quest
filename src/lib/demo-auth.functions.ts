import { createServerFn } from "@tanstack/react-start";

// One-click demo sign-in. Only these four seeded demo accounts can use it;
// no passwords and no service-role key ever reach the browser.
export const DEMO_ACCOUNTS = [
  { email: "anna@eventhub-demo.test", name: "Anna Studentova", role: "Student" },
  { email: "petr@eventhub-demo.test", name: "Petr Maly", role: "Student" },
  { email: "klara@eventhub-demo.test", name: "Klara Horakova", role: "Organizer" },
  { email: "ondrej@eventhub-demo.test", name: "Ondrej Benes", role: "Organizer" },
] as const;

const DEMO_EMAILS = new Set(DEMO_ACCOUNTS.map((a) => a.email));

export const demoLogin = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) => input)
  .handler(async ({ data }) => {
    if (!DEMO_EMAILS.has(data.email)) throw new Error("Unknown demo account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: data.email,
    });
    if (error || !link.properties?.hashed_token) throw new Error(error?.message ?? "Could not create demo session");
    return { tokenHash: link.properties.hashed_token, email: data.email };
  });
