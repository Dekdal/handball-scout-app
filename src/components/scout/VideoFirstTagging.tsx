import { useState, useRef, useEffect } from "react";
import { Video, Play, Pause, RotateCcw, Clock, Gauge, Trash2, Sparkles, Check, Crosshair, MapPin, Palette, UserCheck, ShieldCheck, UserPlus, Pencil, Volume2, VolumeX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GoalMap } from "./GoalMap";
import { CourtMap, type PointXY } from "./CourtMap";
import { TelestratorCanvas, type Shape } from "./TelestratorCanvas";
import {
  POSITIONS,
  SHOT_TYPES,
  RESULTS,
  DISCIPLINARY_CARDS,
  SANCTION_REASONS,
  TACTICAL_PLAY_TYPES,
  TURNOVER_REASONS,
  positionLabel,
  formattedResultLabel,
  type Position,
  type ShotType,
  type ShotResult,
  type Zone,
} from "@/lib/scout/constants";
import { secondsToTimeString, type VideoConfig } from "@/lib/scout/video";
import type { Shot, GoalkeeperItem } from "@/lib/scout/stats";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  teamName: string;
  opponentName: string;
  config: VideoConfig;
  shots: Shot[];
  onSubmit: (draft: any) => void;
  onRemoveShot?: (shotId: string) => void;
  defaultGoalkeeper?: string;
  onUpdateGoalkeeperName?: (oldName: string, newName: string) => void;
}

const PLAYBACK_SPEEDS = [
  { label: "0.25x", value: 0.25 },
  { label: "0.5x", value: 0.5 },
  { label: "0.75x", value: 0.75 },
  { label: "1.0x", value: 1.0 },
  { label: "1.25x", value: 1.25 },
  { label: "1.5x", value: 1.5 },
  { label: "2.0x", value: 2.0 },
];

