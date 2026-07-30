'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { 
  Play, Pause, XCircle, CheckCircle, Activity, Terminal, 
  RefreshCcw, AlertTriangle, FileJson, Database, 
  Search, ShieldAlert, Clock, Network, BrainCircuit, User,
  ChevronDown, ChevronRight, Copy, Download, Filter, ChevronUp
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { StatusBadge } from '../ui/StatusBadge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Execution, ExecutionLog, WorkflowNode } from '../../types';
import { useInspectorStore } from '../../lib/store';
import { useReplayStore } from '../../lib/replayStore';
import { NodeInspector } from './NodeInspector';
import { ReplayMode } from './replay/ReplayMode';

export function ExecutionMonitor({ workflowId, executionId }: { workflowId: string, executionId?: string }) {
  const { data: history } = useQuery({
    queryKey: ['history'],
    queryFn: () => api.getHistory(),
    refetchInterval: 3000,
    enabled: !executionId,
  });

  const { data: specificExecution } = useQuery({
    queryKey: ['execution', executionId],
    queryFn: () => api.getExecution(executionId!),
    refetchInterval: 3000,
    enabled: !!executionId,
  });

  const { data: workflow } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: () => api.getWorkflow(workflowId),
  });

  const activeExecution = executionId 
    ? specificExecution 
    : history?.find((h: Execution) => (h.workflowVersionId || h.workflowId) === workflowId);

  const { data: stepLogs } = useQuery({
    queryKey: ['logs', activeExecution?.id],
    queryFn: () => api.getExecutionLogs(activeExecution?.id as string),
    refetchInterval: (activeExecution?.status === 'RUNNING' || activeExecution?.status === 'PAUSED') ? 3000 : false,
    enabled: !!activeExecution?.id,
  });

  const inspectorStore = useInspectorStore();
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const stepDurations = useMemo(() => {
    if (!stepLogs) return {};
    const durations: Record<string, number> = {};
    const grouped = stepLogs.reduce((acc: Record<string, ExecutionLog[]>, log: ExecutionLog) => {
      if (log.stepId) {
        if (!acc[log.stepId]) acc[log.stepId] = [];
        acc[log.stepId].push(log);
      }
      return acc;
    }, {});

    Object.keys(grouped).forEach(stepId => {
      const logs = grouped[stepId];
      if (logs.length > 1) {
        const first = new Date(logs[0].timestamp).getTime();
        const last = new Date(logs[logs.length - 1].timestamp).getTime();
        durations[stepId] = Math.max(last - first, 1);
      }
    });
    return durations;
  }, [stepLogs]);

  if (!activeExecution) {
    return (
      <div className="flex-1 flex flex-col h-[calc(100vh-56px)] items-center justify-center bg-black">
        <Activity className="h-6 w-6 text-gray-500 animate-pulse mb-4" />
        <p className="text-gray-500 text-sm">Loading execution data...</p>
      </div>
    );
  }

  const isRunning = activeExecution.status === 'RUNNING';
  const isSuccess = activeExecution.status === 'COMPLETED';
  const isFailed = activeExecution.status === 'FAILED';
  const isPaused = activeExecution.status === 'PAUSED';
  const isCancelled = activeExecution.status === 'CANCELLED';

  const formatDuration = (ms: number) => {
    if (!ms) return '0.00s';
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const isAwaitingHuman = isPaused && workflow?.nodes?.find((n: WorkflowNode) => n.id === activeExecution.executionPath?.[(activeExecution.executionPath?.length || 1) - 1])?.type === 'human_approval';

  const executionPath = activeExecution.executionPath || [];
  
  // Calculate node status
  const getNodeStatus = (nodeId: string, idx: number) => {
    const isLast = idx === executionPath.length - 1;
    if (isLast) {
      if (isRunning) return 'running';
      if (isPaused) return 'paused';
      if (isFailed) return 'failed';
      if (isCancelled) return 'cancelled';
      if (isSuccess) return 'success';
    }
    return 'success'; // Earlier nodes are successful
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] w-full bg-black overflow-hidden selection:bg-blue-500/30">
      {/* Header */}
      <header className="shrink-0 bg-[#0a0a0a] border-b border-white/5 px-8 py-5 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Execution <span className="text-gray-500 font-mono text-sm ml-2">#{activeExecution.id.substring(0,8)}</span>
            </h1>
            <StatusBadge status={activeExecution.status} className="bg-white/5 border border-white/10" />
            {isAwaitingHuman && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-medium rounded-full animate-pulse">
                <User className="h-3 w-3" /> Waiting for Approval
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Triggered from <span className="text-gray-300 font-medium">{workflow?.name || activeExecution.workflowId}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="h-4 w-4" />
            <span className="font-mono text-white">{formatDuration(activeExecution.durationMs || 0)}</span>
          </div>
          
          <div className="h-4 w-px bg-white/10 mx-2" />

          <div className="flex gap-2">
            {(isSuccess || isFailed) && (
              <button 
                onClick={() => useReplayStore.getState().open(activeExecution.durationMs || 10000)}
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-all text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 mr-2"
              >
                <Play className="h-4 w-4" /> Replay Execution
              </button>
            )}
            {isRunning && (
              <button className="px-4 py-2 rounded-md bg-white/5 hover:bg-white/10 text-white transition-colors text-sm font-medium flex items-center gap-2 border border-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                <Pause className="h-4 w-4" /> Pause
              </button>
            )}
            {isPaused && (
              <button className="px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors text-sm font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
                <Play className="h-4 w-4" /> Resume
              </button>
            )}
            {(isFailed || isCancelled) && (
              <button className="px-4 py-2 rounded-md bg-white text-black hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                <RefreshCcw className="h-4 w-4" /> Retry
              </button>
            )}
            {(isRunning || isPaused) && (
              <button className="px-4 py-2 rounded-md hover:bg-red-500/10 text-red-400 transition-colors text-sm font-medium flex items-center gap-2 border border-transparent hover:border-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                <XCircle className="h-4 w-4" /> Cancel
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Timeline View */}
      <main className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full custom-scrollbar">
        <div className="space-y-6 pb-20 relative">
          
          {executionPath.length === 0 && !isSuccess && !isFailed && (
             <div className="text-center text-gray-500 py-12">
               <Activity className="h-8 w-8 mx-auto mb-4 animate-pulse opacity-50" />
               Initializing execution engine...
             </div>
          )}

          {executionPath.map((nodeId: string, idx: number) => {
            const status = getNodeStatus(nodeId, idx);
            const nodeDef = workflow?.nodes?.find((n: WorkflowNode) => n.id === nodeId);
            const isExpanded = expandedStep === nodeId;
            const duration = stepDurations[nodeId];
            
            // Extract AI Reasoning for the card preview
            const nodeLogs = stepLogs?.filter((l: ExecutionLog) => l.stepId === nodeId) || [];
            const aiLog = nodeLogs.slice().reverse().find((l: ExecutionLog) => l.reason?.includes('thinking') || l.reason?.includes('Analyzing') || l.eventType === 'LLM_REASONING');
            const reasonText = aiLog?.reason || nodeLogs.slice().reverse().find((l: ExecutionLog) => l.reason)?.reason;

            return (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                key={idx} 
                className="relative"
              >
                {/* Timeline connector line */}
                {idx !== executionPath.length - 1 && (
                  <div className="absolute left-6 top-14 bottom-[-24px] w-0.5 bg-white/5 z-0" />
                )}
                
                <div className="relative z-10 flex gap-6">
                  {/* Status Icon */}
                  <div className="shrink-0 mt-1">
                    <div className={cn(
                      "w-12 h-12 rounded-full border-4 border-black flex items-center justify-center relative overflow-hidden",
                      status === 'success' ? "bg-green-500/20 text-green-500" :
                      status === 'failed' || status === 'cancelled' ? "bg-red-500/20 text-red-500" :
                      status === 'running' ? "bg-blue-500/20 text-blue-500" :
                      "bg-yellow-500/20 text-yellow-500"
                    )}>
                      {status === 'running' && <div className="absolute inset-0 bg-blue-500/20 animate-ping" />}
                      {status === 'success' ? <CheckCircle className="h-5 w-5" /> :
                       status === 'failed' || status === 'cancelled' ? <XCircle className="h-5 w-5" /> :
                       status === 'running' ? <Activity className="h-5 w-5 relative z-10" /> :
                       <Pause className="h-5 w-5" />}
                    </div>
                  </div>

                  {/* Card */}
                  <div className={cn(
                    "flex-1 rounded-xl border bg-[#0a0a0a] transition-all overflow-hidden",
                    status === 'running' ? "border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.1)]" : "border-white/5",
                    inspectorStore.selectedStepId === nodeId ? "border-white/30 bg-white/[0.02]" : ""
                  )}>
                    <div 
                      role="button"
                      tabIndex={0}
                      className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] focus-visible:outline-none focus-visible:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
                      onClick={() => inspectorStore.open(nodeId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          inspectorStore.open(nodeId);
                        }
                      }}
                    >
                      <div>
                        <h3 className="font-semibold text-white flex items-center gap-2">
                          {String(nodeDef?.data?.label || nodeDef?.type || nodeId)}
                          {status === 'running' && <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">Running</span>}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 capitalize">{nodeDef?.type?.replace('_', ' ')} • {duration ? formatDuration(duration) : '-'}</p>
                      </div>
                      <div className="text-gray-500">
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      </div>
                    </div>


                  </div>
                </div>
              </motion.div>
            );
          })}
          
          {/* Final success marker */}
          {isSuccess && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: executionPath.length * 0.1 }}
              className="relative z-10 flex gap-6"
            >
              <div className="shrink-0 mt-1">
                <div className="w-12 h-12 rounded-full border-4 border-black bg-green-500/20 text-green-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>
              <div className="flex items-center">
                <span className="font-semibold text-green-400 text-lg">Execution Completed Successfully</span>
              </div>
            </motion.div>
          )}

          {isFailed && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: executionPath.length * 0.1 }}
              className="relative z-10 flex gap-6"
            >
              <div className="shrink-0 mt-1">
                <div className="w-12 h-12 rounded-full border-4 border-black bg-red-500/20 text-red-500 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                  <ShieldAlert className="h-6 w-6" />
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <span className="font-semibold text-red-400 text-lg">Execution Failed</span>
                <span className="text-sm text-gray-500 mt-1">{activeExecution.error || 'An unexpected error occurred.'}</span>
              </div>
            </motion.div>
          )}

        </div>
      </main>

      {/* Slide-in Inspector Panel */}
      {activeExecution?.id && workflow?.nodes && (
        <NodeInspector 
          executionId={activeExecution.id} 
          workflowNodes={workflow.nodes} 
        />
      )}

      {/* Full-screen Replay Mode */}
      {activeExecution?.id && workflow?.id && (
        <ReplayMode 
          executionId={activeExecution.id}
          workflowId={workflow.id}
        />
      )}
    </div>
  );
}
