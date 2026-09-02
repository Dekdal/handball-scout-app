import type { CourtMode, CourtTheme } from '../types/tactical';

export interface CourtDimensions {
  width: number;
  height: number;
  viewBox: string;
}

export const BASE_COURT_WIDTH = 1000;
export const BASE_COURT_HEIGHT = 500;

export const COURT_THEMES: Record<CourtTheme, { bg: string; lines: string; area: string; goal: string }> = {
  blue: {
    bg: '#0f2942', // Azul marinho sintético profissional
    lines: '#ffffff',
    area: '#1a4971', // Azul mais claro na área de 6m
    goal: '#e63946',
  },
  wood: {
    bg: '#b87d4b', // Taco de madeira clássico de ginásio
    lines: '#ffffff',
    area: '#965e33',
    goal: '#1d3557',
  },
  green: {
    bg: '#1b4332', // Quadra verde clássica
    lines: '#ffffff',
    area: '#2d6a4f',
    goal: '#ffb703',
  },
};

/**
 * Desenha a quadra de handebol em um contexto de Canvas (utilizado para exportação PNG)
 */
export function drawCourtToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: CourtTheme = 'blue',
  mode: CourtMode = 'full'
) {
  const colors = COURT_THEMES[theme];

  // Escala para os 1000x500 oficiais
  const renderWidth = mode === 'full' ? width : width * 2;
  const renderOffset = mode === 'half_defense' ? -width : 0;

  const scaleX = renderWidth / BASE_COURT_WIDTH;
  const scaleY = height / BASE_COURT_HEIGHT;

  ctx.save();
  ctx.translate(renderOffset, 0);

  // Fundo da quadra
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, renderWidth, height);

  // Estilo das linhas
  ctx.strokeStyle = colors.lines;
  ctx.fillStyle = colors.area;
  ctx.lineWidth = 3 * scaleX;

  // --- ÁREA DE 6 METROS (ESQUERDA) ---
  drawGoalAreaCanvas(ctx, 0, scaleX, scaleY, colors);

  // --- ÁREA DE 6 METROS (DIREITA) ---
  drawGoalAreaCanvas(ctx, BASE_COURT_WIDTH, scaleX, scaleY, colors, true);

  // --- LINHAS DE 9 METROS (TRACEJADA ESQUERDA) ---
  draw9mLineCanvas(ctx, 0, scaleX, scaleY, colors.lines);

  // --- LINHAS DE 9 METROS (TRACEJADA DIREITA) ---
  draw9mLineCanvas(ctx, BASE_COURT_WIDTH, scaleX, scaleY, colors.lines, true);

  // --- LINHA CENTRAL E CÍRCULO CENTRAL ---
  ctx.beginPath();
  ctx.moveTo(500 * scaleX, 0);
  ctx.lineTo(500 * scaleX, height);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(500 * scaleX, 250 * scaleY, 100 * scaleY, 0, Math.PI * 2);
  ctx.stroke();

  // --- PONTO DE MARCAÇÃO CENTRAL ---
  ctx.fillStyle = colors.lines;
  ctx.beginPath();
  ctx.arc(500 * scaleX, 250 * scaleY, 5 * scaleX, 0, Math.PI * 2);
  ctx.fill();

  // --- MARCAS DE 7M (PÊNALTI) E 4M (GOLEIRO) ---
  drawMarksCanvas(ctx, 0, scaleX, scaleY, colors.lines);
  drawMarksCanvas(ctx, BASE_COURT_WIDTH, scaleX, scaleY, colors.lines, true);

  // --- MARCAÇÕES DE BALIZA (GOLS) ---
  drawGoalFrameCanvas(ctx, 0, scaleX, scaleY, colors.goal);
  drawGoalFrameCanvas(ctx, BASE_COURT_WIDTH, scaleX, scaleY, colors.goal, true);

  // --- BORDAS DA QUADRA ---
  ctx.strokeStyle = colors.lines;
  ctx.lineWidth = 4 * scaleX;
  ctx.strokeRect(0, 0, renderWidth, height);

  ctx.restore();
}

