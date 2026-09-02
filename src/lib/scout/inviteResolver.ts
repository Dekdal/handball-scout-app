import { supabase } from "@/integrations/supabase/client";
import { getSharedTeamNamesForEmail, getSharedGameIdsForEmail } from "./teamSharing";

export const DEFAULT_OFFLINE_GAME = {
  id: "demo-game-local-1",
  user_id: "local-user-id",
  team_name: "Brasil Handebol",
  opponent: "Adversário FC",
  game_date: new Date().toISOString().split("T")[0],
  competition: "Liga Nacional",
  category: "Adulto Masculino",
  goalkeeper_name: "Gabriel Maia (#1)",
  status: "in_progress",
  created_at: new Date().toISOString(),
};

/**
 * 1. RESOLUÇÃO DE CONVITES PENDENTES NO LOGIN (MATCH DE USUÁRIO)
 */
export async function resolvePendingInvitesOnLogin(userId: string, email: string) {
  if (!email || !userId) return;
  const normEmail = email.trim().toLowerCase();

  try {
    const { data: pendingInvites, error: inviteErr } = await supabase
      .from("team_invites")
      .select("*")
      .eq("email", normEmail)
      .eq("status", "pending");

    if (!inviteErr && pendingInvites && pendingInvites.length > 0) {
      for (const invite of pendingInvites) {
        await supabase.from("team_access").insert({
          team_id: invite.team_id,
          user_id: userId,
          email: normEmail,
          role: invite.role,
        });

        await supabase
          .from("team_invites")
          .delete()
          .eq("id", invite.id);
      }
    }
  } catch (err) {
    console.warn("Resolução de convites no Supabase (em segundo plano):", err);
  }
}

/**
 * 2. QUERY DE BUSCA DO DASHBOARD (COM FALLBACK PARA MODO OFFLINE / LOCALSTORAGE)
 */
export async function fetchDashboardGamesForUser(userId?: string | null, email?: string | null) {
  const normEmail = email ? email.trim().toLowerCase() : null;
  const isOffline = typeof window !== "undefined" && localStorage.getItem("handball_scout_offline_user") === "true";

  // Obter jogos salvos localmente no computador do usuário
  let localGames: any[] = [];
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("handball_scout_local_games");
      if (raw) localGames = JSON.parse(raw);
    } catch {}
  }

  if (isOffline) {
    if (localGames.length > 0) return localGames;
    // Se ainda não criou nenhum jogo no modo offline, fornece o jogo demonstrativo
    return [DEFAULT_OFFLINE_GAME];
  }

  try {
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .order("game_date", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      return localGames.length > 0 ? localGames : [DEFAULT_OFFLINE_GAME];
    }

    const sharedTeams = getSharedTeamNamesForEmail(normEmail);
    const sharedScouts = getSharedGameIdsForEmail(normEmail);

    const remoteGames = data.filter((g) => {
      if (userId && g.user_id === userId) return true;
      if (g.team_name && sharedTeams.some((t) => t.toLowerCase() === g.team_name.trim().toLowerCase())) return true;
      if (sharedScouts.includes(g.id)) return true;
      return false;
    });

    // Mescla jogos do servidor com os criados localmente sem duplicatas
    const gameMap = new Map<string, any>();
    localGames.forEach((g) => gameMap.set(g.id, g));
    remoteGames.forEach((g) => gameMap.set(g.id, g));

    return Array.from(gameMap.values());
  } catch (err) {
    console.warn("Supabase indisponível. Carregando dados locais do computador:", err);
    return localGames.length > 0 ? localGames : [DEFAULT_OFFLINE_GAME];
  }
}
