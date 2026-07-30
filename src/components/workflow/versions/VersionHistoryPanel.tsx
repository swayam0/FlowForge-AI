import React from 'react';
import { format } from 'date-fns';
import { GitCommit, History, ArrowRight, Play, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface VersionHistoryPanelProps {
  versions: any[];
  selectedVersionId: string;
  compareVersionId: string | null;
  onSelectBase: (id: string) => void;
  onSelectCompare: (id: string) => void;
  onRollbackClick: (v: number) => void;
}

export function VersionHistoryPanel({
  versions,
  selectedVersionId,
  compareVersionId,
  onSelectBase,
  onSelectCompare,
  onRollbackClick
}: VersionHistoryPanelProps) {

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-r border-border shrink-0 w-[350px]">
      <div className="p-4 border-b border-border bg-[#121212] flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-bold text-foreground tracking-tight">Version History</h2>
        </div>
        <p className="text-xs text-muted-foreground">Select two versions to compare their differences, or roll back to a previous state.</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {versions.map((v, idx) => {
          const isLatest = idx === 0;
          const isBase = v.id === selectedVersionId;
          const isCompare = v.id === compareVersionId;
          
          return (
            <div 
              key={v.id} 
              className={cn(
                "relative p-4 rounded-xl border transition-all cursor-pointer group",
                isBase || isCompare ? "bg-white/5 border-blue-500/50" : "bg-card border-border hover:border-muted-foreground/30"
              )}
              onClick={() => {
                if (isBase) return; // do nothing
                if (isCompare) {
                  onSelectCompare(''); // deselect
                } else {
                  onSelectCompare(v.id);
                }
              }}
            >
              {/* Timeline line connecting items */}
              {idx !== versions.length - 1 && (
                <div className="absolute left-6 top-16 bottom-[-16px] w-px bg-border group-hover:bg-muted-foreground/20 transition-colors" />
              )}
              
              <div className="flex items-center justify-between mb-2 relative z-10">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex items-center justify-center w-5 h-5 rounded-full border bg-[#0a0a0a]",
                    isBase ? "border-blue-500" : isCompare ? "border-green-500" : "border-muted-foreground"
                  )}>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      isBase ? "bg-blue-500" : isCompare ? "bg-green-500" : "bg-muted-foreground"
                    )} />
                  </div>
                  <span className="font-bold text-foreground">v{v.versionNumber}</span>
                  {isLatest && (
                    <span className="text-[9px] uppercase tracking-widest font-bold bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded-sm">Current</span>
                  )}
                </div>
                
                <span className="text-xs text-muted-foreground">{format(new Date(v.createdAt), 'MMM d, yyyy')}</span>
              </div>
              
              <div className="ml-7 space-y-2 relative z-10">
                <p className="text-xs text-muted-foreground">Snapshot of workflow configuration and layout.</p>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  {!isBase && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-[10px] px-2 uppercase tracking-wider"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBase(v.id);
                      }}
                    >
                      Set as Base
                    </Button>
                  )}
                  {isBase && (
                    <span className="h-7 inline-flex items-center text-[10px] uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 px-2 rounded-md">
                      Base Version
                    </span>
                  )}
                  {isCompare && (
                    <span className="h-7 inline-flex items-center text-[10px] uppercase font-bold tracking-wider text-green-400 bg-green-500/10 px-2 rounded-md">
                      Comparing
                    </span>
                  )}
                  {!isLatest && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-[10px] px-2 uppercase tracking-wider ml-auto hover:text-blue-400 hover:border-blue-500/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRollbackClick(v.versionNumber);
                      }}
                    >
                      Restore
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
