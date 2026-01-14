export interface VideoFilter {
  // Filtro de texto
  searchText: string;
  searchInTitle: boolean;
  searchInDescription: boolean;
  searchInChannel: boolean;

  // Filtro de idioma
  selectedLanguage: string;

  // Filtro de duração (em segundos)
  minDuration: number;
  maxDuration: number;

  // Filtro de visualizações
  minViewCount: number;
  maxViewCount: number;
}

export type DurationPreset = "all" | "shorts" | "short" | "medium" | "long";
export type ViewCountPreset = "all" | "low" | "medium" | "high" | "viral";

export interface DurationPresetConfig {
  min: number;
  max: number;
  label: string;
}

export interface ViewCountPresetConfig {
  min: number;
  max: number;
  label: string;
}

// Presets de duração
export const DURATION_PRESETS: Record<DurationPreset, DurationPresetConfig> = {
  all: { min: 0, max: Infinity, label: "Todos" },
  shorts: { min: 0, max: 60, label: "Shorts (<1min)" },
  short: { min: 60, max: 300, label: "Curtos (1-5min)" },
  medium: { min: 300, max: 1200, label: "Médios (5-20min)" },
  long: { min: 1200, max: Infinity, label: "Longos (>20min)" },
};

// Presets de visualizações
export const VIEW_COUNT_PRESETS: Record<ViewCountPreset, ViewCountPresetConfig> = {
  all: { min: 0, max: Infinity, label: "Todas" },
  low: { min: 0, max: 1000, label: "Baixas (<1K)" },
  medium: { min: 1000, max: 10000, label: "Médias (1K-10K)" },
  high: { min: 10000, max: 100000, label: "Altas (10K-100K)" },
  viral: { min: 100000, max: Infinity, label: "Virais (>100K)" },
};

export const DEFAULT_FILTER: VideoFilter = {
  searchText: "",
  searchInTitle: true,
  searchInDescription: true,
  searchInChannel: true,
  selectedLanguage: "all",
  minDuration: 0,
  maxDuration: Infinity,
  minViewCount: 0,
  maxViewCount: Infinity,
};
