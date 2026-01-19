"use client";

import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { Video } from "@/types/video";
import { formatDate, formatDuration, formatViewCount } from "@/lib/utils";

interface VideoListProps {
  videos: Video[];
  selectedVideos: Set<string>;
  onToggleSelect: (videoId: string) => void;
  onToggleSelectAll: () => void;
}

export function VideoList({
  videos,
  selectedVideos,
  onToggleSelect,
  onToggleSelectAll,
}: VideoListProps) {
  const allSelected = videos.length > 0 && videos.every((v) => selectedVideos.has(v.id));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onToggleSelectAll}
            aria-label="Selecionar todos"
          />
          Selecionar todos
        </label>
        <span className="text-sm text-muted-foreground">
          {videos.length} vídeos
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {videos.map((video) => (
          <div
            key={video.id}
            className="flex gap-3 rounded-lg border bg-card p-3 shadow-sm"
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
            </div>
            <div className="flex flex-1 items-start gap-3">
              <Checkbox
                checked={selectedVideos.has(video.id)}
                onCheckedChange={() => onToggleSelect(video.id)}
                aria-label={`Selecionar vídeo ${video.title}`}
              />
              <div className="space-y-1">
                <a
                  href={`https://www.youtube.com/watch?v=${video.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
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
