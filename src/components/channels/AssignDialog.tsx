"use client";

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
import { useAssign } from "@/hooks/useTransfer";
import { useQuota } from "@/hooks/useQuota";
import { useToast } from "@/components/ui/use-toast";
import { calculateAssignCost } from "@/lib/quota.shared";
import { UI_TEXT, t } from "@/lib/i18n";
import { formatNumber } from "@/lib/utils";
import { AlertTriangle, Loader2 } from "lucide-react";

interface AssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlistId: string;
  videoIds: string[];
  onSuccess: () => void;
}

export function AssignDialog({
  open,
  onOpenChange,
  playlistId,
  videoIds,
  onSuccess,
}: AssignDialogProps) {
  const { toast } = useToast();
  const { data: quota } = useQuota();
  const assignMutation = useAssign();

  const quotaCost = calculateAssignCost(videoIds.length);
  const hasQuota = quota && quota.remainingUnits >= quotaCost;

  const handleAssign = async () => {
    try {
      const result = await assignMutation.mutateAsync({
        playlistId,
        videoIds,
      });

      if (result.success) {
        toast({
          title: UI_TEXT.assign.success,
          description: t(UI_TEXT.messages.assignSuccess, {
            count: result.added,
          }),
          variant: "success",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: UI_TEXT.general.error,
          description: t(UI_TEXT.messages.assignPartial, {
            success: result.added,
            errors: result.errors,
          }),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: UI_TEXT.assign.error,
        description:
          error instanceof Error ? error.message : UI_TEXT.messages.assignError,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{UI_TEXT.assign.title}</DialogTitle>
          <DialogDescription>
            {t(UI_TEXT.assign.description, { count: videoIds.length })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quota Info */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t(UI_TEXT.assign.quotaCost, { cost: formatNumber(quotaCost) })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t(UI_TEXT.assign.quotaRemaining, {
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
                {UI_TEXT.assign.quotaInsufficient}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={assignMutation.isPending}
          >
            {UI_TEXT.general.cancel}
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!hasQuota || assignMutation.isPending}
          >
            {assignMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {UI_TEXT.assign.inProgress}
              </>
            ) : (
              UI_TEXT.assign.confirm
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
