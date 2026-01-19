"use client";

import type { KeyboardEvent } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Video } from "@/types/video";
import { cn, formatDate, formatDuration, formatViewCount } from "@/lib/utils";

interface VideoListProps {
  videos: Video[];
  selectedVideos: Set<string>;
  onToggleSelect: (videoId: string) => void;
  onToggleSelectAll: () => void;
  combineMeta?: boolean;
}

export function VideoList({
  videos,
  selectedVideos,
  onToggleSelect,
  onToggleSelectAll,
  combineMeta = false,
}: VideoListProps) {
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
      <div className="flex flex-col gap-3">
        {videos.map((video) => (
          <div
            key={video.id}
            role="button"
            tabIndex={0}
            onClick={() => onToggleSelect(video.id)}
            onKeyDown={(event) => handleCardKeyDown(event, video.id)}
            className={cn(
              "flex gap-3 rounded-lg border bg-card p-3 shadow-sm transition-colors",
              selectedVideos.has(video.id)
                ? "border-primary/70 ring-1 ring-primary/40"
                : "border-border hover:border-primary/40"
            )}
          >
            <div className="relative h-20 w-36 shrink-0 overflow-hidden rounded-md bg-muted sm:h-24 sm:w-40">
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
              <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {formatDuration(video.durationInSeconds)}
              </div>
            </div>
            <div className="flex flex-1 items-start gap-3">
              <div className="space-y-1">
                <a
                  href={`https://www.youtube.com/watch?v=${video.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="line-clamp-2 font-medium hover:text-primary"
                >
                  {video.title}
                </a>
                {combineMeta ? (
                  <div className="text-xs text-muted-foreground">
                    {[
                      video.channelTitle,
                      `${formatViewCount(video.viewCount)} visualizações`,
                      video.publishedAt ? formatDate(video.publishedAt) : "-",
                    ].join(" • ")}
                  </div>
                ) : (
                  <>
                    <div className="text-xs text-muted-foreground">
                      {video.channelTitle}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>{formatViewCount(video.viewCount)} visualizações</span>
                      <span>
                        {video.publishedAt ? formatDate(video.publishedAt) : "-"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
