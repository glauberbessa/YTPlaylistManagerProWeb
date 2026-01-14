"use client";

import { useQuota, useQuotaHistory } from "@/hooks/useQuota";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UI_TEXT } from "@/lib/i18n";
import { formatNumber, formatDate, cn } from "@/lib/utils";
import { QUOTA_OPERATIONS } from "@/types/quota";
import { Gauge, History, DollarSign, TrendingUp } from "lucide-react";

export default function QuotaPage() {
  const { data: quota, isLoading: quotaLoading } = useQuota();
  const { data: history, isLoading: historyLoading } = useQuotaHistory();

  const getProgressColor = (percent: number) => {
    if (percent >= 80) return "bg-destructive";
    if (percent >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Gauge className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{UI_TEXT.quota.title}</h1>
          <p className="text-muted-foreground">{UI_TEXT.quota.subtitle}</p>
        </div>
      </div>

      {/* Current Status */}
      <div className="grid gap-4 md:grid-cols-3">
        {quotaLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {UI_TEXT.quota.used}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatNumber(quota?.consumedUnits || 0)}
                </div>
                <p className="text-sm text-muted-foreground">
                  de {formatNumber(quota?.dailyLimit || 10000)} {UI_TEXT.quota.units}
                </p>
                <Progress
                  value={quota?.percentUsed || 0}
                  className={cn("mt-3 h-2", getProgressColor(quota?.percentUsed || 0))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {UI_TEXT.quota.remaining}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {formatNumber(quota?.remainingUnits || 0)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {UI_TEXT.quota.units} disponíveis
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Percentual Usado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    "text-3xl font-bold",
                    (quota?.percentUsed || 0) >= 80
                      ? "text-destructive"
                      : (quota?.percentUsed || 0) >= 50
                      ? "text-yellow-600"
                      : "text-green-600"
                  )}
                >
                  {(quota?.percentUsed || 0).toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">
                  do limite diário
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {UI_TEXT.quota.history}
          </CardTitle>
          <CardDescription>{UI_TEXT.quota.historySubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : history && history.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Consumido</TableHead>
                  <TableHead>Limite</TableHead>
                  <TableHead>Percentual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item, index) => {
                  const percent =
                    (item.consumedUnits / item.dailyLimit) * 100;
                  return (
                    <TableRow key={index}>
                      <TableCell>{formatDate(item.date)}</TableCell>
                      <TableCell>{formatNumber(item.consumedUnits)}</TableCell>
                      <TableCell>{formatNumber(item.dailyLimit)}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "font-medium",
                            percent >= 80
                              ? "text-destructive"
                              : percent >= 50
                              ? "text-yellow-600"
                              : "text-green-600"
                          )}
                        >
                          {percent.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-6">
              Nenhum histórico disponível
            </p>
          )}
        </CardContent>
      </Card>

      {/* Costs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {UI_TEXT.quota.costs}
          </CardTitle>
          <CardDescription>{UI_TEXT.quota.costsSubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operação</TableHead>
                <TableHead className="text-right">Custo (unidades)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {QUOTA_OPERATIONS.map((op) => (
                <TableRow key={op.endpoint}>
                  <TableCell>{op.endpoint}</TableCell>
                  <TableCell className="text-right font-mono">
                    {op.cost}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Dicas de Economia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            • <strong>Transferências:</strong> Cada transferência custa 100 unidades (inserir + remover).
            Máximo de ~100 transferências por dia.
          </p>
          <p className="text-sm text-muted-foreground">
            • <strong>Busca por canal:</strong> Custa 100 unidades por busca. Evite buscar repetidamente.
          </p>
          <p className="text-sm text-muted-foreground">
            • <strong>Atribuições:</strong> Cada atribuição custa 50 unidades. Agrupe vídeos quando possível.
          </p>
          <p className="text-sm text-muted-foreground">
            • <strong>Cache:</strong> Os dados são mantidos em cache por 5 minutos para economizar quota.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
