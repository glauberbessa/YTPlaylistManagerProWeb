"use client";

import { useQuery } from "@tanstack/react-query";
import { Video } from "@/types";

async function fetchChannelVideos(channelId: string): Promise<Video[]> {
  const res = await fetch(`/api/channels/${channelId}/videos`);
  if (!res.ok) throw new Error("Erro ao buscar vídeos");
  return res.json();
}

export function useChannelVideos(channelId: string | null) {
  return useQuery({
    queryKey: ["channelVideos", channelId],
    queryFn: () => fetchChannelVideos(channelId!),
    enabled: !!channelId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
