import { useState } from "react";
import { Upload, Video, Clock, Sliders, Check, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { VideoConfig } from "@/lib/scout/video";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: VideoConfig;
  onSaveConfig: (newConfig: VideoConfig) => void;
}

export function VideoSyncModal({ open, onOpenChange, config, onSaveConfig }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [offset1TInput, setOffset1TInput] = useState<string>(String(config.offset1TSeconds));
  const [offset2TInput, setOffset2TInput] = useState<string>(String(config.offset2TSeconds));
  const [preRollInput, setPreRollInput] = useState<string>(String(config.preRollSeconds));
  const [postRollInput, setPostRollInput] = useState<string>(String(config.postRollSeconds));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSave = () => {
    let videoUrl = config.videoUrl;
    let videoFileName = config.videoFileName;

    if (selectedFile) {
      videoUrl = URL.createObjectURL(selectedFile);
      videoFileName = selectedFile.name;
    }

    onSaveConfig({
      videoUrl,
      videoFileName,
      offset1TSeconds: parseFloat(offset1TInput) || 0,
      offset2TSeconds: parseFloat(offset2TInput) || 0,
      preRollSeconds: parseInt(preRollInput, 10) || 5,
      postRollSeconds: parseInt(postRollInput, 10) || 3,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-primary">
            <Video className="h-5 w-5 text-accent" />
            Configurar & Sincronizar Vídeo da Partida
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Selecione o arquivo de vídeo gravado e informe o tempo no vídeo em que iniciou o cronômetro do 1º e 2º Tempo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3">
          
          {/* SELEÇÃO DO ARQUIVO DE VÍDEO LOCAL */}
          <div className="space-y-2 border-2 border-dashed border-primary/30 rounded-lg p-4 bg-muted/30 text-center">
            <Upload className="h-8 w-8 text-primary mx-auto opacity-70" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-primary">
                {config.videoFileName ? `Arquivo Atual: ${config.videoFileName}` : "Selecionar Vídeo Local (.mp4, .mkv, .webm)"}
              </p>
              <p className="text-xs text-muted-foreground">
                O arquivo é lido diretamente do seu computador com reprodução instantânea (sem upload demorado).
              </p>
            </div>
            <Input
              type="file"
              accept="video/*"
              className="hidden"
              id="video-file-input"
              onChange={handleFileSelect}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="font-bold text-xs"
              onClick={() => document.getElementById("video-file-input")?.click()}
            >
              {selectedFile ? `Substituir: ${selectedFile.name}` : "Procurar Arquivo no Computador"}
            </Button>
          </div>

          {/* CONFIGURAÇÃO DOS OFFSETS DE SINCRONIZAÇÃO */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold flex items-center gap-1 text-primary">
                <Clock className="h-3.5 w-3.5 text-accent" /> Offset 1º Tempo (segundos)
              </Label>
              <Input
                type="number"
                step="0.5"
                className="font-mono text-sm"
                placeholder="Ex: 42 (segundos)"
                value={offset1TInput}
                onChange={(e) => setOffset1TInput(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Segundo no vídeo onde o cronômetro do 1ºT começou.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold flex items-center gap-1 text-primary">
                <Clock className="h-3.5 w-3.5 text-accent" /> Offset 2º Tempo (segundos)
              </Label>
              <Input
                type="number"
                step="0.5"
                className="font-mono text-sm"
                placeholder="Ex: 1850 (segundos)"
                value={offset2TInput}
                onChange={(e) => setOffset2TInput(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Segundo no vídeo onde o cronômetro do 2ºT começou.
              </p>
            </div>
          </div>

          {/* JANELA DO RECORTE (PRE-ROLL E POST-ROLL) */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold flex items-center gap-1 text-primary">
                <Sliders className="h-3.5 w-3.5 text-emerald-600" /> Pre-roll (Segundos Antes)
              </Label>
              <Input
                type="number"
                min="1"
                max="30"
                className="font-mono text-sm"
                value={preRollInput}
                onChange={(e) => setPreRollInput(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">Tempo para mostrar a armação do lance.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold flex items-center gap-1 text-primary">
                <Sliders className="h-3.5 w-3.5 text-blue-600" /> Post-roll (Segundos Depois)
              </Label>
              <Input
                type="number"
                min="1"
                max="30"
                className="font-mono text-sm"
                value={postRollInput}
                onChange={(e) => setPostRollInput(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">Tempo para ver a comemoração/retorno.</p>
            </div>
          </div>

        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button size="sm" className="font-bold text-xs bg-primary" onClick={handleSave}>
            <Check className="mr-1.5 h-4 w-4" /> Salvar Sincronização
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