export function VideoFirstTagging({
  teamName,
  opponentName,
  config,
  shots,
  onSubmit,
  onRemoveShot,
  defaultGoalkeeper,
  onUpdateGoalkeeperName,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [videoDuration, setVideoDuration] = useState<number>(0);

  // CONTROLADOR DO MODAL POP-UP DE MARCAÇÃO (OPÇÃO 2)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(0);
  const [capturedTimestamp, setCapturedTimestamp] = useState<number | null>(null);

  // ESTADO DO MODO DESENHO TÁTICO (TELESTRATOR)
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [telestratorShapes, setTelestratorShapes] = useState<Shape[]>([]);

  // 1. ESTRUTURA DE DADOS: ARRAY DE OBJETOS DE GOLEIROS (FIM DO BUG DA VÍRGULA)
  const [goalkeepers, setGoalkeepers] = useState<GoalkeeperItem[]>(() => {
    const names = new Set<string>();
    if (defaultGoalkeeper && defaultGoalkeeper.trim()) {
      defaultGoalkeeper.split(",").forEach((n) => {
        const trimmed = n.trim();
        if (trimmed) names.add(trimmed);
      });
    }
    shots.forEach((s) => {
      if (s.goalkeeper_name && s.goalkeeper_name.trim()) {
        names.add(s.goalkeeper_name.trim());
      }
    });

    if (names.size === 0) names.add("Goleiro 1");

    return Array.from(names).map((name, idx) => ({
      id: `gk-${idx + 1}`,
      name,
    }));
  });

  // 2. ID DO GOLEIRO EM QUADRA (activeGoalkeeperId)
  const [activeGoalkeeperId, setActiveGoalkeeperId] = useState<string>(
    goalkeepers[0]?.id || "gk-1"
  );

  // Modais de Adicionar e Editar Nome de Goleiro
  const [isAddGkDialogOpen, setIsAddGkDialogOpen] = useState<boolean>(false);
  const [newGkNameInput, setNewGkNameInput] = useState<string>("");

  const [editingGk, setEditingGk] = useState<GoalkeeperItem | null>(null);
  const [editGkNameInput, setEditGkNameInput] = useState<string>("");

  // Goleiro Ativo Atual (Objeto & Nome)
  const activeGkObj = goalkeepers.find((g) => g.id === activeGoalkeeperId) || goalkeepers[0];
  const activeGkName = activeGkObj?.name || "Goleiro";

  // Sincronizar quando defaultGoalkeeper mudar externamente
  useEffect(() => {
    if (defaultGoalkeeper) {
      const parts = defaultGoalkeeper.split(",").map((s) => s.trim()).filter(Boolean);
      parts.forEach((name) => {
        setGoalkeepers((prev) => {
          if (!prev.some((g) => g.name === name)) {
            return [...prev, { id: `gk-${Date.now()}-${Math.random()}`, name }];
          }
          return prev;
        });
      });
    }
  }, [defaultGoalkeeper]);

  // ADICIONAR NOVO GOLEIRO (PUSH NO ARRAY DE OBJETOS COM ID ÚNICO)
  const handleAddNewGoalkeeper = () => {
    const trimmed = newGkNameInput.trim();
    if (!trimmed) return;

    // Verificar duplicidade por nome
    const existing = goalkeepers.find((g) => g.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      setActiveGoalkeeperId(existing.id);
      toast.info(`Goleiro "${existing.name}" já existe no elenco e foi ativado em quadra!`);
    } else {
      const newGk: GoalkeeperItem = {
        id: `gk-${Date.now()}`,
        name: trimmed,
      };
      setGoalkeepers((prev) => [...prev, newGk]);
      setActiveGoalkeeperId(newGk.id);
      toast.success(`Goleiro "${trimmed}" adicionado com sucesso e ativo em quadra!`);
    }

    setNewGkNameInput("");
    setIsAddGkDialogOpen(false);
  };

  // EDITAR NOME DO GOLEIRO (MANTÉM O ID E PRESERVA AS ESTATÍSTICAS)
  const handleSaveEditedName = () => {
    if (!editingGk) return;
    const trimmed = editGkNameInput.trim();
    if (!trimmed) return;

    const oldName = editingGk.name;

    setGoalkeepers((prev) =>
      prev.map((g) => (g.id === editingGk.id ? { ...g, name: trimmed } : g))
    );

    if (onUpdateGoalkeeperName) {
      onUpdateGoalkeeperName(oldName, trimmed);
    }

    toast.success(`Nome do goleiro alterado de "${oldName}" para "${trimmed}"!`);
    setEditingGk(null);
    setEditGkNameInput("");
  };

  // Parâmetros da Marcação dentro do Pop-up
  const [possession, setPossession] = useState<string>(teamName);
  const [opponentGkName, setOpponentGkName] = useState<string>(`${opponentName} (Goleiro)`);
  const [period, setPeriod] = useState<string>("1º Tempo");
  const [selectedShotType, setSelectedShotType] = useState<ShotType>("6m");
  const [selectedPosition, setSelectedPosition] = useState<Position>("ponta_esq");
  const [selectedTacticalPlay, setSelectedTacticalPlay] = useState<string>("engajamento_armacao_finta");
  const [numericalStatus, setNumericalStatus] = useState<string>("6x6");
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [selectedCourtPoint, setSelectedCourtPoint] = useState<PointXY | null>(null);

  const [playerNum, setPlayerNum] = useState<string>("");
  const [assistNum, setAssistNum] = useState<string>("");
  const [defensivePlayerNum, setDefensivePlayerNum] = useState<string>("");
  const [isPseudoAssist, setIsPseudoAssist] = useState<boolean>(false);
  const [selectedTurnover, setSelectedTurnover] = useState<string>("");
  const [selectedSanctionReason, setSelectedSanctionReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [dominantHand, setDominantHand] = useState<string>("destra");

  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Alternar mudo do áudio do vídeo
  const toggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  // Ajustar velocidade de reprodução do vídeo
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Utilitário auxiliar para obter o tempo do vídeo de forma garantida como número em segundos
  const getValidVideoTime = (): number => {
    if (typeof capturedTimestamp === "number" && !isNaN(capturedTimestamp) && isFinite(capturedTimestamp)) {
      return Math.max(0, capturedTimestamp);
    }
    const cur = videoRef.current?.currentTime;
    if (typeof cur === "number" && !isNaN(cur) && isFinite(cur)) {
      return Math.max(0, cur);
    }
    if (typeof currentVideoTime === "number" && !isNaN(currentVideoTime) && isFinite(currentVideoTime)) {
      return Math.max(0, currentVideoTime);
    }
    return 0;
  };

  // ABRIR MODO DESENHO TÁTICO
  const handleOpenDrawingMode = () => {
    if (videoRef.current) {
      if (!videoRef.current.paused) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      const time = videoRef.current.currentTime;
      setCapturedTimestamp(typeof time === "number" && !isNaN(time) ? Math.max(0, time) : 0);
    } else {
      setCapturedTimestamp(typeof currentVideoTime === "number" && !isNaN(currentVideoTime) ? Math.max(0, currentVideoTime) : 0);
    }
    setTelestratorShapes([]);
    setIsDrawingMode(true);
  };

  // SALVAR ANOTAÇÃO TÁTICA COMO CLIPE DEDICADO NA PLAYLIST
  const handleSaveTacticalDrawingClip = () => {
    if (telestratorShapes.length === 0) {
      alert("Por favor, faça pelo menos um desenho ou seta na tela!");
      return;
    }

    const exactVideoTime = getValidVideoTime();
    const offset = period === "2º Tempo" ? (config?.offset2TSeconds || 0) : (config?.offset1TSeconds || 0);
    const matchTimeSeconds = Math.max(0, exactVideoTime - offset);
    const formattedMatchTime = secondsToTimeString(matchTimeSeconds);

    const drawingJSON = JSON.stringify(telestratorShapes);

    onSubmit({
      possession_team: possession,
      period,
      game_time: formattedMatchTime,
      video_timestamp_seconds: exactVideoTime,
      sector: possession === teamName ? "Ataque" : "Defesa",
      position: selectedPosition,
      shot_type: selectedShotType,
      zone: "B2",
      result: `tatica|draw:${drawingJSON}`,
      player_number: playerNum ? Number(playerNum) : undefined,
      tactical_play: "anotacao_tatica",
      notes: notes.trim() || "Anotação Tática sobre Vídeo",
      dominant_hand: dominantHand,
      goalkeeper_name: activeGkName,
    });

    setTelestratorShapes([]);
    setIsDrawingMode(false);
    setCapturedTimestamp(null);

    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // ABRIR POP-UP MODAL E CAPTURAR TIMESTAMP EXATO COM POSSE DE BOLA DEFINIDA
  const handleOpenTaggingModal = (targetPossession?: string) => {
    if (videoRef.current) {
      if (!videoRef.current.paused) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      const time = videoRef.current.currentTime;
      setCapturedTimestamp(typeof time === "number" && !isNaN(time) ? Math.max(0, time) : 0);
    } else {
      setCapturedTimestamp(typeof currentVideoTime === "number" && !isNaN(currentVideoTime) ? Math.max(0, currentVideoTime) : 0);
    }
    if (targetPossession) {
      setPossession(targetPossession);
    }
    setIsModalOpen(true);
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // SALVAR LANCE, FECHAR POP-UP E RETOMAR VÍDEO AUTOMATICAMENTE
  const handleSaveLance = (result: ShotResult, turnoverOverride?: string) => {
    const isDisciplinaryCard = result.startsWith("cartao_") || result.includes("2min") || result === "falta";

    if (!selectedZone && result !== "perda" && !isDisciplinaryCard) {
      alert("Por favor, selecione a zona do gol (A1 a C3)!");
      return;
    }

    const exactVideoTime = getValidVideoTime();
    const finalTurnover = turnoverOverride || selectedTurnover || selectedSanctionReason;

    const offset = period === "2º Tempo" ? (config?.offset2TSeconds || 0) : (config?.offset1TSeconds || 0);
    const matchTimeSeconds = Math.max(0, exactVideoTime - offset);
    const formattedMatchTime = secondsToTimeString(matchTimeSeconds);
    const defensiveTeamName = possession === teamName ? opponentName : teamName;
    const defensiveNote = defensivePlayerNum.trim()
      ? `Defensor #${defensivePlayerNum.trim()} (${defensiveTeamName})`
      : "";
    const combinedNotes = [defensiveNote, notes.trim()].filter(Boolean).join(" | ");

    onSubmit({
      possession_team: possession,
      period,
      game_time: formattedMatchTime,
      video_timestamp_seconds: exactVideoTime,
      sector: possession === teamName ? "Ataque" : "Defesa",
      position: selectedPosition,
      shot_type: selectedShotType,
      zone: selectedZone || "B2",
      result,
      player_number: playerNum ? Number(playerNum) : undefined,
      assist_number: assistNum ? Number(assistNum) : undefined,
      is_pseudo_assist: isPseudoAssist,
      tactical_play: selectedTacticalPlay,
      turnover_reason: (result === "perda" || isDisciplinaryCard) ? (finalTurnover || undefined) : undefined,
      defensive_sector: defensivePlayerNum ? `defensor_${defensivePlayerNum.trim()}` : undefined,
      notes: combinedNotes || undefined,
      dominant_hand: dominantHand,
      shot_origin_x: selectedCourtPoint?.x,
      shot_origin_y: selectedCourtPoint?.y,
      goalkeeper_name: possession === teamName ? (opponentGkName.trim() || `${opponentName} (Goleiro)`) : activeGkName,
      numerical_status: numericalStatus || "6x6",
    });

    toast.success("Lance / Punição gravada com sucesso!");

    // Resetar formulário, fechar o Pop-up Modal e retomar a reprodução do vídeo!
    setSelectedZone(null);
    setSelectedCourtPoint(null);
    setPlayerNum("");
    setAssistNum("");
    setDefensivePlayerNum("");
    setIsPseudoAssist(false);
    setSelectedTurnover("");
    setNotes("");
    setCapturedTimestamp(null);
    setIsModalOpen(false);

    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SEÇÃO PRINCIPAL: PLAYER DE VÍDEO DESTACADO (ZERO SCROLL) */}
      <Card className="border-2 border-accent/40 bg-card overflow-hidden shadow-md">
        <CardContent className="p-4 space-y-3">
          
          {/* PAINEL SUPERIOR DO PLAYER DE VÍDEO */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-accent" />
              <div>
                <h3 className="text-sm font-bold text-primary">Player de Vídeo & Marcação Instantânea</h3>
                <p className="text-[11px] text-muted-foreground">
                  {config.videoFileName ? `Arquivo: ${config.videoFileName}` : "Aviso: Nenhum arquivo de vídeo selecionado."}
                </p>
              </div>
            </div>

            {/* BOTÃO DE ABRIR DESENHO TÁTICO + POP-UP + VELOCIDADE */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-muted/80 p-1 rounded-lg border">
                <Gauge className="h-3.5 w-3.5 text-accent ml-1" />
                <span className="text-[11px] font-bold text-muted-foreground mr-1">Velocidade:</span>
                {PLAYBACK_SPEEDS.map((sp) => (
                  <Button
                    key={sp.value}
                    size="xs"
                    variant={playbackSpeed === sp.value ? "default" : "ghost"}
                    className={cn("h-6 px-1.5 text-[11px] font-bold", playbackSpeed === sp.value && "shadow")}
                    onClick={() => handleSpeedChange(sp.value)}
                  >
                    {sp.label}
                  </Button>
                ))}
              </div>

              {/* BOTÃO DE ATIVAR MODO DESENHO TÁTICO (TELESTRATOR) */}
              <Button
                size="sm"
                variant="outline"
                className="font-bold text-xs border-purple-400 text-purple-900 bg-purple-50/80 hover:bg-purple-600 hover:text-white shadow-sm"
                disabled={!config.videoUrl || isDrawingMode}
                onClick={handleOpenDrawingMode}
              >
                <Palette className="mr-1.5 h-4 w-4 text-purple-600" />
                🎨 Modo Desenho
              </Button>
            </div>
          </div>

          {/* BARRA DE GOLEIRO EM QUADRA (DESTACADO) & BANCO (TROCA RÁPIDA) */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-300 rounded-lg shadow-sm">
            
            {/* GOLEIRO ATIVO (NA QUADRA) - CARD DESTACADO */}
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 uppercase">Na Quadra:</span>
              
              <div className="flex items-center gap-1.5 bg-emerald-600 text-white font-bold text-xs px-3 py-1 rounded-md shadow flex-wrap">
                <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                <span className="text-sm tracking-wide">{activeGkName}</span>
              </div>
            </div>

            {/* GOLEIROS NO BANCO (TROCA RÁPIDA) */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">No Banco (Troca Rápida):</span>
              
              {goalkeepers.map((gk) => {
                if (gk.id === activeGoalkeeperId) return null;
                return (
                  <Button
                    key={gk.id}
                    type="button"
                    size="xs"
                    variant="outline"
                    className="h-7 text-xs font-bold border-emerald-400 text-emerald-900 bg-white dark:bg-card hover:bg-emerald-600 hover:text-white"
                    onClick={() => {
                      setActiveGoalkeeperId(gk.id);
                      toast.info(`Goleiro em quadra alterado para: ${gk.name}`);
                    }}
                  >
                    🔁 {gk.name}
                  </Button>
                );
              })}
            </div>

          </div>

          {/* ÁREA DO PLAYER VÍDEO HTML5 COM OVERLAY TELESTRATOR */}
          <div className="relative aspect-video max-h-[62vh] max-w-[1050px] mx-auto rounded-lg overflow-hidden bg-black flex items-center justify-center border border-border shadow-inner">
            {config.videoUrl ? (
              <video
                ref={videoRef}
                src={config.videoUrl}
                className="w-full h-full object-contain"
                onLoadedMetadata={() => {
                  if (videoRef.current) setVideoDuration(videoRef.current.duration || 0);
                }}
                onTimeUpdate={() => {
                  if (videoRef.current) setCurrentVideoTime(videoRef.current.currentTime);
                }}
                controls={false}
              />
            ) : (
              <div className="text-center p-6 text-muted-foreground space-y-2">
                <Video className="h-12 w-12 mx-auto text-accent opacity-50" />
                <p className="text-sm font-bold text-foreground">Importe o Vídeo da Partida</p>
                <p className="text-xs max-w-sm mx-auto">
                  Clique no botão "Importar & Sincronizar Vídeo" acima para carregar o arquivo `.mp4` local do seu computador.
                </p>
              </div>
            )}

            {/* CAMADA TRANSPARENTE DO MODO DESENHO TÁTICO OVERLAY */}
            <TelestratorCanvas
              active={isDrawingMode}
              shapes={telestratorShapes}
              onShapesChange={setTelestratorShapes}
              onSave={handleSaveTacticalDrawingClip}
              onCancel={() => {
                setIsDrawingMode(false);
                setTelestratorShapes([]);
              }}
            />
          </div>

          {/* TIMELINE INTERATIVA DE BUSCA (SEEKBAR CLICÁVEL & ARRASTÁVEL) */}
          {config.videoUrl && (
            <div className="flex items-center gap-3 px-3 py-1.5 bg-muted/40 rounded-lg border">
              <span className="text-xs font-mono font-bold text-primary min-w-[45px]">
                {secondsToTimeString(currentVideoTime)}
              </span>
              <input
                type="range"
                min={0}
                max={videoDuration || 100}
                step={0.1}
                value={currentVideoTime}
                onChange={(e) => {
                  const newTime = parseFloat(e.target.value);
                  setCurrentVideoTime(newTime);
                  if (videoRef.current) videoRef.current.currentTime = newTime;
                }}
                className="flex-1 h-2 bg-muted-foreground/20 rounded-lg appearance-none cursor-pointer accent-accent hover:accent-primary transition-all"
              />
              <span className="text-xs font-mono font-bold text-muted-foreground min-w-[45px]">
                {secondsToTimeString(videoDuration)}
              </span>
            </div>
          )}

          {/* CONTROLES DE REPRODUÇÃO RÁPIDA */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={isPlaying ? "secondary" : "default"}
                className="font-bold text-xs px-4"
                disabled={!config.videoUrl}
                onClick={togglePlayPause}
              >
                {isPlaying ? <Pause className="h-4 w-4 mr-1.5" /> : <Play className="h-4 w-4 mr-1.5" />}
                {isPlaying ? "Pausar" : "Reproduzir Vídeo"}
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                disabled={!config.videoUrl}
                onClick={() => {
                  if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
                }}
              >
                -5s
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                disabled={!config.videoUrl}
                onClick={() => {
                  if (videoRef.current) videoRef.current.currentTime += 5;
                }}
              >
                +5s
              </Button>

              <Button
                size="sm"
                variant={isMuted ? "destructive" : "outline"}
                className="text-xs font-bold gap-1 shadow-xs"
                disabled={!config.videoUrl}
                onClick={toggleMute}
                title={isMuted ? "Ativar Áudio do Vídeo" : "Mutar Áudio do Vídeo"}
              >
                {isMuted ? <VolumeX className="h-4 w-4 text-white" /> : <Volume2 className="h-4 w-4 text-accent" />}
                {isMuted ? "Mutado" : "Áudio"}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="default"
                className="font-extrabold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-md gap-1.5"
                disabled={!config.videoUrl}
                onClick={() => handleOpenTaggingModal(teamName)}
              >
                🛡️ Marcar Nosso Ataque ({teamName})
              </Button>
              
              <Button
                size="sm"
                variant="default"
                className="font-extrabold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-md gap-1.5"
                disabled={!config.videoUrl}
                onClick={() => handleOpenTaggingModal(opponentName)}
              >
                ⚠️ Marcar Ataque Rival ({opponentName})
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* MODAL DE ADICIONAR NOVO GOLEIRO AO ARRAY DE OBJETOS */}
      <Dialog open={isAddGkDialogOpen} onOpenChange={setIsAddGkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary font-bold">
              <UserPlus className="h-5 w-5 text-emerald-600" />
              Adicionar Novo Goleiro
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cadastre um novo goleiro no elenco da partida sem concatenar nem sobrescrever nomes anteriores:
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label className="text-xs font-bold">Nome do Goleiro</Label>
            <Input
              placeholder="Ex: Alexandre / Marcelo / Gabriel"
              value={newGkNameInput}
              onChange={(e) => setNewGkNameInput(e.target.value)}
              className="h-9 text-sm"
              autoFocus
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setIsAddGkDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="default"
              className="font-bold bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={!newGkNameInput.trim()}
              onClick={handleAddNewGoalkeeper}
            >
              <Check className="h-4 w-4 mr-1" /> Criar & Ativar em Quadra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE EDITAR NOME DO GOLEIRO (MANTÉM O ID E PRESERVA ESTATÍSTICAS) */}
      <Dialog open={Boolean(editingGk)} onOpenChange={(open) => !open && setEditingGk(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary font-bold">
              <Pencil className="h-5 w-5 text-accent" />
              Editar Nome do Goleiro
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Altere o nome do atleta mantendo seu ID intacto (preserva estatísticas e históricos de defesas):
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label className="text-xs font-bold">Nome do Goleiro</Label>
            <Input
              value={editGkNameInput}
              onChange={(e) => setEditGkNameInput(e.target.value)}
              className="h-9 text-sm"
              autoFocus
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditingGk(null)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="default"
              className="font-bold bg-accent hover:bg-accent/90"
              disabled={!editGkNameInput.trim()}
              onClick={handleSaveEditedName}
            >
              <Check className="h-4 w-4 mr-1" /> Salvar Alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* POP-UP MODAL FLUTUANTE DE MARCAÇÃO TÁTICA COM MAPA 2D DA QUADRA */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between border-b pb-2 text-lg font-bold text-primary">
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Registrar Marcação da Jogada
              </span>
              {capturedTimestamp !== null && (
                <span className="text-xs font-mono font-bold bg-amber-500 text-amber-950 px-2.5 py-1 rounded">
                  TIMESTAMP: {secondsToTimeString(capturedTimestamp)} ({capturedTimestamp.toFixed(2)}s)
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Preencha os detalhes, confirme o goleiro em quadra, clique na meia-quadra e selecione o resultado!
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-12 py-2">
            
            {/* COLUNA ESQUERDA: PARÂMETROS E MAPA 2D DE MEIA-QUADRA (6 COLS) */}
            <div className="md:col-span-6 space-y-4">
              {/* BANNER INDICATIVO DA EQUIPE ATACANTE */}
              <div className={cn(
                "p-3 rounded-xl border flex items-center justify-between shadow-xs font-bold text-xs",
                possession === teamName
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-300"
              )}>
                <div className="flex items-center gap-2">
                  {possession === teamName ? (
                    <>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">🛡️</span>
                      <div>
                        <p className="font-extrabold uppercase tracking-wide">Ataque do Nosso Time ({teamName})</p>
                        <p className="text-[10px] text-muted-foreground font-normal">Arremessos e estatísticas vinculados à equipe {teamName}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-white text-xs">⚠️</span>
                      <div>
                        <p className="font-extrabold uppercase tracking-wide">Ataque do Time Adversário ({opponentName})</p>
                        <p className="text-[10px] text-muted-foreground font-normal">Arremessos e estatísticas vinculados à equipe {opponentName}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* SELEÇÃO E TROCA DO GOLEIRO EM QUADRA NO POP-UP (ADAPTATIVO CONFORME POSSE) */}
              {possession === teamName ? (
                <div className="p-2.5 bg-amber-50/80 dark:bg-amber-950/20 rounded-lg border border-amber-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5 text-amber-600" /> Meta Atacada: Goleiro do {opponentName}
                    </Label>
                    <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      Nosso Ataque
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      size={1}
                      className="h-7 text-xs font-bold bg-white dark:bg-card border-amber-300"
                      value={opponentGkName}
                      onChange={(e) => setOpponentGkName(e.target.value)}
                      placeholder={`Ex: Goleiro ${opponentName} ou #12 Rival`}
                    />
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-400 italic">
                    * Nosso time ataca no goleiro adversário. Os gols e defesas neste lance contabilizam contra a meta rival.
                  </p>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50/80 dark:bg-emerald-950/20 rounded-lg border border-emerald-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5" /> Meta Defendida: Nosso Goleiro ({teamName})
                    </Label>
                    <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
                      Na Quadra: {activeGkName}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {goalkeepers.map((gk) => {
                      const isActive = gk.id === activeGoalkeeperId;
                      return (
                        <Button
                          key={gk.id}
                          type="button"
                          size="xs"
                          variant={isActive ? "default" : "outline"}
                          className={cn("text-xs font-bold h-7", isActive && "bg-emerald-600 text-white")}
                          onClick={() => setActiveGoalkeeperId(gk.id)}
                        >
                          🧤 {gk.name}
                        </Button>
                      );
                    })}
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      className="h-7 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                      onClick={() => setIsAddGkDialogOpen(true)}
                    >
                      <UserPlus className="h-3 w-3 mr-1" /> Novo
                    </Button>
                  </div>
                </div>
              )}

              {/* MAPA DE ORIGEM DO ARREMESSO NA MEIA-QUADRA (X/Y) */}
              <CourtMap
                selectedPoint={selectedCourtPoint}
                onSelectPoint={(pt, positionHint) => {
                  setSelectedCourtPoint(pt);
                  if (positionHint) setSelectedPosition(positionHint);
                }}
                size="md"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-bold">Período</Label>
                  <div className="flex gap-1 mt-1">
                    <Button
                      type="button"
                      size="xs"
                      variant={period === "1º Tempo" ? "default" : "outline"}
                      onClick={() => setPeriod("1º Tempo")}
                    >1ºT</Button>
                    <Button
                      type="button"
                      size="xs"
                      variant={period === "2º Tempo" ? "default" : "outline"}
                      onClick={() => setPeriod("2º Tempo")}
                    >2ºT</Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold">Linha (Distância)</Label>
                  <div className="flex gap-1 mt-1">
                    {SHOT_TYPES.map((t) => (
                      <Button
                        key={t.value}
                        type="button"
                        size="xs"
                        variant={selectedShotType === t.value ? "default" : "outline"}
                        onClick={() => setSelectedShotType(t.value as ShotType)}
                      >
                        {t.value}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ESTADO NUMÉRICO DA EQUIPE EM QUADRA (2 MINUTOS) */}
              <div>
                <Label className="text-xs font-bold">Estado Numérico em Quadra (2 min)</Label>
                <div className="grid grid-cols-4 gap-1 mt-1">
                  {[
                    { value: "6x6", label: "6x6 (Igualdade)" },
                    { value: "6x5", label: "6x5 (+1 Sup)" },
                    { value: "5x6", label: "5x6 (-1 Inf)" },
                    { value: "7x6", label: "7x6 (Gk Linha)" },
                  ].map((st) => (
                    <Button
                      key={st.value}
                      type="button"
                      size="xs"
                      variant={numericalStatus === st.value ? "default" : "outline"}
                      className={cn(
                        "h-7 text-[11px] font-bold px-1",
                        st.value === "6x5" && numericalStatus === "6x5" && "bg-emerald-600 text-white",
                        st.value === "5x6" && numericalStatus === "5x6" && "bg-red-600 text-white",
                        st.value === "7x6" && numericalStatus === "7x6" && "bg-purple-600 text-white"
                      )}
                      onClick={() => setNumericalStatus(st.value)}
                    >
                      {st.value}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold">Posição do Atleta</Label>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {POSITIONS.map((pos) => (
                    <Button
                      key={pos.value}
                      type="button"
                      variant={selectedPosition === pos.value ? "secondary" : "outline"}
                      className="h-7 text-xs justify-start font-semibold"
                      onClick={() => setSelectedPosition(pos.value)}
                    >
                      {pos.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold">Estrutura Tática</Label>
                <div className="grid grid-cols-1 gap-1 mt-1">
                  {TACTICAL_PLAY_TYPES.map((t) => (
                    <Button
                      key={t.value}
                      type="button"
                      variant={selectedTacticalPlay === t.value ? "secondary" : "ghost"}
                      className="h-6 text-[11px] justify-start"
                      onClick={() => setSelectedTacticalPlay(t.value)}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs font-semibold">Nº Atacante</Label>
                  <Input
                    placeholder="Ex: 10"
                    className="h-8 text-xs font-bold"
                    inputMode="numeric"
                    value={playerNum}
                    onChange={(e) => setPlayerNum(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Nº Assist.</Label>
                  <Input
                    placeholder="Ex: 7"
                    className="h-8 text-xs"
                    inputMode="numeric"
                    value={assistNum}
                    onChange={(e) => setAssistNum(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    Defensor (2min)
                  </Label>
                  <Input
                    placeholder={possession === teamName ? `Ex: #5 (${opponentName})` : `Ex: #3 (${teamName})`}
                    className="h-8 text-xs font-bold border-amber-300 bg-amber-500/10"
                    inputMode="numeric"
                    value={defensivePlayerNum}
                    onChange={(e) => setDefensivePlayerNum(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Observação do Lance</Label>
                <Input
                  placeholder="Ex: Bela finta / Cobertura atrasada"
                  className="h-8 text-xs mt-0.5"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* COLUNA DIREITA: QUADRANTE E RESULTADO (6 COLS) */}
            <div className="md:col-span-6 space-y-4 border-l pl-4">
              <div className="flex items-center justify-between border-b pb-1">
                <span className="text-xs font-bold text-primary">Quadrante do Gol & Gravação</span>
                {selectedZone && (
                  <span className="text-xs font-mono font-bold bg-accent text-accent-foreground px-2 py-0.5 rounded">
                    Zona: {selectedZone}
                  </span>
                )}
              </div>

              <GoalMap
                selected={selectedZone}
                onSelect={(z) => setSelectedZone(z)}
                size="md"
              />

              <div className="space-y-2 pt-1">
                <Label className="text-xs uppercase font-semibold text-muted-foreground">Clique no Resultado para Salvar</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {RESULTS.filter(
                    (r) =>
                      r.value !== "perda" &&
                      !r.value.startsWith("cartao_") &&
                      !r.value.includes("2min")
                  ).map((res) => (
                    <Button
                      key={res.value}
                      type="button"
                      className={cn("h-10 font-bold text-xs shadow", res.color)}
                      onClick={() => handleSaveLance(res.value as ShotResult)}
                    >
                      {res.label}
                    </Button>
                  ))}
                </div>

                <div className="pt-2 border-t">
                  <Label className="text-xs font-bold text-orange-600 uppercase block mb-1">
                    Perda de Bola (Turnover):
                  </Label>
                  <div className="grid grid-cols-1 gap-1">
                    {TURNOVER_REASONS.map((r) => (
                      <Button
                        key={r.value}
                        type="button"
                        variant="outline"
                        className="h-7 text-xs justify-start font-bold border-orange-300 text-orange-900 bg-orange-50/60 hover:bg-orange-600 hover:text-white"
                        onClick={() => {
                          setSelectedTurnover(r.value);
                          handleSaveLance("perda", r.value);
                        }}
                      >
                        Perda: {r.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* PUNIÇÕES DISCIPLINARES & CARTÕES */}
                <div className="pt-2 border-t space-y-2">
                  <Label className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase block">
                    Punições Disciplinares & Cartões:
                  </Label>

                  <div className="grid grid-cols-2 gap-1.5">
                    {DISCIPLINARY_CARDS.map((card) => (
                      <Button
                        key={card.value}
                        type="button"
                        className={cn("h-9 font-bold text-xs shadow", card.color)}
                        onClick={() => {
                          handleSaveLance(card.value as ShotResult, selectedSanctionReason);
                        }}
                      >
                        {card.label}
                      </Button>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Motivo da Punição Disciplinar:</Label>
                    <select
                      className="w-full h-8 text-xs font-medium bg-background border border-input rounded-md px-2 py-1"
                      value={selectedSanctionReason}
                      onChange={(e) => setSelectedSanctionReason(e.target.value)}
                    >
                      <option value="">Selecione o motivo da falta/cartão...</option>
                      {SANCTION_REASONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </DialogContent>
      </Dialog>

      {/* TIMELINE INTEGRADA DE LANCES DA PARTIDA */}
      <Card>
        <CardContent className="py-5">
          <h3 className="mb-3 font-display text-lg font-bold text-primary">Timeline dos Lances Registrados no Vídeo</h3>
          {shots.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum lance registrado até o momento.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Tempo Vídeo</TableHead>
                    <TableHead>Tempo Jogo</TableHead>
                    <TableHead>Equipe</TableHead>
                    <TableHead>Nº</TableHead>
                    <TableHead>Posição</TableHead>
                    <TableHead>Zona</TableHead>
                    <TableHead>Goleiro</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Observação</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shots.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-semibold text-xs text-primary">{s.period || "1º Tempo"}</TableCell>
                      <TableCell className="font-mono text-xs font-bold text-accent">
                        {s.video_timestamp_seconds ? secondsToTimeString(s.video_timestamp_seconds) : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold">{s.game_time || "—"}</TableCell>
                      <TableCell className="text-xs font-semibold">{s.possession_team || teamName}</TableCell>
                      <TableCell className="font-bold">{s.player_number ?? "—"}</TableCell>
                      <TableCell>{positionLabel(s.position)}</TableCell>
                      <TableCell className="font-mono font-bold">{s.zone}</TableCell>
                      <TableCell className="text-xs font-semibold text-emerald-700">{s.goalkeeper_name || "—"}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "rounded px-2 py-0.5 text-xs font-semibold",
                          s.result.startsWith("tatica") ? "bg-purple-600 text-white" : RESULTS.find((r) => r.value === (s.result.startsWith("perda") ? "perda" : s.result))?.color || "bg-orange-600 text-white",
                        )}>
                          {s.result.startsWith("tatica") ? "🎨 Anotação Tática" : formattedResultLabel(s)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground italic">{s.notes || "—"}</TableCell>
                      <TableCell>
                        {onRemoveShot && (
                          <Button size="sm" variant="ghost" onClick={() => onRemoveShot(s.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
