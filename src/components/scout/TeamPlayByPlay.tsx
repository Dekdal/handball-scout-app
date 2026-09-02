import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Clock, ShieldAlert, ShieldCheck, Plus, Trash2, Check, UserPlus, UserCheck, MessageSquare, Edit2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoalMap } from "./GoalMap";
import {
  POSITIONS,
  SHOT_TYPES,
  RESULTS,
  TACTICAL_PLAY_TYPES,
  TURNOVER_REASONS,
  positionLabel,
  resultLabel,
  turnoverReasonLabel,
  type Position,
  type ShotType,
  type ShotResult,
  type Zone,
} from "@/lib/scout/constants";
import { cn } from "@/lib/utils";

type ShotDraft = {
  possession_team: string;
  period: string;
  game_time: string;
  sector: string;
  position: Position;
  shot_type: ShotType;
  zone: Zone;
  result: ShotResult;
  player_number?: number;
  assist_number?: number;
  is_pseudo_assist?: boolean;
  tactical_play?: string;
  turnover_reason?: string;
  numerical_status?: string;
  goalkeeper_name?: string;
  notes?: string;
  dominant_hand?: string;
};

type Props = {
  teamName: string;
  opponentName: string;
  initialGoalkeeper?: string;
  onSubmit: (draft: ShotDraft) => void;
};

