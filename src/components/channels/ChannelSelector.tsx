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
  const res = await fetch(`/api/channels?t=${Date.now()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro ${res.status}: ${text}`);
  }
  return res.json();
}

export function ChannelSelector({
  value,
  onChange,
  showOnlyEnabled = false,
}: ChannelSelectorProps) {
  const { data: channels, isLoading, isError, error } = useQuery({
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

  if (isError) {
    return (
      <div className="text-sm text-destructive p-2 border border-destructive/50 rounded-md">
        Erro ao carregar canais: {error?.message || "Erro desconhecido"}
      </div>
    );
  }

  const filteredChannels = channels?.filter((c) => {
    if (showOnlyEnabled && c.config?.isEnabled === false) return false;
    return true;
  });

  if (!filteredChannels || filteredChannels.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-2 border border-dashed rounded-md">
        Nenhum canal encontrado. Verifique se você está inscrito em canais no YouTube.
      </div>
    );
  }

  return (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={UI_TEXT.channels.selectChannel} />
      </SelectTrigger>
      <SelectContent>
        {filteredChannels.map((channel) => (
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
