import { google, youtube_v3 } from "googleapis";
import { trackQuotaUsage } from "./quota";
import { Playlist, Channel, Video } from "@/types";
import { parseDuration } from "./utils";
import { logger } from "./logger";

export class YouTubeService {
  private youtube: youtube_v3.Youtube;
  private userId: string;
  private accessTokenPreview: string;

  constructor(accessToken: string, userId: string) {
    logger.info("YOUTUBE_API", "YouTubeService instantiated", {
      userId,
      accessTokenLength: accessToken.length,
      accessTokenPreview: `${accessToken.substring(0, 20)}...`,
    });

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    this.youtube = google.youtube({ version: "v3", auth: oauth2Client });
    this.userId = userId;
    this.accessTokenPreview = `${accessToken.substring(0, 20)}...`;
  }

  // Listar playlists do usuário
  async getPlaylists(): Promise<Playlist[]> {
    logger.info("YOUTUBE_API", "getPlaylists called", {
      userId: this.userId,
    });

    const playlists: Playlist[] = [];
    let pageToken: string | undefined;
    let pageCount = 0;

    try {
      do {
        pageCount++;
        const startTime = Date.now();

        logger.info("YOUTUBE_API", `Fetching playlists page ${pageCount}`, {
          pageToken: pageToken || "initial",
        });

        const response = await this.youtube.playlists.list({
          part: ["snippet", "contentDetails"],
          mine: true,
          maxResults: 50,
          pageToken,
        });

        const elapsed = Date.now() - startTime;

        await trackQuotaUsage(this.userId, "playlists.list");

        logger.youtubeApi(`playlists.list page ${pageCount}`, true, {
          elapsed: `${elapsed}ms`,
          itemsCount: response.data.items?.length || 0,
          hasNextPage: !!response.data.nextPageToken,
          totalResults: response.data.pageInfo?.totalResults,
        });

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

      logger.youtubeApi("getPlaylists completed", true, {
        totalPlaylists: playlists.length,
        pagesLoaded: pageCount,
      });

      return playlists;
    } catch (error) {
      logger.youtubeApi(
        "getPlaylists failed",
        false,
        {
          userId: this.userId,
          pagesLoadedBeforeError: pageCount,
          playlistsLoadedBeforeError: playlists.length,
          errorCode: (error as { code?: number })?.code,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  // Listar vídeos de uma playlist
  async getPlaylistItems(playlistId: string): Promise<Video[]> {
    logger.info("YOUTUBE_API", "getPlaylistItems called", {
      playlistId,
      userId: this.userId,
    });

    const items: Video[] = [];
    const videoIds: string[] = [];
    let pageToken: string | undefined;
    let pageCount = 0;

    try {
      // 1. Buscar IDs dos vídeos
      do {
        pageCount++;
        const startTime = Date.now();

        const response = await this.youtube.playlistItems.list({
          part: ["snippet", "contentDetails"],
          playlistId,
          maxResults: 50,
          pageToken,
        });

        const elapsed = Date.now() - startTime;
        await trackQuotaUsage(this.userId, "playlistItems.list");

        logger.youtubeApi(`playlistItems.list page ${pageCount}`, true, {
          playlistId,
          elapsed: `${elapsed}ms`,
          itemsCount: response.data.items?.length || 0,
          hasNextPage: !!response.data.nextPageToken,
        });

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

      logger.info("YOUTUBE_API", "Playlist items fetched, now fetching video details", {
        playlistId,
        totalItems: items.length,
        pagesLoaded: pageCount,
      });

      // 2. Buscar metadados completos em batches de 50
      const totalBatches = Math.ceil(videoIds.length / 50);
      for (let i = 0; i < videoIds.length; i += 50) {
        const batchNum = Math.floor(i / 50) + 1;
        const batch = videoIds.slice(i, i + 50);
        const startTime = Date.now();

        try {
          const response = await this.youtube.videos.list({
            part: ["snippet", "contentDetails", "statistics"],
            id: batch,
          });

          const elapsed = Date.now() - startTime;
          await trackQuotaUsage(this.userId, "videos.list");

          logger.youtubeApi(`videos.list batch ${batchNum}/${totalBatches}`, true, {
            elapsed: `${elapsed}ms`,
            batchSize: batch.length,
            returnedCount: response.data.items?.length || 0,
          });

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
          logger.youtubeApi(
            `videos.list batch ${batchNum}/${totalBatches} failed`,
            false,
            { batchSize: batch.length },
            error instanceof Error ? error : undefined
          );
        }
      }

      logger.youtubeApi("getPlaylistItems completed", true, {
        playlistId,
        totalItems: items.length,
      });

      return items;
    } catch (error) {
      logger.youtubeApi(
        "getPlaylistItems failed",
        false,
        {
          playlistId,
          pagesLoadedBeforeError: pageCount,
          itemsLoadedBeforeError: items.length,
        },
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  // Adicionar vídeo a uma playlist
  async addVideoToPlaylist(
    playlistId: string,
    videoId: string
  ): Promise<{ success: boolean; error?: string }> {
    logger.info("YOUTUBE_API", "addVideoToPlaylist called", {
      playlistId,
      videoId,
      userId: this.userId,
    });

    try {
      const startTime = Date.now();

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

      const elapsed = Date.now() - startTime;
      await trackQuotaUsage(this.userId, "playlistItems.insert");

      logger.youtubeApi("playlistItems.insert", true, {
        playlistId,
        videoId,
        elapsed: `${elapsed}ms`,
      });

      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      const isDuplicate =
        errorMessage.includes("videoAlreadyInPlaylist") ||
        errorMessage.includes("duplicate");

      logger.youtubeApi(
        "playlistItems.insert",
        false,
        {
          playlistId,
          videoId,
          isDuplicate,
          errorMessage,
        },
        error instanceof Error ? error : undefined
      );

      if (isDuplicate) {
        return { success: false, error: "Vídeo já existe na playlist de destino" };
      }
      return { success: false, error: errorMessage };
    }
  }

  // Remover vídeo de uma playlist
  async removeVideoFromPlaylist(
    playlistItemId: string
  ): Promise<{ success: boolean; error?: string }> {
    logger.info("YOUTUBE_API", "removeVideoFromPlaylist called", {
      playlistItemId,
      userId: this.userId,
    });

    try {
      const startTime = Date.now();

      await this.youtube.playlistItems.delete({
        id: playlistItemId,
      });

      const elapsed = Date.now() - startTime;
      await trackQuotaUsage(this.userId, "playlistItems.delete");

      logger.youtubeApi("playlistItems.delete", true, {
        playlistItemId,
        elapsed: `${elapsed}ms`,
      });

      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

      logger.youtubeApi(
        "playlistItems.delete",
        false,
        { playlistItemId, errorMessage },
        error instanceof Error ? error : undefined
      );

      return { success: false, error: errorMessage };
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
    logger.info("YOUTUBE_API", "transferVideos called", {
      sourcePlaylistId,
      destinationPlaylistId,
      videosCount: videos.length,
      userId: this.userId,
    });

    const details: Array<{
      videoId: string;
      status: "success" | "error";
      error?: string;
    }> = [];
    let transferred = 0;
    let errors = 0;

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      logger.debug("YOUTUBE_API", `Transferring video ${i + 1}/${videos.length}`, {
        videoId: video.videoId,
        playlistItemId: video.playlistItemId,
      });

      try {
        // 1. Adicionar ao destino
        const addResult = await this.addVideoToPlaylist(
          destinationPlaylistId,
          video.videoId
        );

        if (addResult.success) {
          // 2. Remover da origem
          const removeResult = await this.removeVideoFromPlaylist(
            video.playlistItemId
          );

          if (removeResult.success) {
            transferred++;
            details.push({ videoId: video.videoId, status: "success" });
          } else {
            errors++;
            details.push({
              videoId: video.videoId,
              status: "error",
              error: removeResult.error || "Erro ao remover da playlist de origem",
            });
          }
        } else {
          errors++;
          details.push({
            videoId: video.videoId,
            status: "error",
            error: addResult.error || "Erro ao adicionar à playlist de destino",
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

    logger.youtubeApi("transferVideos completed", errors === 0, {
      sourcePlaylistId,
      destinationPlaylistId,
      totalVideos: videos.length,
      transferred,
      errors,
    });

    return {
      success: errors === 0,
      transferred,
      errors,
      details,
    };
  }

  // Listar canais inscritos
  async getSubscribedChannels(): Promise<Channel[]> {
    logger.info("YOUTUBE_API", "getSubscribedChannels called", {
      userId: this.userId,
    });

    const channels: Channel[] = [];
    const channelIds: string[] = [];
    let pageToken: string | undefined;
    let pageCount = 0;

    try {
      // 1. Buscar inscrições
      do {
        pageCount++;
        const startTime = Date.now();

        const response = await this.youtube.subscriptions.list({
          part: ["snippet"],
          mine: true,
          maxResults: 50,
          pageToken,
        });

        const elapsed = Date.now() - startTime;
        await trackQuotaUsage(this.userId, "subscriptions.list");

        logger.youtubeApi(`subscriptions.list page ${pageCount}`, true, {
          elapsed: `${elapsed}ms`,
          itemsCount: response.data.items?.length || 0,
          hasNextPage: !!response.data.nextPageToken,
        });

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
      const totalBatches = Math.ceil(channelIds.length / 50);
      for (let i = 0; i < channelIds.length; i += 50) {
        const batchNum = Math.floor(i / 50) + 1;
        const batch = channelIds.slice(i, i + 50);
        const startTime = Date.now();

        try {
          const response = await this.youtube.channels.list({
            part: ["statistics"],
            id: batch,
          });

          const elapsed = Date.now() - startTime;
          await trackQuotaUsage(this.userId, "channels.list");

          logger.youtubeApi(`channels.list batch ${batchNum}/${totalBatches}`, true, {
            elapsed: `${elapsed}ms`,
            batchSize: batch.length,
            returnedCount: response.data.items?.length || 0,
          });

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
          logger.youtubeApi(
            `channels.list batch ${batchNum}/${totalBatches} failed`,
            false,
            { batchSize: batch.length },
            error instanceof Error ? error : undefined
          );
        }
      }

      logger.youtubeApi("getSubscribedChannels completed", true, {
        totalChannels: channels.length,
        pagesLoaded: pageCount,
      });

      return channels;
    } catch (error) {
      logger.youtubeApi(
        "getSubscribedChannels failed",
        false,
        { pagesLoadedBeforeError: pageCount, channelsLoadedBeforeError: channels.length },
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  // Buscar vídeos de um canal (CARO: 100 unidades!)
  async getChannelVideos(channelId: string): Promise<Video[]> {
    logger.info("YOUTUBE_API", "getChannelVideos called (expensive: 100 units)", {
      channelId,
      userId: this.userId,
    });

    try {
      const searchStartTime = Date.now();

      const response = await this.youtube.search.list({
        part: ["snippet"],
        channelId,
        type: ["video"],
        maxResults: 50,
        order: "date",
      });

      const searchElapsed = Date.now() - searchStartTime;
      await trackQuotaUsage(this.userId, "search.list");

      logger.youtubeApi("search.list (channel videos)", true, {
        channelId,
        elapsed: `${searchElapsed}ms`,
        itemsCount: response.data.items?.length || 0,
      });

      const videoIds =
        response.data.items?.map((i) => i.id?.videoId || "").filter(Boolean) ||
        [];
      const videos: Video[] = [];

      // Buscar metadados completos
      if (videoIds.length > 0) {
        const detailsStartTime = Date.now();

        const detailsResponse = await this.youtube.videos.list({
          part: ["snippet", "contentDetails", "statistics"],
          id: videoIds,
        });

        const detailsElapsed = Date.now() - detailsStartTime;
        await trackQuotaUsage(this.userId, "videos.list");

        logger.youtubeApi("videos.list (channel video details)", true, {
          elapsed: `${detailsElapsed}ms`,
          videoIdsCount: videoIds.length,
          returnedCount: detailsResponse.data.items?.length || 0,
        });

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

      logger.youtubeApi("getChannelVideos completed", true, {
        channelId,
        totalVideos: videos.length,
      });

      return videos;
    } catch (error) {
      logger.youtubeApi(
        "getChannelVideos failed",
        false,
        { channelId },
        error instanceof Error ? error : undefined
      );
      throw error;
    }
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
    logger.info("YOUTUBE_API", "assignVideosToPlaylist called", {
      playlistId,
      videosCount: videoIds.length,
      userId: this.userId,
    });

    const details: Array<{
      videoId: string;
      status: "success" | "error";
      error?: string;
    }> = [];
    let added = 0;
    let errors = 0;

    for (let i = 0; i < videoIds.length; i++) {
      const videoId = videoIds[i];
      logger.debug("YOUTUBE_API", `Assigning video ${i + 1}/${videoIds.length}`, {
        videoId,
        playlistId,
      });

      try {
        const result = await this.addVideoToPlaylist(playlistId, videoId);

        if (result.success) {
          added++;
          details.push({ videoId, status: "success" });
        } else {
          errors++;
          details.push({
            videoId,
            status: "error",
            error: result.error || "Erro ao adicionar à playlist",
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

    logger.youtubeApi("assignVideosToPlaylist completed", errors === 0, {
      playlistId,
      totalVideos: videoIds.length,
      added,
      errors,
    });

    return {
      success: errors === 0,
      added,
      errors,
      details,
    };
  }
}
