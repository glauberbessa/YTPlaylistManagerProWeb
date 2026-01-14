"use client";

import { useQuery } from "@tanstack/react-query";
import { QuotaStatus, QuotaHistoryItem } from "@/types/quota";

async function fetchQuotaStatus(): Promise<QuotaStatus> {
  const res = await fetch("/api/quota");
  if (!res.ok) throw new Error("Erro ao buscar quota");
  return res.json();
}

async function fetchQuotaHistory(): Promise<QuotaHistoryItem[]> {
  const res = await fetch("/api/quota/history");
  if (!res.ok) throw new Error("Erro ao buscar histórico");
  return res.json();
}

export function useQuota() {
  return useQuery({
    queryKey: ["quota"],
    queryFn: fetchQuotaStatus,
    refetchInterval: 30000, // 30 segundos
  });
}

export function useQuotaHistory() {
  return useQuery({
    queryKey: ["quotaHistory"],
    queryFn: fetchQuotaHistory,
  });
}