export function TeamPlayByPlay({ teamName, opponentName, initialGoalkeeper = "Goleiro Titular", onSubmit }: Props) {
  // Posse de Bola e Cronômetro
  const [possession, setPossession] = useState<string>(teamName);
  const [period, setPeriod] = useState<string>("1º Tempo");
  const [seconds, setSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isEditingTime, setIsEditingTime] = useState<boolean>(false);
  const [manualTimeInput, setManualTimeInput] = useState<string>("00:00");

  // Goleiros em Quadra
  const [goalkeepers, setGoalkeepers] = useState<string[]>([initialGoalkeeper, "Goleiro reserva"]);
  const [activeGoalkeeper, setActiveGoalkeeper] = useState<string>(initialGoalkeeper);
  const [showAddGk, setShowAddGk] = useState<boolean>(false);
  const [newGkName, setNewGkName] = useState<string>("");
  const [isRenamingGk, setIsRenamingGk] = useState<boolean>(false);
  const [renameGkInput, setRenameGkInput] = useState<string>("");

  // Parâmetros do Lance
  const [selectedShotType, setSelectedShotType] = useState<ShotType>("6m");
  const [selectedPosition, setSelectedPosition] = useState<Position>("ponta_esq");
  const [selectedTacticalPlay, setSelectedTacticalPlay] = useState<string>("engajamento_armacao_finta");
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  const [playerNum, setPlayerNum] = useState<string>("");
  const [assistNum, setAssistNum] = useState<string>("");
  const [isPseudoAssist, setIsPseudoAssist] = useState<boolean>(false);
  const [selectedTurnover, setSelectedTurnover] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [dominantHand, setDominantHand] = useState<string>("destra");

  // Penalidades de 2 Minutos (Cronômetros de Exclusão)
  const [ourPenalties, setOurPenalties] = useState<number[]>([]);
  const [oppPenalties, setOppPenalties] = useState<number[]>([]);

  // Atualizador do Cronômetro da Partida e das Exclusões
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
        setOurPenalties((prev) => prev.map((t) => Math.max(0, t - 1)).filter((t) => t > 0));
        setOppPenalties((prev) => prev.map((t) => Math.max(0, t - 1)).filter((t) => t > 0));
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formattedGameTime = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const handleApplyManualTime = () => {
    const parts = manualTimeInput.split(":");
    if (parts.length === 2) {
      const m = parseInt(parts[0], 10) || 0;
      const s = parseInt(parts[1], 10) || 0;
      setSeconds(m * 60 + s);
    }
    setIsEditingTime(false);
  };

  const handleAddGoalkeeper = () => {
    if (newGkName.trim()) {
      const name = newGkName.trim();
      if (!goalkeepers.includes(name)) {
        setGoalkeepers((prev) => [...prev, name]);
      }
      setActiveGoalkeeper(name);
      setNewGkName("");
      setShowAddGk(false);
    }
  };

  const handleRenameActiveGk = () => {
    if (renameGkInput.trim() && activeGoalkeeper) {
      const newName = renameGkInput.trim();
      setGoalkeepers((prev) => prev.map((g) => (g === activeGoalkeeper ? newName : g)));
      setActiveGoalkeeper(newName);
      setIsRenamingGk(false);
    }
  };

  const addPenalty = (target: "our" | "opp") => {
    if (target === "our") setOurPenalties((prev) => [...prev, 120]);
    else setOppPenalties((prev) => [...prev, 120]);
  };

  const ourPlayersOnCourt = 6 - ourPenalties.length;
  const oppPlayersOnCourt = 6 - oppPenalties.length;

  const currentNumericalStatus =
    ourPlayersOnCourt === oppPlayersOnCourt
      ? "Igualdade 6x6"
      : ourPlayersOnCourt > oppPlayersOnCourt
      ? "Superioridade 6x5"
      : "Inferioridade 5x6";

  const handleSave = (result: ShotResult, turnoverReasonOverride?: string) => {
    if (!selectedZone && result !== "perda") {
      alert("Por favor, selecione o quadrante do gol (A1 a C3)!");
      return;
    }

    const finalTurnoverReason = turnoverReasonOverride || selectedTurnover;

    onSubmit({
      possession_team: possession,
      period,
      game_time: formattedGameTime,
      sector: possession === teamName ? "Ataque" : "Defesa",
      position: selectedPosition,
      shot_type: selectedShotType,
      zone: selectedZone || "B2",
      result,
      player_number: playerNum ? Number(playerNum) : undefined,
      assist_number: assistNum ? Number(assistNum) : undefined,
      is_pseudo_assist: isPseudoAssist,
      tactical_play: selectedTacticalPlay,
      turnover_reason: result === "perda" ? (finalTurnoverReason || undefined) : undefined,
      numerical_status: currentNumericalStatus,
      goalkeeper_name: activeGoalkeeper,
      notes: notes.trim() || undefined,
      dominant_hand: dominantHand,
    });

    setSelectedZone(null);
    setPlayerNum("");
    setAssistNum("");
    setIsPseudoAssist(false);
    setSelectedTurnover("");
    setNotes("");
  };

  return (
    <div className="space-y-6">
      
      {/* SELETOR RÁPIDO E RENOMEAÇÃO DE GOLEIRO EM QUADRA */}
      <Card className="border-l-4 border-l-primary bg-card">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase">Goleiro em Quadra (Nosso Time)</span>
              
              {!isRenamingGk ? (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-extrabold text-primary">{activeGoalkeeper}</p>
                  <Button
                    size="xs"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    title="Renomear este goleiro"
                    onClick={() => {
                      setRenameGkInput(activeGoalkeeper);
                      setIsRenamingGk(true);
                    }}
                  >
                    <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Input
                    className="h-7 text-xs w-36 font-bold"
                    value={renameGkInput}
                    onChange={(e) => setRenameGkInput(e.target.value)}
                    placeholder="Novo Nome Ex: #1 João"
                  />
                  <Button size="xs" onClick={handleRenameActiveGk}>
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => setIsRenamingGk(false)}>X</Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {goalkeepers.map((gk) => (
              <Button
                key={gk}
                size="sm"
                variant={activeGoalkeeper === gk ? "default" : "outline"}
                className={cn("text-xs font-bold", activeGoalkeeper === gk && "ring-2 ring-primary")}
                onClick={() => setActiveGoalkeeper(gk)}
              >
                {gk}
              </Button>
            ))}

            {!showAddGk ? (
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowAddGk(true)}>
                <UserPlus className="mr-1 h-3.5 w-3.5" /> + Goleiro
              </Button>
            ) : (
              <div className="flex items-center gap-1.5">
                <Input
                  className="h-8 text-xs w-32"
                  placeholder="Nome/Nº Ex: #12 Pedro"
                  value={newGkName}
                  onChange={(e) => setNewGkName(e.target.value)}
                />
                <Button size="xs" onClick={handleAddGoalkeeper}>Salvar</Button>
                <Button size="xs" variant="ghost" onClick={() => setShowAddGk(false)}>X</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* HEADER: TIMING, EDICAO MANUAL & EXCLUSOES */}
      <Card className="border-2 border-primary/20 bg-card shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-6 md:grid-cols-3 md:items-center">
            
            {/* POSSE DE BOLA */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Posse de Bola
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="lg"
                  className={cn(
                    "flex-1 font-bold text-sm sm:text-base transition-all",
                    possession === teamName
                      ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                  onClick={() => setPossession(teamName)}
                >
                  <ShieldCheck className="mr-1.5 h-4 w-4" />
                  {teamName}
                </Button>
                <Button
                  type="button"
                  size="lg"
                  className={cn(
                    "flex-1 font-bold text-sm sm:text-base transition-all",
                    possession === opponentName
                      ? "bg-destructive text-destructive-foreground shadow-md ring-2 ring-destructive"
                      : "bg-muted text-muted-foreground"
                  )}
                  onClick={() => setPossession(opponentName)}
                >
                  <ShieldAlert className="mr-1.5 h-4 w-4" />
                  {opponentName}
                </Button>
              </div>
            </div>

            {/* CRONÔMETRO COM OPÇÃO DE EDIÇÃO MANUAL */}
            <div className="flex flex-col items-center space-y-2">
              <div className="flex gap-2">
                <Button size="xs" variant={period === "1º Tempo" ? "default" : "outline"} onClick={() => setPeriod("1º Tempo")}>1º Tempo</Button>
                <Button size="xs" variant={period === "2º Tempo" ? "default" : "outline"} onClick={() => setPeriod("2º Tempo")}>2º Tempo</Button>
              </div>

              {!isEditingTime ? (
                <div
                  className="flex items-center gap-2 cursor-pointer group hover:opacity-80"
                  onClick={() => {
                    setManualTimeInput(formattedGameTime);
                    setIsEditingTime(true);
                  }}
                  title="Clique para editar o tempo manualmente"
                >
                  <Clock className="h-6 w-6 text-accent animate-pulse" />
                  <span className="font-mono text-4xl font-extrabold tracking-widest text-primary">
                    {formattedGameTime}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    className="w-24 text-center font-mono font-bold text-lg h-9"
                    value={manualTimeInput}
                    onChange={(e) => setManualTimeInput(e.target.value)}
                    placeholder="MM:SS"
                  />
                  <Button size="xs" onClick={handleApplyManualTime}>OK</Button>
                </div>
              )}

              <div className="flex gap-2">
                <Button size="sm" variant={isRunning ? "secondary" : "default"} onClick={() => setIsRunning(!isRunning)}>
                  {isRunning ? <Pause className="mr-1 h-4 w-4" /> : <Play className="mr-1 h-4 w-4" />}
                  {isRunning ? "Pausar" : "Iniciar"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setIsRunning(false); setSeconds(0); }}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* PAINEL DE 2 MINUTOS */}
            <div className="space-y-2 text-right">
              <div className="flex justify-between items-center">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Status Numérico</Label>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-accent/20 text-accent">{currentNumericalStatus}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs border-primary/30" onClick={() => addPenalty("our")}>-1 Jogador / 2min ({teamName})</Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs border-destructive/30" onClick={() => addPenalty("opp")}>-1 Jogador / 2min ({opponentName})</Button>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* FLUXO DE REGISTRO DO LANCE */}
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* PARÂMETROS TÁTICOS & TIPO DE ARREMESSO */}
        <Card className="lg:col-span-5 space-y-4 p-5">
          <div>
            <span className="text-xs font-bold text-accent uppercase">Passo 1</span>
            <h3 className="text-lg font-bold text-primary">Origem & Tipo de Arremesso</h3>
          </div>

          {/* DISTÂNCIA / TIPO DE ARREMESSO (SEPARADO E EXPLÍCITO) */}
          <div>
            <Label className="text-xs font-bold text-primary">Distância / Tipo de Arremesso (Linha)</Label>
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              {SHOT_TYPES.map((t) => (
                <Button
                  key={t.value}
                  type="button"
                  variant={selectedShotType === t.value ? "default" : "outline"}
                  className={cn("h-8 text-xs font-bold", selectedShotType === t.value && "ring-2 ring-primary")}
                  onClick={() => setSelectedShotType(t.value as ShotType)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          {/* POSIÇÃO NA QUADRA */}
          <div>
            <Label className="text-xs font-bold text-primary">Posição em Quadra</Label>
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              {POSITIONS.map((pos) => (
                <Button
                  key={pos.value}
                  type="button"
                  variant={selectedPosition === pos.value ? "secondary" : "outline"}
                  className="h-8 text-xs justify-start font-semibold"
                  onClick={() => setSelectedPosition(pos.value)}
                >
                  {pos.label}
                </Button>
              ))}
            </div>
          </div>

          {/* ESTRUTURA TÁTICA */}
          <div>
            <Label className="text-xs font-bold text-primary">Estrutura Tática da Jogada</Label>
            <div className="grid grid-cols-1 gap-1 mt-1">
              {TACTICAL_PLAY_TYPES.map((t) => (
                <Button
                  key={t.value}
                  type="button"
                  variant={selectedTacticalPlay === t.value ? "secondary" : "ghost"}
                  className="h-7 text-xs justify-start"
                  onClick={() => setSelectedTacticalPlay(t.value)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          {/* CAMISAS E MÃO DOMINANTE */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div>
              <Label className="text-xs">Nº Atleta</Label>
              <Input placeholder="Ex: 10" inputMode="numeric" value={playerNum} onChange={(e) => setPlayerNum(e.target.value.replace(/\D/g, ""))} />
            </div>
            <div>
              <Label className="text-xs">Nº Assist.</Label>
              <Input placeholder="Ex: 7" inputMode="numeric" value={assistNum} onChange={(e) => setAssistNum(e.target.value.replace(/\D/g, ""))} />
            </div>
            <div>
              <Label className="text-xs">Mão</Label>
              <div className="flex gap-1 mt-1">
                <Button
                  type="button"
                  size="xs"
                  variant={dominantHand === "destra" ? "default" : "outline"}
                  onClick={() => setDominantHand("destra")}
                >D</Button>
                <Button
                  type="button"
                  size="xs"
                  variant={dominantHand === "canhota" ? "default" : "outline"}
                  onClick={() => setDominantHand("canhota")}
                >C</Button>
              </div>
            </div>
          </div>

          {/* CAMPO DE OBSERVAÇÃO DO LANCE */}
          <div className="pt-1">
            <Label className="text-xs font-semibold flex items-center gap-1 text-primary">
              <MessageSquare className="h-3.5 w-3.5 text-accent" /> Observação do Lance (Opcional):
            </Label>
            <Input
              className="h-8 text-xs mt-1"
              placeholder="Ex: Atraso na cobertura do pivô / Bela defesa de pé"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="pseudo_assist"
              checked={isPseudoAssist}
              onChange={(e) => setIsPseudoAssist(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
            />
            <Label htmlFor="pseudo_assist" className="text-xs cursor-pointer">
              Marcar como <strong>Pseudo-Assistência</strong> (Passe perfeito com gol perdido)
            </Label>
          </div>
        </Card>

        {/* MAPA DO GOL & REGISTRO DE RESULTADO */}
        <Card className="lg:col-span-7 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-accent uppercase">Passo 2 e 3</span>
              <h3 className="text-lg font-bold text-primary">Quadrante & Resultado</h3>
            </div>
            {selectedZone && <span className="text-xs font-mono font-bold bg-accent text-accent-foreground px-2 py-1 rounded">Zona: {selectedZone}</span>}
          </div>

          <div className="grid gap-6 md:grid-cols-2 items-center">
            <GoalMap selected={selectedZone} onSelect={setSelectedZone} size="lg" />

            <div className="space-y-3">
              <Label className="text-xs uppercase font-semibold text-muted-foreground">Clique para Salvar o Lance</Label>
              <div className="grid grid-cols-2 gap-2">
                {RESULTS.filter((r) => r.value !== "perda").map((res) => (
                  <Button
                    key={res.value}
                    type="button"
                    className={cn("h-12 font-bold text-xs shadow", res.color)}
                    onClick={() => handleSave(res.value as ShotResult)}
                  >
                    {res.label}
                  </Button>
                ))}
              </div>

              {/* BOTAO DIRETO DE PERDAS DE BOLA ESPECÍFICAS (PERDA: MOTIVO) */}
              <div className="pt-3 border-t">
                <Label className="text-xs font-bold text-orange-600 uppercase tracking-wider block mb-1">
                  Registrar Perda de Bola (Turnover):
                </Label>
                <div className="grid grid-cols-1 gap-1.5">
                  {TURNOVER_REASONS.map((r) => (
                    <Button
                      key={r.value}
                      type="button"
                      variant="outline"
                      className="h-8 text-xs justify-start font-bold border-orange-300 text-orange-900 bg-orange-50/60 hover:bg-orange-600 hover:text-white shadow-sm transition-all"
                      onClick={() => {
                        setSelectedTurnover(r.value);
                        handleSave("perda", r.value);
                      }}
                    >
                      Perda: {r.label}
                    </Button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
