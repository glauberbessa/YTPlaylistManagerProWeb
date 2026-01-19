"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { PlaylistWithConfig } from "@/types/playlist";
import { UI_TEXT } from "@/lib/i18n";
import { formatNumber, formatDuration } from "@/lib/utils";
import { Settings } from "lucide-react";

async function fetchPlaylists(): Promise<PlaylistWithConfig[]> {
  const res = await fetch("/api/playlists", { credentials: "include" });
  if (!res.ok) throw new Error("Erro ao buscar playlists");
  return res.json();
}

async function savePlaylistConfigs(
  configs: Array<{ playlistId: string; title: string; isEnabled: boolean }>
) {
  const res = await fetch("/api/config/playlists", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(configs),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Erro ao salvar configurações");
  return res.json();
}

export default function ConfigPlaylistsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({});
  const [showOnlyEnabled, setShowOnlyEnabled] = useState(false);

  const { data: playlists, isLoading } = useQuery({
    queryKey: ["playlists"],
    queryFn: fetchPlaylists,
  });

  const saveMutation = useMutation({
    mutationFn: savePlaylistConfigs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      toast({
        title: UI_TEXT.config.saved,
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: UI_TEXT.general.error,
        description: "Erro ao salvar configurações",
        variant: "destructive",
      });
    },
  });

  // Inicializar estado quando playlists carregam
  useEffect(() => {
    if (playlists) {
      const map: Record<string, boolean> = {};
      playlists.forEach((p) => {
        map[p.id] = p.config?.isEnabled ?? true;
      });
      setEnabledMap(map);
    }
  }, [playlists]);

  const handleSave = (nextMap: Record<string, boolean>) => {
    if (!playlists) return;

    const configs = playlists.map((p) => ({
      playlistId: p.id,
      title: p.title,
      isEnabled: nextMap[p.id] ?? true,
    }));

    saveMutation.mutate(configs);
  };

  const handleEnableAll = () => {
    if (!playlists) return;
    const confirmed = window.confirm(
      "Tem certeza que deseja ativar todas as playlists?"
    );
    if (!confirmed) return;
    const map: Record<string, boolean> = {};
    playlists.forEach((p) => {
      map[p.id] = true;
    });
    setEnabledMap(map);
    handleSave(map);
  };

  const handleDisableAll = () => {
    if (!playlists) return;
    const confirmed = window.confirm(
      "Tem certeza que deseja desativar todas as playlists?"
    );
    if (!confirmed) return;
    const map: Record<string, boolean> = {};
    playlists.forEach((p) => {
      map[p.id] = false;
    });
    setEnabledMap(map);
    handleSave(map);
  };

  const handleToggle = (playlistId: string, enabled: boolean) => {
    setEnabledMap((prev) => {
      const nextMap = { ...prev, [playlistId]: enabled };
      handleSave(nextMap);
      return nextMap;
    });
  };

  const filteredPlaylists = playlists?.filter((p) => {
    if (showOnlyEnabled) {
      return enabledMap[p.id] ?? true;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{UI_TEXT.config.playlistsTitle}</h1>
          <p className="text-muted-foreground">{UI_TEXT.config.playlistsSubtitle}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 mr-4 border-r pr-4">
          <Switch
            checked={showOnlyEnabled}
            onCheckedChange={setShowOnlyEnabled}
            id="show-active"
          />
          <label htmlFor="show-active" className="text-sm font-medium cursor-pointer">
            {UI_TEXT.config.showOnlyActive}
          </label>
        </div>
        <Button variant="outline" onClick={handleEnableAll}>
          {UI_TEXT.config.enableAll}
        </Button>
        <Button variant="outline" onClick={handleDisableAll}>
          {UI_TEXT.config.disableAll}
        </Button>
      </div>

      {/* Playlists List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPlaylists?.map((playlist) => (
            <Card key={playlist.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{playlist.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatNumber(playlist.itemCount)} {UI_TEXT.config.videos}
                    {playlist.config?.totalDurationSeconds && (
                      <> • {formatDuration(playlist.config.totalDurationSeconds)}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {enabledMap[playlist.id]
                      ? UI_TEXT.config.enabled
                      : UI_TEXT.config.disabled}
                  </span>
                  <Switch
                    checked={enabledMap[playlist.id] ?? true}
                    onCheckedChange={(checked) =>
                      handleToggle(playlist.id, checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
