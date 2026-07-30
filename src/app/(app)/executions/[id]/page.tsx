'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ExecutionMonitor } from '@/components/execution/ExecutionMonitor';
import { ExplanationTab } from '@/components/execution/ExplanationTab';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Activity, Lightbulb } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonGraph } from '@/components/skeletons/SkeletonGraph';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type TabId = 'monitor' | 'explain';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'monitor', label: 'Monitor',     icon: Activity  },
  { id: 'explain', label: 'Explain',     icon: Lightbulb },
];

export default function ExecutionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const executionId = unwrappedParams.id;

  const [activeTab, setActiveTab] = useState<TabId>('monitor');

  const { data: execution, isLoading, isError } = useQuery({
    queryKey: ['execution', executionId],
    queryFn:  () => api.getExecution(executionId),
  });

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-4 space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-border">
          <Skeleton className="h-10 w-10 rounded-full bg-white/5" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 bg-white/5" />
            <Skeleton className="h-4 w-32 bg-white/5" />
          </div>
        </div>
        <div className="flex-1 w-full rounded-xl overflow-hidden border border-white/5">
          <SkeletonGraph />
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (isError || !execution) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] p-8">
        <div className="text-center bg-card border border-border rounded-xl p-12 shadow-sm max-w-md">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2">Execution Not Found</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            The execution trace you are looking for does not exist or there was an error loading it.
          </p>
          <Link href="/executions">
            <Button>Back to Executions</Button>
          </Link>
        </div>
      </div>
    );
  }

  // The run model has workflowVersionId which acts as the workflowId for the monitor
  const workflowId = execution.workflowVersionId || execution.workflowId;

  // ── Full page ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* ── Top bar ── */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-[#27272a] shrink-0">
        <Link
          href="/executions"
          className="p-2 hover:bg-white/5 rounded-full transition-colors"
          aria-label="Back to executions"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold truncate">Execution #{executionId.substring(0, 8)}</h1>
          <p className="text-xs text-gray-500 font-mono truncate">Workflow: {workflowId}</p>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div
        className="flex items-center gap-1 px-4 border-b border-[#27272a] bg-[#050505] shrink-0"
        role="tablist"
        aria-label="Execution detail tabs"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-selected={activeTab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setActiveTab(id)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-t',
              activeTab === id
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-300',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {/* Active underline */}
            {activeTab === id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab panels ── */}
      <div className="flex-1 overflow-hidden">
        <div
          id="panel-monitor"
          role="tabpanel"
          aria-labelledby="tab-monitor"
          className={cn('h-full', activeTab !== 'monitor' && 'hidden')}
        >
          {workflowId ? (
            <ExecutionMonitor workflowId={workflowId} executionId={executionId} />
          ) : (
            <div className="p-8 text-gray-500">Invalid execution data: missing workflow ID.</div>
          )}
        </div>

        <div
          id="panel-explain"
          role="tabpanel"
          aria-labelledby="tab-explain"
          className={cn('h-full overflow-y-auto', activeTab !== 'explain' && 'hidden')}
        >
          <ExplanationTab executionId={executionId} />
        </div>
      </div>

    </div>
  );
}
