'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { ExecutionMonitor } from '../../../components/execution/ExecutionMonitor';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ExecutionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const executionId = unwrappedParams.id;
  
  console.log(`[DEBUG Frontend executions/[id]/page.tsx] Rendering for executionId: ${executionId}`);

  const { data: execution, isLoading } = useQuery({
    queryKey: ['execution', executionId],
    queryFn: () => api.getExecution(executionId),
  });

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] w-full flex items-center justify-center bg-[#050505] animate-pulse">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin"></div>
          <div className="h-4 w-32 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] p-8">
        <h1 className="text-2xl font-bold mb-4">Execution not found</h1>
        <Link href="/executions" className="text-blue-500 hover:underline">
          Return to Executions
        </Link>
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
