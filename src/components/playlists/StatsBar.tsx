"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Video } from "@/types/video";
import { formatDuration, formatNumber } from "@/lib/utils";
import { UI_TEXT } from "@/lib/i18n";
import { List, Filter, CheckSquare, Clock } from "lucide-react";

interface StatsBarProps {
  totalVideos: number;
  filteredVideos: Video[];
  selectedVideos: Set<string>;
}

export function StatsBar({
  totalVideos,
  filteredVideos,
  selectedVideos,
}: StatsBarProps) {
  const selectedDuration = useMemo(() => {
    return filteredVideos
      .filter((v) => selectedVideos.has(v.id))
      .reduce((acc, v) => acc + v.durationInSeconds, 0);
  }, [filteredVideos, selectedVideos]);

  const stats = [
    {
      icon: List,
      label: UI_TEXT.stats.total,
      value: formatNumber(totalVideos),
    },
    {
      icon: Filter,
      label: UI_TEXT.stats.filtered,
      value: formatNumber(filteredVideos.length),
    },
    {
      icon: CheckSquare,
      label: UI_TEXT.stats.selected,
      value: formatNumber(selectedVideos.size),
    },
    {
      icon: Clock,
      label: UI_TEXT.stats.selectedDuration,
      value: formatDuration(selectedDuration),
    },
  ];

  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-2">
              <stat.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{stat.label}:</span>
              <span className="font-medium">{stat.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
