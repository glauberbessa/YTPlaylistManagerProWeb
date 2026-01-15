import { google, youtube_v3 } from "googleapis";
import { trackQuotaUsage } from "./quota";
import { Playlist, Channel, Video } from "@/types";
import { parseDuration } from "./utils";

export class YouTubeService {
  private youtube: youtube_v3.Youtube;
  private userId: string;

  constructor(accessToken: string, userId: string) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    this.youtube = google.youtube({ version: "v3", auth: oauth2Client });
    this.userId = userId;
  }

  // Listar playlists do usuário
  async getPlaylists(): Promise<Playlist[]> {
    const playlists: Playlist[] = [];
    let pageToken: string | undefined;

    do {
      const response = await this.youtube.playlists.list({
        part: ["snippet", "contentDetails"],
        mine: true,
        maxResults: 50,
        pageToken,
      });

      await trackQuotaUsage(this.userId, "playlists.list");

      for (const item of response.data.items || []) {
        playlists.push({
          id: item.id!,
          title: item.snippet?.title || "",
          description: item.snippet?.description || "",
          itemCount: item.contentDetails?.itemCount || 0,
          createdDate: item.snippet?.publishedAt || "",
          thumbnailUrl: item.snippet?.thumbnails?.medium?.url ?? undefined,
        });
      }

      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);

    return playlists;
  }

  // Listar vídeos de uma playlist
  async getPlaylistItems(playlistId: string): Promise<Video[]> {
    const items: Video[] = [];
    const videoIds: string[] = [];
    let pageToken: string | undefined;

    // 1. Buscar IDs dos vídeos
    do {
      const response = await this.youtube.playlistItems.list({
        part: ["snippet", "contentDetails"],
        playlistId,
        maxResults: 50,
        pageToken,
      });

      await trackQuotaUsage(this.userId, "playlistItems.list");

      for (const item of response.data.items || []) {
        const videoId = item.contentDetails?.videoId || "";
        if (videoId) {
          items.push({
            id: item.id!,
            videoId,
            title: item.snippet?.title || "",
            description: item.snippet?.description || undefined,
            channelId: item.snippet?.videoOwnerChannelId || undefined,
            channelTitle: item.snippet?.videoOwnerChannelTitle || "",
            thumbnailUrl: item.snippet?.thumbnails?.medium?.url || "",
            addedToPlaylistAt: item.snippet?.publishedAt || undefined,
            duration: "",
            durationInSeconds: 0,
            viewCount: 0,
            language: "",
            publishedAt: "",
            isSelected: false,
          });
          videoIds.push(videoId);
        }
      }

      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);

    // 2. Buscar metadados completos em batches de 50
    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = videoIds.slice(i, i + 50);
      try {
        const response = await this.youtube.videos.list({
          part: ["snippet", "contentDetails", "statistics"],
          id: batch,
        });

        await trackQuotaUsage(this.userId, "videos.list");

        for (const video of response.data.items || []) {
          const item = items.find((i) => i.videoId === video.id);
          if (item) {
            item.duration = video.contentDetails?.duration || "";
            item.durationInSeconds = parseDuration(
              video.contentDetails?.duration || ""
            );
            item.viewCount = parseInt(video.statistics?.viewCount || "0");
            item.language = video.snippet?.defaultAudioLanguage || "";
            item.publishedAt = video.snippet?.publishedAt || "";
          }
        }
      } catch (error) {
        console.error("Erro ao buscar detalhes dos vídeos:", error);
      }
    }

    return items;
  }

  // Adicionar vídeo a uma playlist
  async addVideoToPlaylist(
    playlistId: string,
    videoId: string
  ): Promise<boolean> {
    try {
      await this.youtube.playlistItems.insert({
        part: ["snippet"],
        requestBody: {
          snippet: {
            playlistId,
            resourceId: {
              kind: "youtube#video",
              videoId,
            },
          },
        },
      });

      await trackQuotaUsage(this.userId, "playlistItems.insert");
      return true;
    } catch (error) {
      console.error("Erro ao adicionar vídeo:", error);
      return false;
    }
  }

  // Remover vídeo de uma playlist
  async removeVideoFromPlaylist(playlistItemId: string): Promise<boolean> {
    try {
      await this.youtube.playlistItems.delete({
        id: playlistItemId,
      });

      await trackQuotaUsage(this.userId, "playlistItems.delete");
      return true;
    } catch (error) {
      console.error("Erro ao remover vídeo:", error);
      return false;
    }
  }

  // Transferir vídeos entre playlists
  async transferVideos(
    sourcePlaylistId: string,
    destinationPlaylistId: string,
    videos: Array<{ playlistItemId: string; videoId: string }>
  ): Promise<{
    success: boolean;
    transferred: number;
    errors: number;
    details: Array<{
      videoId: string;
      status: "success" | "error";
      error?: string;
    }>;
  }> {
    const details: Array<{
      videoId: string;
      status: "success" | "error";
      error?: string;
    }> = [];
    let transferred = 0;
    let errors = 0;

    for (const video of videos) {
      try {
        // 1. Adicionar ao destino
        const addSuccess = await this.addVideoToPlaylist(
          destinationPlaylistId,
          video.videoId
        );

        if (addSuccess) {
          // 2. Remover da origem
          const removeSuccess = await this.removeVideoFromPlaylist(
            video.playlistItemId
          );

          if (removeSuccess) {
            transferred++;
            details.push({ videoId: video.videoId, status: "success" });
          } else {
            errors++;
            details.push({
              videoId: video.videoId,
              status: "error",
              error: "Erro ao remover da playlist de origem",
            });
          }
        } else {
          errors++;
          details.push({
            videoId: video.videoId,
            status: "error",
            error: "Erro ao adicionar à playlist de destino",
          });
        }
      } catch (error) {
        errors++;
        details.push({
          videoId: video.videoId,
          status: "error",
          error: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    }

    return {
      success: errors === 0,
      transferred,
      errors,
      details,
    };
  }

  // Listar canais inscritos
  async getSubscribedChannels(): Promise<Channel[]> {
    const channels: Channel[] = [];
    const channelIds: string[] = [];
    let pageToken: string | undefined;

    // 1. Buscar inscrições
    do {
      const response = await this.youtube.subscriptions.list({
        part: ["snippet"],
        mine: true,
        maxResults: 50,
        pageToken,
      });

      await trackQuotaUsage(this.userId, "subscriptions.list");

      for (const item of response.data.items || []) {
        const channelId = item.snippet?.resourceId?.channelId || "";
        if (channelId) {
          channelIds.push(channelId);
          channels.push({
            id: channelId,
            title: item.snippet?.title || "",
            description: item.snippet?.description || "",
            thumbnailUrl: item.snippet?.thumbnails?.medium?.url || "",
            subscriberCount: 0,
            videoCount: 0,
            subscribedAt: item.snippet?.publishedAt || undefined,
          });
        }
      }

      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);

    // 2. Buscar detalhes dos canais em batches de 50
    for (let i = 0; i < channelIds.length; i += 50) {
      const batch = channelIds.slice(i, i + 50);
      try {
        const response = await this.youtube.channels.list({
          part: ["statistics"],
          id: batch,
        });

        await trackQuotaUsage(this.userId, "channels.list");

        for (const channel of response.data.items || []) {
          const item = channels.find((c) => c.id === channel.id);
          if (item) {
            item.subscriberCount = parseInt(
              channel.statistics?.subscriberCount || "0"
            );
            item.videoCount = parseInt(channel.statistics?.videoCount || "0");
          }
        }
      } catch (error) {
        console.error("Erro ao buscar detalhes dos canais:", error);
      }
    }

    return channels;
  }

  // Buscar vídeos de um canal (CARO: 100 unidades!)
  async getChannelVideos(channelId: string): Promise<Video[]> {
    const response = await this.youtube.search.list({
      part: ["snippet"],
      channelId,
      type: ["video"],
      maxResults: 50,
      order: "date",
    });

    await trackQuotaUsage(this.userId, "search.list");

    const videoIds =
      response.data.items?.map((i) => i.id?.videoId || "").filter(Boolean) ||
      [];
    const videos: Video[] = [];

    // Buscar metadados completos
    if (videoIds.length > 0) {
      const detailsResponse = await this.youtube.videos.list({
        part: ["snippet", "contentDetails", "statistics"],
        id: videoIds,
      });

      await trackQuotaUsage(this.userId, "videos.list");

      for (const video of detailsResponse.data.items || []) {
        videos.push({
          id: "", // Não há playlistItemId aqui
          videoId: video.id!,
          title: video.snippet?.title || "",
          description: video.snippet?.description || undefined,
          channelId: video.snippet?.channelId || undefined,
          channelTitle: video.snippet?.channelTitle || "",
          duration: video.contentDetails?.duration || "",
          durationInSeconds: parseDuration(
            video.contentDetails?.duration || ""
          ),
          viewCount: parseInt(video.statistics?.viewCount || "0"),
          language: video.snippet?.defaultAudioLanguage || "",
          publishedAt: video.snippet?.publishedAt || "",
          thumbnailUrl: video.snippet?.thumbnails?.medium?.url || "",
          isSelected: false,
        });
      }
    }

    return videos;
  }

  // Atribuir vídeos a uma playlist (apenas adiciona, não remove)
  async assignVideosToPlaylist(
    playlistId: string,
    videoIds: string[]
  ): Promise<{
    success: boolean;
    added: number;
    errors: number;
    details: Array<{
      videoId: string;
      status: "success" | "error";
      error?: string;
    }>;
  }> {
    const details: Array<{
      videoId: string;
      status: "success" | "error";
      error?: string;
    }> = [];
    let added = 0;
    let errors = 0;

    for (const videoId of videoIds) {
      try {
        const success = await this.addVideoToPlaylist(playlistId, videoId);

        if (success) {
          added++;
          details.push({ videoId, status: "success" });
        } else {
          errors++;
          details.push({
            videoId,
            status: "error",
            error: "Erro ao adicionar à playlist",
          });
        }
      } catch (error) {
        errors++;
        details.push({
          videoId,
          status: "error",
          error: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    }

    return {
      success: errors === 0,
      added,
      errors,
      details,
    };
  }
}
