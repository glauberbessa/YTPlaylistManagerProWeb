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
import { ChannelWithConfig } from "@/types/channel";
import { UI_TEXT } from "@/lib/i18n";
import { formatViewCount } from "@/lib/utils";

interface ChannelSelectorProps {
  value: string | null;
  onChange: (value: string) => void;
  showOnlyEnabled?: boolean;
}

async function fetchChannels(): Promise<ChannelWithConfig[]> {
  const res = await fetch("/api/channels");
  if (!res.ok) throw new Error("Erro ao buscar canais");
  return res.json();
}

export function ChannelSelector({
  value,
  onChange,
  showOnlyEnabled = false,
}: ChannelSelectorProps) {
  const { data: channels, isLoading } = useQuery({
    queryKey: ["channels"],
    queryFn: fetchChannels,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const filteredChannels = channels?.filter((c) => {
    if (showOnlyEnabled && c.config?.isEnabled === false) return false;
    return true;
  });

  return (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={UI_TEXT.channels.selectChannel} />
      </SelectTrigger>
      <SelectContent>
        {filteredChannels?.map((channel) => (
          <SelectItem key={channel.id} value={channel.id}>
            <div className="flex items-center justify-between gap-4">
              <span className="truncate">{channel.title}</span>
              <span className="text-xs text-muted-foreground">
                {formatViewCount(channel.videoCount)} vídeos
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
