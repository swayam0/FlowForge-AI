'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { format, differenceInMilliseconds } from 'date-fns';
import { 
  X, Server, FileJson, Activity, Terminal, BrainCircuit, 
  CheckCircle, XCircle, Clock, PlayCircle, SkipForward, ArrowRight 
} from 'lucide-react';
import { useInspectorStore } from '@/lib/store';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { JsonViewer } from './JsonViewer';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { WorkflowStepType } from '@/types/common';

interface NodeInspectorProps {
  executionId: string;
  workflowNodes: any[]; // The nodes from the workflow builder definition
}

export function NodeInspector({ executionId, workflowNodes }: NodeInspectorProps) {
  const { selectedStepId, isOpen, close } = useInspectorStore();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: steps, isLoading: loadingSteps } = useQuery({
    queryKey: ['steps', executionId],
    queryFn: () => api.getExecutionSteps(executionId),
    refetchInterval: 2000,
    enabled: isOpen,
  });

  const { data: logs, isLoading: loadingLogs } = useQuery({
    queryKey: ['logs', executionId],
    queryFn: () => api.getExecutionLogs(executionId),
    refetchInterval: 2000,
    enabled: isOpen,
  });

  if (!isOpen || !selectedStepId) return null;

  const nodeDef = workflowNodes.find(n => n.id === selectedStepId);
  const stepData = steps?.find((s: any) => s.stepId === selectedStepId);
  const stepLogs = logs?.filter((l: any) => l.stepId === selectedStepId) || [];

  const isAI = nodeDef?.data?.type === WorkflowStepType.AI_EXTRACTION || nodeDef?.data?.type === WorkflowStepType.AI_CLASSIFICATION;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'input', label: 'Input', icon: FileJson },
    { id: 'output', label: 'Output', icon: FileJson },
    { id: 'execution', label: 'Execution', icon: Server },
    { id: 'logs', label: 'Logs', icon: Terminal },
  ];

  if (isAI) {
    tabs.push({ id: 'ai', label: 'AI Details', icon: BrainCircuit });
  }

  // Ensure active tab is valid
  if (activeTab === 'ai' && !isAI) {
    setActiveTab('overview');
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-bold uppercase tracking-wider"><CheckCircle className="h-3.5 w-3.5" /> Completed</span>;
      case 'running':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold uppercase tracking-wider"><Activity className="h-3.5 w-3.5 animate-pulse" /> Running</span>;
      case 'failed':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold uppercase tracking-wider"><XCircle className="h-3.5 w-3.5" /> Failed</span>;
      case 'skipped':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20 text-xs font-bold uppercase tracking-wider"><SkipForward className="h-3.5 w-3.5" /> Skipped</span>;
      default:
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs font-bold uppercase tracking-wider"><Clock className="h-3.5 w-3.5" /> Waiting</span>;
    }
  };

  const renderContent = () => {
    if (loadingSteps) {
      return (
        <div className="p-6 space-y-6">
          <Skeleton className="h-32 w-full bg-white/5 rounded-xl" />
          <Skeleton className="h-64 w-full bg-white/5 rounded-xl" />
        </div>
      );
    }

    if (!stepData && !nodeDef) {
      return <EmptyState icon={Server} title="Data not found" description="Unable to find execution data for this node." className="border-none mt-12" />;
    }

    const duration = stepData?.startedAt && stepData?.completedAt
      ? differenceInMilliseconds(new Date(stepData.completedAt), new Date(stepData.startedAt))
      : null;

    if (activeTab === 'overview') {
      return (
        <div className="p-6 space-y-6">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">Status</p>
                <div>{getStatusBadge(stepData?.status || 'pending')}</div>
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">Duration</p>
                <p className="text-sm text-gray-200 font-mono">{duration ? `${duration}ms` : '--'}</p>
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">Started</p>
                <p className="text-sm text-gray-200">{stepData?.startedAt ? format(new Date(stepData.startedAt), 'MMM d, HH:mm:ss.SSS') : '--'}</p>
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">Completed</p>
                <p className="text-sm text-gray-200">{stepData?.completedAt ? format(new Date(stepData.completedAt), 'MMM d, HH:mm:ss.SSS') : '--'}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5 space-y-4">
             <h4 className="text-sm font-semibold text-gray-200">Execution Metadata</h4>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">Retry Count</p>
                  <p className="text-sm text-gray-200 font-mono">{stepData?.metadata?.attemptNumber || 1}</p>
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">Node ID</p>
                  <p className="text-sm text-gray-200 font-mono truncate">{selectedStepId}</p>
                </div>
             </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'input') {
      return (
        <div className="p-4 h-[calc(100vh-140px)]">
          <JsonViewer data={stepData?.input || {}} className="h-full" />
        </div>
      );
    }

    if (activeTab === 'output') {
      return (
        <div className="p-4 h-[calc(100vh-140px)]">
          <JsonViewer data={stepData?.output || {}} className="h-full" />
        </div>
      );
    }

    if (activeTab === 'execution') {
      return (
        <div className="p-6 space-y-6">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-6">
            <h4 className="text-sm font-semibold text-gray-200 mb-6">Execution Timeline</h4>
            <div className="relative border-l border-white/10 ml-3 space-y-8">
              <div className="relative">
                <div className="absolute -left-[37px] bg-blue-500/20 text-blue-400 rounded-full p-1 border border-blue-500/30">
                  <PlayCircle className="h-5 w-5" />
                </div>
                <div className="pl-4">
                  <p className="text-sm font-semibold text-gray-200">Started</p>
                  <p className="text-xs text-gray-500">{stepData?.startedAt ? format(new Date(stepData.startedAt), 'HH:mm:ss.SSS') : '--'}</p>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute -left-[37px] bg-yellow-500/20 text-yellow-400 rounded-full p-1 border border-yellow-500/30">
                  <Activity className="h-5 w-5" />
                </div>
                <div className="pl-4">
                  <p className="text-sm font-semibold text-gray-200">Executing</p>
                  <p className="text-xs text-gray-500">Worker ID: {stepData?.metadata?.workerId || 'default-worker'}</p>
                </div>
              </div>

              <div className="relative">
                <div className={cn(
                  "absolute -left-[37px] rounded-full p-1 border",
                  stepData?.status === 'completed' ? "bg-green-500/20 text-green-400 border-green-500/30" :
                  stepData?.status === 'failed' ? "bg-red-500/20 text-red-400 border-red-500/30" :
                  "bg-gray-500/20 text-gray-400 border-gray-500/30"
                )}>
                  {stepData?.status === 'completed' ? <CheckCircle className="h-5 w-5" /> :
                   stepData?.status === 'failed' ? <XCircle className="h-5 w-5" /> :
                   <Clock className="h-5 w-5" />}
                </div>
                <div className="pl-4">
                  <p className="text-sm font-semibold text-gray-200 capitalize">{stepData?.status || 'Pending'}</p>
                  <p className="text-xs text-gray-500">{stepData?.completedAt ? format(new Date(stepData.completedAt), 'HH:mm:ss.SSS') : '--'}</p>
                  {stepData?.error && (
                    <p className="mt-2 text-sm text-red-400 bg-red-500/10 p-2 rounded-md border border-red-500/20">{stepData.error}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5 space-y-4">
             <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">Execution ID</p>
                  <p className="text-sm text-gray-200 font-mono truncate">{stepData?.id || '--'}</p>
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">Run ID</p>
                  <p className="text-sm text-gray-200 font-mono truncate">{executionId}</p>
                </div>
             </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'logs') {
      return (
        <div className="p-4 h-[calc(100vh-140px)]">
          <div className="flex flex-col h-full bg-[#050505] border border-white/5 rounded-lg overflow-hidden">
            <div className="flex-1 overflow-auto p-4 custom-scrollbar">
              {loadingLogs ? (
                 <div className="space-y-4">
                   <Skeleton className="h-6 w-full bg-white/5" />
                   <Skeleton className="h-6 w-3/4 bg-white/5" />
                 </div>
              ) : stepLogs.length === 0 ? (
                <EmptyState icon={Terminal} title="No logs found" description="No execution logs for this step." className="border-none mt-12" />
              ) : (
                <div className="space-y-2 font-mono text-[11px]">
                  {stepLogs.map((log: any, idx: number) => {
                    const time = new Date(log.timestamp);
                    const levelColor = 
                      log.level === 'INFO' ? 'text-blue-400' :
                      log.level === 'ERROR' ? 'text-red-400' :
                      log.level === 'WARN' ? 'text-yellow-400' : 'text-green-400';
                    
                    return (
                      <div key={idx} className="flex gap-4 p-2.5 border-b border-white/5 last:border-0 hover:bg-white/5 rounded">
                        <span className="text-gray-600 shrink-0">{format(time, 'HH:mm:ss.SSS')}</span>
                        <span className={cn(levelColor, "font-bold w-12 shrink-0")}>{log.level}</span>
                        <span className="text-gray-300 break-words">{log.reason || log.message || JSON.stringify(log)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'ai' && isAI) {
      const config = nodeDef?.data?.configuration || {};
      const aiMeta = stepData?.metadata || {};
      
      return (
        <div className="p-6 space-y-6 h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5 space-y-4">
             <h4 className="text-sm font-semibold text-gray-200">Model Configuration</h4>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">Model</p>
                  <p className="text-sm text-gray-200 font-mono">{config.model || 'gpt-4o'}</p>
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">Temperature</p>
                  <p className="text-sm text-gray-200 font-mono">{config.temperature ?? 0.7}</p>
                </div>
             </div>
             <div>
                <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">Prompt</p>
                <div className="bg-[#050505] border border-white/10 rounded-md p-3 text-sm text-gray-300 font-mono">
                  {config.prompt || 'No prompt configured.'}
                </div>
             </div>
          </div>
          
          <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5 space-y-4">
             <h4 className="text-sm font-semibold text-gray-200">Execution Results</h4>
             
             {aiMeta.reasoningSummary && (
               <div className="bg-purple-500/10 border border-purple-500/20 rounded-md p-4 space-y-2">
                 <p className="text-xs font-mono uppercase tracking-widest text-purple-400/80 flex items-center gap-2">
                   <BrainCircuit className="h-3.5 w-3.5" /> Reasoning
                 </p>
                 <p className="text-sm text-purple-200 italic">{aiMeta.reasoningSummary}</p>
               </div>
             )}

             <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">Tokens (Prompt)</p>
                  <p className="text-sm text-gray-200 font-mono">{aiMeta.tokenUsage?.promptTokens || '--'}</p>
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">Tokens (Completion)</p>
                  <p className="text-sm text-gray-200 font-mono">{aiMeta.tokenUsage?.completionTokens || '--'}</p>
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">Tokens (Total)</p>
                  <p className="text-sm text-gray-200 font-mono">{aiMeta.tokenUsage?.totalTokens || '--'}</p>
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">Est. Cost</p>
                  <p className="text-sm text-green-400 font-mono">{aiMeta.cost ? `$${aiMeta.cost.toFixed(4)}` : '--'}</p>
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">Latency</p>
                  <p className="text-sm text-gray-200 font-mono">{aiMeta.latencyMs ? `${aiMeta.latencyMs}ms` : '--'}</p>
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">Confidence</p>
                  <p className="text-sm text-gray-200 font-mono">{aiMeta.confidence ? `${aiMeta.confidence}%` : '--'}</p>
                </div>
             </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-[64px] right-0 bottom-0 w-[560px] bg-[#0a0a0a]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-50 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0 bg-[#050505]">
            <div className="flex flex-col">
              <span className="font-label-mono text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                Node Inspector <ArrowRight className="h-3 w-3" /> {nodeDef?.data?.type?.replace('_', ' ')}
              </span>
              <div className="flex items-center gap-3 mt-1">
                <h3 className="text-lg font-semibold text-gray-200 tracking-tight">{nodeDef?.data?.label || selectedStepId}</h3>
                {getStatusBadge(stepData?.status)}
              </div>
            </div>
            <button 
              onClick={close} 
              className="p-2 rounded-md hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-white" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-white/5 px-2 bg-[#050505] shrink-0 custom-scrollbar">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap focus:outline-none",
                    isActive 
                      ? "border-blue-500 text-blue-400" 
                      : "border-transparent text-gray-400 hover:text-gray-200 hover:border-white/20"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-blue-400" : "text-gray-500")} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-[#050505]">
            {renderContent()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
