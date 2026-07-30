'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ExecutionMonitor } from '@/components/execution/ExecutionMonitor';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonGraph } from '@/components/skeletons/SkeletonGraph';
import { Button } from '@/components/ui/Button';

export default function ExecutionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const executionId = unwrappedParams.id;

  const { data: execution, isLoading, isError } = useQuery({
    queryKey: ['execution', executionId],
    queryFn: () => api.getExecution(executionId),
  });

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

  if (isError || !execution) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] p-8">
        <div className="text-center bg-card border border-border rounded-xl p-12 shadow-sm max-w-md">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2">Execution Not Found</h2>
          <p className="text-muted-foreground mb-6 text-sm">The execution trace you are looking for does not exist or there was an error loading it.</p>
          <Link href="/executions">
            <Button>Back to Executions</Button>
          </Link>
        </div>
      </div>
    );
  }

  // The run model has workflowVersionId which acts as the workflowId for the monitor
  const workflowId = execution.workflowVersionId || execution.workflowId;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 p-4 border-b border-[#27272a]">
        <Link href="/executions" className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Execution #{executionId.substring(0, 8)}</h1>
          <p className="text-sm text-gray-500 font-mono">Workflow: {workflowId}</p>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {workflowId ? (
          <ExecutionMonitor workflowId={workflowId} executionId={executionId} />
        ) : (
          <div className="p-8">Invalid execution data: missing workflow ID.</div>
        )}
      </div>
    </div>
  );
}
