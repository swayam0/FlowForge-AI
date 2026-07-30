'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { toast } from 'sonner';
import { 
  Search, Eye, RotateCcw, Filter, TerminalSquare, AlertTriangle, 
  RefreshCcw, X, Clock, PlayCircle, CheckCircle2, XCircle, PauseCircle,
  FileText, Activity, Network, ChevronRight
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonCard } from '@/components/skeletons/SkeletonCard';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { EmptyState } from '@/components/ui/EmptyState';
import { Execution } from '@/types';



export default function HistoryPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);

  // Fetch History
  const { data: history, isLoading, isError, refetch } = useQuery({
    queryKey: ['history'],
    queryFn: () => api.getHistory(),
  });

  const { data: selectedExecLogs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['logs', selectedExecution?.id],
    queryFn: () => api.getExecutionLogs(selectedExecution?.id as string),
    enabled: !!selectedExecution?.id,
  });

  const handleRerun = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.rerunExecution(id);
      queryClient.invalidateQueries({ queryKey: ['history'] });
      toast.success(`Rerun started successfully.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to rerun execution';
      toast.error(message, {
        action: { label: 'Retry', onClick: () => handleRerun(id, e) }
      });
    }
  };

  // Grouped and Filtered History
  const groupedHistory = useMemo(() => {
    if (!history) return [];
    
    const filtered = history.filter((h: Execution) => {
      const matchesSearch = (h.workflowId || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (h.id || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || 
                           (statusFilter === 'COMPLETED' && h.status === 'COMPLETED') ||
                           (statusFilter === 'FAILED' && h.status === 'FAILED') ||
                           (statusFilter === 'RUNNING' && (h.status === 'RUNNING' || h.status === 'PAUSED'));
      return matchesSearch && matchesStatus;
    });

    // Grouping by Date
    const groups: { [key: string]: Execution[] } = {};
    
    filtered.forEach((h: Execution) => {
      if (!h.startedAt) {
        if (!groups['Unknown Date']) groups['Unknown Date'] = [];
        groups['Unknown Date'].push(h);
        return;
      }
      
      const date = new Date(h.startedAt);
      let groupKey = '';
      
      if (isToday(date)) groupKey = 'Today';
      else if (isYesterday(date)) groupKey = 'Yesterday';
      else if (isThisWeek(date)) groupKey = 'This Week';
      else groupKey = format(date, 'MMMM yyyy');

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(h);
    });

    return Object.entries(groups).map(([label, items]) => ({ label, items }));
  }, [history, searchQuery, statusFilter]);

  const formatDuration = (ms: number) => {
    if (!ms) return '-';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] w-full bg-black overflow-hidden selection:bg-blue-500/30">
      {/* Header & Filters */}
      <div className="px-8 py-6 border-b border-white/5 bg-[#0a0a0a] shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">Execution History</h1>
            <p className="text-sm text-gray-500 max-w-xl">
              Audit log of all workflow runs, human approvals, and AI reasoning pathways.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              aria-label="Search workflows or execution IDs"
              placeholder="Search workflows or execution IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121212] border border-white/10 rounded-md py-2 pl-9 pr-4 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors placeholder:text-gray-600"
            />
          </div>
          
          <div className="flex items-center gap-1.5 p-1 bg-[#121212] border border-white/5 rounded-md overflow-x-auto w-full sm:w-auto">
            {['ALL', 'COMPLETED', 'RUNNING', 'FAILED'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-4 py-1.5 rounded text-[11px] font-bold transition-all uppercase tracking-wider whitespace-nowrap",
                  statusFilter === status 
                    ? "bg-white/10 text-white shadow-sm" 
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* List View */}
        <div className={cn(
          "flex-1 overflow-y-auto custom-scrollbar transition-all duration-300",
          selectedExecution ? "pr-[450px]" : ""
        )}>
          {isLoading ? (
            <div className="p-8 space-y-6 max-w-5xl mx-auto">
              {[1, 2].map(group => (
                <div key={group} className="space-y-4">
                  <Skeleton className="h-6 w-32 bg-white/5" />
                  {[1, 2, 3].map(item => (
                    <SkeletonCard key={item} />
                  ))}
                </div>
              ))}
            </div>
          ) : isError ? (
            <EmptyState 
              icon={AlertTriangle}
              title="Failed to load history"
              description="Could not connect to the audit server."
              action={
                <button 
                  onClick={() => refetch()}
                  className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-md font-medium transition-colors border border-white/5"
                >
                  <RefreshCcw className="h-4 w-4" /> Retry
                </button>
              }
            />
          ) : groupedHistory.length === 0 ? (
            <EmptyState 
              icon={Filter}
              title="No executions found"
              description="No workflow runs match your current filters or search query."
            />
          ) : (
            <div className="p-8 max-w-5xl mx-auto space-y-10 pb-20">
              {groupedHistory.map((group, gIdx) => (
                <div key={gIdx}>
                  <h3 className="text-[11px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-4 sticky top-0 bg-black/80 backdrop-blur-sm py-2 z-10 border-b border-white/5">
                    {group.label}
                  </h3>
                  
                  <div className="space-y-3">
                    {group.items.map((h: Execution) => {
                      const isSelected = selectedExecution?.id === h.id;
                      const statusColor = 
                        h.status === 'COMPLETED' ? 'text-green-500 bg-green-500/10 border-green-500/20' :
                        h.status === 'FAILED' ? 'text-red-500 bg-red-500/10 border-red-500/20' :
                        h.status === 'RUNNING' ? 'text-blue-500 bg-blue-500/10 border-blue-500/20' :
                        'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';

                      return (
                        <div 
                          key={h.id} 
                          onClick={() => setSelectedExecution(isSelected ? null : h)}
                          className={cn(
                            "group cursor-pointer rounded-xl border p-4 transition-all hover:bg-white/[0.02]",
                            isSelected ? "border-white/20 bg-white/[0.02]" : "border-white/5 bg-[#0a0a0a]"
                          )}
                        >
                          <div className="flex items-center justify-between gap-4">
                            
                            <div className="flex items-center gap-4 min-w-0">
                              <div className={cn("w-10 h-10 rounded-full border flex items-center justify-center shrink-0", statusColor)}>
                                {h.status === 'COMPLETED' ? <CheckCircle2 className="h-5 w-5" /> :
                                 h.status === 'FAILED' ? <XCircle className="h-5 w-5" /> :
                                 h.status === 'RUNNING' ? <Activity className="h-5 w-5" /> :
                                 <PauseCircle className="h-5 w-5" />}
                              </div>
                              
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium text-white truncate text-base">{h.workflowId || 'Unknown Workflow'}</span>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                  <span className="font-mono">v{h.version || '1.0'}</span>
                                  <span>•</span>
                                  <span className="font-mono">{h.id.substring(0,8)}</span>
                                  <span>•</span>
                                  <span>{h.startedAt ? format(new Date(h.startedAt), 'h:mm:ss a') : '-'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-6 shrink-0">
                              <div className="text-right hidden sm:block">
                                <span className="text-sm font-medium text-gray-300 block">{formatDuration(h.durationMs || 0)}</span>
                                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Duration</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={(e) => handleRerun(h.id, e)}
                                  className="p-2 rounded-md bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                  title="Rerun Execution"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </button>
                                <ChevronRight className={cn(
                                  "h-5 w-5 text-gray-500 transition-transform",
                                  isSelected ? "rotate-180" : ""
                                )} />
                              </div>
                            </div>
                            
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sliding Detail Panel */}
        <AnimatePresence>
          {selectedExecution && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-[450px] bg-[#050505] border-l border-white/5 flex flex-col shadow-2xl z-20"
            >
              {/* Detail Header */}
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#0a0a0a]">
                <div>
                  <h2 className="text-lg font-semibold text-white truncate">{selectedExecution.workflowId}</h2>
                  <p className="text-xs font-mono text-gray-500 mt-1">EXEC-#{selectedExecution.id.substring(0,8)}</p>
                </div>
                <button 
                  onClick={() => setSelectedExecution(null)}
                  className="p-2 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#121212] p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Duration</span>
                    </div>
                    <p className="text-sm font-semibold text-white mt-1">{formatDuration(selectedExecution.durationMs || 0)}</p>
                  </div>
                  <div className="bg-[#121212] p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <Activity className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Status</span>
                    </div>
                    <StatusBadge status={selectedExecution.status} className="bg-transparent px-0 text-base border-none" />
                  </div>
                </div>

                {/* Timeline / Path */}
                <div className="space-y-4">
                  <h3 className="text-[11px] font-mono font-bold uppercase tracking-widest text-gray-500 border-b border-white/5 pb-2">
                    Execution Trace
                  </h3>
                  
                  {isLoadingLogs ? (
                    <div className="space-y-4 p-2">
                       <Skeleton className="h-16 w-full rounded-xl bg-white/5" />
                       <Skeleton className="h-16 w-full rounded-xl bg-white/5" />
                       <Skeleton className="h-16 w-full rounded-xl bg-white/5" />
                    </div>
                  ) : selectedExecLogs && selectedExecLogs.length > 0 ? (
                    <div className="relative space-y-0 pl-2">
                      <div className="absolute left-[15px] top-4 bottom-4 w-px bg-white/10 z-0" />
                      
                      {selectedExecLogs.map((log: any, idx: number) => {
                        // Only show major state changes in the visual trace
                        if (!['START', 'COMPLETED', 'FAILED', 'PAUSED'].includes(log.status) && !log.eventType?.includes('REASONING')) return null;
                        
                        const isError = log.level === 'ERROR' || log.status === 'FAILED';
                        const isWarning = log.level === 'WARN' || log.status === 'PAUSED';
                        
                        return (
                          <div key={idx} className="relative z-10 flex gap-4 py-3 group">
                            <div className="shrink-0 mt-1">
                              <div className={cn(
                                "w-4 h-4 rounded-full border-2 bg-[#050505] flex items-center justify-center",
                                isError ? "border-red-500" : isWarning ? "border-yellow-500" : "border-gray-600 group-hover:border-blue-500"
                              )} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex justify-between items-start gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-300 break-words">
                                  {log.stepId || log.nodeId || log.eventType || 'System Event'}
                                </span>
                                <span className="text-[10px] font-mono text-gray-600 shrink-0">
                                  {format(new Date(log.timestamp), 'HH:mm:ss')}
                                </span>
                              </div>
                              {log.message && (
                                <p className="text-xs text-gray-500 break-words font-mono">
                                  {log.message}
                                </p>
                              )}
                              {log.reason && (
                                <div className="mt-2 bg-[#121212] p-3 rounded-lg border border-white/5 text-xs text-gray-400 italic">
                                  {log.reason}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No detailed logs available.
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
