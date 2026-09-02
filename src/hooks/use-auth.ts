import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "tecnico" | "jogador";

const ROLE_CHANGE_EVENT = "handball_scout_role_changed";

const SYNTHETIC_OFFLINE_USER: User = {
  id: "local-user-id",
  app_metadata: { provider: "email" },
  user_metadata: { display_name: "Treinador (Modo Offline)" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
  email: "treinador@goalscout.local",
  phone: "",
  role: "authenticated",
  updated_at: new Date().toISOString(),
};

export function useAuth() {
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    return typeof window !== "undefined" && localStorage.getItem("handball_scout_offline_user") === "true";
  });

  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined" && localStorage.getItem("handball_scout_offline_user") === "true") {
      return SYNTHETIC_OFFLINE_USER;
    }
    return null;
  });

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const [overrideRole, setOverrideRole] = useState<UserRole | null>(() => {
    return (localStorage.getItem("handball_scout_simulated_role") as UserRole) || null;
  });

  useEffect(() => {
    localStorage.removeItem("handball_scout_simulated_email");

    const handleRoleChange = () => {
      const storedRole = (localStorage.getItem("handball_scout_simulated_role") as UserRole) || null;
      setOverrideRole(storedRole);
      setIsOffline(localStorage.getItem("handball_scout_offline_user") === "true");
    };

    window.addEventListener(ROLE_CHANGE_EVENT, handleRoleChange);
    window.addEventListener("storage", handleRoleChange);

    if (localStorage.getItem("handball_scout_offline_user") === "true") {
      setUser(SYNTHETIC_OFFLINE_USER);
      setLoading(false);
    } else {
      const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
        setSession(s);
        if (s?.user) {
          setUser(s.user);
        }
      });
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session);
        if (data.session?.user) {
          setUser(data.session.user);
        }
        setLoading(false);
      }).catch(() => {
        // Fallback em caso de erro na sessão Supabase
        setLoading(false);
      });

      return () => {
        sub.subscription.unsubscribe();
      };
    }

    return () => {
      window.removeEventListener(ROLE_CHANGE_EVENT, handleRoleChange);
      window.removeEventListener("storage", handleRoleChange);
    };
  }, []);

  const userMetaDataRole = (user?.user_metadata?.role as UserRole) || "tecnico";
  const role: UserRole = overrideRole || userMetaDataRole;

  const isTecnico = role === "tecnico";
  const isJogador = role === "jogador";

  const setSimulatedRole = (newRole: UserRole | null) => {
    if (newRole) {
      localStorage.setItem("handball_scout_simulated_role", newRole);
    } else {
      localStorage.removeItem("handball_scout_simulated_role");
    }
    setOverrideRole(newRole);
    window.dispatchEvent(new Event(ROLE_CHANGE_EVENT));
  };

  const loginOffline = () => {
    localStorage.setItem("handball_scout_offline_user", "true");
    setUser(SYNTHETIC_OFFLINE_USER);
    setIsOffline(true);
    window.dispatchEvent(new Event(ROLE_CHANGE_EVENT));
  };

  const logoutOffline = () => {
    localStorage.removeItem("handball_scout_offline_user");
    setUser(null);
    setSession(null);
    setIsOffline(false);
    try {
      supabase.auth.signOut().catch(() => {});
    } catch {}
  };

  return {
    user,
    session,
    loading,
    role,
    isTecnico,
    isJogador,
    isOffline,
    setSimulatedRole,
    loginOffline,
    logoutOffline,
  };
}
