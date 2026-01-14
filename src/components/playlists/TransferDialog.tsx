"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTransfer } from "@/hooks/useTransfer";
import { useQuota } from "@/hooks/useQuota";
import { useToast } from "@/components/ui/use-toast";
import { calculateTransferCost } from "@/lib/quota";
import { UI_TEXT, t } from "@/lib/i18n";
import { formatNumber } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourcePlaylistId: string;
  destinationPlaylistId: string;
  videos: Array<{ playlistItemId: string; videoId: string }>;
  onSuccess: () => void;
}

export function TransferDialog({
  open,
  onOpenChange,
  sourcePlaylistId,
  destinationPlaylistId,
  videos,
  onSuccess,
}: TransferDialogProps) {
  const { toast } = useToast();
  const { data: quota } = useQuota();
  const transferMutation = useTransfer();

  const quotaCost = calculateTransferCost(videos.length);
  const hasQuota = quota && quota.remainingUnits >= quotaCost;

  const handleTransfer = async () => {
    try {
      const result = await transferMutation.mutateAsync({
        sourcePlaylistId,
        destinationPlaylistId,
        videos,
      });

      if (result.success) {
        toast({
          title: UI_TEXT.transfer.success,
          description: t(UI_TEXT.messages.transferSuccess, {
            count: result.transferred,
          }),
          variant: "success",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: UI_TEXT.general.error,
          description: t(UI_TEXT.messages.transferPartial, {
            success: result.transferred,
            errors: result.errors,
          }),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: UI_TEXT.transfer.error,
        description:
          error instanceof Error ? error.message : UI_TEXT.messages.transferError,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{UI_TEXT.transfer.title}</DialogTitle>
          <DialogDescription>
            {t(UI_TEXT.transfer.description, { count: videos.length })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quota Info */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t(UI_TEXT.transfer.quotaCost, { cost: formatNumber(quotaCost) })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t(UI_TEXT.transfer.quotaRemaining, {
                  remaining: formatNumber(quota?.remainingUnits || 0),
                })}
              </span>
            </div>
            {quota && (
              <Progress value={quota.percentUsed} className="h-2" />
            )}
          </div>

          {/* Warning if no quota */}
          {!hasQuota && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm text-destructive">
                {UI_TEXT.transfer.quotaInsufficient}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={transferMutation.isPending}
          >
            {UI_TEXT.general.cancel}
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!hasQuota || transferMutation.isPending}
          >
            {transferMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {UI_TEXT.transfer.inProgress}
              </>
            ) : (
              UI_TEXT.transfer.confirm
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
