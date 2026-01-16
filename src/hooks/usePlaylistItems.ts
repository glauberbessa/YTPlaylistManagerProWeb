"use client";

import { useQuery } from "@tanstack/react-query";
import { Video } from "@/types";

async function fetchPlaylistItems(playlistId: string): Promise<Video[]> {
  const res = await fetch(`/api/playlists/${playlistId}/items`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Erro ao buscar vídeos");
  return res.json();
}

export function usePlaylistItems(playlistId: string | null) {
  return useQuery({
    queryKey: ["playlistItems", playlistId],
    queryFn: () => fetchPlaylistItems(playlistId!),
    enabled: !!playlistId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
