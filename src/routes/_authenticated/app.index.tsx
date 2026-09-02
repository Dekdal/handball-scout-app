import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Plus, CalendarDays, Trophy, Trash2, CheckCircle2, Clock, RotateCcw, Filter, ShieldCheck, TrendingUp, BarChart3, Swords, Users, Share2, Layers } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { HistoricalComparison } from "@/components/scout/HistoricalComparison";
import { HeadToHeadDashboard } from "@/components/scout/HeadToHeadDashboard";
import { TacticalBoardContainer } from "@/components/tactical/TacticalBoardContainer";
import { ShareTeamModal } from "@/components/scout/ShareTeamModal";
import { ShareScoutModal } from "@/components/scout/ShareScoutModal";
import { getSharedTeamNamesForEmail, getSharedGameIdsForEmail, getCalculatedUserRole } from "@/lib/scout/teamSharing";
import { resolvePendingInvitesOnLogin, fetchDashboardGamesForUser } from "@/lib/scout/inviteResolver";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/")({
  component: AppHome,
});

const newGameSchema = z.object({
  team_name: z.string().trim().min(1, "Nome da equipe é obrigatório").max(80),
  opponent: z.string().trim().min(1, "Adversário é obrigatório").max(80),
  game_date: z.string().min(1),
  competition: z.string().trim().max(80).optional(),
  category: z.string().trim().max(40).optional(),
  goalkeeper_name: z.string().trim().min(1, "Goleiro é obrigatório").max(80),
});

