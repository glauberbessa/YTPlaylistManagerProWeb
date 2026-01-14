export interface Video {
  id: string; // playlistItemId (para remoção)
  videoId: string; // ID do vídeo no YouTube
  title: string;
  description?: string;
  channelId?: string;
  channelTitle: string;
  duration: string; // ISO 8601: "PT1H2M3S"
  durationInSeconds: number;
  viewCount: number;
  likeCount?: number;
  commentCount?: number;
  language: string;
  publishedAt: string;
  addedToPlaylistAt?: string;
  thumbnailUrl: string;
  isSelected: boolean;
}

export interface VideoSelection {
  playlistItemId: string;
  videoId: string;
}
