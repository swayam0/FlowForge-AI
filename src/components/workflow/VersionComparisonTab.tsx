'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { GitBranch, GitCommit, AlertCircle, PlusCircle, MinusCircle, FileEdit, Check, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '../ui/Skeleton';
import { SkeletonCard } from '../skeletons/SkeletonCard';
import { cn } from '../../lib/utils';

interface VersionComparisonTabProps {
  workflowId: string;
}

export function VersionComparisonTab({ workflowId }: VersionComparisonTabProps) {
  const { data: versions, isLoading: versionsLoading } = useQuery({
    queryKey: ['workflow', workflowId, 'versions'],
    queryFn: () => api.getWorkflowVersions(workflowId),
  });

  const [versionAId, setVersionAId] = useState<string>('');
  const [versionBId, setVersionBId] = useState<string>('');

  // Auto-select the two most recent versions if available
  useEffect(() => {
    if (versions && versions.length >= 2 && !versionAId && !versionBId) {
      setVersionBId(versions[0].id); // Newest
      setVersionAId(versions[1].id); // Older
    } else if (versions && versions.length === 1 && !versionAId && !versionBId) {
      setVersionBId(versions[0].id);
      setVersionAId(versions[0].id);
    }
  }, [versions, versionAId, versionBId]);

  const versionA = useMemo(() => versions?.find((v: any) => v.id === versionAId), [versions, versionAId]);
  const versionB = useMemo(() => versions?.find((v: any) => v.id === versionBId), [versions, versionBId]);

  const { data: diff, isLoading: diffLoading } = useQuery({
    queryKey: ['workflow', workflowId, 'versions', 'compare', versionA?.versionNumber, versionB?.versionNumber],
    queryFn: () => {
      if (!versionA || !versionB || versionA.id === versionB.id) return null;
      return api.compareWorkflowVersions(workflowId, versionA.versionNumber, versionB.versionNumber);
    },
    enabled: !!versionA && !!versionB && versionA.id !== versionB.id,
  });

  if (versionsLoading) {
    return (
      <div className="p-8 flex gap-4">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[200px]" />
      </div>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-border rounded-lg bg-card mt-4">
        <GitBranch className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-lg text-foreground font-semibold">No Versions Found</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Publish this workflow at least once to create a snapshot version.
        </p>
      </div>
    );
  }

  const renderSideBySideDiff = (title: string, leftContent: any, rightContent: any, type: 'added' | 'removed' | 'modified') => {
    const isAdded = type === 'added';
    const isRemoved = type === 'removed';
    
    // Convert objects to pretty JSON strings if they are objects
    const formatContent = (content: any) => {
      if (!content) return '';
      if (typeof content === 'string') return content;
      return JSON.stringify(content, null, 2);
    };

    const leftStr = formatContent(leftContent);
    const rightStr = formatContent(rightContent);

    // If it's modified, we only want to show the diff for config fields
    // We'll just do a simple line-by-line visual for now, or side by side full blocks.
    
    return (
      <div className="border border-border rounded-lg overflow-hidden bg-card mb-4 flex flex-col">
        <div className={cn(
          "px-4 py-2 border-b border-border flex items-center gap-2",
          type === 'added' ? "bg-green-500/10 border-green-500/30" : 
          type === 'removed' ? "bg-red-500/10 border-red-500/30" : 
          "bg-blue-500/10 border-blue-500/30"
        )}>
          {type === 'added' && <PlusCircle className="h-4 w-4 text-green-500" />}
          {type === 'removed' && <MinusCircle className="h-4 w-4 text-red-500" />}
          {type === 'modified' && <FileEdit className="h-4 w-4 text-blue-500" />}
          <span className="font-semibold text-sm text-foreground">{title}</span>
        </div>
        
        <div className="flex divide-x divide-border">
          {/* LEFT SIDE (Older) */}
          <div className={cn("w-1/2 p-4 font-mono text-xs overflow-x-auto whitespace-pre-wrap", isAdded ? "bg-muted/10" : isRemoved ? "bg-red-500/5 text-red-400" : "bg-card text-muted-foreground")}>
            {isAdded ? <span className="opacity-50 italic">Not present in version {versionA?.versionNumber}</span> : leftStr}
          </div>
          
          {/* RIGHT SIDE (Newer) */}
          <div className={cn("w-1/2 p-4 font-mono text-xs overflow-x-auto whitespace-pre-wrap", isRemoved ? "bg-muted/10" : isAdded ? "bg-green-500/5 text-green-400" : "bg-card text-foreground")}>
            {isRemoved ? <span className="opacity-50 italic">Removed in version {versionB?.versionNumber}</span> : rightStr}
          </div>
        </div>
      </div>
    );
  };

  const renderConfigDifferences = (nodeDiff: any) => {
    const { before, after } = nodeDiff;
    const configBefore = before.configuration || {};
    const configAfter = after.configuration || {};

    const allKeys = Array.from(new Set([...Object.keys(configBefore), ...Object.keys(configAfter)]));
    
    const diffs: React.ReactNode[] = [];

    // Check basic properties
    if (before.label !== after.label) {
      diffs.push(renderSideBySideDiff(`Label changed`, before.label, after.label, 'modified'));
    }
    if (before.type !== after.type) {
      diffs.push(renderSideBySideDiff(`Type changed`, before.type, after.type, 'modified'));
    }

    allKeys.forEach(key => {
      const valA = configBefore[key];
      const valB = configAfter[key];
      if (JSON.stringify(valA) !== JSON.stringify(valB)) {
        diffs.push(
          <div key={key}>
            {renderSideBySideDiff(`Configuration changed: ${key}`, valA, valB, 'modified')}
          </div>
        );
      }
    });

    return diffs;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-[#050505] rounded-xl border border-border overflow-hidden shadow-sm">
      {/* Header / Selectors */}
      <div className="flex flex-wrap items-center gap-6 p-4 border-b border-border bg-[#0a0a0a] shrink-0">
        <div className="flex items-center gap-2">
          <GitCommit className="h-5 w-5 text-muted-foreground" />
          <span className="font-bold text-foreground tracking-tight">Compare Versions</span>
        </div>
        
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">Base (Older)</label>
            <select 
              value={versionAId} 
              onChange={(e) => setVersionAId(e.target.value)}
              className="bg-card border border-border text-foreground rounded-md p-1.5 text-sm outline-none focus:border-blue-500 font-medium"
            >
              {versions.map((v: any) => (
                <option key={v.id} value={v.id}>
                  v{v.versionNumber} ({format(new Date(v.createdAt), 'MMM d, HH:mm')})
                </option>
              ))}
            </select>
          </div>

          <ArrowRightLeft className="h-4 w-4 text-muted-foreground mt-4" />

          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">Compare (Newer)</label>
            <select 
              value={versionBId} 
              onChange={(e) => setVersionBId(e.target.value)}
              className="bg-card border border-border text-foreground rounded-md p-1.5 text-sm outline-none focus:border-blue-500 font-medium"
            >
              {versions.map((v: any) => (
                <option key={v.id} value={v.id}>
                  v{v.versionNumber} ({format(new Date(v.createdAt), 'MMM d, HH:mm')})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Diff Content */}
      <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
        {versionAId === versionBId ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Check className="h-12 w-12 mb-4 text-green-500/50" />
            <p className="font-medium text-sm">You are comparing the same version. No differences to show.</p>
          </div>
        ) : diffLoading ? (
          <div className="flex flex-col h-full space-y-4 p-8 max-w-5xl mx-auto w-full">
            <Skeleton className="h-10 w-1/3 mb-4 bg-white/5" />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : diff ? (
          <div className="flex flex-col">
            {/* Split View Header */}
            <div className="flex sticky top-0 bg-[#0a0a0a] z-10 border-b border-border shadow-sm">
              <div className="w-1/2 p-3 font-semibold text-sm text-center text-muted-foreground bg-card border-r border-border">Base: Version {versionA?.versionNumber}</div>
              <div className="w-1/2 p-3 font-semibold text-sm text-center text-foreground bg-card">Compare: Version {versionB?.versionNumber}</div>
            </div>

            <div className="p-6 max-w-7xl mx-auto w-full space-y-8">
              
              {diff.nodes.added.length === 0 && diff.nodes.deleted.length === 0 && diff.nodes.modified.length === 0 && (
                <div className="text-center p-8 bg-card rounded-lg border border-border mt-10">
                  <p className="text-muted-foreground">No structural or configuration changes detected between these versions.</p>
                </div>
              )}

              {/* ADDED NODES */}
              {diff.nodes.added.length > 0 && (
                <section>
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <PlusCircle className="h-5 w-5 text-green-500" /> Added Steps
                  </h3>
                  {diff.nodes.added.map((node: any) => (
                    <div key={node.id}>
                      {renderSideBySideDiff(`New Step: ${node.data?.label || node.type} (${node.id})`, null, node.configuration, 'added')}
                    </div>
                  ))}
                </section>
              )}

              {/* DELETED NODES */}
              {diff.nodes.deleted.length > 0 && (
                <section>
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <MinusCircle className="h-5 w-5 text-red-500" /> Removed Steps
                  </h3>
                  {diff.nodes.deleted.map((node: any) => (
                    <div key={node.id}>
                      {renderSideBySideDiff(`Deleted Step: ${node.data?.label || node.type} (${node.id})`, node.configuration, null, 'removed')}
                    </div>
                  ))}
                </section>
              )}

              {/* MODIFIED NODES */}
              {diff.nodes.modified.length > 0 && (
                <section>
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <FileEdit className="h-5 w-5 text-blue-500" /> Modified Steps
                  </h3>
                  <div className="space-y-6">
                    {diff.nodes.modified.map((mod: any) => (
                      <div key={mod.id} className="p-4 bg-muted/5 border border-border rounded-xl">
                        <h4 className="font-semibold text-foreground mb-4 pb-2 border-b border-border flex justify-between items-center">
                          <span>{mod.after.label || mod.after.type}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{mod.id}</span>
                        </h4>
                        
                        <div className="space-y-2">
                          {renderConfigDifferences(mod)}
                        </div>
                      </div>
                    ))}
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
    </div>
  );
}
