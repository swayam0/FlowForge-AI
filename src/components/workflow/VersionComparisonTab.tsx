'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { GitBranch, GitCommit, AlertCircle, PlusCircle, MinusCircle, FileEdit, Check } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

interface VersionComparisonTabProps {
  workflowId: string;
}

export function VersionComparisonTab({ workflowId }: VersionComparisonTabProps) {
  const { data: versions, isLoading } = useQuery({
    queryKey: ['workflow', workflowId, 'versions'],
    queryFn: () => api.getWorkflowVersions(workflowId),
  });

  const [versionAId, setVersionAId] = useState<string>('');
  const [versionBId, setVersionBId] = useState<string>('');

  // Auto-select the two most recent versions if available
  useMemo(() => {
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

  const diff = useMemo(() => {
    if (!versionA || !versionB) return null;

    const nodesA = versionA.snapshot.nodes || [];
    const nodesB = versionB.snapshot.nodes || [];

    const nodesMapA = new Map(nodesA.map((n: any) => [n.id, n]));
    const nodesMapB = new Map(nodesB.map((n: any) => [n.id, n]));

    const added: any[] = [];
    const removed: any[] = [];
    const modified: any[] = [];

    nodesMapB.forEach((nodeB: any, id: string) => {
      if (!nodesMapA.has(id)) {
        added.push(nodeB);
      } else {
        const nodeA = nodesMapA.get(id);
        if (JSON.stringify(nodeA.data) !== JSON.stringify(nodeB.data) || nodeA.type !== nodeB.type) {
          modified.push({ before: nodeA, after: nodeB });
        }
      }
    });

    nodesMapA.forEach((nodeA: any, id: string) => {
      if (!nodesMapB.has(id)) {
        removed.push(nodeA);
      }
    });

    return { added, removed, modified };
  }, [versionA, versionB]);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading version history...</div>;
  }

  if (!versions || versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-surface-container-low mt-4">
        <GitBranch className="h-12 w-12 text-outline-variant mb-4" />
        <h3 className="text-lg font-headline-md text-primary font-semibold">No Versions Found</h3>
        <p className="text-body-sm text-on-surface-variant mt-2 max-w-sm">
          Publish this workflow at least once to create a snapshot version.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#050505] rounded-lg border border-outline-variant overflow-hidden">
      {/* Header / Selectors */}
      <div className="flex flex-wrap items-center gap-6 p-4 border-b border-outline-variant bg-[#0a0a0a]">
        <div className="flex items-center gap-2">
          <GitCommit className="h-5 w-5 text-gray-500" />
          <span className="font-semibold text-white">Compare Versions</span>
        </div>
        
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1">Base Version (Older)</label>
            <select 
              value={versionAId} 
              onChange={(e) => setVersionAId(e.target.value)}
              className="bg-[#18181b] border border-outline-variant text-white rounded p-1.5 text-sm outline-none focus:border-blue-500"
            >
              {versions.map((v: any) => (
                <option key={v.id} value={v.id}>
                  Version {v.versionNumber} ({format(new Date(v.createdAt), 'MMM d, HH:mm')})
                </option>
              ))}
            </select>
          </div>

          <div className="text-gray-500 font-bold px-2 mt-4">&rarr;</div>

          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1">Target Version (Newer)</label>
            <select 
              value={versionBId} 
              onChange={(e) => setVersionBId(e.target.value)}
              className="bg-[#18181b] border border-outline-variant text-white rounded p-1.5 text-sm outline-none focus:border-blue-500"
            >
              {versions.map((v: any) => (
                <option key={v.id} value={v.id}>
                  Version {v.versionNumber} ({format(new Date(v.createdAt), 'MMM d, HH:mm')})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Diff Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {versionAId === versionBId ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Check className="h-12 w-12 mb-4 text-green-500/50" />
            <p>You are comparing the same version. No differences to show.</p>
          </div>
        ) : diff ? (
          <div className="max-w-4xl mx-auto space-y-6">
            
            {diff.added.length === 0 && diff.removed.length === 0 && diff.modified.length === 0 && (
              <div className="text-center p-8 bg-[#0a0a0a] rounded-lg border border-outline-variant">
                <p className="text-gray-400">No structural changes detected between these versions.</p>
              </div>
            )}

            {diff.added.length > 0 && (
              <div className="border border-green-500/30 rounded-lg overflow-hidden">
                <div className="bg-green-500/10 p-3 flex items-center gap-2 border-b border-green-500/30">
                  <PlusCircle className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold text-green-400">Nodes Added ({diff.added.length})</h3>
                </div>
                <div className="p-4 space-y-3 bg-[#0a0a0a]">
                  {diff.added.map((node: any) => (
                    <div key={node.id} className="flex justify-between items-center bg-[#18181b] p-3 rounded border border-outline-variant">
                      <div>
                        <p className="font-semibold text-white">{node.data?.label || node.type}</p>
                        <p className="text-xs text-gray-500 mt-1 font-mono">ID: {node.id} • Type: {node.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {diff.removed.length > 0 && (
              <div className="border border-red-500/30 rounded-lg overflow-hidden">
                <div className="bg-red-500/10 p-3 flex items-center gap-2 border-b border-red-500/30">
                  <MinusCircle className="h-5 w-5 text-red-500" />
                  <h3 className="font-semibold text-red-400">Nodes Removed ({diff.removed.length})</h3>
                </div>
                <div className="p-4 space-y-3 bg-[#0a0a0a]">
                  {diff.removed.map((node: any) => (
                    <div key={node.id} className="flex justify-between items-center bg-[#18181b] p-3 rounded border border-outline-variant">
                      <div>
                        <p className="font-semibold text-white">{node.data?.label || node.type}</p>
                        <p className="text-xs text-gray-500 mt-1 font-mono">ID: {node.id} • Type: {node.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {diff.modified.length > 0 && (
              <div className="border border-blue-500/30 rounded-lg overflow-hidden">
                <div className="bg-blue-500/10 p-3 flex items-center gap-2 border-b border-blue-500/30">
                  <FileEdit className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold text-blue-400">Nodes Modified ({diff.modified.length})</h3>
                </div>
                <div className="p-4 space-y-3 bg-[#0a0a0a]">
                  {diff.modified.map((mod: any) => (
                    <div key={mod.after.id} className="flex flex-col bg-[#18181b] p-3 rounded border border-outline-variant gap-2">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-white">{mod.after.data?.label || mod.after.type}</p>
                        <p className="text-xs text-gray-500 font-mono">ID: {mod.after.id}</p>
                      </div>
                      <div className="text-xs bg-[#050505] p-2 rounded text-gray-400 font-mono overflow-x-auto whitespace-pre">
                        {/* A very basic diff view - just stringifying data for simplicity in this MVP */}
                        <p className="text-red-400 line-through mb-1">- {JSON.stringify(mod.before.data)}</p>
                        <p className="text-green-400">+ {JSON.stringify(mod.after.data)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : null}
      </div>
    </div>
  );
}
