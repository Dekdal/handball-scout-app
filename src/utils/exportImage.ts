import type { Player, DrawingStroke, CourtMode, CourtTheme } from '../types/tactical';
import { drawCourtToCanvas } from './courtDrawings';

interface ExportOptions {
  players: Player[];
  strokes: DrawingStroke[];
  mode: CourtMode;
  theme: CourtTheme;
  title?: string;
}

export function exportTacticalBoardToPNG({
  players,
  strokes,
  mode,
  theme,
  title = 'Prancheta Tática - GoalScout',
}: ExportOptions) {
  // Resolução em Alta Definição (1920 x 960 para 2:1)
  const exportWidth = 1920;
  const exportHeight = 960;

  const canvas = document.createElement('canvas');
  canvas.width = exportWidth;
  canvas.height = exportHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Renderiza a quadra oficial no contexto do Canvas
  drawCourtToCanvas(ctx, exportWidth, exportHeight, theme, mode);

  // Mapeia coordenadas percentuais (0-100) para os pixels de exportação (1920x960)
  const toPx = (xPercent: number, yPercent: number) => {
    let x = xPercent;
    if (mode === 'half_attack') {
      x = (xPercent - 50) * 2;
    } else if (mode === 'half_defense') {
      x = xPercent * 2;
    }
    return {
      x: (x / 100) * exportWidth,
      y: (yPercent / 100) * exportHeight,
    };
  };

  // 2. Renderiza todos os traços táticos no Canvas
  strokes.forEach((stroke) => {
    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.lineWidth = stroke.width * (exportWidth / 1000) * 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.tool === 'dashed') {
      ctx.setLineDash([20, 12]);
    } else {
      ctx.setLineDash([]);
    }

    const pxPoints = stroke.points.map((p) => toPx(p.x, p.y));

    if (stroke.tool === 'brush') {
      ctx.beginPath();
      ctx.moveTo(pxPoints[0].x, pxPoints[0].y);
      for (let i = 1; i < pxPoints.length; i++) {
        ctx.lineTo(pxPoints[i].x, pxPoints[i].y);
      }
      ctx.stroke();

      if (pxPoints.length >= 2) {
        const p1 = pxPoints[pxPoints.length - 2];
        const p2 = pxPoints[pxPoints.length - 1];
        drawArrowHead(ctx, p1.x, p1.y, p2.x, p2.y, stroke.width * 4);
      }
    } else if (stroke.tool === 'line' || stroke.tool === 'dashed') {
      const p1 = pxPoints[0];
      const p2 = pxPoints[pxPoints.length - 1];

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      drawArrowHead(ctx, p1.x, p1.y, p2.x, p2.y, stroke.width * 5);
    }

    ctx.restore();
  });

  // 3. Renderiza todas as fichas dos jogadores
  players.forEach((player) => {
    const { x, y } = toPx(player.x, player.y);

    // Ignora se o jogador estiver fora do campo visível no modo Meia Quadra
    if (x < -20 || x > exportWidth + 20) return;

    if (player.team === 'ball') {
      // DESENHA A BOLA DE HANDEBOL
      const r = 24;
      ctx.save();

      // Sombra
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.arc(x + 4, y + 4, r, 0, Math.PI * 2);
      ctx.fill();

      // Esfera da bola
      const grad = ctx.createRadialGradient(x - r / 3, y - r / 3, r / 4, x, y, r);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.5, '#f59e0b');
      grad.addColorStop(1, '#78350f');

      ctx.fillStyle = grad;
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Texto HB
      ctx.fillStyle = '#451a03';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('HB', x, y);

      ctx.restore();
    } else {
      // DESENHA FICHA DO JOGADOR
      const r = 32;
      const isAttack = player.team === 'attack';

      ctx.save();

      // Sombra projetada
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.arc(x + 4, y + 4, r, 0, Math.PI * 2);
      ctx.fill();

      // Gradiente do jogador
      const grad = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
      if (isAttack) {
        grad.addColorStop(0, '#3b82f6');
        grad.addColorStop(1, '#1e3a8a');
      } else {
        grad.addColorStop(0, '#ef4444');
        grad.addColorStop(1, '#7f1d1d');
      }

      ctx.fillStyle = grad;
      ctx.strokeStyle = isAttack ? '#67e8f9' : '#fde047';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Texto do Número
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player.number, x, y - 6);

      // Texto da Posição
      ctx.fillStyle = isAttack ? '#a5f3fc' : '#fef08a';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillText(player.position, x, y + 15);

      ctx.restore();
    }
  });

  // 4. Marca d'água / Título no canto inferior
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(exportWidth - 450, exportHeight - 65, 430, 50);

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(exportWidth - 450, exportHeight - 65, 430, 50);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(title.toUpperCase(), exportWidth - 435, exportHeight - 40);

  const timestamp = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px Inter, sans-serif';
  ctx.fillText(`Gerado em: ${timestamp}`, exportWidth - 435, exportHeight - 22);

  ctx.restore();

  // 5. Aciona o download da imagem PNG
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `jogada_handebol_${Date.now()}.png`;
  link.href = dataUrl;
  link.click();
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  size: number
) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const arrowSize = Math.max(16, size * 2.5);

  ctx.save();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - arrowSize * Math.cos(angle - Math.PI / 6),
    toY - arrowSize * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    toX - arrowSize * Math.cos(angle + Math.PI / 6),
    toY - arrowSize * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
