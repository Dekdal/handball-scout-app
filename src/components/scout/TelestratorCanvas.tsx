import React, { useState, useRef, useEffect } from "react";
import { Undo, Trash2, Check, X, ArrowRight, CornerDownRight, Circle, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ShapeType = "freehand" | "arrow" | "curved_arrow" | "circle";

export interface Point {
  x: number;
  y: number;
}

export interface Shape {
  id: string;
  type: ShapeType;
  color: string;
  points: Point[];
}

interface Props {
  active?: boolean;
  shapes?: Shape[];
  initialShapes?: Shape[];
  onShapesChange?: (shapes: Shape[]) => void;
  onSave?: () => void;
  onCancel?: () => void;
  readOnly?: boolean;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  currentTime?: number;
}

const COLORS = [
  { name: "Vermelho (Atenção/Erro)", value: "#ef4444" },
  { name: "Verde (Acerto/Movimento)", value: "#22c55e" },
  { name: "Amarelo (Trajetória da Bola)", value: "#f59e0b" },
  { name: "Azul (Posicionamento)", value: "#3b82f6" },
];

export function TelestratorCanvas({
  active = false,
  shapes,
  initialShapes = [],
  onShapesChange,
  onSave,
  onCancel,
  readOnly = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [currentType, setCurrentType] = useState<ShapeType>("freehand");
  const [currentColor, setCurrentColor] = useState<string>("#f59e0b");
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);

  // Garante que lista de formas nunca seja undefined
  const activeShapes = shapes || initialShapes || [];

  // Ajustar tamanho do canvas ao tamanho do contêiner do vídeo
  const updateCanvasDimensions = () => {
    if (canvasRef.current && containerRef.current) {
      canvasRef.current.width = containerRef.current.clientWidth;
      canvasRef.current.height = containerRef.current.clientHeight;
      drawAllShapes();
    }
  };

  useEffect(() => {
    updateCanvasDimensions();
    window.addEventListener("resize", updateCanvasDimensions);
    return () => window.removeEventListener("resize", updateCanvasDimensions);
  }, [activeShapes, active]);

  // Função para desenhar a lista de formas no Canvas
  const drawAllShapes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const renderShape = (shape: Shape) => {
      if (!shape || !shape.points || shape.points.length < 2) return;
      ctx.strokeStyle = shape.color || "#f59e0b";
      ctx.fillStyle = shape.color || "#f59e0b";
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const p1 = shape.points[0];
      const p2 = shape.points[shape.points.length - 1];
      if (!p1 || !p2) return;

      if (shape.type === "freehand") {
        ctx.beginPath();
        ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
        for (let i = 1; i < shape.points.length; i++) {
          const pt = shape.points[i];
          if (pt) ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
        }
        ctx.stroke();
      } else if (shape.type === "arrow") {
        const x1 = p1.x * canvas.width;
        const y1 = p1.y * canvas.height;
        const x2 = p2.x * canvas.width;
        const y2 = p2.y * canvas.height;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Desenhar ponta da seta
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLen = 14;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      } else if (shape.type === "curved_arrow") {
        const x1 = p1.x * canvas.width;
        const y1 = p1.y * canvas.height;
        const x2 = p2.x * canvas.width;
        const y2 = p2.y * canvas.height;

        // Ponto de controle em arco
        const cx = (x1 + x2) / 2 + (y1 - y2) * 0.3;
        const cy = (y1 + y2) / 2 + (x2 - x1) * 0.3;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cx, cy, x2, y2);
        ctx.stroke();

        // Ponta da seta curva
        const angle = Math.atan2(y2 - cy, x2 - cx);
        const headLen = 14;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      } else if (shape.type === "circle") {
        const x1 = p1.x * canvas.width;
        const y1 = p1.y * canvas.height;
        const x2 = p2.x * canvas.width;
        const y2 = p2.y * canvas.height;

        const radiusX = Math.abs(x2 - x1) / 2;
        const radiusY = Math.abs(y2 - y1) / 2;
        const centerX = Math.min(x1, x2) + radiusX;
        const centerY = Math.min(y1, y2) + radiusY;

        ctx.beginPath();
        ctx.ellipse(centerX, centerY, Math.max(5, radiusX), Math.max(5, radiusY), 0, 0, 2 * Math.PI);
        ctx.stroke();
      }
    };

    (activeShapes || []).forEach(renderShape);

    // Renderizar forma que está sendo desenhada agora
    if (isDrawing && currentPoints.length > 0) {
      renderShape({
        id: "temp",
        type: currentType,
        color: currentColor,
        points: currentPoints,
      });
    }
  };

  useEffect(() => {
    drawAllShapes();
  }, [activeShapes, currentPoints, isDrawing]);

  // Manipuladores de mouse/touch para desenho
  const getNormalizedPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!active || readOnly) return;
    setIsDrawing(true);
    const pt = getNormalizedPoint(e);
    setCurrentPoints([pt, pt]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !active || readOnly) return;
    const pt = getNormalizedPoint(e);
    if (currentType === "freehand") {
      setCurrentPoints((prev) => [...prev, pt]);
    } else {
      setCurrentPoints((prev) => [prev[0], pt]);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !active || readOnly) return;
    setIsDrawing(false);
    if (currentPoints.length >= 2) {
      const newShape: Shape = {
        id: Date.now().toString(),
        type: currentType,
        color: currentColor,
        points: currentPoints,
      };
      if (onShapesChange) {
        onShapesChange([...activeShapes, newShape]);
      }
    }
    setCurrentPoints([]);
  };

  const handleUndo = () => {
    if (!onShapesChange || activeShapes.length === 0) return;
    onShapesChange(activeShapes.slice(0, -1));
  };

  const handleClear = () => {
    if (!onShapesChange) return;
    onShapesChange([]);
  };

  const isInteractive = active && !readOnly;

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-20">
      
      {/* CANVAS TRANSPARENTE DE DESENHO */}
      <canvas
        ref={canvasRef}
        className={cn(
          "w-full h-full",
          isInteractive ? "pointer-events-auto cursor-crosshair" : "pointer-events-none"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />

      {/* BARRA DE FERRAMENTAS DO MOSTRADOR DE DESENHO TÁTICO */}
      {isInteractive && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white backdrop-blur-md p-2 rounded-xl border border-slate-700 shadow-2xl pointer-events-auto flex flex-wrap items-center gap-3 max-w-[95%] z-30">
          
          {/* SELEÇÃO DE FERRAMENTA */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
            <Button
              size="xs"
              variant={currentType === "freehand" ? "default" : "ghost"}
              className={cn("h-7 px-2 text-xs", currentType === "freehand" && "bg-accent text-accent-foreground")}
              onClick={() => setCurrentType("freehand")}
              title="Livre"
            >
              <PenTool className="h-3.5 w-3.5 mr-1" /> Livre
            </Button>
            <Button
              size="xs"
              variant={currentType === "arrow" ? "default" : "ghost"}
              className={cn("h-7 px-2 text-xs", currentType === "arrow" && "bg-accent text-accent-foreground")}
              onClick={() => setCurrentType("arrow")}
              title="Seta Reta"
            >
              <ArrowRight className="h-3.5 w-3.5 mr-1" /> Seta
            </Button>
            <Button
              size="xs"
              variant={currentType === "curved_arrow" ? "default" : "ghost"}
              className={cn("h-7 px-2 text-xs", currentType === "curved_arrow" && "bg-accent text-accent-foreground")}
              onClick={() => setCurrentType("curved_arrow")}
              title="Seta Curva"
            >
              <CornerDownRight className="h-3.5 w-3.5 mr-1" /> Curva
            </Button>
            <Button
              size="xs"
              variant={currentType === "circle" ? "default" : "ghost"}
              className={cn("h-7 px-2 text-xs", currentType === "circle" && "bg-accent text-accent-foreground")}
              onClick={() => setCurrentType("circle")}
              title="Círculo / Elipse"
            >
              <Circle className="h-3.5 w-3.5 mr-1" /> Círculo
            </Button>
          </div>

          {/* PALETA DE CORES */}
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg border border-slate-700">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                className={cn(
                  "w-5 h-5 rounded-full border-2 transition-all",
                  currentColor === c.value ? "border-white scale-125 shadow" : "border-transparent opacity-80 hover:opacity-100"
                )}
                style={{ backgroundColor: c.value }}
                title={c.name}
                onClick={() => setCurrentColor(c.value)}
              />
            ))}
          </div>

          {/* BOTAO UNDO & CLEAR */}
          <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
            <Button size="xs" variant="ghost" className="h-7 text-xs text-slate-300 hover:text-white" onClick={handleUndo} title="Desfazer traço">
              <Undo className="h-3.5 w-3.5" />
            </Button>
            <Button size="xs" variant="ghost" className="h-7 text-xs text-red-400 hover:text-red-300" onClick={handleClear} title="Limpar tudo">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* SALVAR / CANCELAR */}
          <div className="flex items-center gap-1.5 border-l border-slate-700 pl-2">
            {onCancel && (
              <Button size="xs" variant="ghost" className="h-7 text-xs text-slate-300 hover:text-white" onClick={onCancel}>
                <X className="h-3.5 w-3.5 mr-1" /> Cancelar
              </Button>
            )}
            {onSave && (
              <Button size="xs" variant="default" className="h-7 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-amber-950" onClick={onSave}>
                <Check className="h-3.5 w-3.5 mr-1" /> Salvar Anotação
              </Button>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
