"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChannelWithConfig } from "@/types/channel";
import { UI_TEXT } from "@/lib/i18n";
import { formatNumber, formatDate } from "@/lib/utils";
import { Settings2, ArrowUp, ArrowDown } from "lucide-react";

async function fetchChannels(): Promise<ChannelWithConfig[]> {
  const res = await fetch("/api/channels", { credentials: "include" });
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
    credentials: "include",
  });
  if (!res.ok) throw new Error("Erro ao salvar configurações");
  return res.json();
}

type SortField = "title" | "subscribedAt";
type SortDirection = "asc" | "desc";

export default function ConfigChannelsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({});
  const [sortField, setSortField] = useState<SortField>("subscribedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showOnlyActive, setShowOnlyActive] = useState(false);

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

  // Ordenar canais
  const sortedChannels = useMemo(() => {
    if (!channels) return [];

    return [...channels].sort((a, b) => {
      let comparison = 0;

      if (sortField === "title") {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === "subscribedAt") {
        const dateA = a.subscribedAt ? new Date(a.subscribedAt).getTime() : 0;
        const dateB = b.subscribedAt ? new Date(b.subscribedAt).getTime() : 0;
        comparison = dateA - dateB;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [channels, sortField, sortDirection]);

  const visibleChannels = useMemo(() => {
    if (!showOnlyActive) return sortedChannels;
    return sortedChannels.filter((channel) => enabledMap[channel.id] ?? true);
  }, [sortedChannels, enabledMap, showOnlyActive]);

  const persistConfigs = (nextMap: Record<string, boolean>) => {
    if (!channels) return;

    const configs = channels.map((c) => ({
      channelId: c.id,
      title: c.title,
      isEnabled: nextMap[c.id] ?? true,
    }));

    saveMutation.mutate(configs);
  };

  const handleToggle = (channelId: string, enabled: boolean) => {
    setEnabledMap((prev) => {
      const nextMap = { ...prev, [channelId]: enabled };
      persistConfigs(nextMap);
      return nextMap;
    });
  };

  const handleEnableAll = () => {
    if (!channels) return;
    const confirmed = window.confirm(
      "Tem certeza que deseja ativar todos os canais?"
    );
    if (!confirmed) return;
    const map: Record<string, boolean> = {};
    channels.forEach((c) => {
      map[c.id] = true;
    });
    setEnabledMap(map);
    persistConfigs(map);
  };

  const handleDisableAll = () => {
    if (!channels) return;
    const confirmed = window.confirm(
      "Tem certeza que deseja desativar todos os canais?"
    );
    if (!confirmed) return;
    const map: Record<string, boolean> = {};
    channels.forEach((c) => {
      map[c.id] = false;
    });
    setEnabledMap(map);
    persistConfigs(map);
  };

  const handleHeaderDoubleClick = () => {
    if (sortField === "title") {
      setSortField("subscribedAt");
      setSortDirection("desc");
    } else {
      setSortField("title");
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-4 w-4 inline" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4 inline" />
    );
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
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={showOnlyActive}
            onCheckedChange={setShowOnlyActive}
            id="show-only-active"
          />
          <label htmlFor="show-only-active" className="text-sm text-muted-foreground">
            Apenas Ativas
          </label>
        </div>
        <Button variant="outline" onClick={handleEnableAll}>
          {UI_TEXT.config.enableAll}
        </Button>
        <Button variant="outline" onClick={handleDisableAll}>
          {UI_TEXT.config.disableAll}
        </Button>
      </div>

      {/* Channels Table */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onDoubleClick={handleHeaderDoubleClick}
                  title="Clique duplo para alternar a ordenação"
                >
                  Canal
                  <SortIcon field={sortField} />
                </TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleChannels.map((channel) => (
                <TableRow key={channel.id}>
                  <TableCell className="font-medium">
                    <span className="truncate block max-w-[520px]">
                      {channel.title} -{" "}
                      {(() => {
                        const subscriptionDate =
                          channel.subscribedAt ?? channel.config?.subscriptionDate;

                        return subscriptionDate ? formatDate(subscriptionDate) : "-";
                      })()}{" "}
                      - {formatNumber(channel.videoCount)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-3">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
