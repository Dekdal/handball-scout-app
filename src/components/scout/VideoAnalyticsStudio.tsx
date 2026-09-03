import { useState, useRef, useEffect, useMemo } from "react";
import { Video, Play, Pause, SkipBack, SkipForward, RotateCcw, Filter, Sliders, CheckCircle, AlertCircle, Layers, User, Crosshair, Sparkles, Film, Download, Loader2, Palette, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VideoSyncModal } from "./VideoSyncModal";
import { VideoFirstTagging } from "./VideoFirstTagging";
import { TelestratorCanvas, type Shape } from "./TelestratorCanvas";
import { calculateClipWindow, secondsToTimeString, type VideoConfig, type ClipWindow } from "@/lib/scout/video";
import { exportPlaylistToVideo, type ExportProgress } from "@/lib/scout/videoExporter";
import { positionLabel, resultLabel, formattedResultLabel, RESULTS, POSITIONS, SHOT_TYPES, TACTICAL_PLAY_TYPES } from "@/lib/scout/constants";
import type { Shot } from "@/lib/scout/stats";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  game: any;
  shots: Shot[];
  teamName: string;
  onAddShot?: (draft: any) => void;
  onRemoveShot?: (shotId: string) => void;
  readOnly?: boolean;
}

export function VideoAnalyticsStudio({ game, shots, teamName, onAddShot, onRemoveShot, readOnly = false }: Props) {
  const opponentName = game?.opponent || "Adversário";

  // MODO DA TELA: "tagging" (MARCAÇÃO NO VÍDEO) ou "studio" (PLAYLISTS E FILTROS)
  const [activeMode, setActiveMode] = useState<"tagging" | "studio">(readOnly ? "studio" : "tagging");

  // Estado da Configuração do Vídeo e Offsets
  const [config, setConfig] = useState<VideoConfig>({
    videoUrl: null,
    videoFileName: null,
    offset1TSeconds: 0,
    offset2TSeconds: 0,
    preRollSeconds: 5,
    postRollSeconds: 3,
  });

  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);

  // ESTADOS DOS FILTROS AVANÇADOS MULTI-CRITÉRIO
  const [filterTeam, setFilterTeam] = useState<string>("all");
  const [filterPlayer, setFilterPlayer] = useState<string>("all");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const [filterShotType, setFilterShotType] = useState<string>("all");
  const [filterTactical, setFilterTactical] = useState<string>("all");
  const [filterResult, setFilterResult] = useState<string>("all");

  // PLAYLIST, PLAYER E ESTADO DE EXPORTAÇÃO MP4
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentClipIndex, setCurrentClipIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStudioTime, setCurrentStudioTime] = useState<number>(0);

  // ESTADO DE DESENHO LIVRE AO VIVO SOBRE O VÍDEO (SEM NECESSIDADE DE SALVAR)
  const [isLiveDrawingActive, setIsLiveDrawingActive] = useState<boolean>(false);
  const [liveShapes, setLiveShapes] = useState<Shape[]>([]);

  // Ref para controlar o último clipe cujo tempo de início foi buscado no vídeo
  const lastPositionedClipRef = useRef<number | null>(null);

  // Controle de auto-pausa no frame do desenho
  const hasAutoPausedForDrawingRef = useRef<boolean>(false);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);

  // Obter lista única de números de camisa presentes nos lances
  const allPlayerNumbers = Array.from(
    new Set(shots.flatMap((s) => [s.player_number, s.assist_number]).filter((n): n is number => n != null))
  ).sort((a, b) => a - b);

  // Aplicação dos Filtros Combinados com Memoização
  const filteredShots = useMemo(() => {
    return (shots || []).filter((s) => {
      if (!s) return false;
      if (filterTeam !== "all") {
        const matchTeam = filterTeam === teamName
          ? (!s.possession_team || String(s.possession_team).trim().toLowerCase() === String(teamName || "").trim().toLowerCase())
          : (Boolean(s.possession_team) && String(s.possession_team).trim().toLowerCase() !== String(teamName || "").trim().toLowerCase());
        if (!matchTeam) return false;
      }
      if (filterPlayer !== "all" && s.player_number !== Number(filterPlayer) && s.assist_number !== Number(filterPlayer)) {
        return false;
      }
      if (filterPosition !== "all" && s.position !== filterPosition) return false;
      if (filterShotType !== "all" && s.shot_type !== filterShotType) return false;
      if (filterTactical !== "all" && s.tactical_play !== filterTactical) return false;
      if (filterResult !== "all") {
        const isPerda = s.result.startsWith("perda");
        const isTatica = s.result.startsWith("tatica");
        if (filterResult === "perda" && !isPerda) return false;
        if (filterResult === "tatica" && !isTatica) return false;
        if (filterResult !== "perda" && filterResult !== "tatica" && s.result !== filterResult) return false;
      }
      return true;
    });
  }, [shots, filterTeam, teamName, opponentName, filterPlayer, filterPosition, filterShotType, filterTactical, filterResult]);

  // Resetar o índice da playlist para o 1º lance ao alterar qualquer filtro
  useEffect(() => {
    setCurrentClipIndex(0);
  }, [filterTeam, filterPlayer, filterPosition, filterShotType, filterTactical, filterResult]);

  // Mapeamento dos clipes filtrados com cálculo das janelas de tempo no vídeo (memoizado)
  const clipsList: ClipWindow[] = useMemo(() => {
    return filteredShots.map((s) => calculateClipWindow(s, config));
  }, [filteredShots, config]);

  const activeClip = clipsList[currentClipIndex] || null;
  const activeClipStart = activeClip?.start;
  const activeClipEnd = activeClip?.end;

  // Extrair formas salvas do clipe ativo
  let parsedActiveShapes: Shape[] = [];
  if (activeClip?.shot?.drawing_data) {
    try {
      parsedActiveShapes = JSON.parse(activeClip.shot.drawing_data);
    } catch {
      parsedActiveShapes = [];
    }
  }

  // Efeito 1: Posicionar o vídeo no início do clipe apenas quando o índice do clipe mudar
  useEffect(() => {
    if (!videoRef.current || activeClipStart == null) return;
    const vid = videoRef.current;

    if (lastPositionedClipRef.current !== currentClipIndex) {
      lastPositionedClipRef.current = currentClipIndex;
      hasAutoPausedForDrawingRef.current = false;
      setIsLiveDrawingActive(false);
      setLiveShapes([]);

      const startTime = typeof activeClipStart === "number" && !isNaN(activeClipStart) && isFinite(activeClipStart)
        ? Math.max(0, activeClipStart)
        : 0;

      const applySeek = () => {
        try {
          vid.currentTime = startTime;
          if (isPlaying) {
            vid.play().catch(() => {});
          }
        } catch {
          // Ignora exceções se vídeo ainda estiver abrindo
        }
      };

      if (vid.readyState >= 1) {
        applySeek();
      } else {
        const handleLoadedMetadata = () => {
          applySeek();
          vid.removeEventListener("loadedmetadata", handleLoadedMetadata);
        };
        vid.addEventListener("loadedmetadata", handleLoadedMetadata);
      }
    }
  }, [currentClipIndex, activeClipStart, isPlaying]);

  // Efeito 2: Escutar timeupdate e gerenciar o avanço do clipe sem resetar currentTime!
  useEffect(() => {
    if (!videoRef.current || !activeClip) return;
    const vid = videoRef.current;

    const handleTimeUpdate = () => {
      setCurrentStudioTime(vid.currentTime);

      // Auto-pausa exata no instante do desenho tático
      if (
        parsedActiveShapes.length > 0 &&
        activeClip.shot.video_timestamp_seconds != null &&
        !hasAutoPausedForDrawingRef.current
      ) {
        const targetTime = activeClip.shot.video_timestamp_seconds;
        if (vid.currentTime >= targetTime && vid.currentTime <= targetTime + 0.5) {
          vid.pause();
          setIsPlaying(false);
          hasAutoPausedForDrawingRef.current = true;
          return;
        }
      }

      // Avançar para o próximo clipe da playlist ao fim do clipe atual
      const clipEndTime = typeof activeClipEnd === "number" && !isNaN(activeClipEnd) ? activeClipEnd : (activeClipStart || 0) + 10;
      if (vid.currentTime >= clipEndTime) {
        if (currentClipIndex < clipsList.length - 1) {
          setCurrentClipIndex((prev) => prev + 1);
        } else {
          vid.pause();
          setIsPlaying(false);
        }
      }
    };

    vid.addEventListener("timeupdate", handleTimeUpdate);
    return () => vid.removeEventListener("timeupdate", handleTimeUpdate);
  }, [currentClipIndex, activeClip, activeClipStart, activeClipEnd, clipsList.length, parsedActiveShapes.length]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleExportPlaylistMP4 = async () => {
    if (!config.videoUrl) {
      toast.error("Nenhum vídeo da partida foi selecionado!");
      return;
    }
    if (clipsList.length === 0) {
      toast.error("Nenhum lance selecionado nos filtros para exportar!");
      return;
    }

    setIsExporting(true);
    setExportProgress({ currentClipIndex: 1, totalClips: clipsList.length, statusMessage: "Iniciando renderização..." });

    try {
      const blob = await exportPlaylistToVideo(
        config.videoUrl,
        clipsList,
        `${teamName}_vs_${opponentName}`,
        (p) => setExportProgress(p)
      );

      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `Playlist_Tatica_${teamName}_vs_${opponentName}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      toast.success("Playlist MP4 baixada com sucesso!");
    } catch (err: any) {
      console.error("Erro na exportação de vídeo:", err);
      toast.error("Falha ao exportar vídeo: " + (err?.message || "Tente novamente."));
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* CABEÇALHO DE STATUS E SELETOR DE MODO */}
      <Card className="border-2 border-primary/20 bg-card">
        <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <Video className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                Módulo de Vídeo & Playlists Táticas {readOnly && "(Modo Jogador)"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {config.videoFileName
                  ? `Vídeo: ${config.videoFileName} · Offsets: 1ºT (${config.offset1TSeconds}s) | 2ºT (${config.offset2TSeconds}s)`
                  : "Nenhum arquivo de vídeo carregado. Abra o modal para selecionar o vídeo gravado da partida."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!readOnly && (
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border">
                <Button
                  size="sm"
                  variant={activeMode === "tagging" ? "default" : "ghost"}
                  className={cn("text-xs font-bold h-8", activeMode === "tagging" && "shadow")}
                  onClick={() => setActiveMode("tagging")}
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
                  Marcação no Vídeo (Video-First)
                </Button>
                <Button
                  size="sm"
                  variant={activeMode === "studio" ? "default" : "ghost"}
                  className={cn("text-xs font-bold h-8", activeMode === "studio" && "shadow")}
                  onClick={() => setActiveMode("studio")}
                >
                  <Film className="mr-1.5 h-3.5 w-3.5 text-accent" />
                  Playlists & Filtros
                </Button>
              </div>
            )}

            <Button
              size="sm"
              variant="outline"
              className="font-bold border-accent/40 text-accent hover:bg-accent/10"
              onClick={() => setIsSyncModalOpen(true)}
            >
              <Sliders className="mr-1.5 h-4 w-4" />
              {config.videoFileName ? "Vídeo Carregado" : "Carregar Vídeo"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* MODAL DE SELEÇÃO E SINCRO DE VÍDEO */}
      <VideoSyncModal
        open={isSyncModalOpen}
        onOpenChange={setIsSyncModalOpen}
        config={config}
        onSaveConfig={(newConfig) => {
          setConfig(newConfig);
          toast.success("Vídeo e offsets da partida atualizados com sucesso!");
        }}
      />

      {/* COMPONENTES DE ACORDO COM O MODO SELECIONADO */}
      {!readOnly && activeMode === "tagging" ? (
        <VideoFirstTagging
          teamName={teamName}
          opponentName={opponentName}
          config={config}
          shots={shots}
          onSubmit={(draft) => onAddShot?.(draft)}
          onRemoveShot={onRemoveShot}
          onUpdateShot={onUpdateShot}
        />
      ) : (
        /* MODO STUDIO (PLAYLISTS E VÍDEO FILTRADO) */
        <div className="space-y-6">
          
          {/* BARRA DE FILTROS AVANÇADOS MULTI-CRITÉRIO */}
          <Card className="border-l-4 border-l-accent">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-accent" />
                  <span className="text-xs font-bold uppercase text-primary">Filtros Táticos de Playlist:</span>
                </div>

                <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-300">
                  {clipsList.length} {clipsList.length === 1 ? "lance encontrado" : "lances encontrados"}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                <div>
                  <Label className="text-[11px] font-bold text-muted-foreground">Posse da Bola</Label>
                  <Select value={filterTeam} onValueChange={setFilterTeam}>
                    <SelectTrigger className="h-8 text-xs font-bold"><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Equipes</SelectItem>
                      <SelectItem value={teamName}>🛡️ {teamName}</SelectItem>
                      <SelectItem value={opponentName}>⚔️ {opponentName}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[11px] font-bold text-muted-foreground">Atleta (Camisa #)</Label>
                  <Select value={filterPlayer} onValueChange={setFilterPlayer}>
                    <SelectTrigger className="h-8 text-xs font-bold"><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Atletas</SelectItem>
                      {allPlayerNumbers.map((num) => (
                        <SelectItem key={num} value={String(num)}>Camisa #{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[11px] font-bold text-muted-foreground">Posição de Quadra</Label>
                  <Select value={filterPosition} onValueChange={setFilterPosition}>
                    <SelectTrigger className="h-8 text-xs font-bold"><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Posições</SelectItem>
                      {POSITIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[11px] font-bold text-muted-foreground">Tipo de Arremesso</Label>
                  <Select value={filterShotType} onValueChange={setFilterShotType}>
                    <SelectTrigger className="h-8 text-xs font-bold"><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Tipos</SelectItem>
                      {SHOT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[11px] font-bold text-muted-foreground">Jogada Tática</Label>
                  <Select value={filterTactical} onValueChange={setFilterTactical}>
                    <SelectTrigger className="h-8 text-xs font-bold"><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Jogadas</SelectItem>
                      {TACTICAL_PLAY_TYPES.map((tp) => (
                        <SelectItem key={tp.value} value={tp.value}>{tp.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[11px] font-bold text-muted-foreground">Resultado do Lance</Label>
                  <Select value={filterResult} onValueChange={setFilterResult}>
                    <SelectTrigger className="h-8 text-xs font-bold"><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Resultados</SelectItem>
                      <SelectItem value="gol">⚽ Gol</SelectItem>
                      <SelectItem value="defesa">🧤 Defesa</SelectItem>
                      <SelectItem value="fora">❌ Para Fora</SelectItem>
                      <SelectItem value="trave">🧱 Trave</SelectItem>
                      <SelectItem value="perda">🔄 Perda de Bola</SelectItem>
                      <SelectItem value="tatica">🧠 Jogada Tática</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ÁREA DO PLAYER DE VÍDEO COM CANVAS DE TELESTRATOR PARA PLAYLISTS */}
          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* PLAYER PRINCIPAL */}
            <div className="lg:col-span-2 space-y-3">
              <Card className="border-2 border-primary/20 overflow-hidden bg-black shadow-xl">
                <CardContent className="p-0 relative aspect-video flex items-center justify-center bg-black">
                  {config.videoUrl ? (
                    <div className="relative w-full h-full">
                      <video
                        ref={videoRef}
                        src={config.videoUrl}
                        className="w-full h-full object-contain"
                        controls={false}
                      />
                      
                      {/* CANVAS TELESTRATOR SOBREPOSTO (COM SUPORTE A DESENHO LIVRE AO VIVO) */}
                      <TelestratorCanvas
                        active={isLiveDrawingActive}
                        shapes={isLiveDrawingActive ? liveShapes : parsedActiveShapes}
                        initialShapes={parsedActiveShapes}
                        onShapesChange={(newShapes) => setLiveShapes(newShapes)}
                        onCancel={() => {
                          setIsLiveDrawingActive(false);
                          setLiveShapes([]);
                        }}
                        readOnly={readOnly}
                      />
                    </div>
                  ) : (
                    <div className="text-center p-8 space-y-4">
                      <Film className="mx-auto h-12 w-12 text-accent opacity-80 animate-pulse" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white">
                          Nenhum vídeo da partida carregado neste dispositivo.
                        </p>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          Selecione o arquivo de vídeo do jogo (.mp4, .mov, .webm) para assistir aos lances e playlists táticas.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="font-extrabold bg-accent text-accent-foreground hover:bg-accent/90 shadow-md gap-2"
                        onClick={() => setIsSyncModalOpen(true)}
                      >
                        <Sliders className="h-4 w-4" /> 📂 Selecionar Vídeo da Partida
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* BARRINHA INTERATIVA DE TEMPO E PROGRESSO DO CLIPE NA PLAYLIST */}
              {config.videoUrl && activeClip && (
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-2 shadow-inner">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-cyan-400 font-extrabold flex items-center gap-1">
                      ⏱️ {secondsToTimeString(Math.max(0, currentStudioTime - (activeClipStart || 0)))}
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      Duração do Clipe: {secondsToTimeString(Math.max(0, (activeClipEnd || 0) - (activeClipStart || 0)))} · <span className="text-slate-300 font-semibold">(Vídeo: {secondsToTimeString(currentStudioTime)})</span>
                    </span>
                  </div>

                  {/* SCRUBBER SLIDER RANGE INTERATIVO */}
                  <input
                    type="range"
                    min={activeClipStart || 0}
                    max={activeClipEnd || ((activeClipStart || 0) + 10)}
                    step={0.1}
                    value={Math.max(activeClipStart || 0, Math.min(activeClipEnd || ((activeClipStart || 0) + 10), currentStudioTime))}
                    onChange={(e) => {
                      const targetTime = parseFloat(e.target.value);
                      if (videoRef.current && !isNaN(targetTime)) {
                        videoRef.current.currentTime = targetTime;
                        setCurrentStudioTime(targetTime);
                      }
                    }}
                    className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 focus:outline-none transition-all"
                  />
                </div>
              )}

              {/* CONTROLES DO PLAYER DA PLAYLIST */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/60 p-3 rounded-xl border">
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="default" onClick={togglePlay} disabled={!config.videoUrl || clipsList.length === 0} className="font-bold">
                    {isPlaying ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                    {isPlaying ? "Pausar" : "Reproduzir"}
                  </Button>

                  {/* BOTÃO DE DESENHO LIVRE AO VIVO (SEM SALVAR) */}
                  <Button
                    size="sm"
                    variant={isLiveDrawingActive ? "default" : "outline"}
                    className={cn(
                      "font-bold text-xs gap-1.5 transition-all",
                      isLiveDrawingActive
                        ? "bg-amber-500 hover:bg-amber-600 text-amber-950 border-amber-400 shadow-md ring-2 ring-amber-400/40"
                        : "border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                    )}
                    disabled={!config.videoUrl}
                    onClick={() => {
                      if (!isLiveDrawingActive) {
                        if (videoRef.current && !videoRef.current.paused) {
                          videoRef.current.pause();
                          setIsPlaying(false);
                        }
                        setIsLiveDrawingActive(true);
                      } else {
                        setIsLiveDrawingActive(false);
                      }
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    {isLiveDrawingActive ? "Concluir Desenho" : "🎨 Desenhar no Vídeo"}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentClipIndex === 0}
                    onClick={() => setCurrentClipIndex((prev) => Math.max(0, prev - 1))}
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>

                  <span className="text-xs font-mono font-bold px-2">
                    Lance {clipsList.length > 0 ? currentClipIndex + 1 : 0} de {clipsList.length}
                  </span>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentClipIndex >= clipsList.length - 1}
                    onClick={() => setCurrentClipIndex((prev) => Math.min(clipsList.length - 1, prev + 1))}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                {/* BOTÃO DE EXPORTAR MP4 DA PLAYLIST */}
                {!readOnly && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-bold border-emerald-500 text-emerald-800 hover:bg-emerald-600 hover:text-white dark:text-emerald-300"
                    onClick={handleExportPlaylistMP4}
                    disabled={isExporting || clipsList.length === 0 || !config.videoUrl}
                  >
                    {isExporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
                    {isExporting ? `Exportando (${exportProgress?.currentClipIndex || 1}/${exportProgress?.totalClips || 1})...` : "Baixar Playlist MP4"}
                  </Button>
                )}
              </div>
            </div>

            {/* LISTA DE LANCES FILTRADOS */}
            <Card className="border-t-4 border-t-accent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-primary flex items-center gap-2">
                  <Layers className="h-4 w-4 text-accent" />
                  Lances da Playlist ({clipsList.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[380px] overflow-y-auto divide-y">
                  {clipsList.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      Nenhum lance coincide com os filtros selecionados.
                    </div>
                  ) : (
                    clipsList.map((clip, idx) => {
                      const isSelected = idx === currentClipIndex;
                      const s = clip.shot;
                      return (
                        <div
                          key={`clip-${s.id}-${idx}`}
                          className={cn(
                            "p-3 text-xs flex items-center justify-between cursor-pointer transition-colors hover:bg-muted/50",
                            isSelected && "bg-accent/15 border-l-4 border-l-accent font-bold"
                          )}
                          onClick={() => {
                            setCurrentClipIndex(idx);
                            setIsPlaying(true);
                          }}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-primary">#{idx + 1}</span>
                              <span className="font-bold text-foreground">
                                Camisa #{s.player_number ?? "—"}
                              </span>
                              <span className="text-[10px] text-muted-foreground">({positionLabel(s.position as any)})</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {formattedResultLabel(s.result as any)} · Tempo: {secondsToTimeString(clip.start)} - {secondsToTimeString(clip.end)}
                            </p>
                          </div>

                          {isSelected && <Play className="h-4 w-4 text-accent animate-pulse" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      )}
    </div>
  );
}
