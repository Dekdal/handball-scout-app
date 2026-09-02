import { createFileRoute, Outlet, redirect, isRedirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const isOfflineMode = typeof window !== "undefined" && localStorage.getItem("handball_scout_offline_user") === "true";
    if (isOfflineMode) {
      return {
        user: {
          id: "local-user-id",
          email: "treinador@goalscout.local",
          user_metadata: { display_name: "Treinador (Modo Offline)" },
        },
      };
    }

    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        throw redirect({ to: "/auth" });
      }
      return { user: data.user };
    } catch (err: any) {
      if (isRedirect(err)) {
        throw err;
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("handball_scout_offline_user", "true");
      }
      return {
        user: {
          id: "local-user-id",
          email: "treinador@goalscout.local",
          user_metadata: { display_name: "Treinador (Modo Offline)" },
        },
      };
    }
  },
  component: () => <Outlet />,
});
