import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FileDown, FileSpreadsheet, FileText, Trash2, ArrowLeft, Video, Pencil, Check, UserPlus, ShieldCheck, Star, Layers } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { StatsDashboard } from "@/components/scout/StatsDashboard";
import { PlayerLeaderboard } from "@/components/scout/PlayerLeaderboard";
import { PlayerProfile } from "@/components/scout/PlayerProfile";
import { TacticalAnalytics } from "@/components/scout/TacticalAnalytics";
import { DefensiveImpact } from "@/components/scout/DefensiveImpact";
import { ExecutiveReport } from "@/components/scout/ExecutiveReport";
import { VideoAnalyticsStudio } from "@/components/scout/VideoAnalyticsStudio";
import { TacticalBoardContainer } from "@/components/tactical/TacticalBoardContainer";
import { exportCSV, exportXLSX, exportPDF } from "@/lib/scout/exports";
import { positionLabel, resultLabel, formattedResultLabel, RESULTS } from "@/lib/scout/constants";
import type { Shot } from "@/lib/scout/stats";
import type { VideoConfig } from "@/lib/scout/video";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/game/$gameId")({
  component: GameScoutPage,
});

export type RawShot = {
  id: string;
  player_number: number | null;
  assist_number: number | null;
  shot_type: string;
  position: string;
  zone: string;
  result: string;
  game_time: string | null;
  period: string | null;
  possession_team: string | null;
  sector: string | null;
  is_pseudo_assist: boolean | null;
  tactical_play: string | null;
  turnover_reason: string | null;
  defensive_sector: string | null;
  numerical_status: string | null;
  goalkeeper_name: string | null;
  notes: string | null;
  dominant_hand: string | null;
  video_timestamp_seconds?: number | null;
};

async function fetchGameDetails(gameId: string) {
  const { data, error } = await supabase.from("games").select("*").eq("id", gameId).single();
  if (error) throw error;
  return data;
}

async function fetchShots(gameId: string) {
  const { data, error } = await supabase.from("shots").select("*").eq("game_id", gameId).order("created_at", { ascending: true });
  if (error) throw error;
  return data as RawShot[];
}

async function appendGoalkeeperApi(gameId: string, currentName: string | null, newName: string) {
  let updatedGkList = newName;
  if (currentName && currentName.trim()) {
    const existing = currentName.split(",").map((s) => s.trim());
    if (!existing.includes(newName.trim())) {
      updatedGkList = `${currentName}, ${newName.trim()}`;
    } else {
      updatedGkList = currentName;
    }
  }
  const { error } = await supabase.from("games").update({ goalkeeper_name: updatedGkList }).eq("id", gameId);
  if (error) throw error;
}

async function renameGoalkeeperApi(gameId: string, currentNameStr: string | null, oldName: string, newName: string) {
  let list = currentNameStr ? currentNameStr.split(",").map((s) => s.trim()).filter(Boolean) : [];
  list = list.map((n) => (n === oldName ? newName : n));
  const newGkStr = list.join(", ");

  const { error: gameErr } = await supabase.from("games").update({ goalkeeper_name: newGkStr }).eq("id", gameId);
  if (gameErr) throw gameErr;

  const { error: shotErr } = await supabase.from("shots").update({ goalkeeper_name: newName }).eq("game_id", gameId).eq("goalkeeper_name", oldName);
  if (shotErr) throw shotErr;
}

async function deleteGoalkeeperApi(gameId: string, currentNameStr: string | null, nameToDelete: string) {
  let list = currentNameStr ? currentNameStr.split(",").map((s) => s.trim()).filter(Boolean) : [];
  list = list.filter((n) => n !== nameToDelete);
  const newGkStr = list.join(", ");

  const { error } = await supabase.from("games").update({ goalkeeper_name: newGkStr }).eq("id", gameId);
  if (error) throw error;
}