function AppHome() {
  const { user, isJogador, isTecnico } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [targetShareTeam, setTargetShareTeam] = useState<string>("");
  const [isShareScoutModalOpen, setIsShareScoutModalOpen] = useState(false);
  const [targetShareScout, setTargetShareScout] = useState<{ id: string; title: string } | null>(null);
  const [mainTab, setMainTab] = useState<"games" | "comparison" | "head_to_head" | "tactical_board">("games");
  const [statusFilter, setStatusFilter] = useState<"all" | "in_progress" | "completed">("all");

  // 1. RESOLUÇÃO AUTOMÁTICA DE CONVITES PENDENTES AO ACESSAR A APLICAÇÃO
  useEffect(() => {
    if (user?.id && user?.email) {
      resolvePendingInvitesOnLogin(user.id, user.email);
    }
  }, [user?.id, user?.email]);

  // 2. QUERY DO DASHBOARD BUSCANDO JOGOS DA CONTA LOGADA (CRIADOR + CONVIDADO EM TIMES/SCOUTS)
  const { data: games = [], isLoading } = useQuery({
    queryKey: ["games", user?.id, user?.email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .order("game_date", { ascending: false });

      if (error) throw error;

      return fetchDashboardGamesForUser(user?.id, user?.email);
    },
  });

  const { data: allShots = [] } = useQuery({
    queryKey: ["all_shots"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shots").select("*");
      if (error) return [];
      return data || [];
    },
  });

  // Organizar shots por game_id
  const shotsByGame: Record<string, any[]> = {};
  allShots.forEach((s: any) => {
    if (!shotsByGame[s.game_id]) shotsByGame[s.game_id] = [];
    shotsByGame[s.game_id].push(s);
  });

  const createMut = useMutation({
    mutationFn: async (input: z.infer<typeof newGameSchema>) => {
      const payload: any = { ...input, user_id: user?.id || "local-user-id", status: "in_progress" };
      const isOffline = typeof window !== "undefined" && localStorage.getItem("handball_scout_offline_user") === "true";

      const saveLocally = () => {
        const localGame = {
          ...payload,
          id: `local-game-${Date.now()}`,
          created_at: new Date().toISOString(),
        };
        try {
          const raw = localStorage.getItem("handball_scout_local_games");
          const list = raw ? JSON.parse(raw) : [];
          list.unshift(localGame);
          localStorage.setItem("handball_scout_local_games", JSON.stringify(list));
        } catch {}
        return localGame;
      };

      if (isOffline) {
        return saveLocally();
      }

      try {
        const { data, error } = await supabase
          .from("games")
          .insert(payload)
          .select()
          .single();

        if (error) {
          if (error.message?.includes("status") || error.code === "PGRST204") {
            delete payload.status;
            const fallback = await supabase.from("games").insert(payload).select().single();
            if (fallback.error) return saveLocally();
            return fallback.data;
          }
          return saveLocally();
        }
        return data;
      } catch {
        return saveLocally();
      }
    },
    onSuccess: (g) => {
      qc.invalidateQueries({ queryKey: ["games"] });
      setOpen(false);
      toast.success("Novo scout iniciado com sucesso!");
      router.navigate({ to: "/app/game/$gameId", params: { gameId: g.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleStatusMut = useMutation({
    mutationFn: async ({ gameId, currentStatus }: { gameId: string; currentStatus: string }) => {
      const newStatus = currentStatus === "completed" ? "in_progress" : "completed";
      setLocalStatusMap((prev) => ({ ...prev, [gameId]: newStatus }));

      const { error } = await supabase
        .from("games")
        .update({ status: newStatus })
        .eq("id", gameId);

      if (error) {
        console.warn("Aviso de migração de status no Supabase:", error.message);
      }
      return { id: gameId, status: newStatus };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["games"] });
      if (res.status === "completed") {
        toast.success("Scout marcado como CONCLUÍDO! ✅");
      } else {
        toast.info("Scout REABERTO para edição (Em Andamento)! 🔁");
      }
    },
    onError: (err: any) => {
      toast.error("Erro ao alterar status: " + (err?.message || "Tente novamente"));
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("games").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["games"] });
      toast.success("Jogo removido com sucesso!");
    },
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = newGameSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    createMut.mutate(parsed.data);
  }

  const [localStatusMap, setLocalStatusMap] = useState<Record<string, "in_progress" | "completed">>({});

  // Obter convites/acessos atribuídos ao e-mail logado (ou simulado)
  const sharedTeamNames = getSharedTeamNamesForEmail(user?.email);
  const sharedGameIds = getSharedGameIdsForEmail(user?.email);

  const accessibleGames = games.filter((g) => {
    // 1. O próprio criador tem acesso total aos seus jogos
    if (!user || g.user_id === user.id) return true;

    // 2. Acesso liberado por time compartilhado
    if (g.team_name && sharedTeamNames.some((t) => t.toLowerCase() === g.team_name.trim().toLowerCase())) {
      return true;
    }

    // 3. Acesso liberado por scout isolado compartilhado
    if (sharedGameIds.includes(g.id)) {
      return true;
    }

    // 4. Se é perfil de jogador e nenhuma restrição de convite foi criada, exibe a lista geral
    if (isJogador && sharedTeamNames.length === 0 && sharedGameIds.length === 0) {
      return true;
    }

    return false;
  });

  const gamesWithStatus = accessibleGames.map((g) => ({
    ...g,
    effectiveStatus: localStatusMap[g.id] || g.status || "in_progress",
  }));

  // Filtrar jogos por status efetivo
  const inProgressCount = gamesWithStatus.filter((g) => g.effectiveStatus !== "completed").length;
  const completedCount = gamesWithStatus.filter((g) => g.effectiveStatus === "completed").length;

  const filteredGames = gamesWithStatus.filter((g) => {
    if (statusFilter === "in_progress") return g.effectiveStatus !== "completed";
    if (statusFilter === "completed") return g.effectiveStatus === "completed";
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} />
      <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        
        {/* CABEÇALHO PRINCIPAL DA GESTÃO DE SCOUTS */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary flex items-center gap-2">
              <Trophy className="h-8 w-8 text-accent" />
              Central de Scouts & Partidas
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie seus jogos, acompanhe o status de finalização e analise estatísticas.
            </p>
          </div>
          
          {isTecnico && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="lg"
                variant="outline"
                className="font-bold border-purple-500 text-purple-700 hover:bg-purple-600 hover:text-white dark:text-purple-300 shadow-md gap-2"
                onClick={() => {
                  const availableTeams = Array.from(new Set(games.map((g) => g.team_name?.trim()).filter(Boolean)));
                  setTargetShareTeam(availableTeams[0] || "UFAL");
                  setIsShareModalOpen(true);
                }}
              >
                <Users className="h-5 w-5 text-purple-600" /> 🔗 Compartilhar Time
              </Button>

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="font-bold shadow-md bg-accent text-accent-foreground hover:bg-accent/90">
                    <Plus className="mr-2 h-5 w-5" /> Novo Jogo / Scout
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-primary font-bold">Criar Nova Partida</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={onSubmit} className="space-y-3 pt-2">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="team_name">Equipe Principal</Label>
                        <Input id="team_name" name="team_name" placeholder="Ex: Brasil / Pinheiros" required />
                      </div>
                      <div>
                        <Label htmlFor="opponent">Adversário</Label>
                        <Input id="opponent" name="opponent" placeholder="Ex: Argentina / Taubaté" required />
                      </div>
                      <div>
                        <Label htmlFor="game_date">Data da Partida</Label>
                        <Input id="game_date" name="game_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
                      </div>
                      <div>
                        <Label htmlFor="category">Categoria</Label>
                        <Input id="category" name="category" placeholder="Adulto, Sub-18, Sub-21..." />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="competition">Competição</Label>
                        <Input id="competition" name="competition" placeholder="Liga Nacional, Campeonato Paulista, Amistoso..." />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="goalkeeper_name">Elenco de Goleiros</Label>
                        <Input id="goalkeeper_name" name="goalkeeper_name" placeholder="Ex: Marcelo, Alex, Gabriel" required />
                      </div>
                    </div>
                    <DialogFooter className="pt-4">
                      <Button type="submit" className="font-bold bg-primary text-white" disabled={createMut.isPending}>
                        🚀 Iniciar Scout
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* NAVEGAÇÃO PRINCIPAL DAS VISÕES: JOGOS VS EVOLUÇÃO HISTÓRICA VS HEAD-TO-HEAD */}
        <div className="flex flex-wrap border-b pb-1 gap-2">
          <Button
            size="sm"
            variant={mainTab === "games" ? "default" : "ghost"}
            className={cn("font-bold text-xs", mainTab === "games" && "bg-primary text-white shadow")}
            onClick={() => setMainTab("games")}
          >
            <Trophy className="h-4 w-4 mr-1.5" /> 🏆 Lista de Partidas ({games.length})
          </Button>

          <Button
            size="sm"
            variant={mainTab === "comparison" ? "default" : "ghost"}
            className={cn("font-bold text-xs", mainTab === "comparison" && "bg-emerald-600 text-white shadow")}
            onClick={() => setMainTab("comparison")}
          >
            <BarChart3 className="h-4 w-4 mr-1.5" /> 📈 Evolução & Comparação Histórica
          </Button>

          <Button
            size="sm"
            variant={mainTab === "head_to_head" ? "default" : "ghost"}
            className={cn("font-bold text-xs", mainTab === "head_to_head" && "bg-purple-600 text-white shadow")}
            onClick={() => setMainTab("head_to_head")}
          >
            <Swords className="h-4 w-4 mr-1.5" /> ⚔️ Head-to-Head (Confronto Direto)
          </Button>

          <Button
            size="sm"
            variant={mainTab === "tactical_board" ? "default" : "ghost"}
            className={cn("font-bold text-xs", mainTab === "tactical_board" && "bg-cyan-600 text-white shadow")}
            onClick={() => setMainTab("tactical_board")}
          >
            <Layers className="h-4 w-4 mr-1.5" /> 📋 Prancheta Tática 2D
          </Button>
        </div>

        {mainTab === "comparison" ? (
          <HistoricalComparison games={games} shotsByGame={shotsByGame} />
        ) : mainTab === "head_to_head" ? (
          <HeadToHeadDashboard games={games} shotsByGame={shotsByGame} />
        ) : mainTab === "tactical_board" ? (
          <TacticalBoardContainer />
        ) : (
          <>
            {/* ABAS / FILTROS DE STATUS (TODAS, EM ANDAMENTO, CONCLUÍDAS) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-3 rounded-xl border">
              <div className="flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-muted-foreground mr-1" />
                <span className="text-xs font-bold text-muted-foreground uppercase mr-1">Filtrar por Status:</span>
                
                <Button
                  size="sm"
                  variant={statusFilter === "all" ? "default" : "ghost"}
                  className={cn("h-8 text-xs font-bold", statusFilter === "all" && "bg-primary text-white shadow-xs")}
                  onClick={() => setStatusFilter("all")}
                >
                  Todas ({games.length})
                </Button>

                <Button
                  size="sm"
                  variant={statusFilter === "in_progress" ? "default" : "ghost"}
                  className={cn(
                    "h-8 text-xs font-bold border border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200",
                    statusFilter === "in_progress" && "bg-amber-500 text-amber-950 border-amber-600 shadow-xs"
                  )}
                  onClick={() => setStatusFilter("in_progress")}
                >
                  <Clock className="h-3.5 w-3.5 mr-1" /> Em Andamento ({inProgressCount})
                </Button>

                <Button
                  size="sm"
                  variant={statusFilter === "completed" ? "default" : "ghost"}
                  className={cn(
                    "h-8 text-xs font-bold border border-emerald-300 text-emerald-900 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200",
                    statusFilter === "completed" && "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                  )}
                  onClick={() => setStatusFilter("completed")}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Concluídas ({completedCount})
                </Button>
              </div>
            </div>

        {/* LISTA DE CARDS DE JOGOS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full py-12 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="mt-3 text-sm text-muted-foreground">Carregando partidas...</p>
            </div>
          ) : filteredGames.length === 0 ? (
            <Card className="col-span-full border-dashed">
              <CardContent className="py-12 text-center">
                <Trophy className="mx-auto h-10 w-10 text-muted-foreground opacity-50" />
                <p className="mt-3 text-sm text-muted-foreground font-semibold">Nenhuma partida encontrada para este filtro.</p>
              </CardContent>
            </Card>
          ) : (
            filteredGames.map((g) => {
              const isCompleted = g.effectiveStatus === "completed";

              return (
                <Card key={g.id} className="group transition-all hover:shadow-md border flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      {/* BADGE VISUAL DO STATUS DO SCOUT */}
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs",
                          isCompleted
                            ? "bg-emerald-100 text-emerald-900 border-emerald-400 dark:bg-emerald-950 dark:text-emerald-200"
                            : "bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950 dark:text-amber-200"
                        )}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Scout Concluído
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 text-amber-600 animate-pulse" /> Em Andamento
                          </>
                        )}
                      </span>

                      {g.category ? (
                        <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {g.category}
                        </span>
                      ) : null}
                    </div>

                    <CardTitle className="text-lg font-bold text-primary">
                      {g.team_name} <span className="text-accent">vs</span> {g.opponent}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5 text-xs">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(g.game_date + "T00:00").toLocaleDateString("pt-BR")}
                      {g.competition ? ` · ${g.competition}` : ""}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    <p className="text-xs text-muted-foreground">
                      <span>Goleiros:</span> <span className="font-semibold text-foreground">{g.goalkeeper_name}</span>
                    </p>

                    <div className="flex flex-col gap-2 pt-2 border-t">
                      <div className="flex items-center justify-between gap-2">
                        <Button asChild size="sm" className="font-bold flex-1">
                          <Link to="/app/game/$gameId" params={{ gameId: g.id }}>
                            {isJogador ? "📊 Assistir Vídeo & Ver Stats" : isCompleted ? "📊 Ver Relatório & Stats" : "✏️ Continuar Scout"}
                          </Link>
                        </Button>

                        {isTecnico && (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-accent"
                              onClick={() => {
                                setTargetShareScout({ id: g.id, title: `${g.team_name} vs ${g.opponent}` });
                                setIsShareScoutModalOpen(true);
                              }}
                              title="Compartilhar Apenas este Scout"
                            >
                              <Share2 className="h-4 w-4 text-purple-600" />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                if (confirm(`Tem certeza que deseja excluir o jogo "${g.team_name} vs ${g.opponent}"?`)) {
                                  deleteMut.mutate(g.id);
                                }
                              }}
                              title="Excluir Jogo"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* BOTÃO ALTERNADAR DE STATUS (APENAS TÉCNICO) */}
                      {isTecnico && (
                        <Button
                          size="xs"
                          variant="outline"
                          className={cn(
                            "w-full h-7 text-[11px] font-bold transition-all",
                            isCompleted
                              ? "border-amber-400 text-amber-800 hover:bg-amber-500 hover:text-white dark:text-amber-300"
                              : "border-emerald-500 text-emerald-800 hover:bg-emerald-600 hover:text-white dark:text-emerald-300"
                          )}
                          onClick={() => toggleStatusMut.mutate({ gameId: g.id, currentStatus: g.effectiveStatus })}
                        >
                          {isCompleted ? (
                            <>
                              <RotateCcw className="h-3 w-3 mr-1 text-amber-600" /> 🔁 Reabrir Scout (Voltar para Em Andamento)
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" /> ✅ Marcar Scout como Concluído
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
        </>
        )}
      </main>

      {/* MODAL DE COMPARTILHAMENTO DE EQUIPE */}
      <ShareTeamModal
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        availableTeams={Array.from(new Set(games.map((g) => g.team_name?.trim()).filter(Boolean)))}
        initialTeam={targetShareTeam || "UFAL"}
      />

      {/* MODAL DE COMPARTILHAMENTO DE SCOUT ISOLADO */}
      <ShareScoutModal
        open={isShareScoutModalOpen}
        onOpenChange={setIsShareScoutModalOpen}
        gameId={targetShareScout?.id || ""}
        gameTitle={targetShareScout?.title || ""}
      />
    </div>
  );
}
