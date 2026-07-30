import React, { useState } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, GitBranch, Save, FileClock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type RollbackStrategy = 'restore-as-draft' | 'replace-draft' | 'new-version';

interface RollbackConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetVersion: number;
  onConfirm: (strategy: RollbackStrategy) => void;
  isRollingBack: boolean;
}

export function RollbackConfirmDialog({ open, onOpenChange, targetVersion, onConfirm, isRollingBack }: RollbackConfirmDialogProps) {
  const [strategy, setStrategy] = useState<RollbackStrategy>('restore-as-draft');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Restore Version {targetVersion}
          </DialogTitle>
          <p className="text-muted-foreground pt-2 text-sm">
            You are about to restore the workflow to the exact state of Version {targetVersion}. Historical versions will not be altered.
          </p>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <p className="text-sm font-semibold mb-2">Choose Restore Strategy:</p>
          
          <button 
            onClick={() => setStrategy('restore-as-draft')}
            className={cn(
              "w-full flex items-start gap-3 p-4 rounded-lg border text-left transition-all",
              strategy === 'restore-as-draft' ? "bg-blue-500/10 border-blue-500/50" : "bg-card border-border hover:bg-muted/10"
            )}
          >
            <GitBranch className={cn("h-5 w-5 mt-0.5", strategy === 'restore-as-draft' ? "text-blue-400" : "text-muted-foreground")} />
            <div>
              <p className={cn("font-bold", strategy === 'restore-as-draft' ? "text-blue-400" : "text-foreground")}>Restore as Draft</p>
              <p className="text-xs text-muted-foreground mt-1">Overwrites your current draft with the contents of v{targetVersion}. Use this to continue editing.</p>
            </div>
          </button>

          <button 
            onClick={() => setStrategy('new-version')}
            className={cn(
              "w-full flex items-start gap-3 p-4 rounded-lg border text-left transition-all",
              strategy === 'new-version' ? "bg-green-500/10 border-green-500/50" : "bg-card border-border hover:bg-muted/10"
            )}
          >
            <FileClock className={cn("h-5 w-5 mt-0.5", strategy === 'new-version' ? "text-green-400" : "text-muted-foreground")} />
            <div>
              <p className={cn("font-bold", strategy === 'new-version' ? "text-green-400" : "text-foreground")}>Restore & Publish New Version</p>
              <p className="text-xs text-muted-foreground mt-1">Immediately publishes v{targetVersion}'s content as a brand new version.</p>
            </div>
          </button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isRollingBack}>Cancel</Button>
          <Button 
            className={strategy === 'new-version' ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"} 
            onClick={() => onConfirm(strategy)}
            disabled={isRollingBack}
          >
            {isRollingBack ? 'Restoring...' : 'Confirm Restore'}
          </Button>
        </DialogFooter>
    </Dialog>
  );
}