async function addShotApi(gameId: string, userId: string, payload: any) {
  let dbResult = payload.result;
  if ((payload.result === "perda" || payload.result.startsWith("cartao_") || payload.result.includes("2min")) && payload.turnover_reason) {
    dbResult = `${payload.result}:${payload.turnover_reason}`;
  }

  if (payload.shot_origin_x != null && payload.shot_origin_y != null) {
    dbResult = `${dbResult}|xy:${payload.shot_origin_x},${payload.shot_origin_y}`;
  }

  const periodPrefix = payload.period === "2º Tempo" ? "2T" : "1T";
  const dbTime = `${periodPrefix} ${payload.game_time || "00:00"}`;

  const corePayload: any = {
    game_id: gameId,
    user_id: userId,
    player_number: payload.player_number ?? null,
    position: payload.position || "ponta_esq",
    shot_type: payload.shot_type || "6m",
    zone: payload.zone || "B2",
    result: dbResult,
    game_time: dbTime,
    dominant_hand: payload.dominant_hand || "destra",
  };

  if (payload.goalkeeper_name) {
    corePayload.goalkeeper_name = payload.goalkeeper_name;
  }

  const { data, error } = await supabase.from("shots").insert([corePayload]).select().single();
  if (error) {
    // Se a coluna goalkeeper_name ainda não existir na tabela shots do Supabase, executa fallback limpo sem a coluna
    if (error.message?.includes("goalkeeper_name") || error.code === "PGRST204") {
      delete corePayload.goalkeeper_name;
      const fallback = await supabase.from("shots").insert([corePayload]).select().single();
      if (fallback.error) throw fallback.error;
      return fallback.data;
    }
    throw error;
  }
  return data;
}

async function deleteShotApi(gameId: string, shotId: string) {
  const { error } = await supabase.from("shots").delete().eq("id", shotId);
  if (error) throw error;
}

function rawToShot(r: RawShot): Shot {
  let res = r.result || "";
  let reason: string | null = r.turnover_reason || null;
  let periodName = r.period || "1º Tempo";
  let timeOnly = r.game_time || "00:00";

  let originX: number | undefined = undefined;
  let originY: number | undefined = undefined;
  let drawingData: string | undefined = undefined;

  if (res.includes("|xy:")) {
    const parts = res.split("|xy:");
    res = parts[0];
    if (parts[1]) {
      const [xStr, yStr] = parts[1].split(",");
      originX = Number(xStr);
      originY = Number(yStr);
    }
  }

  if (res.includes("|draw:")) {
    const parts = res.split("|draw:");
    res = parts[0];
    drawingData = parts[1];
  }

  if (res && res.startsWith("perda:")) {
    const parts = res.split(":");
    res = "perda";
    reason = parts[1] || reason;
  }

  if (timeOnly.startsWith("1T ")) {
    periodName = "1º Tempo";
    timeOnly = timeOnly.replace("1T ", "");
  } else if (timeOnly.startsWith("2T ")) {
    periodName = "2º Tempo";
    timeOnly = timeOnly.replace("2T ", "");
  }

  return {
    id: r.id,
    player_number: r.player_number,
    assist_number: r.assist_number,
    shot_type: r.shot_type as any,
    position: r.position as any,
    zone: r.zone as any,
    result: res as any,
    game_time: timeOnly,
    period: periodName,
    possession_team: r.possession_team,
    sector: r.sector,
    is_pseudo_assist: r.is_pseudo_assist,
    tactical_play: r.tactical_play,
    turnover_reason: reason,
    defensive_sector: r.defensive_sector,
    numerical_status: r.numerical_status,
    goalkeeper_name: r.goalkeeper_name,
    notes: r.notes || null,
    dominant_hand: r.dominant_hand,
    video_timestamp_seconds: r.video_timestamp_seconds ?? undefined,
    shot_origin_x: originX,
    shot_origin_y: originY,
    drawing_data: drawingData,
  };
}

