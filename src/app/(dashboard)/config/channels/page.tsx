"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { ChannelWithConfig } from "@/types/channel";
import { UI_TEXT } from "@/lib/i18n";
import { formatNumber, formatDate } from "@/lib/utils";
import { Settings2, Check, Loader2 } from "lucide-react";

async function fetchChannels(): Promise<ChannelWithConfig[]> {
  const res = await fetch("/api/channels");
  if (!res.ok) throw new Error("Erro ao buscar canais");
  return res.json();
}

async function saveChannelConfigs(
  configs: Array<{ channelId: string; title: string; isEnabled: boolean }>
) {
  const res = await fetch("/api/config/channels", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(configs),
  });
  if (!res.ok) throw new Error("Erro ao salvar configurações");
  return res.json();
}

export default function ConfigChannelsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({});

  const { data: channels, isLoading } = useQuery({
    queryKey: ["channels"],
    queryFn: fetchChannels,
  });

  const saveMutation = useMutation({
    mutationFn: saveChannelConfigs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
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

  // Inicializar estado quando canais carregam
  useEffect(() => {
    if (channels) {
      const map: Record<string, boolean> = {};
      channels.forEach((c) => {
        map[c.id] = c.config?.isEnabled ?? true;
      });
      setEnabledMap(map);
    }
  }, [channels]);

  const handleToggle = (channelId: string, enabled: boolean) => {
    setEnabledMap((prev) => ({ ...prev, [channelId]: enabled }));
  };

  const handleSave = () => {
    if (!channels) return;

    const configs = channels.map((c) => ({
      channelId: c.id,
      title: c.title,
      isEnabled: enabledMap[c.id] ?? true,
    }));

    saveMutation.mutate(configs);
  };

  const handleEnableAll = () => {
    if (!channels) return;
    const map: Record<string, boolean> = {};
    channels.forEach((c) => {
      map[c.id] = true;
    });
    setEnabledMap(map);
  };

  const handleDisableAll = () => {
    if (!channels) return;
    const map: Record<string, boolean> = {};
    channels.forEach((c) => {
      map[c.id] = false;
    });
    setEnabledMap(map);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{UI_TEXT.config.channelsTitle}</h1>
          <p className="text-muted-foreground">{UI_TEXT.config.channelsSubtitle}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={handleEnableAll}>
          {UI_TEXT.config.enableAll}
        </Button>
        <Button variant="outline" onClick={handleDisableAll}>
          {UI_TEXT.config.disableAll}
        </Button>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {UI_TEXT.config.saving}
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              {UI_TEXT.general.save}
            </>
          )}
        </Button>
      </div>

      {/* Channels List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {channels?.map((channel) => (
            <Card key={channel.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{channel.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatNumber(channel.videoCount)} {UI_TEXT.config.videos}
                    {channel.subscribedAt && (
                      <> • Inscrito em {formatDate(channel.subscribedAt)}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {enabledMap[channel.id]
                      ? UI_TEXT.config.enabled
                      : UI_TEXT.config.disabled}
                  </span>
                  <Switch
                    checked={enabledMap[channel.id] ?? true}
                    onCheckedChange={(checked) =>
                      handleToggle(channel.id, checked)
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
