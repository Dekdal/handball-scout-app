import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { DrawingStroke, Point, ToolType, CourtMode } from '../../types/tactical';

interface CanvasOverlayProps {
  tool: ToolType;
  color: string;
  lineWidth: number;
  strokes: DrawingStroke[];
  onAddStroke: (stroke: DrawingStroke) => void;
  onRemoveStroke: (strokeId: string) => void;
  mode: CourtMode;
}

export const CanvasOverlay: React.FC<CanvasOverlayProps> = ({
  tool,
  color,
  lineWidth,
  strokes,
  onAddStroke,
  onRemoveStroke,
  mode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);

  // Converte coordenadas da tela (pixels) para percentuais 0-100 da quadra
  const getCanvasPoint = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): Point | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;

      let xPercent = ((clientX - rect.left) / rect.width) * 100;
      let yPercent = ((clientY - rect.top) / rect.height) * 100;

      // Ajusta se estiver no modo Meia Quadra
      if (mode === 'half_attack') {
        xPercent = 50 + xPercent / 2; // Mapeia 0-100 da meia quadra para 50-100 da quadra inteira
      } else if (mode === 'half_defense') {
        xPercent = xPercent / 2; // Mapeia 0-100 da meia quadra para 0-50 da quadra inteira
      }

      return { x: xPercent, y: yPercent };
    },
    [mode]
  );

  // Redimensiona a resolução lógica do Canvas de acordo com o tamanho visual
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth * window.devicePixelRatio;
      canvas.height = parent.clientHeight * window.devicePixelRatio;
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // Função auxiliar para renderizar todos os traços no Canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Mapeia percentual (0-100) para pixels locais do Canvas
    const toPx = (point: Point) => {
      let x = point.x;
      if (mode === 'half_attack') {
        x = (point.x - 50) * 2;
      } else if (mode === 'half_defense') {
        x = point.x * 2;
      }
      return {
        x: (x / 100) * width,
        y: (point.y / 100) * height,
      };
    };

    // Desenha traços já confirmados
    strokes.forEach((stroke) => {
      drawStroke(ctx, stroke, toPx);
    });

    // Desenha o traço atual em andamento
    if (isDrawing && currentPoints.length > 0 && tool !== 'select' && tool !== 'eraser') {
      const activeStroke: DrawingStroke = {
        id: 'active',
        tool: tool as 'brush' | 'line' | 'dashed',
        points: currentPoints,
        color,
        width: lineWidth,
      };
      drawStroke(ctx, activeStroke, toPx);
    }
  }, [strokes, isDrawing, currentPoints, tool, color, lineWidth, mode]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Lógica de manipulação de Pointer (Mouse + Toque)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === 'select') return;

    const p = getCanvasPoint(e);
    if (!p) return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDrawing(true);
    setCurrentPoints([p]);

    // Se for Borracha, checa se tocou em algum traço próximo
    if (tool === 'eraser') {
      checkErase(p);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool === 'select') return;

    const p = getCanvasPoint(e);
    if (!p) return;

    if (tool === 'eraser') {
      checkErase(p);
      return;
    }

    if (tool === 'brush') {
      setCurrentPoints((prev) => [...prev, p]);
    } else if (tool === 'line' || tool === 'dashed') {
      // Para retas e pontilhados, mantemos o ponto inicial e atualizamos o ponto final
      setCurrentPoints((prev) => (prev.length > 0 ? [prev[0], p] : [p]));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignora erro se capture já tiver sido libertado
    }

    setIsDrawing(false);

    if (tool !== 'select' && tool !== 'eraser' && currentPoints.length >= 2) {
      const newStroke: DrawingStroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        tool: tool as 'brush' | 'line' | 'dashed',
        points: currentPoints,
        color,
        width: lineWidth,
      };
      onAddStroke(newStroke);
    }
    setCurrentPoints([]);
  };

  // Função para apagar traços próximos ao ponteiro
  const checkErase = (point: Point) => {
    const threshold = 4; // 4% de tolerância para toque
    strokes.forEach((stroke) => {
      const hit = stroke.points.some((p) => {
        const dx = p.x - point.x;
        const dy = p.y - point.y;
        return Math.sqrt(dx * dx + dy * dy) < threshold;
      });
      if (hit) {
        onRemoveStroke(stroke.id);
      }
    });
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`absolute inset-0 w-full h-full touch-none z-10 ${
        tool === 'select' ? 'pointer-events-none' : 'pointer-events-auto cursor-crosshair'
      }`}
    />
  );
};

/**
 * Utilitário interno para desenhar um traço no contexto 2D com ponta de seta
 */
function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  toPx: (p: Point) => { x: number; y: number }
) {
  if (stroke.points.length === 0) return;

  ctx.save();
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = stroke.width * (ctx.canvas.width / 1000);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (stroke.tool === 'dashed') {
    ctx.setLineDash([12, 8]);
  } else {
    ctx.setLineDash([]);
  }

  const pxPoints = stroke.points.map(toPx);

  if (stroke.tool === 'brush') {
    ctx.beginPath();
    ctx.moveTo(pxPoints[0].x, pxPoints[0].y);
    for (let i = 1; i < pxPoints.length; i++) {
      ctx.lineTo(pxPoints[i].x, pxPoints[i].y);
    }
    ctx.stroke();

    // Seta na ponta do pincel livre se tiver ao menos 2 pontos
    if (pxPoints.length >= 2) {
      const p1 = pxPoints[pxPoints.length - 2];
      const p2 = pxPoints[pxPoints.length - 1];
      drawArrowHead(ctx, p1.x, p1.y, p2.x, p2.y, stroke.width * 2.5);
    }
  } else if (stroke.tool === 'line' || stroke.tool === 'dashed') {
    const p1 = pxPoints[0];
    const p2 = pxPoints[pxPoints.length - 1];

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Ponta de seta
    drawArrowHead(ctx, p1.x, p1.y, p2.x, p2.y, stroke.width * 3);
  }

  ctx.restore();
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
  const arrowSize = Math.max(10, size * 2.5);

  ctx.save();
  ctx.setLineDash([]); // Ponta de seta sempre contínua
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
