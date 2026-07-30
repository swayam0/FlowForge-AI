'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Skeleton } from '../ui/Skeleton';
import { SkeletonCard } from '../skeletons/SkeletonCard';
import { VersionHistoryPanel } from './versions/VersionHistoryPanel';
import { RollbackConfirmDialog, RollbackStrategy } from './versions/RollbackConfirmDialog';
import { PromptDiffViewer } from './versions/PromptDiffViewer';
import { GraphDiffCanvas } from './versions/GraphDiffCanvas';
import { toast } from 'sonner';
import { GitBranch, PlusCircle, MinusCircle, FileEdit, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactFlowProvider } from '@xyflow/react';

export function VersionComparisonTab({ workflowId }: { workflowId: string }) {
  const { data: versions, isLoading: versionsLoading, refetch: refetchVersions } = useQuery({
    queryKey: ['workflow', workflowId, 'versions'],
    queryFn: () => api.getWorkflowVersions(workflowId),
  });

  const [baseVersionId, setBaseVersionId] = useState<string>('');
  const [compareVersionId, setCompareVersionId] = useState<string>('');
  const [rollbackTarget, setRollbackTarget] = useState<number | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  // Auto-select latest versions
  useEffect(() => {
    if (versions && versions.length >= 2 && !baseVersionId && !compareVersionId) {
      setBaseVersionId(versions[1].id); // Older is base
      setCompareVersionId(versions[0].id); // Newer is compare
    } else if (versions && versions.length === 1 && !baseVersionId && !compareVersionId) {
      setBaseVersionId(versions[0].id);
      setCompareVersionId('');
    }
  }, [versions, baseVersionId, compareVersionId]);

  const baseVersion = versions?.find((v: any) => v.id === baseVersionId);
  const compareVersion = versions?.find((v: any) => v.id === compareVersionId);

  const { data: diff, isLoading: diffLoading } = useQuery({
    queryKey: ['workflow', workflowId, 'versions', 'compare', baseVersion?.versionNumber, compareVersion?.versionNumber],
    queryFn: () => {
      if (!baseVersion || !compareVersion || baseVersion.id === compareVersion.id) return null;
      return api.compareWorkflowVersions(workflowId, baseVersion.versionNumber, compareVersion.versionNumber);
    },
    enabled: !!baseVersion && !!compareVersion && baseVersion.id !== compareVersion.id,
  });

  const handleRollback = async (strategy: RollbackStrategy) => {
    if (!rollbackTarget) return;
    setIsRollingBack(true);
    try {
      await api.rollbackWorkflowVersion(workflowId, rollbackTarget, strategy);
      toast.success(`Workflow successfully restored to version ${rollbackTarget}`);
      setRollbackTarget(null);
      refetchVersions();
      // the parent might want to switch tabs to 'editor' here, but a reload is safer or just let user navigate
      window.location.reload(); 
    } catch (err: any) {
      toast.error(err.message || 'Failed to rollback version');
    } finally {
      setIsRollingBack(false);
    }
  };

  if (versionsLoading) {
    return (
      <div className="flex h-[calc(100vh-140px)] gap-4">
        <div className="w-[350px] border border-border rounded-xl p-4 space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="flex-1 border border-border rounded-xl p-8 space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] text-center border border-border rounded-xl bg-card">
        <GitBranch className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-lg text-foreground font-semibold">No Versions Found</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Publish this workflow at least once to create a snapshot version.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] bg-[#050505] rounded-xl border border-border overflow-hidden shadow-sm">
      <VersionHistoryPanel 
        versions={versions}
        selectedVersionId={baseVersionId}
        compareVersionId={compareVersionId}
        onSelectBase={setBaseVersionId}
        onSelectCompare={setCompareVersionId}
        onRollbackClick={setRollbackTarget}
      />

      <div className="flex-1 flex flex-col overflow-y-auto bg-[#0a0a0a] custom-scrollbar relative">
        {!compareVersionId || baseVersionId === compareVersionId ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-12 text-center">
            <Check className="h-12 w-12 mb-4 text-green-500/30" />
            <h3 className="text-lg font-bold text-foreground mb-2">Select a version to compare</h3>
            <p className="font-medium text-sm">Choose another version from the history panel to see the differences.</p>
          </div>
        ) : diffLoading ? (
          <div className="flex flex-col h-full space-y-6 p-8 max-w-5xl mx-auto w-full">
            <Skeleton className="h-[400px] w-full rounded-xl bg-white/5" />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : diff ? (
          <div className="flex flex-col">
            <div className="flex sticky top-0 bg-[#0a0a0a] z-20 border-b border-border shadow-sm">
              <div className="w-1/2 p-3 font-semibold text-sm text-center text-muted-foreground bg-card border-r border-border">Base: Version {baseVersion?.versionNumber}</div>
              <div className="w-1/2 p-3 font-semibold text-sm text-center text-foreground bg-card">Compare: Version {compareVersion?.versionNumber}</div>
            </div>

            <div className="p-6 max-w-7xl mx-auto w-full space-y-8">
              
              {/* Visual Graph Diff */}
              <section>
                <h3 className="text-lg font-bold text-foreground mb-4">Visual Graph Changes</h3>
                <ReactFlowProvider>
                  <GraphDiffCanvas 
                    diff={diff} 
                    baseNodes={baseVersion?.snapshot?.nodes ?? []} 
                    baseEdges={baseVersion?.snapshot?.edges ?? []} 
                  />
                </ReactFlowProvider>
              </section>

              {diff.nodes.added.length === 0 && diff.nodes.deleted.length === 0 && diff.nodes.modified.length === 0 && (
                <div className="text-center p-8 bg-card rounded-lg border border-border mt-10">
                  <p className="text-muted-foreground">No structural or configuration changes detected between these versions.</p>
                </div>
              )}

              {/* Added Nodes */}
              {diff.nodes.added.length > 0 && (
                <section>
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <PlusCircle className="h-5 w-5 text-green-500" /> Added Steps
                  </h3>
                  <div className="space-y-4">
                    {diff.nodes.added.map((node: any) => (
                      <div key={node.id} className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                        <h4 className="font-semibold text-green-400">{node.label || node.type} <span className="text-[10px] text-muted-foreground ml-2">{node.id}</span></h4>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Removed Nodes */}
              {diff.nodes.deleted.length > 0 && (
                <section>
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <MinusCircle className="h-5 w-5 text-red-500" /> Removed Steps
                  </h3>
                  <div className="space-y-4">
                    {diff.nodes.deleted.map((node: any) => (
                      <div key={node.id} className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                        <h4 className="font-semibold text-red-400">{node.label || node.type} <span className="text-[10px] text-muted-foreground ml-2">{node.id}</span></h4>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Modified Nodes */}
              {diff.nodes.modified.length > 0 && (
                <section>
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <FileEdit className="h-5 w-5 text-blue-500" /> Modified Steps
                  </h3>
                  <div className="space-y-6">
                    {diff.nodes.modified.map((mod: any) => {
                      const beforePrompt = mod.before.configuration?.prompt;
                      const afterPrompt = mod.after.configuration?.prompt;
                      const promptChanged = beforePrompt !== afterPrompt;
                      
                      return (
                        <div key={mod.id} className="p-4 bg-muted/5 border border-border rounded-xl">
                          <h4 className="font-semibold text-foreground mb-4 pb-2 border-b border-border flex justify-between items-center">
                            <span>{mod.after.label || mod.after.type}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{mod.id}</span>
                          </h4>
                          
                          <div className="space-y-4">
                            {promptChanged && typeof beforePrompt === 'string' && typeof afterPrompt === 'string' && (
                              <PromptDiffViewer before={beforePrompt} after={afterPrompt} />
                            )}
                            
                            {/* Simple render for other config changes */}
                            {Object.keys(mod.changes).map(changeKey => {
                              if (changeKey === 'configChanged' && !promptChanged) {
                                return (
                                  <div key="config" className="text-xs text-muted-foreground p-2 bg-black/20 rounded">
                                    Configuration changed (excluding prompt)
                                  </div>
                                );
                              }
                              if (changeKey === 'labelChanged' && mod.changes.labelChanged) {
                                return (
                                  <div key="label" className="text-xs text-muted-foreground">
                                    Label changed from <span className="text-red-400 font-mono">"{mod.before.label}"</span> to <span className="text-green-400 font-mono">"{mod.after.label}"</span>
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
            <p className="font-medium text-sm">Failed to generate diff.</p>
          </div>
        )}
      </div>

      <RollbackConfirmDialog 
        open={rollbackTarget !== null}
        onOpenChange={(open) => !open && setRollbackTarget(null)}
        targetVersion={rollbackTarget || 0}
        onConfirm={handleRollback}
        isRollingBack={isRollingBack}
      />
    </div>
  );
}
