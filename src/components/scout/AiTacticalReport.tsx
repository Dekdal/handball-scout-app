import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { HeadToHeadSummary } from "@/lib/scout/headToHead";
import { Sparkles, Bot, Loader2, Copy, Check, Printer, Shield, Target, Compass, Swords, FileText, CheckCircle2, AlertTriangle, Lightbulb, Users, Trophy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  h2h: HeadToHeadSummary;
}

export function AiTacticalReport({ h2h }: Props) {
  const [isGenerated, setIsGenerated] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const teamName = h2h.selectedTeamName === "all" ? "Nossa Equipe" : h2h.selectedTeamName || "Nossa Equipe";
  const oppName = h2h.opponentName;

  const isM9Strong = h2h.m9Accuracy >= 45;
  const isM6Strong = h2h.m6Accuracy >= 55;
  const isHighTurnovers = h2h.avgTurnovers >= 5;
  const isHighExclusions = h2h.exclusoes2min >= 3;

  const mainOppPosition = h2h.opponentPositions.armacao.percent >= 45
    ? "Armação (AE / AC / AD)"
    : h2h.opponentPositions.pontas.percent >= 35
    ? "Pontas (PE / PD)"
    : "Trabalho com Pivô (PV)";

  const recommendedDefensiveSystem = h2h.opponentPositions.armacao.percent >= 45 && h2h.opponentDistances.m9.percent >= 40
    ? "Defesa 5-1 Agressiva com Flutuante na Armação Central"
    : h2h.opponentPositions.pivo.percent >= 30 || h2h.opponentDistances.m6.percent >= 50
    ? "Defesa 6-0 Compacta e Fechada nos 6 Metros"
    : "Defesa 3-2-1 Pressionante com Roubo de Bola";

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setIsGenerated(true);
      toast.success("Relatório Tático Gerado com Sucesso!");
    }, 1000);
  };

  const getFullTextForClipboard = () => {
    return `📋 RELATÓRIO TÁTICO PRÉ-JOGO: ${teamName.toUpperCase()} VS ${oppName.toUpperCase()}

1. RESUMO EXECUTIVO
- Jogos Analisados: ${h2h.totalGames} confronto(s)
- Gols Marcados: Média de ${h2h.avgGolsMarcados} g/jogo
- Gols Sofridos: Média de ${h2h.avgGolsSofridos} g/jogo
- Aproveitamento Geral: ${h2h.accuracy}%
- Defesa de Goleiros: ${h2h.gkSaveRate}%

2. DIAGNÓSTICO OFENSIVO (${teamName})
- Eficiência de 9m: ${h2h.m9Accuracy}% (${isM9Strong ? "Excelente uso do chute de fora" : "Evitar chutes forçados sem finta prévia"})
- Eficiência de 6m: ${h2h.m6Accuracy}% (${isM6Strong ? "Setor letal em infiltrações/pontas" : "Aumentar circulação de bola"})
- Turnovers / Erros Técnicos: Média de ${h2h.avgTurnovers} perdas/jogo (${isHighTurnovers ? "Atenção redobrada na passe fácil" : "Excelente controle de posse"})

3. DIAGNÓSTICO DEFENSIVO & AMEAÇAS (${oppName})
- Origem do Rival: Armação (${h2h.opponentPositions.armacao.percent}%), Pontas (${h2h.opponentPositions.pontas.percent}%), Pivô (${h2h.opponentPositions.pivo.percent}%)
- Sistema Defensivo Recomendado: ${recommendedDefensiveSystem}
- Justificativa: Foco de bloqueio na ${mainOppPosition}
- Goleiros: Manter postura firme e orientar o bloqueio no canto curto

4. GESTÃO DISCIPLINAR
- Exclusões 2min: ${h2h.exclusoes2min} | Cartões: ${h2h.cartoesAmarelos} Amarelos, ${h2h.cartoesVermelhos + h2h.cartoesAzuis} Vermelhos/Azuis
- Status: ${isHighExclusions ? "Atenção para evitar faltas de punição de 2min" : "Manter disciplina agressiva sem faltas de 2min"}

5. PLANO DE AÇÃO PARA O VESTIÁRIO
- Pilar 1 (Ataque): Iniciar com cruzamento de armadores. ${isM9Strong ? "Explorar chutes de 9m no início." : "Infiltrar e servir o pivô."}
- Pilar 2 (Defesa): Aplicar ${recommendedDefensiveSystem} e dobrar a marcação central.
- Pilar 3 (Transição): Repliegue defensivo imediato em sprint nos primeiros 3 passos após perda de posse.`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getFullTextForClipboard());
    setCopied(true);
    toast.success("Relatório copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-2 border-purple-500/40 bg-card shadow-lg">
      
      {/* CABEÇALHO DO GERADOR DE IA */}
      <CardHeader className="pb-3 border-b bg-gradient-to-r from-purple-900/10 via-purple-600/10 to-transparent">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-extrabold text-primary flex items-center gap-2">
                Gerador de Análise Tática Inteligente com IA
                <span className="text-xs bg-purple-600 text-white px-2.5 py-0.5 rounded-full font-bold shadow-2xs">
                  IA ESTRATEGISTA
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Relatório tático de handebol ultra-organizado para leitura rápida da comissão técnica e palestra de vestiário.
              </CardDescription>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="font-extrabold bg-purple-600 hover:bg-purple-700 text-white shadow-md gap-2 w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processando Análise IA...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" /> 🤖 Gerar Análise Tática Ultra-Detalhada
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {isGenerated ? (
          <div className="space-y-6">
            
            {/* BARRA SUPERIOR DE AÇÕES */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-purple-50 dark:bg-purple-950/40 p-3 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                <span className="text-xs font-extrabold text-purple-900 dark:text-purple-200">
                  DOSSIÊ TÁTICO PRÉ-JOGO: {teamName.toUpperCase()} VS {oppName.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button size="xs" variant="outline" onClick={copyToClipboard} className="font-bold border-purple-300 text-purple-900 hover:bg-purple-600 hover:text-white">
                  {copied ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                  {copied ? "Copiado!" : "Copiar Texto"}
                </Button>
                <Button size="xs" variant="outline" onClick={() => window.print()} className="font-bold border-border text-foreground hover:bg-muted">
                  <Printer className="h-3.5 w-3.5 mr-1" /> Imprimir / PDF
                </Button>
              </div>
            </div>

            {/* SEÇÃO 1: RESUMO EXECUTIVO DO CONFRONTO */}
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-primary flex items-center gap-2 border-b pb-1">
                <Trophy className="h-4 w-4 text-purple-600" /> 1. 📊 RESUMO EXECUTIVO DO CONFRONTO
              </h3>
              
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="bg-muted/40 p-3 rounded-lg border">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">Partidas Analisadas</span>
                  <p className="font-mono text-lg font-extrabold text-primary mt-1">{h2h.totalGames} {h2h.totalGames === 1 ? "Confronto" : "Confrontos"}</p>
                  <p className="text-[10px] text-muted-foreground">Histórico acumulado no scout</p>
                </div>

                <div className="bg-muted/40 p-3 rounded-lg border">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">Média de Gols Pró vs Contra</span>
                  <p className="font-mono text-lg font-extrabold text-emerald-600 mt-1">
                    {h2h.avgGolsMarcados}g <span className="text-xs text-muted-foreground font-normal">pró</span> / <span className="text-red-600">{h2h.avgGolsSofridos}g</span> <span className="text-xs text-muted-foreground font-normal">contra</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">Média por partida</p>
                </div>

                <div className="bg-muted/40 p-3 rounded-lg border">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">Aproveitamento & Defesa</span>
                  <p className="font-mono text-lg font-extrabold text-purple-600 mt-1">
                    {h2h.accuracy}% <span className="text-xs text-muted-foreground font-normal">Acerto</span> | <span className="text-accent">{h2h.gkSaveRate}%</span> <span className="text-xs text-muted-foreground font-normal">Defesa GK</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">Balanço geral de eficiência</p>
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: DIAGNÓSTICO OFENSIVO */}
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-primary flex items-center gap-2 border-b pb-1">
                <Target className="h-4 w-4 text-emerald-600" /> 2. ⚔️ DIAGNÓSTICO OFENSIVO ({teamName.toUpperCase()})
              </h3>

              <div className="grid gap-3 sm:grid-cols-3">
                {/* 9 METROS */}
                <div className="bg-background p-3 rounded-lg border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Finalizações de 9 Metros (9m)</span>
                    <span className="font-mono font-extrabold text-sm text-primary">{h2h.m9Accuracy}%</span>
                  </div>
                  <div className={cn("text-xs p-2 rounded-md font-medium border", isM9Strong ? "bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200" : "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200")}>
                    {isM9Strong ? "🟢 Excelente aproveitamento de fora. Usar chute de 9m para abrir a defesa." : "⚠️ Aproveitamento moderado de fora. Evitar chute forçado sem finta prévia."}
                  </div>
                </div>

                {/* 6 METROS */}
                <div className="bg-background p-3 rounded-lg border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Infiltrações & Pontas (6m)</span>
                    <span className="font-mono font-extrabold text-sm text-emerald-600">{h2h.m6Accuracy}%</span>
                  </div>
                  <div className={cn("text-xs p-2 rounded-md font-medium border", isM6Strong ? "bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200" : "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200")}>
                    {isM6Strong ? "🟢 Setor muito letal. Priorizar jogadas combinadas com o pivô e pontas." : "⚠️ Aumentar a velocidade da circulação para dar mais ângulo aos pontas."}
                  </div>
                </div>

                {/* TURNOVERS */}
                <div className="bg-background p-3 rounded-lg border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Gestão de Posse (Turnovers)</span>
                    <span className="font-mono font-extrabold text-sm text-primary">{h2h.avgTurnovers} er./jogo</span>
                  </div>
                  <div className={cn("text-xs p-2 rounded-md font-medium border", isHighTurnovers ? "bg-red-50 text-red-900 border-red-300 dark:bg-red-950 dark:text-red-200" : "bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200")}>
                    {isHighTurnovers ? "🔴 Taxa de erros alta. Orientar centrais a evitar passe arriscado." : "🟢 Ótimo controle de posse. Baixo índice de passes errados."}
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: DIAGNÓSTICO DEFENSIVO & SISTEMA RECOMENDADO */}
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-primary flex items-center gap-2 border-b pb-1">
                <Shield className="h-4 w-4 text-red-600" /> 3. 🛡️ DIAGNÓSTICO DEFENSIVO & AMEAÇAS ({oppName.toUpperCase()})
              </h3>

              {/* CARD DESTACADO DO SISTEMA RECOMENDADO */}
              <div className="bg-gradient-to-r from-purple-900/20 via-purple-600/10 to-transparent p-4 rounded-xl border border-purple-400/40 space-y-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500 animate-bounce" />
                  <span className="text-xs font-extrabold uppercase text-purple-700 dark:text-purple-300">Sistema Defensivo Recomendado para o Jogo:</span>
                </div>
                <h4 className="text-base font-extrabold text-primary">{recommendedDefensiveSystem}</h4>
                <p className="text-xs text-muted-foreground">
                  <strong>Justificativa Tática:</strong> O adversário concentra <strong>{h2h.opponentPositions.armacao.percent}% dos arremessos na {mainOppPosition}</strong>. É fundamental fechar a primeira linha e dobrar a cobertura central.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="bg-background p-3 rounded-lg border">
                  <span className="text-xs font-bold text-foreground">Origem das Ameaças Rivais:</span>
                  <ul className="text-xs space-y-1 mt-1 text-muted-foreground">
                    <li>• <strong>Armação (AE/AC/AD)</strong>: {h2h.opponentPositions.armacao.percent}% do volume ({h2h.opponentPositions.armacao.gols} gols)</li>
                    <li>• <strong>Pontas (PE/PD)</strong>: {h2h.opponentPositions.pontas.percent}% do volume ({h2h.opponentPositions.pontas.gols} gols)</li>
                    <li>• <strong>Pivô (PV)</strong>: {h2h.opponentPositions.pivo.percent}% do volume ({h2h.opponentPositions.pivo.gols} gols)</li>
                  </ul>
                </div>

                <div className="bg-background p-3 rounded-lg border">
                  <span className="text-xs font-bold text-foreground">Orientação para Nossos Goleiros:</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sustentamos <strong>{h2h.gkSaveRate}% de defesas</strong>. Orientar a barreira defensiva a cobrir o canto longo e os goleiros a manterem firmeza na bola de ponta.
                  </p>
                </div>
              </div>
            </div>

            {/* SEÇÃO 4: GESTÃO DISCIPLINAR */}
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-primary flex items-center gap-2 border-b pb-1">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> 4. ⏱️ GESTÃO DISCIPLINAR & INFERIORIDADE NUMÉRICA
              </h3>

              <div className="bg-background p-3.5 rounded-lg border flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-foreground">Histórico de Faltas & Punições:</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <strong>{h2h.exclusoes2min} Exclusões de 2 min</strong> | <strong>{h2h.cartoesAmarelos} Amarelos</strong> | <strong>{h2h.cartoesVermelhos + h2h.cartoesAzuis} Vermelhos/Azuis</strong>
                  </p>
                </div>

                <div className={cn("text-xs px-3 py-1.5 rounded-full font-bold border", isHighExclusions ? "bg-red-100 text-red-900 border-red-300 dark:bg-red-950 dark:text-red-200" : "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200")}>
                  {isHighExclusions ? "⚠️ Evitar faltas de punição de 2min em momentos decisivos" : "🟢 Disciplina agressiva sem excesso de 2 minutos"}
                </div>
              </div>
            </div>

            {/* SEÇÃO 5: PLANO DE AÇÃO PARA O VESTIÁRIO (3 PILARES) */}
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-primary flex items-center gap-2 border-b pb-1">
                <Users className="h-4 w-4 text-purple-600" /> 5. 🎯 PLANO DE AÇÃO PARA A PALESTRA PRÉ-JOGO (VESTIÁRIO)
              </h3>

              <div className="grid gap-3 sm:grid-cols-3">
                {/* PILAR 1 */}
                <div className="bg-gradient-to-br from-purple-500/10 to-transparent p-3.5 rounded-xl border border-purple-300 dark:border-purple-800 space-y-1">
                  <span className="text-[11px] font-extrabold text-purple-700 dark:text-purple-300 uppercase">Pilar 1: Ataque Organizado</span>
                  <p className="text-xs text-foreground/90 font-medium">
                    Iniciar com cruzamento de armadores para desestabilizar o bloco central rival. {isM9Strong ? "Explorar chutes de 9m logo no início." : "Infiltrar na fixação e servir o pivô."}
                  </p>
                </div>

                {/* PILAR 2 */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-transparent p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800 space-y-1">
                  <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 uppercase">Pilar 2: Postura Defensiva</span>
                  <p className="text-xs text-foreground/90 font-medium">
                    Aplicar o sistema <strong>{recommendedDefensiveSystem}</strong>. Bascular a defesa na bola lateral e não permitir arremessos sem oposição dos armadores deles.
                  </p>
                </div>

                {/* PILAR 3 */}
                <div className="bg-gradient-to-br from-amber-500/10 to-transparent p-3.5 rounded-xl border border-amber-300 dark:border-amber-800 space-y-1">
                  <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-300 uppercase">Pilar 3: Transição & Repliegue</span>
                  <p className="text-xs text-foreground/90 font-medium">
                    Após cada gol ou perda de bola, efetuar o <strong>repliegue defensivo imediato em sprint</strong> nos primeiros 3 passos para anular a saída rápida de centro deles.
                  </p>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="py-10 text-center space-y-3 bg-purple-50/10 rounded-xl border border-dashed border-purple-200 dark:border-purple-900">
            <Sparkles className="mx-auto h-10 w-10 text-purple-500 opacity-60" />
            <h4 className="font-bold text-sm text-primary">Nenhum Relatório Gerado Ainda</h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Clique no botão acima para cruzar os dados matemáticos do confronto direto e gerar um relatório tático ultra-organizado com IA.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
