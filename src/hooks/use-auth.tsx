import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "student" | "organizer";

export interface AuthState {
  userId: string;
  fullName: string;
  role: AppRole;
}

async function loadAuth(): Promise<AuthState | null> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);
  return {
    userId: user.id,
    fullName: profile?.full_name ?? user.email ?? "User",
    role: (roles?.[0]?.role as AppRole) ?? "student",
  };
}

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: auth, isLoading } = useQuery({ queryKey: ["auth"], queryFn: loadAuth, staleTime: 60_000 });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        queryClient.invalidateQueries({ queryKey: ["auth"] });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  const signOut = async () => {
    await queryClient.cancelQueries();
    await supabase.auth.signOut();
    queryClient.clear();
    navigate({ to: "/", replace: true });
  };

  return { auth, isLoading, signOut };
}
