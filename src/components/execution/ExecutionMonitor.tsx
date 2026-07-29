'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { 
  Play, Pause, XCircle, CheckCircle, Activity, Terminal, 
  RefreshCcw, AlertTriangle, FileJson, Info, Database, 
  Search, ShieldAlert, Clock, Network
} from 'lucide-react';
import { ReactFlow, Background, Controls, MiniMap, BackgroundVariant, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { BaseNode } from '../workflow/CustomNodes';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { StatusBadge } from '../ui/StatusBadge';

const nodeTypes = {
  customNode: BaseNode,
};

function ExecutionMonitorInner({ workflowId, executionId }: { workflowId: string, executionId?: string }) {
  // Fetch History for Execution State if monitoring globally
  const { data: history } = useQuery({
    queryKey: ['history'],
    queryFn: () => api.getHistory(),
    refetchInterval: 3000,
    enabled: !executionId,
  });

  // Fetch specific execution if monitoring a specific one
  const { data: specificExecution } = useQuery({
    queryKey: ['execution', executionId],
    queryFn: () => api.getExecution(executionId!),
    refetchInterval: 3000,
    enabled: !!executionId,
  });

  // Fetch Workflow Topology
  const { data: workflow } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: () => api.getWorkflow(workflowId),
  });

  const activeExecution = executionId 
    ? specificExecution 
    : history?.find((h: any) => (h.workflowVersionId || h.workflowId) === workflowId);

  // Fetch logs for the active execution
  const { data: stepLogs } = useQuery({
    queryKey: ['logs', activeExecution?.id],
    queryFn: () => api.getExecutionLogs(activeExecution?.id),
    refetchInterval: activeExecution?.status === 'RUNNING' ? 3000 : false,
    enabled: !!activeExecution?.id,
  });

  // Bottom Panel State
  const [activeTab, setActiveTab] = useState('logs');
  const [logSearch, setLogSearch] = useState('');
  
  // Right Panel State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Compute ReactFlow Nodes & Edges
  const { nodes, edges } = useMemo(() => {
    if (!workflow) return { nodes: [], edges: [] };
    
    let path = activeExecution?.executionPath || [];
    const isRunning = activeExecution?.status === 'RUNNING';
    const isSuccess = activeExecution?.status === 'SUCCESS';
    const isFailed = activeExecution?.status === 'FAILED';
    const isPaused = activeExecution?.status === 'PAUSED';

    const rfNodes = workflow.nodes.map((n: any) => {
      let status = 'pending';
      const idx = path.indexOf(n.id);
      
      if (idx !== -1) {
        if (isSuccess || idx < path.length - 1) {
          status = 'completed';
        } else if (isFailed && idx === path.length - 1) {
          status = 'failed';
        } else if (isPaused && idx === path.length - 1) {
          status = 'paused';
        } else if (isRunning && idx === path.length - 1) {
          status = 'running';
        }
      }

      return {
        id: n.id,
        type: 'customNode',
        position: n.position || { x: 250, y: 150 },
        data: { 
          label: n.name, 
          type: n.type, 
          configuration: n.configuration,
          executionStatus: status
        }
      };
    });

    const rfEdges = workflow.edges.map((e: any) => {
      const sourceIdx = path.indexOf(e.source);
      const targetIdx = path.indexOf(e.target);
      const isActive = isRunning && sourceIdx !== -1 && targetIdx === -1 && path[path.length - 1] === e.source;
      const isCompleted = sourceIdx !== -1 && targetIdx !== -1 && sourceIdx < targetIdx;
      
      return {
        id: `${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        animated: isActive,
        style: {
          stroke: isCompleted ? '#22c55e' : isActive ? '#3b82f6' : '#3f3f46',
          strokeWidth: isActive || isCompleted ? 2 : 1
        }
      };
    });

    return { nodes: rfNodes, edges: rfEdges };
  }, [workflow, activeExecution]);

  if (!activeExecution) {
    return (
      <div className="flex flex-col flex-1 h-[calc(100vh-64px)] items-center justify-center bg-[#050505]">
        <Activity className="h-12 w-12 text-gray-500 mb-4 animate-pulse" />
        <h3 className="text-lg font-headline-md font-semibold text-white">
          {executionId ? "No executions found for this workflow." : "No Active Execution"}
        </h3>
        <p className="font-body-sm text-gray-400 mt-1">
          {executionId ? "The requested execution does not exist." : "Run the workflow to monitor it here."}
        </p>
      </div>
    );
  }

  const isRunning = activeExecution.status === 'RUNNING';
  const isSuccess = activeExecution.status === 'SUCCESS';
  const isFailed = activeExecution.status === 'FAILED';
  const isPaused = activeExecution.status === 'PAUSED';

  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.min(Math.round(((activeExecution.executionPath?.length || 0) / Math.max(workflow?.nodes?.length || 1, 1)) * 100), 100);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full bg-[#050505] overflow-hidden">
      
      {/* 1. Execution Header */}
      <header className="h-16 shrink-0 bg-[#0a0a0a] border-b border-outline-variant flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-lg font-display font-semibold text-white">{workflow?.name || activeExecution.workflowId}</h1>
            <span className="text-[10px] font-label-mono text-gray-500 uppercase tracking-widest">
              v{activeExecution.version || workflow?.version || 1} • Execution ID: {activeExecution.id.substring(0,8)}
            </span>
          </div>
          
          <StatusBadge status={activeExecution.status} className="px-3 py-1.5 text-xs border-dashed bg-transparent" />

          <div className="flex items-center gap-2 text-gray-400 border-l border-outline-variant pl-6">
            <Clock className="h-4 w-4" />
            <span className="font-label-mono text-sm">{formatDuration(activeExecution.durationMs)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-3 py-1.5 rounded text-gray-400 border border-outline-variant hover:bg-white/5 transition-colors text-xs font-semibold flex items-center gap-2">
            <Pause className="h-3.5 w-3.5" /> Pause
          </button>
          <button className="px-3 py-1.5 rounded text-blue-400 border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-colors text-xs font-semibold flex items-center gap-2">
            <RefreshCcw className="h-3.5 w-3.5" /> Retry
          </button>
          <button className="px-3 py-1.5 rounded text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-colors text-xs font-semibold flex items-center gap-2">
            <XCircle className="h-3.5 w-3.5" /> Cancel
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* 2 & 4. Left Panel: Progress Overview & Live Activity */}
        <aside className="w-[320px] bg-[#0a0a0a] border-r border-outline-variant flex flex-col shrink-0 z-10">
          <div className="p-5 border-b border-outline-variant shrink-0">
            <h3 className="text-[11px] font-label-mono uppercase tracking-widest text-gray-500 mb-4">Progress Overview</h3>
            <div className="flex items-end justify-between mb-2">
              <span className="text-3xl font-display font-semibold text-white">{isSuccess ? 100 : progressPercent}%</span>
              <span className="text-xs text-gray-500 mb-1">
                {activeExecution.executionPath?.length || 0} / {workflow?.nodes?.length || 0} Nodes
              </span>
            </div>
            <div className="w-full h-2 bg-[#18181b] rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isSuccess ? "bg-green-500" : isFailed ? "bg-red-500" : "bg-blue-500"
                )} 
                style={{ width: `${isSuccess ? 100 : progressPercent}%` }}
              />
            </div>
            <div className="mt-4 flex justify-between text-[11px] font-label-mono text-gray-500">
              <div className="flex flex-col">
                <span>RETRY COUNT</span>
                <span className="text-white mt-0.5">0</span>
              </div>
              <div className="flex flex-col text-right">
                <span>STARTED AT</span>
                <span className="text-white mt-0.5">{activeExecution.startedAt ? format(new Date(activeExecution.startedAt), 'HH:mm:ss') : '-'}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <h3 className="p-5 pb-2 text-[11px] font-label-mono uppercase tracking-widest text-gray-500 shrink-0">Live Activity</h3>
            <div className="flex-1 overflow-y-auto p-5 pt-2 custom-scrollbar space-y-4 relative">
              <div className="absolute left-[29px] top-4 bottom-4 w-px bg-outline-variant z-0" />
              
              {(activeExecution.executionPath || []).map((nodeId: string, idx: number) => {
                const isLast = idx === activeExecution.executionPath.length - 1;
                const isCurrent = isRunning && isLast;
                const isErr = isFailed && isLast;
                const nodeDef = workflow?.nodes?.find((n: any) => n.id === nodeId);
                
                return (
                  <div key={idx} className="relative z-10 flex gap-4 cursor-pointer" onClick={() => setSelectedNodeId(nodeId)}>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center bg-[#0a0a0a] shrink-0 mt-0.5",
                      isCurrent ? "border-blue-500" : isErr ? "border-red-500" : "border-green-500"
                    )}>
                      {isCurrent ? <Activity className="h-3 w-3 text-blue-500 animate-pulse" /> : 
                       isErr ? <XCircle className="h-3 w-3 text-red-500" /> : 
                       <CheckCircle className="h-3 w-3 text-green-500" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">{nodeDef?.name || nodeId}</span>
                      <span className="text-[10px] font-label-mono text-gray-500 mt-0.5">{nodeDef?.type?.replace('_', ' ')}</span>
                      
                      {/* Reason text rendering */}
                      {(() => {
                        const hasReasonSupport = !['structured_input', 'document_retrieval'].includes(nodeDef?.type || '');
                        if (!hasReasonSupport) return null;
                        
                        // Find the main completion/failure/paused step execution
                        const finalLog = stepLogs?.slice().reverse().find((l: any) => 
                          l.stepId === nodeId && 
                          ['COMPLETED', 'FAILED', 'PAUSED'].includes(l.status)
                        );
                        
                        if (finalLog?.reason && finalLog.reason !== 'Skipped via Idempotency Check') {
                          return (
                            <span className="text-[10px] text-gray-400 mt-1 italic max-w-xs break-words border-l border-gray-700 pl-2">
                              {finalLog.reason}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                );
              })}
              
              {!isSuccess && !isFailed && (
                <div className="relative z-10 flex gap-4 opacity-50">
                  <div className="w-5 h-5 rounded-full border-2 border-outline-variant flex items-center justify-center bg-[#0a0a0a] shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-400 italic">Waiting...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* 3. Center: Visual Execution Graph */}
        <main className="flex-1 relative bg-[#050505]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            className="bg-[#050505]"
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={true}
            onSelectionChange={(params) => {
              if (params.nodes.length > 0) setSelectedNodeId(params.nodes[0].id);
            }}
          >
            <Background gap={24} color="#1f1f23" variant={BackgroundVariant.Lines} />
            <Controls className="bg-[#121212] border border-outline-variant rounded-lg overflow-hidden shadow-xl" showInteractive={false} />
          </ReactFlow>

          {/* 7. Bottom Panel: Tabs */}
          <section className="absolute bottom-0 left-0 right-0 h-64 bg-[#0a0a0a] border-t border-outline-variant flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
            <div className="flex border-b border-outline-variant px-2 shrink-0">
              {[
                { id: 'logs', label: 'Logs', icon: Terminal },
                { id: 'json', label: 'JSON Output', icon: FileJson },
                { id: 'metadata', label: 'Metadata', icon: Database },
                { id: 'errors', label: 'Error Details', icon: AlertTriangle }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-[11px] font-label-caps uppercase tracking-wider border-b-2 transition-colors",
                    activeTab === tab.id ? "border-blue-500 text-blue-400" : "border-transparent text-gray-500 hover:text-gray-300"
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" /> {tab.label}
                </button>
              ))}
            </div>
            
            <div className="flex-1 overflow-hidden relative">
              {activeTab === 'logs' && <LogsViewerWrapper executionId={activeExecution.id} />}
              
              {activeTab === 'json' && (
                <div className="p-4 h-full overflow-y-auto font-label-mono text-xs text-green-400 bg-[#0e0e11]">
                  <pre>{JSON.stringify(activeExecution, null, 2)}</pre>
                </div>
              )}
              
              {activeTab === 'errors' && isFailed && (
                <div className="p-8 flex flex-col items-center justify-center text-center h-full">
                  <ShieldAlert className="h-12 w-12 text-red-500 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Execution Failed</h3>
                  <p className="text-gray-400 text-sm max-w-md bg-[#18181b] p-3 rounded border border-outline-variant">
                    {activeExecution.error || 'Unknown error occurred during execution.'}
                  </p>
                  <button className="mt-6 px-6 py-2 bg-blue-600 text-white rounded font-bold text-xs hover:bg-blue-500 transition-colors">
                    Retry from failure
                  </button>
                </div>
              )}

              {activeTab === 'errors' && !isFailed && (
                <div className="p-8 flex flex-col items-center justify-center text-center h-full opacity-50">
                  <CheckCircle className="h-12 w-12 text-gray-500 mb-4" />
                  <p className="text-gray-400 text-sm">No errors recorded.</p>
                </div>
              )}
              
              {activeTab === 'metadata' && (
                <div className="p-4 text-sm text-gray-400 h-full overflow-y-auto">
                  <p>Workflow Version: {workflow?.version || '1.0.0'}</p>
                  <p>Started: {activeExecution.startedAt}</p>
                  <p>Environment: Production</p>
                </div>
              )}
            </div>
          </section>
        </main>

        {/* 6. Right Panel: Execution Details */}
        <aside className="w-[320px] bg-[#0a0a0a] border-l border-outline-variant flex flex-col shrink-0 z-10">
          <div className="p-5 border-b border-outline-variant shrink-0">
            <h3 className="text-[11px] font-label-mono uppercase tracking-widest text-gray-500 mb-1">Execution Details</h3>
            <h2 className="text-lg font-display font-semibold text-white truncate">
              {selectedNodeId ? (workflow?.nodes?.find((n:any) => n.id === selectedNodeId)?.name || selectedNodeId) : 'Select a node'}
            </h2>
          </div>
          
          <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-6">
            {!selectedNodeId ? (
              <div className="text-center text-gray-500 text-sm mt-10">
                <Network className="h-8 w-8 mx-auto opacity-20 mb-4" />
                Click on any node in the graph or timeline to view its execution data.
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-label-mono text-gray-500 uppercase">Status</label>
                  <div className="flex items-center gap-2">
                    {activeExecution.executionPath?.includes(selectedNodeId) ? (
                      activeExecution.executionPath.indexOf(selectedNodeId) === activeExecution.executionPath.length - 1 && isRunning ? (
                        <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-sm text-xs font-semibold">Running</span>
                      ) : activeExecution.executionPath.indexOf(selectedNodeId) === activeExecution.executionPath.length - 1 && isFailed ? (
                        <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-sm text-xs font-semibold">Failed</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-sm text-xs font-semibold">Completed</span>
                      )
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-500/10 border border-gray-500/30 text-gray-400 rounded-sm text-xs font-semibold">Pending</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-label-mono text-gray-500 uppercase flex items-center justify-between">
                    <span>Node Output</span>
                    <button className="text-blue-400 hover:text-blue-300">Copy</button>
                  </label>
                  <div className="bg-[#121212] border border-outline-variant rounded p-3 text-xs font-label-mono text-gray-300 min-h-[100px] break-all">
                    {/* Mock data for now, would be activeExecution.nodeOutputs[selectedNodeId] */}
                    {activeExecution.executionPath?.includes(selectedNodeId) 
                      ? '{"status": "success", "data": {...}}' 
                      : 'No output generated yet.'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-label-mono text-gray-500 uppercase">Latency</label>
                    <p className="text-sm font-semibold text-white">
                       {activeExecution.executionPath?.includes(selectedNodeId) ? '342ms' : '-'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-label-mono text-gray-500 uppercase">Tokens</label>
                    <p className="text-sm font-semibold text-white">
                      {activeExecution.executionPath?.includes(selectedNodeId) ? '1,204' : '-'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}

function LogsViewerWrapper({ executionId }: { executionId: string }) {
  const [search, setSearch] = useState('');
  
  const { data: logs } = useQuery({
    queryKey: ['logs', executionId],
    queryFn: () => api.getExecutionLogs(executionId),
    refetchInterval: 2000,
  });

  if (!logs) {
    return (
      <div className="flex flex-col h-full bg-black p-4 space-y-2 animate-pulse">
        {[1,2,3,4].map(i => (
          <div key={i} className="flex gap-4">
            <div className="h-4 bg-white/5 rounded w-16"></div>
            <div className="h-4 bg-white/5 rounded w-20"></div>
            <div className="h-4 bg-white/5 rounded flex-1"></div>
          </div>
        ))}
      </div>
    );
  }

  const filtered = logs.filter((l: any) => (l.reason || '').toLowerCase().includes(search.toLowerCase()) || (l.eventType || l.status || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="p-2 border-b border-outline-variant bg-[#0a0a0a] flex items-center justify-between sticky top-0 z-10">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search logs..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#121212] border border-outline-variant rounded pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <span className="text-[10px] font-label-mono text-gray-500">Auto-scrolling</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar font-label-mono text-[11px]">
        {filtered.map((log: any, idx: number) => {
          const time = new Date(log.timestamp).toLocaleTimeString();
          const levelColor = 
            log.level === 'INFO' ? 'text-blue-400' :
            log.level === 'ERROR' ? 'text-red-400' :
            log.level === 'WARN' ? 'text-yellow-400' : 'text-green-400';
            
          return (
            <div key={idx} className="flex gap-3 hover:bg-white/5 px-2 py-0.5 rounded transition-colors group">
              <span className="text-gray-600 shrink-0">{time}</span>
              <span className={cn(levelColor, "shrink-0 w-16 uppercase")}>[{log.eventType || log.status}]</span>
              <span className="text-gray-300 break-words group-hover:text-white transition-colors">{log.reason || log.message}</span>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-gray-600 px-2">No matching logs found.</div>
        )}
      </div>
    </div>
  );
}

export function ExecutionMonitor({ workflowId, executionId }: { workflowId: string, executionId?: string }) {
  return (
    <ReactFlowProvider>
      <ExecutionMonitorInner workflowId={workflowId} executionId={executionId} />
    </ReactFlowProvider>
  );
}
