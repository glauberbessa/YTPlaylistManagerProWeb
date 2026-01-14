export interface Playlist {
  id: string;
  title: string;
  description: string;
  itemCount: number;
  createdDate: string;
  thumbnailUrl?: string;
}

export interface PlaylistConfig {
  id: string;
  playlistId: string;
  title: string;
  isEnabled: boolean;
  videoCount: number;
  totalDurationSeconds: number;
}

export interface PlaylistWithConfig extends Playlist {
  config?: PlaylistConfig;
}
