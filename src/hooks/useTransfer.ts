"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface TransferRequest {
  sourcePlaylistId: string;
  destinationPlaylistId: string;
  videos: Array<{
    playlistItemId: string;
    videoId: string;
  }>;
}

interface TransferResponse {
  success: boolean;
  transferred: number;
  errors: number;
  details: Array<{
    videoId: string;
    status: "success" | "error";
    error?: string;
  }>;
}

async function transferVideos(data: TransferRequest): Promise<TransferResponse> {
  const res = await fetch("/api/playlists/transfer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Erro ao transferir vídeos");
  }

  return res.json();
}

export function useTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transferVideos,
    onSuccess: (_, variables) => {
      // Invalidar cache das playlists afetadas
      queryClient.invalidateQueries({
        queryKey: ["playlistItems", variables.sourcePlaylistId],
      });
      queryClient.invalidateQueries({
        queryKey: ["playlistItems", variables.destinationPlaylistId],
      });
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      queryClient.invalidateQueries({ queryKey: ["quota"] });
    },
  });
}

interface AssignRequest {
  playlistId: string;
  videoIds: string[];
}

interface AssignResponse {
  success: boolean;
  added: number;
  errors: number;
  details: Array<{
    videoId: string;
    status: "success" | "error";
    error?: string;
  }>;
}

async function assignVideos(data: AssignRequest): Promise<AssignResponse> {
  const res = await fetch("/api/channels/assign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Erro ao atribuir vídeos");
  }

  return res.json();
}

export function useAssign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignVideos,
    onSuccess: (_, variables) => {
      // Invalidar cache da playlist afetada
      queryClient.invalidateQueries({
        queryKey: ["playlistItems", variables.playlistId],
      });
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      queryClient.invalidateQueries({ queryKey: ["quota"] });
    },
  });
}