function drawGoalAreaCanvas(
  ctx: CanvasRenderingContext2D,
  startX: number,
  scaleX: number,
  scaleY: number,
  colors: { area: string; lines: string },
  isRight = false
) {
  const goalTop = 212.5 * scaleY;
  const goalBottom = 287.5 * scaleY;
  const r6 = 150 * scaleX; // 6m em escala 1000x500

  ctx.save();
  ctx.fillStyle = colors.area;
  ctx.strokeStyle = colors.lines;
  ctx.lineWidth = 3 * scaleX;

  ctx.beginPath();
  if (!isRight) {
    ctx.moveTo(0, goalTop - r6);
    ctx.arc(0, goalTop, r6, -Math.PI / 2, 0, false);
    ctx.lineTo(r6, goalBottom);
    ctx.arc(0, goalBottom, r6, 0, Math.PI / 2, false);
    ctx.lineTo(0, goalBottom + r6);
  } else {
    ctx.moveTo(startX, goalTop - r6);
    ctx.arc(startX, goalTop, r6, -Math.PI / 2, Math.PI, true);
    ctx.lineTo(startX - r6, goalBottom);
    ctx.arc(startX, goalBottom, r6, Math.PI, Math.PI / 2, true);
    ctx.lineTo(startX, goalBottom + r6);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function draw9mLineCanvas(
  ctx: CanvasRenderingContext2D,
  startX: number,
  scaleX: number,
  scaleY: number,
  lineColor: string,
  isRight = false
) {
  const goalTop = 212.5 * scaleY;
  const goalBottom = 287.5 * scaleY;
  const r9 = 225 * scaleX; // 9m em escala 1000x500

  ctx.save();
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2.5 * scaleX;
  ctx.setLineDash([12 * scaleX, 8 * scaleX]);

  ctx.beginPath();
  if (!isRight) {
    ctx.moveTo(0, goalTop - r9);
    ctx.arc(0, goalTop, r9, -Math.PI / 2, 0, false);
    ctx.lineTo(r9, goalBottom);
    ctx.arc(0, goalBottom, r9, 0, Math.PI / 2, false);
    ctx.lineTo(0, goalBottom + r9);
  } else {
    ctx.moveTo(startX, goalTop - r9);
    ctx.arc(startX, goalTop, r9, -Math.PI / 2, Math.PI, true);
    ctx.lineTo(startX - r9, goalBottom);
    ctx.arc(startX, goalBottom, r9, Math.PI, Math.PI / 2, true);
    ctx.lineTo(startX, goalBottom + r9);
  }
  ctx.stroke();
  ctx.restore();
}

function drawMarksCanvas(
  ctx: CanvasRenderingContext2D,
  startX: number,
  scaleX: number,
  scaleY: number,
  lineColor: string,
  isRight = false
) {
  const dir = isRight ? -1 : 1;
  const centerY = 250 * scaleY;

  ctx.save();
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 3 * scaleX;

  // Marca de 4m (Goleiro)
  const x4m = startX + 100 * scaleX * dir;
  ctx.beginPath();
  ctx.moveTo(x4m, centerY - 10 * scaleY);
  ctx.lineTo(x4m, centerY + 10 * scaleY);
  ctx.stroke();

  // Marca de 7m (Pênalti)
  const x7m = startX + 175 * scaleX * dir;
  ctx.beginPath();
  ctx.moveTo(x7m, centerY - 20 * scaleY);
  ctx.lineTo(x7m, centerY + 20 * scaleY);
  ctx.stroke();

  ctx.restore();
}

function drawGoalFrameCanvas(
  ctx: CanvasRenderingContext2D,
  startX: number,
  scaleX: number,
  scaleY: number,
  goalColor: string,
  isRight = false
) {
  const goalTop = 212.5 * scaleY;
  const goalHeight = 75 * scaleY;
  const depth = 25 * scaleX;

  ctx.save();
  ctx.fillStyle = goalColor;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3 * scaleX;

  const goalX = isRight ? startX : startX - depth;
  ctx.fillRect(goalX, goalTop, depth, goalHeight);
  ctx.strokeRect(goalX, goalTop, depth, goalHeight);

  ctx.restore();
}
