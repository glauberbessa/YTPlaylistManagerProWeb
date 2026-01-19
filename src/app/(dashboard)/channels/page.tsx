"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChannelSelector, AssignDialog } from "@/components/channels";
import { PlaylistSelector, VideoGrid, VideoList } from "@/components/playlists";
import { VideoFilters } from "@/components/playlists/VideoFilters";
import { VideoTable } from "@/components/playlists/VideoTable";
import { StatsBar } from "@/components/playlists/StatsBar";
import { useChannelVideos } from "@/hooks/useChannelVideos";
import { useVideoFilters } from "@/hooks/useVideoFilters";
import { useFilterStore } from "@/stores/filterStore";
import { UI_TEXT } from "@/lib/i18n";
import { Plus, Radio } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ChannelsPage() {
  const { toast } = useToast();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [destinationPlaylistId, setDestinationPlaylistId] = useState<string | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(150);
  const [layout, setLayout] = useState<"grid" | "table" | "list">("grid");
  const [isMobile, setIsMobile] = useState(false);

  const { filter, resetFilters } = useFilterStore();

  const {
    data: videos = [],
    isLoading,
    refetch,
  } = useChannelVideos(selectedChannelId);

  const { filteredVideos, availableLanguages } = useVideoFilters(videos, filter);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
      if (event.matches) {
        setLayout("list");
      }
    };

    handleChange(media);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    setVisibleCount(150);
  }, [selectedChannelId, videos.length, filter]);

  const visibleVideos = useMemo(() => {
    return filteredVideos.slice(0, visibleCount);
  }, [filteredVideos, visibleCount]);

  const visibleVideosWithIds = useMemo(() => {
    return visibleVideos.map((video) => ({
      ...video,
      id: video.videoId || video.id,
    }));
  }, [visibleVideos]);

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
      if (prev.size === visibleVideosWithIds.length) {
        return new Set();
      }
      return new Set(visibleVideosWithIds.map((v) => v.id));
    });
  }, [visibleVideosWithIds]);

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

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Layouts</span>
                <Select
                  value={layout}
                  onValueChange={(value) =>
                    setLayout(value as "grid" | "table" | "list")
                  }
                  disabled={isMobile}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Selecione o layout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">{UI_TEXT.viewMode.grid}</SelectItem>
                    <SelectItem value="list">{UI_TEXT.viewMode.list}</SelectItem>
                    <SelectItem value="table">{UI_TEXT.viewMode.table}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {layout === "table" ? (
                <VideoTable
                  videos={visibleVideosWithIds}
                  selectedVideos={selectedVideos}
                  onToggleSelect={handleToggleSelect}
                  onToggleSelectAll={handleToggleSelectAll}
                />
              ) : layout === "list" ? (
                <VideoList
                  videos={visibleVideosWithIds}
                  selectedVideos={selectedVideos}
                  onToggleSelect={handleToggleSelect}
                  onToggleSelectAll={handleToggleSelectAll}
                />
              ) : (
                <VideoGrid
                  videos={visibleVideosWithIds}
                  selectedVideos={selectedVideos}
                  onToggleSelect={handleToggleSelect}
                  onToggleSelectAll={handleToggleSelectAll}
                />
              )}
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
