"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChannelSelector, AssignDialog } from "@/components/channels";
import { PlaylistSelector } from "@/components/playlists";
import { VideoFilters } from "@/components/playlists/VideoFilters";
import { VideoTable } from "@/components/playlists/VideoTable";
import { StatsBar } from "@/components/playlists/StatsBar";
import { useChannelVideos } from "@/hooks/useChannelVideos";
import { useVideoFilters } from "@/hooks/useVideoFilters";
import { useFilterStore } from "@/stores/filterStore";
import { UI_TEXT } from "@/lib/i18n";
import { AlertTriangle, Plus, Radio } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ChannelsPage() {
  const { toast } = useToast();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [destinationPlaylistId, setDestinationPlaylistId] = useState<string | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(150);

  const { filter, resetFilters } = useFilterStore();

  const {
    data: videos = [],
    isLoading,
    refetch,
  } = useChannelVideos(selectedChannelId);

  const { filteredVideos, availableLanguages } = useVideoFilters(videos, filter);

  useEffect(() => {
    setVisibleCount(150);
  }, [selectedChannelId, videos.length, filter]);

  const visibleVideos = useMemo(() => {
    return filteredVideos.slice(0, visibleCount);
  }, [filteredVideos, visibleCount]);

  const handleToggleSelect = useCallback((videoId: string) => {
    setSelectedVideos((prev) => {
      const next = new Set(prev);
      if (next.has(videoId)) {
        next.delete(videoId);
      } else {
        next.add(videoId);
      }
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    setSelectedVideos((prev) => {
      if (prev.size === visibleVideos.length) {
        return new Set();
      }
      return new Set(visibleVideos.map((v) => v.videoId));
    });
  }, [visibleVideos]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 50, filteredVideos.length));
  };

  const handleChannelChange = (channelId: string) => {
    setSelectedChannelId(channelId);
    setSelectedVideos(new Set());
    resetFilters();
  };

  const handleAssignClick = () => {
    if (selectedVideos.size === 0) {
      toast({
        title: UI_TEXT.general.error,
        description: UI_TEXT.messages.noSelection,
        variant: "destructive",
      });
      return;
    }

    if (!destinationPlaylistId) {
      toast({
        title: UI_TEXT.general.error,
        description: UI_TEXT.messages.noDestination,
        variant: "destructive",
      });
      return;
    }

    setAssignDialogOpen(true);
  };

  const videosToAssign = useMemo(() => {
    return filteredVideos
      .filter((v) => selectedVideos.has(v.videoId))
      .map((v) => v.videoId);
  }, [filteredVideos, selectedVideos]);

  const handleAssignSuccess = () => {
    setSelectedVideos(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Radio className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">{UI_TEXT.channels.title}</h1>
      </div>

      {/* Warning */}
      <Alert variant="destructive" className="border-yellow-500 bg-yellow-50 text-yellow-900">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Atenção: Custo alto de quota</AlertTitle>
        <AlertDescription>
          Buscar vídeos de um canal consome <strong>100 unidades</strong> de quota por vez.
          Use com moderação.
        </AlertDescription>
      </Alert>

      {/* Selectors */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <ChannelSelector
              value={selectedChannelId}
              onChange={handleChannelChange}
              showOnlyEnabled
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {UI_TEXT.channels.destinationPlaylist}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PlaylistSelector
              value={destinationPlaylistId}
              onChange={setDestinationPlaylistId}
              label=""
              showOnlyEnabled
            />
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      {selectedChannelId && (
        <>
          {/* Filters */}
          <VideoFilters availableLanguages={availableLanguages} videos={videos} />

          {/* Videos */}
          {isLoading ? (
            <Card>
              <CardContent className="py-6">
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stats */}
              <StatsBar
                totalVideos={videos.length}
                filteredVideos={filteredVideos}
                selectedVideos={selectedVideos}
              />

              {/* Table - usando videoId ao invés de id para canais */}
              <VideoTable
                videos={visibleVideos.map((v) => ({ ...v, id: v.videoId }))}
                selectedVideos={selectedVideos}
                onToggleSelect={handleToggleSelect}
                onToggleSelectAll={handleToggleSelectAll}
              />
              {visibleVideos.length < filteredVideos.length && (
                <div className="flex justify-center">
                  <Button variant="outline" onClick={handleLoadMore}>
                    Listar + 50 vídeos
                  </Button>
                </div>
              )}

              {/* Assign Button */}
              <div className="flex justify-end">
                <Button
                  size="lg"
                  onClick={handleAssignClick}
                  disabled={
                    selectedVideos.size === 0 || !destinationPlaylistId
                  }
                >
                  <Plus className="mr-2 h-5 w-5" />
                  {UI_TEXT.channels.assignToPlaylist}
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {/* Empty State */}
      {!selectedChannelId && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Radio className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Selecione um canal para ver seus vídeos
            </p>
          </CardContent>
        </Card>
      )}

      {/* Assign Dialog */}
      {destinationPlaylistId && (
        <AssignDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          playlistId={destinationPlaylistId}
          videoIds={videosToAssign}
          onSuccess={handleAssignSuccess}
        />
      )}
    </div>
  );
}
