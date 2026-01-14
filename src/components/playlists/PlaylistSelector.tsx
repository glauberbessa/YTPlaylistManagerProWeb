"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PlaylistWithConfig } from "@/types/playlist";
import { UI_TEXT } from "@/lib/i18n";
import { formatNumber } from "@/lib/utils";

interface PlaylistSelectorProps {
  value: string | null;
  onChange: (value: string) => void;
  label: string;
  excludeId?: string;
  showOnlyEnabled?: boolean;
}

async function fetchPlaylists(): Promise<PlaylistWithConfig[]> {
  const res = await fetch("/api/playlists");
  if (!res.ok) throw new Error("Erro ao buscar playlists");
  return res.json();
}

export function PlaylistSelector({
  value,
  onChange,
  label,
  excludeId,
  showOnlyEnabled = false,
}: PlaylistSelectorProps) {
  const { data: playlists, isLoading } = useQuery({
    queryKey: ["playlists"],
    queryFn: fetchPlaylists,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const filteredPlaylists = playlists?.filter((p) => {
    if (excludeId && p.id === excludeId) return false;
    if (showOnlyEnabled && p.config?.isEnabled === false) return false;
    return true;
  });

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={UI_TEXT.playlists.selectPlaylist} />
        </SelectTrigger>
        <SelectContent>
          {filteredPlaylists?.map((playlist) => (
            <SelectItem key={playlist.id} value={playlist.id}>
              <div className="flex items-center justify-between gap-4">
                <span className="truncate">{playlist.title}</span>
                <span className="text-xs text-muted-foreground">
                  {formatNumber(playlist.itemCount)} vídeos
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
