"use client";

import type { KeyboardEvent } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Video } from "@/types/video";
import { cn, formatDate, formatDuration, formatViewCount } from "@/lib/utils";

interface VideoGridProps {
  videos: Video[];
  selectedVideos: Set<string>;
  onToggleSelect: (videoId: string) => void;
  onToggleSelectAll: () => void;
}

export function VideoGrid({
  videos,
  selectedVideos,
  onToggleSelect,
  onToggleSelectAll,
}: VideoGridProps) {
  const allSelected = videos.length > 0 && videos.every((v) => selectedVideos.has(v.id));
  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>, id: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggleSelect(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleSelectAll}
          disabled={videos.length === 0}
        >
          {allSelected ? "Limpar seleção" : "Selecionar todos"}
        </Button>
        <span className="text-sm text-muted-foreground">
          {videos.length} vídeos
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <div
            key={video.id}
            role="button"
            tabIndex={0}
            onClick={() => onToggleSelect(video.id)}
            onKeyDown={(event) => handleCardKeyDown(event, video.id)}
            className={cn(
              "flex flex-col gap-3 rounded-lg border bg-card p-3 shadow-sm transition-colors",
              selectedVideos.has(video.id)
                ? "border-primary/70 ring-1 ring-primary/40"
                : "border-border hover:border-primary/40"
            )}
          >
            <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
              {video.thumbnailUrl ? (
                <Image
                  src={video.thumbnailUrl}
                  alt={video.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  N/A
                </div>
              )}
            </div>
            <div className="flex items-start gap-3">
              <div className="space-y-2">
                <a
                  href={`https://www.youtube.com/watch?v=${video.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="line-clamp-2 font-medium hover:text-primary"
                >
                  {video.title}
                </a>
                <div className="text-xs text-muted-foreground">
                  {video.channelTitle}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>{formatDuration(video.durationInSeconds)}</span>
                  <span>{formatViewCount(video.viewCount)} visualizações</span>
                  <span>
                    {video.publishedAt ? formatDate(video.publishedAt) : "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
