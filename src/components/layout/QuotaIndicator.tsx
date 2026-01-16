"use client";

import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { cn, formatNumber } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Gauge } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QuotaStatus {
  consumedUnits: number;
  dailyLimit: number;
  remainingUnits: number;
  percentUsed: number;
}

async function fetchQuotaStatus(): Promise<QuotaStatus> {
  const res = await fetch("/api/quota", { credentials: "include" });
  if (!res.ok) throw new Error("Erro ao buscar quota");
  return res.json();
}

export function QuotaIndicator() {
  const { data: quota, isLoading } = useQuery({
    queryKey: ["quota"],
    queryFn: fetchQuotaStatus,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  if (isLoading) {
    return <Skeleton className="h-8 w-48" />;
  }

  if (!quota) {
    return null;
  }

  const getColorClass = (percent: number) => {
    if (percent >= 80) return "bg-destructive";
    if (percent >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href="/quota"
          className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
        >
          <Gauge className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <div className="w-24 hidden sm:block">
              <Progress
                value={quota.percentUsed}
                className={cn("h-2", getColorClass(quota.percentUsed))}
              />
            </div>
            <span className="whitespace-nowrap text-xs">
              {formatNumber(quota.consumedUnits)}/
              {formatNumber(quota.dailyLimit)}
            </span>
          </div>
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          Quota: {quota.percentUsed.toFixed(1)}% utilizada
          <br />
          Restante: {formatNumber(quota.remainingUnits)} unidades
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