function GameScoutPage() {
  const { gameId } = Route.useParams();
  const { isJogador, isTecnico } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<string>("video_studio");

  // Modais de Adicionar e Editar Goleiro no Cabeçalho
  const [isAddGkModalOpen, setIsAddGkModalOpen] = useState<boolean>(false);
  const [newGkName, setNewGkName] = useState<string>("");

  const [editingGkName, setEditingGkName] = useState<string | null>(null);
  const [editGkInput, setEditGkInput] = useState<string>("");

  const { data: game, isLoading: loadingGame } = useQuery({
    queryKey: ["game", gameId],
    queryFn: () => fetchGameDetails(gameId),
  });

  const { data: rawShots = [], isLoading: loadingShots } = useQuery({
    queryKey: ["shots", gameId],
    queryFn: () => fetchShots(gameId),
    refetchInterval: 2000,
  });

  const shots = rawShots.map(rawToShot);

  // Lista de goleiros da partida
  const goalkeeperRoster = Array.from(
    new Set([
      ...(game?.goalkeeper_name ? game.goalkeeper_name.split(",").map((s: string) => s.trim()) : []),
      ...shots.map((s) => s.goalkeeper_name).filter((g): g is string => Boolean(g)),
    ])
  );

  const titularGk = goalkeeperRoster[0] || "Não definido";

  // MUTAÇÕES
  const setTitularGk = useMutation({
    mutationFn: async (targetGk: string) => {
      const newOrder = [targetGk, ...goalkeeperRoster.filter((g) => g !== targetGk)];
      const { error } = await supabase
        .from("games")
        .update({ goalkeeper_name: newOrder.join(", ") })
        .eq("id", gameId);
      if (error) throw error;
    },
    onSuccess: (_, targetGk) => {
      queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      queryClient.invalidateQueries({ queryKey: ["shots", gameId] });
      toast.success(`Goleiro "${targetGk}" promovido a Titular!`);
    },
    onError: (err: any) => {
      toast.error("Erro ao alterar titular: " + (err?.message || "Tente novamente"));
    },
  });

  const addGk = useMutation({
    mutationFn: (name: string) => appendGoalkeeperApi(gameId, game?.goalkeeper_name || null, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      toast.success("Novo goleiro adicionado ao elenco!");
      setIsAddGkModalOpen(false);
      setNewGkName("");
    },
    onError: (err: any) => {
      toast.error("Erro ao adicionar goleiro: " + (err?.message || "Tente novamente"));
    },
  });

  const renameGk = useMutation({
    mutationFn: ({ oldName, newName }: { oldName: string; newName: string }) =>
      renameGoalkeeperApi(gameId, game?.goalkeeper_name || null, oldName, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      queryClient.invalidateQueries({ queryKey: ["shots", gameId] });
      toast.success("Nome do goleiro alterado e estatísticas atualizadas!");
      setEditingGkName(null);
      setEditGkInput("");
    },
    onError: (err: any) => {
      toast.error("Erro ao renomear goleiro: " + (err?.message || "Tente novamente"));
    },
  });

  const deleteGk = useMutation({
    mutationFn: (nameToDelete: string) =>
      deleteGoalkeeperApi(gameId, game?.goalkeeper_name || null, nameToDelete),
    onSuccess: (_, nameToDelete) => {
      queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      toast.success(`Goleiro "${nameToDelete}" removido do elenco!`);
    },
    onError: (err: any) => {
      toast.error("Erro ao remover goleiro: " + (err?.message || "Tente novamente"));
    },
  });

  const addShot = useMutation({
    mutationFn: async (draft: any) => {
      const userRes = await supabase.auth.getUser();
      const currentUserId = game?.user_id || userRes.data.user?.id || "00000000-0000-0000-0000-000000000000";
      return addShotApi(gameId, currentUserId, draft);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shots", gameId] });
      const label = variables.result === "gol" ? "Gol marcado!" : variables.result === "perda" ? `Perda registrada!` : "Lance salvo!";
      toast.success(label);
    },
    onError: (err: any) => {
      console.error("Erro ao salvar lance:", err);
      toast.error("Erro ao registrar lance: " + (err?.message || "Tente novamente"));
    },
  });

  const removeShot = useMutation({
    mutationFn: (shotId: string) => deleteShotApi(gameId, shotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shots", gameId] });
      toast.success("Lance excluído com sucesso!");
    },
  });

  if (loadingGame || loadingShots) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive font-bold text-lg">Partida não encontrada.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/app">Voltar para Partidas</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* CABEÇALHO DA PARTIDA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Button size="xs" variant="ghost" asChild>
              <Link to="/app"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <h1 className="font-display text-2xl font-bold tracking-tight text-primary">
              {game.team_name} <span className="text-accent">vs</span> {game.opponent}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 flex items-center flex-wrap gap-1.5">
            <span>{new Date(game.game_date + "T00:00").toLocaleDateString("pt-BR")}</span>
            {game.competition ? <span>· {game.competition}</span> : null}
            {game.category ? <span>· {game.category}</span> : null}
            <span>· Goleiros:</span>
            
            {goalkeeperRoster.map((gk, index) => {
              const isTitular = index === 0;
              return (
                <span
                  key={gk}
                  className={cn(
                    "font-bold text-xs px-2.5 py-1 rounded-md border flex items-center gap-1 shadow-xs transition-all",
                    isTitular
                      ? "bg-emerald-600 text-white border-emerald-700 font-extrabold"
                      : "bg-card text-foreground border-accent/30 hover:border-emerald-500"
                  )}
                >
                  {isTitular ? (
                    <span>⭐ Titular: {gk}</span>
                  ) : (
                    <>
                      <span>Reserva: {gk}</span>
                      {isTecnico && (
                        <Button
                          size="xs"
                          variant="ghost"
                          className="h-4 px-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100 dark:hover:bg-emerald-900 ml-0.5 border border-emerald-300"
                          onClick={() => setTitularGk.mutate(gk)}
                          title="Promover este goleiro a Titular"
                        >
                          ⭐ Virar Titular
                        </Button>
                      )}
                    </>
                  )}

                  {/* BOTÃO DE RENOMEAR GOLEIRO (APENAS TÉCNICO) */}
                  {isTecnico && (
                    <Button
                      size="xs"
                      variant="ghost"
                      className="h-4 w-4 p-0 text-white/80 hover:text-white hover:bg-emerald-700 ml-0.5"
                      onClick={() => {
                        setEditingGkName(gk);
                        setEditGkInput(gk);
                      }}
                      title={`Editar nome do goleiro "${gk}"`}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}

                  {/* BOTÃO DE EXCLUIR GOLEIRO (APENAS TÉCNICO) */}
                  {isTecnico && goalkeeperRoster.length > 1 && (
                    <Button
                      size="xs"
                      variant="ghost"
                      className="h-4 w-4 p-0 text-red-300 hover:text-white hover:bg-red-600 ml-0.5"
                      onClick={() => {
                        if (confirm(`Tem certeza que deseja remover o goleiro "${gk}" do elenco?`)) {
                          deleteGk.mutate(gk);
                        }
                      }}
                      title={`Remover goleiro "${gk}"`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </span>
              );
            })}

            {isTecnico && (
              <Button
                size="xs"
                variant="outline"
                className="h-7 px-2 text-xs font-bold border-emerald-500 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                onClick={() => {
                  setNewGkName("");
                  setIsAddGkModalOpen(true);
                }}
                title="Adicionar Novo Goleiro à Partida"
              >
                <UserPlus className="h-3.5 w-3.5 mr-1" /> Adicionar Goleiro
              </Button>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCSV(game, shots)}><FileDown className="mr-1.5 h-4 w-4" />CSV (Base_Eventos)</Button>
          <Button variant="outline" size="sm" onClick={() => exportXLSX(game, shots)}><FileSpreadsheet className="mr-1.5 h-4 w-4" />Excel</Button>
          <Button variant="outline" size="sm" onClick={() => exportPDF(game, shots)}><FileText className="mr-1.5 h-4 w-4" />PDF Completo</Button>
        </div>
      </div>

      {/* MODAL DE ADICIONAR NOVO GOLEIRO À PARTIDA */}
      <Dialog open={isAddGkModalOpen} onOpenChange={setIsAddGkModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary font-bold">
              <UserPlus className="h-5 w-5 text-emerald-600" />
              Adicionar Goleiro à Partida
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Digite o nome do goleiro para incluí-lo no elenco da partida:
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-2">
            <Label className="text-xs font-bold">Nome do Goleiro</Label>
            <Input
              placeholder="Ex: Gabriel Maia (#1) / Lucas Silva (#12)"
              value={newGkName}
              onChange={(e) => setNewGkName(e.target.value)}
              className="h-9 text-sm"
              autoFocus
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setIsAddGkModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="default"
              className="font-bold bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={!newGkName.trim() || addGk.isPending}
              onClick={() => addGk.mutate(newGkName.trim())}
            >
              <Check className="h-4 w-4 mr-1" /> Adicionar Goleiro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE EDITAR NOME DE GOLEIRO NO CABEÇALHO */}
      <Dialog open={Boolean(editingGkName)} onOpenChange={(open) => !open && setEditingGkName(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary font-bold">
              <Pencil className="h-5 w-5 text-accent" />
              Editar Nome do Goleiro
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Altere o nome do atleta (isso atualizará automaticamente as estatísticas e lances gravados):
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-2">
            <Label className="text-xs font-bold">Nome do Goleiro</Label>
            <Input
              value={editGkInput}
              onChange={(e) => setEditGkInput(e.target.value)}
              className="h-9 text-sm"
              autoFocus
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditingGkName(null)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="default"
              className="font-bold bg-accent hover:bg-accent/90"
              disabled={!editGkInput.trim() || renameGk.isPending}
              onClick={() => {
                if (editingGkName && editGkInput.trim()) {
                  renameGk.mutate({ oldName: editingGkName, newName: editGkInput.trim() });
                }
              }}
            >
              <Check className="h-4 w-4 mr-1" /> Salvar Novo Nome
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-5 mb-4">
          <TabsTrigger value="video_studio" className="font-bold">
            <Video className="h-3.5 w-3.5 mr-1.5 text-accent" /> Scout no Vídeo & Playlists
          </TabsTrigger>
          <TabsTrigger value="profile">Perfil do Atleta</TabsTrigger>
          <TabsTrigger value="defensive">Defesa & 2min</TabsTrigger>
          <TabsTrigger value="scout_gk">Goleiro</TabsTrigger>
          <TabsTrigger value="executive_report" className="font-bold text-amber-500">Relatório Tático & Inteligência</TabsTrigger>
        </TabsList>

        {/* MANTÉM O VÍDEO E ESTÚDIO MONTADOS COM CSS PARA NUNCA SUMIR O ARQUIVO CARREGADO */}
        <div className={activeTab === "video_studio" ? "block space-y-4" : "hidden"}>
          <VideoAnalyticsStudio
            game={game}
            shots={shots}
            teamName={game.team_name}
            onAddShot={(draft) => addShot.mutate(draft)}
            onRemoveShot={(shotId) => removeShot.mutate(shotId)}
            readOnly={isJogador}
          />
        </div>

        {/* DEMAIS ABAS ANALÍTICAS */}
        {activeTab === "profile" && (
          <TabsContent value="profile">
            <PlayerProfile shots={shots} teamName={game.team_name} game={game} />
          </TabsContent>
        )}

        {activeTab === "defensive" && (
          <TabsContent value="defensive">
            <DefensiveImpact shots={shots} teamName={game.team_name} opponentName={game.opponent} />
          </TabsContent>
        )}

        {activeTab === "scout_gk" && (
          <TabsContent value="scout_gk">
            <StatsDashboard shots={shots} defaultGoalkeeper={titularGk} game={game} />
          </TabsContent>
        )}

        {activeTab === "executive_report" && (
          <TabsContent value="executive_report">
            <ExecutiveReport game={game} shots={shots} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
