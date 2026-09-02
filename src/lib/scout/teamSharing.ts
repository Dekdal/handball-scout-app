import { supabase } from "@/integrations/supabase/client";

export type TeamRole = "tecnico" | "jogador";

export interface TeamMemberItem {
  id: string;
  email: string;
  role: TeamRole;
  type: "access" | "invite";
  status?: "active" | "pending";
  created_at?: string;
  targetId?: string; // teamName ou gameId
}

const LOCAL_STORAGE_TEAMS_KEY = "handball_scout_team_access_store";
const LOCAL_STORAGE_SCOUTS_KEY = "handball_scout_single_scout_access_store";

interface LocalAccessStore {
  [key: string]: TeamMemberItem[]; // key = teamName ou gameId
}

function getStore(key: string): LocalAccessStore {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStore(key: string, store: LocalAccessStore) {
  try {
    localStorage.setItem(key, JSON.stringify(store));
  } catch (err) {
    console.error("Erro ao salvar compartilhamento local:", err);
  }
}

/* ============================================================
 * 1. COMPARTILHAMENTO DE EQUIPE INTEIRA (TEAM SHARING)
 * ============================================================ */

export async function getTeamMembers(teamName: string): Promise<TeamMemberItem[]> {
  const normTeam = teamName.trim();
  const store = getStore(LOCAL_STORAGE_TEAMS_KEY);
  return store[normTeam] || [];
}

export async function inviteMemberToTeam(
  teamName: string,
  email: string,
  role: TeamRole
): Promise<TeamMemberItem[]> {
  const normTeam = teamName.trim();
  const normEmail = email.trim().toLowerCase();

  const store = getStore(LOCAL_STORAGE_TEAMS_KEY);
  const currentMembers = store[normTeam] || [];

  const existingIdx = currentMembers.findIndex((m) => m.email.toLowerCase() === normEmail);

  const newItem: TeamMemberItem = {
    id: existingIdx >= 0 ? currentMembers[existingIdx].id : `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    email: normEmail,
    role,
    type: "access",
    status: "active",
    created_at: new Date().toISOString(),
    targetId: normTeam,
  };

  if (existingIdx >= 0) {
    currentMembers[existingIdx] = newItem;
  } else {
    currentMembers.push(newItem);
  }

  store[normTeam] = currentMembers;
  saveStore(LOCAL_STORAGE_TEAMS_KEY, store);

  try {
    await supabase.from("team_access").insert({
      email: normEmail,
      role,
    });
  } catch {}

  return currentMembers;
}

export async function updateMemberRole(
  teamName: string,
  memberIdOrEmail: string,
  newRole: TeamRole
): Promise<TeamMemberItem[]> {
  const normTeam = teamName.trim();
  const store = getStore(LOCAL_STORAGE_TEAMS_KEY);
  const currentMembers = store[normTeam] || [];

  const targetIdx = currentMembers.findIndex(
    (m) => m.id === memberIdOrEmail || m.email.toLowerCase() === memberIdOrEmail.toLowerCase()
  );

  if (targetIdx >= 0) {
    currentMembers[targetIdx].role = newRole;
    store[normTeam] = currentMembers;
    saveStore(LOCAL_STORAGE_TEAMS_KEY, store);
  }

  return currentMembers;
}

export async function removeMemberAccess(
  teamName: string,
  memberIdOrEmail: string
): Promise<TeamMemberItem[]> {
  const normTeam = teamName.trim();
  const store = getStore(LOCAL_STORAGE_TEAMS_KEY);
  let currentMembers = store[normTeam] || [];

  currentMembers = currentMembers.filter(
    (m) => m.id !== memberIdOrEmail && m.email.toLowerCase() !== memberIdOrEmail.toLowerCase()
  );

  store[normTeam] = currentMembers;
  saveStore(LOCAL_STORAGE_TEAMS_KEY, store);

  return currentMembers;
}

/* ============================================================
 * 2. COMPARTILHAMENTO DE APENAS 1 SCOUT (SINGLE GAME SHARING)
 * ============================================================ */

export async function getScoutMembers(gameId: string): Promise<TeamMemberItem[]> {
  const store = getStore(LOCAL_STORAGE_SCOUTS_KEY);
  return store[gameId] || [];
}

export async function inviteMemberToScout(
  gameId: string,
  email: string,
  role: TeamRole
): Promise<TeamMemberItem[]> {
  const normEmail = email.trim().toLowerCase();
  const store = getStore(LOCAL_STORAGE_SCOUTS_KEY);
  const currentMembers = store[gameId] || [];

  const existingIdx = currentMembers.findIndex((m) => m.email.toLowerCase() === normEmail);

  const newItem: TeamMemberItem = {
    id: existingIdx >= 0 ? currentMembers[existingIdx].id : `scout_mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    email: normEmail,
    role,
    type: "access",
    status: "active",
    created_at: new Date().toISOString(),
    targetId: gameId,
  };

  if (existingIdx >= 0) {
    currentMembers[existingIdx] = newItem;
  } else {
    currentMembers.push(newItem);
  }

  store[gameId] = currentMembers;
  saveStore(LOCAL_STORAGE_SCOUTS_KEY, store);

  return currentMembers;
}

export async function updateScoutMemberRole(
  gameId: string,
  memberIdOrEmail: string,
  newRole: TeamRole
): Promise<TeamMemberItem[]> {
  const store = getStore(LOCAL_STORAGE_SCOUTS_KEY);
  const currentMembers = store[gameId] || [];

  const targetIdx = currentMembers.findIndex(
    (m) => m.id === memberIdOrEmail || m.email.toLowerCase() === memberIdOrEmail.toLowerCase()
  );

  if (targetIdx >= 0) {
    currentMembers[targetIdx].role = newRole;
    store[gameId] = currentMembers;
    saveStore(LOCAL_STORAGE_SCOUTS_KEY, store);
  }

  return currentMembers;
}

export async function removeScoutMemberAccess(
  gameId: string,
  memberIdOrEmail: string
): Promise<TeamMemberItem[]> {
  const store = getStore(LOCAL_STORAGE_SCOUTS_KEY);
  let currentMembers = store[gameId] || [];

  currentMembers = currentMembers.filter(
    (m) => m.id !== memberIdOrEmail && m.email.toLowerCase() !== memberIdOrEmail.toLowerCase()
  );

  store[gameId] = currentMembers;
  saveStore(LOCAL_STORAGE_SCOUTS_KEY, store);

  return currentMembers;
}

/* ============================================================
 * 3. CONSULTA DE ACESSOS RECEBIDOS POR E-MAIL (OUTRAS CONTAS)
 * ============================================================ */

/**
 * Retorna a lista de nomes de times compartilhados com um e-mail específico
 */
export function getSharedTeamNamesForEmail(userEmail?: string | null): string[] {
  if (!userEmail) return [];
  const normEmail = userEmail.trim().toLowerCase();
  const store = getStore(LOCAL_STORAGE_TEAMS_KEY);
  const sharedTeams: string[] = [];

  Object.entries(store).forEach(([teamName, members]) => {
    if (members.some((m) => m.email.toLowerCase() === normEmail)) {
      sharedTeams.push(teamName);
    }
  });

  return sharedTeams;
}

/**
 * Retorna a lista de IDs de scouts/jogos isolados compartilhados com um e-mail específico
 */
export function getSharedGameIdsForEmail(userEmail?: string | null): string[] {
  if (!userEmail) return [];
  const normEmail = userEmail.trim().toLowerCase();
  const store = getStore(LOCAL_STORAGE_SCOUTS_KEY);
  const sharedGames: string[] = [];

  Object.entries(store).forEach(([gameId, members]) => {
    if (members.some((m) => m.email.toLowerCase() === normEmail)) {
      sharedGames.push(gameId);
    }
  });

  return sharedGames;
}

/**
 * Retorna o papel do usuário (Técnico ou Jogador) em um time ou jogo específico
 */
export function getCalculatedUserRole(
  teamName: string,
  gameId?: string,
  userEmail?: string | null,
  globalRole?: TeamRole
): TeamRole {
  if (!userEmail) return globalRole || "tecnico";
  const normEmail = userEmail.trim().toLowerCase();

  // 1. Checar compartilhamento do time
  const teamStore = getStore(LOCAL_STORAGE_TEAMS_KEY);
  const teamMembers = teamStore[teamName?.trim()] || [];
  const foundTeam = teamMembers.find((m) => m.email.toLowerCase() === normEmail);
  if (foundTeam) {
    return foundTeam.role;
  }

  // 2. Checar compartilhamento do scout isolado
  if (gameId) {
    const scoutStore = getStore(LOCAL_STORAGE_SCOUTS_KEY);
    const scoutMembers = scoutStore[gameId] || [];
    const foundScout = scoutMembers.find((m) => m.email.toLowerCase() === normEmail);
    if (foundScout) {
      return foundScout.role;
    }
  }

  return globalRole || "tecnico";
}
