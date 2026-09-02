import { secondsToTimeString, type ClipWindow } from "./video";

export interface ExportProgress {
  currentClip: number;
  totalClips: number;
  percentage: number;
  statusText: string;
}

/**
 * Exporta uma lista de clipes filtrados diretamente no navegador usando a MediaRecorder API.
 * Sem necessidade de backend ou servidor - totalmente processado no computador do usuário!
 */
export async function exportPlaylistToVideo(
  videoUrl: string,
  clips: ClipWindow[],
  fileName: string = "Playlist_Handebol.webm",
  onProgress?: (progress: ExportProgress) => void
): Promise<void> {
  if (!videoUrl || clips.length === 0) {
    throw new Error("Nenhum vídeo ou lista de clipes fornecida para exportação.");
  }

  // Elemento oculto de vídeo e canvas para gravação de quadro a quadro
  const hiddenVideo = document.createElement("video");
  hiddenVideo.src = videoUrl;
  hiddenVideo.crossOrigin = "anonymous";
  hiddenVideo.muted = false;

  await new Promise<void>((resolve, reject) => {
    hiddenVideo.onloadedmetadata = () => resolve();
    hiddenVideo.onerror = (e) => reject(new Error("Erro ao carregar o arquivo de vídeo local."));
  });

  const canvas = document.createElement("canvas");
  canvas.width = hiddenVideo.videoWidth || 1280;
  canvas.height = hiddenVideo.videoHeight || 720;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Não foi possível criar o contexto 2D do Canvas.");
  }

  // Tentar encontrar suporte de gravação de vídeo no navegador (webm/mp4)
  let mimeType = "video/webm;codecs=vp9";
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = "video/webm";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/mp4";
    }
  }

  const stream = canvas.captureStream(30); // 30 FPS
  const mediaRecorder = new MediaRecorder(stream, { mimeType });
  const recordedChunks: Blob[] = [];

  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  mediaRecorder.start();

  const totalClips = clips.length;

  for (let i = 0; i < totalClips; i++) {
    const clip = clips[i];
    const percentage = Math.round(((i + 1) / totalClips) * 100);

    if (onProgress) {
      onProgress({
        currentClip: i + 1,
        totalClips,
        percentage,
        statusText: `Processando clipe ${i + 1} de ${totalClips} (${secondsToTimeString(clip.videoStartTime)} a ${secondsToTimeString(clip.videoEndTime)})...`,
      });
    }

    // Mover agulha do vídeo para o início do clipe
    hiddenVideo.currentTime = clip.videoStartTime;
    await new Promise<void>((r) => {
      hiddenVideo.onseeked = () => r();
    });

    await hiddenVideo.play().catch(() => {});

    // Renderizar quadros do clipe até atingir o tempo final
    await new Promise<void>((resolve) => {
      const renderLoop = () => {
        if (hiddenVideo.currentTime >= clip.videoEndTime || hiddenVideo.paused || hiddenVideo.ended) {
          hiddenVideo.pause();
          resolve();
        } else {
          ctx.drawImage(hiddenVideo, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(renderLoop);
        }
      };
      renderLoop();
    });
  }

  // Finalizar gravação e gerar o download do arquivo compilado
  return new Promise<void>((resolve) => {
    mediaRecorder.onstop = () => {
      const finalBlob = new Blob(recordedChunks, { type: mimeType });
      const blobUrl = URL.createObjectURL(finalBlob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName.endsWith(".webm") || fileName.endsWith(".mp4") ? fileName : `${fileName}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      if (onProgress) {
        onProgress({
          currentClip: totalClips,
          totalClips,
          percentage: 100,
          statusText: "Exportação concluída com sucesso!",
        });
      }
      resolve();
    };

    mediaRecorder.stop();
  });
}

