"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PlaylistSelector,
  VideoFilters,
  VideoTable,
  StatsBar,
  TransferDialog,
} from "@/components/playlists";
import { usePlaylistItems } from "@/hooks/usePlaylistItems";
import { useVideoFilters } from "@/hooks/useVideoFilters";
import { useFilterStore } from "@/stores/filterStore";
import { UI_TEXT } from "@/lib/i18n";
import { ArrowRight, ListVideo } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function PlaylistsPage() {
  const { toast } = useToast();
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
  const [destinationPlaylistId, setDestinationPlaylistId] = useState<string | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  const { filter, resetFilters } = useFilterStore();

  const {
    data: videos = [],
    isLoading,
    refetch,
  } = usePlaylistItems(activeSourceId);

  const { filteredVideos, availableLanguages } = useVideoFilters(videos, filter);

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
      if (prev.size === filteredVideos.length) {
        return new Set();
      }
      return new Set(filteredVideos.map((v) => v.id));
    });
  }, [filteredVideos]);

  const handleSourceChange = (playlistId: string) => {
    setSelectedSourceId(playlistId);
    // Resetar estado de visualização se mudar a playlist
    if (playlistId !== activeSourceId) {
      setActiveSourceId(null);
      setSelectedVideos(new Set());
      resetFilters();
    }
  };

  const handleListVideos = () => {
    if (selectedSourceId) {
      setActiveSourceId(selectedSourceId);
    }
  };

  const handleTransferClick = () => {
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

    if (activeSourceId === destinationPlaylistId) {
      toast({
        title: UI_TEXT.general.error,
        description: UI_TEXT.messages.samePlaylist,
        variant: "destructive",
      });
      return;
    }

    setTransferDialogOpen(true);
  };

  const videosToTransfer = useMemo(() => {
    return filteredVideos
      .filter((v) => selectedVideos.has(v.id))
      .map((v) => ({ playlistItemId: v.id, videoId: v.videoId }));
  }, [filteredVideos, selectedVideos]);

  const handleTransferSuccess = () => {
    setSelectedVideos(new Set());
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ListVideo className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">{UI_TEXT.playlists.title}</h1>
      </div>

      {/* Playlist Selectors */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {UI_TEXT.playlists.sourcePlaylist}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PlaylistSelector
              value={selectedSourceId}
              onChange={handleSourceChange}
              label=""
              showOnlyEnabled
            />
            <Button
              className="w-full"
              onClick={handleListVideos}
              disabled={!selectedSourceId || selectedSourceId === activeSourceId && !isLoading}
            >
              <ListVideo className="mr-2 h-4 w-4" />
              {UI_TEXT.playlists.listVideos}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {UI_TEXT.playlists.destinationPlaylist}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PlaylistSelector
              value={destinationPlaylistId}
              onChange={setDestinationPlaylistId}
              label=""
              excludeId={selectedSourceId || undefined}
              showOnlyEnabled
            />
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      {activeSourceId && (
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

              {/* Table */}
              <VideoTable
                videos={filteredVideos}
                selectedVideos={selectedVideos}
                onToggleSelect={handleToggleSelect}
                onToggleSelectAll={handleToggleSelectAll}
              />
            </>
          )}
        </>
      )}

      {/* Sticky Transfer Bar */}
      {activeSourceId && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50 shadow-lg md:pl-[250px]">
          <div className="container flex justify-between items-center max-w-7xl mx-auto">
            <span className="text-sm text-muted-foreground hidden md:inline-block">
              {selectedVideos.size} vídeos selecionados
            </span>
            <Button
              size="lg"
              onClick={handleTransferClick}
              disabled={selectedVideos.size === 0 || !destinationPlaylistId}
              className="w-full md:w-auto ml-auto"
            >
              {UI_TEXT.playlists.transferVideos}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Spacer to prevent footer from covering content */}
      {activeSourceId && <div className="h-24" />}

      {/* Empty State */}
      {!activeSourceId && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ListVideo className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Selecione uma playlist de origem e clique em &quot;{UI_TEXT.playlists.listVideos}&quot; para começar
            </p>
          </CardContent>
        </Card>
      )}

      {/* Transfer Dialog */}
      {activeSourceId && destinationPlaylistId && (
        <TransferDialog
          open={transferDialogOpen}
          onOpenChange={setTransferDialogOpen}
          sourcePlaylistId={activeSourceId}
          destinationPlaylistId={destinationPlaylistId}
          videos={videosToTransfer}
          onSuccess={handleTransferSuccess}
        />
      )}
    </div>
  );
}
