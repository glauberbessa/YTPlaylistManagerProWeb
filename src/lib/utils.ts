import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatar duração: 3661 → "01:01:01"
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// Formatar visualizações: 1234567 → "1.2M"
export function formatViewCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}

// Formatar data: ISO → "dd/MM/yyyy"
export function formatDate(isoString: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleDateString("pt-BR");
}

// Mapear código de idioma
export function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    pt: "Português",
    "pt-BR": "Português (Brasil)",
    "pt-PT": "Português (Portugal)",
    en: "Inglês",
    "en-US": "Inglês (EUA)",
    "en-GB": "Inglês (Reino Unido)",
    es: "Espanhol",
    "es-ES": "Espanhol (Espanha)",
    "es-MX": "Espanhol (México)",
    fr: "Francês",
    de: "Alemão",
    it: "Italiano",
    ja: "Japonês",
    ko: "Coreano",
    zh: "Chinês",
    "zh-CN": "Chinês (Simplificado)",
    "zh-TW": "Chinês (Tradicional)",
    ru: "Russo",
    ar: "Árabe",
    hi: "Hindi",
    nl: "Holandês",
    pl: "Polonês",
    tr: "Turco",
    vi: "Vietnamita",
    th: "Tailandês",
    id: "Indonésio",
    ms: "Malaio",
    fil: "Filipino",
    uk: "Ucraniano",
    cs: "Tcheco",
    sv: "Sueco",
    da: "Dinamarquês",
    fi: "Finlandês",
    no: "Norueguês",
    el: "Grego",
    he: "Hebraico",
    ro: "Romeno",
    hu: "Húngaro",
    sk: "Eslovaco",
    bg: "Búlgaro",
    hr: "Croata",
    sr: "Sérvio",
    sl: "Esloveno",
    lt: "Lituano",
    lv: "Letão",
    et: "Estoniano",
  };
  return languages[code] || code || "Desconhecido";
}

// Parser de duração ISO 8601 → segundos
export function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");

  return hours * 3600 + minutes * 60 + seconds;
}

// Formatar número grande
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("pt-BR").format(num);
}
