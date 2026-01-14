export interface QuotaStatus {
  date: string;
  consumedUnits: number;
  dailyLimit: number;
  remainingUnits: number;
  percentUsed: number;
}

export interface QuotaCost {
  endpoint: string;
  cost: number;
}

export interface QuotaHistoryItem {
  date: string;
  consumedUnits: number;
  dailyLimit: number;
}

// Custos por endpoint da API do YouTube
export const QUOTA_COSTS: Record<string, number> = {
  "playlists.list": 1,
  "playlistItems.list": 1,
  "playlistItems.insert": 50,
  "playlistItems.delete": 50,
  "videos.list": 1,
  "channels.list": 1,
  "subscriptions.list": 1,
  "search.list": 100,
};

export const DAILY_QUOTA_LIMIT = 10000;

// Lista de operações e custos para exibição
export const QUOTA_OPERATIONS: QuotaCost[] = [
  { endpoint: "Listar playlists", cost: 1 },
  { endpoint: "Listar vídeos da playlist", cost: 1 },
  { endpoint: "Adicionar vídeo à playlist", cost: 50 },
  { endpoint: "Remover vídeo da playlist", cost: 50 },
  { endpoint: "Buscar detalhes de vídeos", cost: 1 },
  { endpoint: "Listar canais", cost: 1 },
  { endpoint: "Listar inscrições", cost: 1 },
  { endpoint: "Buscar vídeos de canal", cost: 100 },
];
