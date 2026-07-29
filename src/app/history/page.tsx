'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  Search, Eye, RotateCcw, Filter, TerminalSquare, AlertCircle, 
  RefreshCcw, X, Clock, PlayCircle, CheckCircle2, XCircle, PauseCircle,
  FileText, Activity, Network
} from 'lucide-react';
import { 
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell 
} from '../../components/ui/Table';
import { 
  Dialog, DialogHeader, DialogTitle, DialogFooter
} from '../../components/ui/Dialog';
import { cn } from '../../lib/utils';
import { StatusBadge } from '../../components/ui/StatusBadge';

function EmptyState({ icon: Icon, title, description, action }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center h-full">
      <div className="h-16 w-16 rounded-2xl bg-[#1c1b1b] flex items-center justify-center mb-5 border border-[#27272a] shadow-inner">
        <Icon className="h-8 w-8 text-outline" />
      </div>
      <h3 className="text-lg font-bold text-primary mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-on-surface-variant mb-6 max-w-sm leading-relaxed">{description}</p>
      {action}
    </div>
  );
}

function TableSkeleton({ columns, rows = 5 }: { columns: number, rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-[#27272a] last:border-0 hover:bg-transparent">
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j} className="px-6 py-4">
              <div className="h-4 bg-[#27272a]/50 rounded animate-pulse w-3/4"></div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function HistoryPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL'); // Simple mock date filter
  
  const [selectedExecution, setSelectedExecution] = useState<any | null>(null);
  const [logExecutionId, setLogExecutionId] = useState<string | null>(null);

  // Fetch History
  const { data: history, isLoading, isError, refetch } = useQuery({
    queryKey: ['history'],
    queryFn: () => api.getHistory(),
  });

  const { data: selectedExecLogs } = useQuery({
    queryKey: ['logs', selectedExecution?.id],
    queryFn: () => api.getExecutionLogs(selectedExecution?.id),
    enabled: !!selectedExecution?.id,
  });

  // Fetch Logs
  const { data: logs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['logs', logExecutionId],
    queryFn: () => api.getExecutionLogs(logExecutionId!),
    enabled: !!logExecutionId,
  });

  const handleRerun = async (id: string) => {
    try {
      await api.rerunExecution(id);
      queryClient.invalidateQueries({ queryKey: ['history'] });
      toast.success(`Rerun started successfully.`);
    } catch (err) {
      toast.error('Failed to rerun execution');
    }
  };

  // Filtering
  const filteredHistory = useMemo(() => {
    if (!history) return [];
    return history.filter((h: any) => {
      const matchesSearch = (h.workflowId || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (h.id || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const normalizedStatus = h.status === 'SUCCESS' ? 'COMPLETED' : h.status;
      const matchesStatus = statusFilter === 'ALL' || normalizedStatus === statusFilter;
      
      // Simple date filter logic (mocked)
      let matchesDate = true;
      if (dateRange === 'TODAY' && h.startedAt) {
        matchesDate = new Date(h.startedAt).toDateString() === new Date().toDateString();
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [history, searchQuery, statusFilter, dateRange]);

  const formatDuration = (ms: number) => {
    if (!ms) return '-';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
  };

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto w-full space-y-8 h-full flex flex-col">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#27272a] shrink-0">
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary">Execution History</h1>
          <p className="text-sm md:text-base text-on-surface-variant max-w-2xl leading-relaxed">
            View and manage all past workflow executions, analyze performance, and debug failures.
          </p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#0a0a0a] p-4 rounded-xl border border-[#27272a] shrink-0 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
          <input
            type="text"
            placeholder="Search by workflow name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111] border border-[#27272a] rounded-lg py-2.5 pl-10 pr-4 text-sm text-primary placeholder:text-on-surface-variant focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          <div className="flex items-center gap-1.5 bg-[#111111] p-1 rounded-lg border border-[#27272a]">
            {['ALL', 'COMPLETED', 'RUNNING', 'FAILED'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all uppercase tracking-wider",
                  statusFilter === status 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "text-on-surface-variant hover:text-primary hover:bg-[#27272a]/50"
                )}
              >
                {status}
              </button>
            ))}
          </div>

          <select 
            className="bg-[#111111] border border-[#27272a] text-sm font-semibold text-primary rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 cursor-pointer"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="ALL">All Time</option>
            <option value="TODAY">Today</option>
            <option value="WEEK">This Week</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 overflow-hidden bg-[#0a0a0a] rounded-xl border border-[#27272a] shadow-sm flex flex-col">
        {isLoading ? (
          <div className="overflow-auto flex-1 custom-scrollbar">
            <Table>
              <TableHeader className="bg-[#111111] sticky top-0 z-10 border-b border-[#27272a]">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="w-[200px] text-xs font-bold text-outline uppercase tracking-wider">Workflow</TableHead>
                  <TableHead className="text-xs font-bold text-outline uppercase tracking-wider">Version</TableHead>
                  <TableHead className="text-xs font-bold text-outline uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-xs font-bold text-outline uppercase tracking-wider">Started At</TableHead>
                  <TableHead className="text-xs font-bold text-outline uppercase tracking-wider">Duration</TableHead>
                  <TableHead className="text-right text-xs font-bold text-outline uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableSkeleton columns={6} rows={8} />
              </TableBody>
            </Table>
          </div>
        ) : isError ? (
          // Error State
          <EmptyState 
            icon={AlertCircle}
            title="Failed to load history"
            description="There was an error communicating with the server. Please try again."
            action={
              <button 
                onClick={() => refetch()}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors"
              >
                <RefreshCcw className="h-4 w-4" /> Retry
              </button>
            }
          />
        ) : filteredHistory.length === 0 ? (
          // Empty State
          <EmptyState 
            icon={Filter}
            title="No executions found"
            description={searchQuery || statusFilter !== 'ALL' 
                ? "We couldn't find any executions matching your filters. Try adjusting them."
                : "There are no recorded workflow executions yet."}
          />
        ) : (
          <div className="overflow-auto flex-1 custom-scrollbar">
            <Table>
              <TableHeader className="bg-[#111111] sticky top-0 z-10 border-b border-[#27272a]">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="w-[250px] text-xs font-bold text-outline uppercase tracking-wider">Workflow</TableHead>
                  <TableHead className="text-xs font-bold text-outline uppercase tracking-wider">Version</TableHead>
                  <TableHead className="text-xs font-bold text-outline uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-xs font-bold text-outline uppercase tracking-wider">Started At</TableHead>
                  <TableHead className="text-xs font-bold text-outline uppercase tracking-wider">Duration</TableHead>
                  <TableHead className="text-right text-xs font-bold text-outline uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((h: any) => (
                  <TableRow key={h.id} className="border-b border-[#27272a] hover:bg-[#1c1b1b] transition-colors group">
                    <TableCell className="font-medium text-primary">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                          <Network className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="flex flex-col">
                          <span className="truncate max-w-[200px] text-sm font-semibold group-hover:text-blue-500 transition-colors">{h.workflowId || 'Unknown'}</span>
                          <span className="text-[10px] text-on-surface-variant font-mono uppercase mt-0.5">{(h.id || '').substring(0,12)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-on-surface-variant font-mono text-xs font-medium">v{h.version || '1.0'}</TableCell>
                    <TableCell>
                      <StatusBadge status={h.status} />
                    </TableCell>
                    <TableCell className="text-on-surface-variant text-sm font-medium">
                      {h.startedAt ? format(new Date(h.startedAt), 'MMM d, yyyy HH:mm:ss') : '-'}
                    </TableCell>
                    <TableCell className="text-on-surface-variant font-mono text-xs font-medium">
                      {formatDuration(h.durationMs)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setSelectedExecution(h)}
                          className="p-2 hover:bg-[#27272a] rounded-md text-on-surface-variant hover:text-primary transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setLogExecutionId(h.id)}
                          className="p-2 hover:bg-[#27272a] rounded-md text-on-surface-variant hover:text-blue-500 transition-colors"
                          title="View Logs"
                        >
                          <TerminalSquare className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleRerun(h.id)}
                          className="p-2 hover:bg-[#27272a] rounded-md text-on-surface-variant hover:text-green-500 transition-colors"
                          title="Rerun Workflow"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Side Drawer for View Details */}
      {selectedExecution && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="absolute inset-0" onClick={() => setSelectedExecution(null)} />
          <div className="relative w-full max-w-md bg-[#0a0a0a] h-full border-l border-[#27272a] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-[#27272a] flex items-center justify-between bg-[#111111]/50">
              <h2 className="text-lg font-bold text-primary">Execution Details</h2>
              <button onClick={() => setSelectedExecution(null)} className="text-outline hover:text-primary p-1 rounded-md hover:bg-[#27272a] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              <section>
                <h3 className="text-[10px] font-mono font-bold uppercase text-blue-500 tracking-widest mb-3">Workflow Information</h3>
                <div className="bg-[#111111] p-5 rounded-xl border border-[#27272a] space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-on-surface-variant">Name</span>
                    <span className="text-sm font-bold text-primary">{selectedExecution.workflowId || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-on-surface-variant">Execution ID</span>
                    <span className="text-xs font-mono font-medium text-outline">{selectedExecution.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-on-surface-variant">Status</span>
                    <StatusBadge status={selectedExecution.status} />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-[10px] font-mono font-bold uppercase text-blue-500 tracking-widest mb-3">Execution Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#111111] p-5 rounded-xl border border-[#27272a]">
                    <div className="flex items-center gap-2 text-on-surface-variant mb-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs uppercase font-bold tracking-wider">Duration</span>
                    </div>
                    <span className="text-xl font-mono font-bold text-primary">{formatDuration(selectedExecution.durationMs)}</span>
                  </div>
                  <div className="bg-[#111111] p-5 rounded-xl border border-[#27272a]">
                    <div className="flex items-center gap-2 text-on-surface-variant mb-2">
                      <Activity className="h-4 w-4" />
                      <span className="text-xs uppercase font-bold tracking-wider">Nodes</span>
                    </div>
                    <span className="text-xl font-mono font-bold text-primary">
                      {selectedExecLogs?.filter((l: any) => ['COMPLETED', 'FAILED', 'PAUSED'].includes(l.status)).length || 0} Executed
                    </span>
                  </div>
                </div>
              </section>
              
              <section>
                <h3 className="text-[10px] font-mono font-bold uppercase text-blue-500 tracking-widest mb-3">Execution Path</h3>
                <div className="space-y-4">
                  {selectedExecLogs && selectedExecLogs.length > 0 ? (
                    <div className="relative pl-7 border-l-2 border-[#27272a] ml-3 space-y-6">
                      {selectedExecLogs
                        .filter((step: any) => ['COMPLETED', 'FAILED', 'PAUSED'].includes(step.status))
                        .map((step: any, idx: number) => {
                          const shouldShowReason = step.reason && step.reason !== 'Skipped via Idempotency Check';

                          return (
                            <div key={idx} className="relative">
                              <div className="absolute -left-[35.5px] bg-[#0a0a0a] p-1 rounded-full border-2 border-[#0a0a0a]">
                                {step.status === 'COMPLETED' ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : step.status === 'FAILED' ? (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                ) : (
                                  <PauseCircle className="h-4 w-4 text-yellow-500" />
                                )}
                              </div>
                              <div className="bg-[#111111] p-4 rounded-xl border border-[#27272a] flex flex-col shadow-sm">
                                <div className="flex justify-between items-start">
                                  <p className="text-sm font-bold text-primary">{step.stepId || 'Unknown Node'}</p>
                                  <p className="text-xs font-mono font-medium text-outline">{step.startedAt ? format(new Date(step.startedAt), 'HH:mm:ss') : '-'}</p>
                                </div>
                                {shouldShowReason && (
                                  <div className="mt-3 bg-[#1c1b1b] p-3 rounded-lg border border-[#27272a]">
                                    <span className="text-[11px] text-on-surface-variant font-medium leading-relaxed max-w-full break-words">
                                      {step.reason}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                      })}
                    </div>
                  ) : (
                    <div className="bg-[#111111] p-5 rounded-xl border border-[#27272a] text-center">
                      <p className="text-sm font-semibold text-outline">No execution path recorded.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Dialog for View Logs */}
      <Dialog open={!!logExecutionId} onOpenChange={(open) => !open && setLogExecutionId(null)}>
        <div className="flex justify-between items-center mb-6">
          <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
            <TerminalSquare className="h-5 w-5 text-blue-500" />
            Execution Logs
          </DialogTitle>
          <button onClick={() => setLogExecutionId(null)} className="text-outline hover:text-primary p-1.5 rounded-md hover:bg-[#27272a] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl h-[450px] overflow-y-auto font-mono text-[11px] p-4 space-y-1 custom-scrollbar shadow-inner">
          {isLoadingLogs ? (
            <div className="space-y-3 p-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 w-full bg-[#27272a]/50 animate-pulse rounded" />
              ))}
            </div>
          ) : logs && logs.length > 0 ? (
            logs.map((log: any, idx: number) => (
              <div key={idx} className="flex gap-4 hover:bg-[#111111] p-1.5 rounded transition-colors group">
                <span className="text-outline shrink-0 w-24 font-medium">
                  {log.timestamp ? format(new Date(log.timestamp), 'HH:mm:ss.SSS') : '-'}
                </span>
                <span className={cn(
                  "shrink-0 w-[70px] font-bold",
                  log.level === 'ERROR' ? 'text-red-500' : 
                  log.level === 'WARN' ? 'text-yellow-500' : 
                  'text-blue-500'
                )}>
                  {log.level || 'INFO'}
                </span>
                <span className="text-purple-400 shrink-0 w-32 truncate font-semibold" title={log.nodeId}>
                  {log.nodeId || 'System'}
                </span>
                <span className="text-primary break-words flex-1 group-hover:text-white transition-colors">{log.message}</span>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-outline gap-3">
              <FileText className="h-8 w-8 opacity-50" />
              <span className="font-semibold text-sm">No logs found for this execution.</span>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
