import type { Shot } from "./stats";

export interface VideoConfig {
  videoUrl: string | null;
  videoFileName: string | null;
  offset1TSeconds: number; // Offset do 1º tempo em segundos
  offset2TSeconds: number; // Offset do 2º tempo em segundos
  preRollSeconds: number;  // Segundos antes do lance (ex: 5s)
  postRollSeconds: number; // Segundos depois do lance (ex: 3s)
}

export interface ClipWindow {
  shot: Shot;
  start: number;
  end: number;
  videoStartTime: number;
  videoEndTime: number;
  eventTimeInVideo: number;
}

/**
 * Converte uma string no formato "MM:SS" (ex: "14:35") em segundos inteiros (ex: 875).
 * Retorna 0 de forma segura para null, undefined ou strings inválidas.
 */
export function timeStringToSeconds(timeStr?: string | null): number {
  if (!timeStr) return 0;
  const str = String(timeStr).trim();
  if (!str) return 0;
  const parts = str.split(":");
  if (parts.length === 2) {
    const min = parseInt(parts[0], 10);
    const sec = parseInt(parts[1], 10);
    const total = (isNaN(min) ? 0 : min) * 60 + (isNaN(sec) ? 0 : sec);
    return isNaN(total) ? 0 : Math.max(0, total);
  }
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

/**
 * Converte segundos em formato amigável "MM:SS" (ex: 875 -> "14:35").
 * Retorna o fallback "00:00" para valores null, undefined, NaN ou não convertíveis.
 */
export function secondsToTimeString(totalSeconds?: number | string | null): string {
  if (totalSeconds === null || totalSeconds === undefined) return "00:00";
  const num = typeof totalSeconds === "number" ? totalSeconds : parseFloat(String(totalSeconds));
  if (isNaN(num) || !isFinite(num) || num < 0) return "00:00";

  const mins = Math.floor(num / 60);
  const secs = Math.floor(num % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Calcula o início e o fim da janela do clipe de vídeo para um lance específico
 */
export function calculateClipWindow(shot: Shot, config: VideoConfig): ClipWindow {
  const shotSeconds = timeStringToSeconds(shot.game_time);
  
  // Define se aplica o offset do 1º ou do 2º tempo
  const isSecondHalf = shot.period === "2º Tempo";
  const offset = isSecondHalf ? (config?.offset2TSeconds || 0) : (config?.offset1TSeconds || 0);

  // Se o lance possui o timestamp exato em segundos do vídeo, usa ele diretamente!
  const rawTimestamp = shot.video_timestamp_seconds;
  const validTimestamp = (typeof rawTimestamp === "number" && !isNaN(rawTimestamp) && isFinite(rawTimestamp) && rawTimestamp >= 0)
    ? rawTimestamp
    : null;

  const eventTimeInVideo = validTimestamp !== null
    ? validTimestamp
    : (shotSeconds + offset);

  const preRoll = typeof config?.preRollSeconds === "number" && !isNaN(config.preRollSeconds) ? config.preRollSeconds : 5;
  const postRoll = typeof config?.postRollSeconds === "number" && !isNaN(config.postRollSeconds) ? config.postRollSeconds : 3;

  const videoStartTime = Math.max(0, eventTimeInVideo - preRoll);
  const videoEndTime = Math.max(videoStartTime, eventTimeInVideo + postRoll + 5);

  return {
    shot,
    start: videoStartTime,
    end: videoEndTime,
    videoStartTime,
    videoEndTime,
    eventTimeInVideo,
  };
}
