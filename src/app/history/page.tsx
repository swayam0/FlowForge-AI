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

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    RUNNING: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    COMPLETED: 'bg-green-500/10 text-green-500 border-green-500/20',
    SUCCESS: 'bg-green-500/10 text-green-500 border-green-500/20', // api uses SUCCESS usually
    PAUSED: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    FAILED: 'bg-red-500/10 text-red-500 border-red-500/20',
    CANCELLED: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  };

  const icons: Record<string, any> = {
    RUNNING: PlayCircle,
    COMPLETED: CheckCircle2,
    SUCCESS: CheckCircle2,
    PAUSED: PauseCircle,
    FAILED: XCircle,
    CANCELLED: X,
  };

  const css = styles[status] || styles.CANCELLED;
  const Icon = icons[status] || AlertCircle;

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border", css)}>
      <Icon className="h-3.5 w-3.5" />
      {status === 'SUCCESS' ? 'COMPLETED' : status}
    </span>
  );
};

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
    <div className="flex flex-col w-full h-full p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-white mb-2">Execution History</h1>
          <p className="text-gray-400 font-body-sm">View and manage all past workflow executions.</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between bg-[#121212] p-4 rounded-xl border border-outline-variant">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by workflow name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#18181b] border border-outline-variant rounded-md py-2 pl-9 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          <div className="flex items-center gap-2 bg-[#18181b] p-1 rounded-md border border-outline-variant">
            {['ALL', 'COMPLETED', 'RUNNING', 'FAILED'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-semibold transition-all",
                  statusFilter === status 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                {status}
              </button>
            ))}
          </div>

          <select 
            className="bg-[#18181b] border border-outline-variant text-sm text-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
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
      <div className="flex-1 overflow-hidden bg-[#121212] rounded-xl border border-outline-variant flex flex-col">
        {isLoading ? (
          // Loading Skeleton
          <div className="p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-white/5 animate-pulse rounded-md" />
            ))}
          </div>
        ) : isError ? (
          // Error State
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Failed to load history</h3>
            <p className="text-gray-400 mb-6 max-w-md">There was an error communicating with the server. Please try again.</p>
            <button 
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-semibold transition-colors"
            >
              <RefreshCcw className="h-4 w-4" /> Retry
            </button>
          </div>
        ) : filteredHistory.length === 0 ? (
          // Empty State
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <Filter className="h-12 w-12 text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No executions found</h3>
            <p className="text-gray-400 max-w-md">
              {searchQuery || statusFilter !== 'ALL' 
                ? "We couldn't find any executions matching your filters. Try adjusting them."
                : "There are no recorded workflow executions yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="bg-[#18181b] sticky top-0 z-10 border-b border-outline-variant">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="w-[200px]">Workflow</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started At</TableHead>
                  <TableHead>Finished At</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((h: any) => (
                  <TableRow key={h.id} className="border-b border-outline-variant/50 hover:bg-white/[0.02]">
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                          <Network className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="truncate max-w-[150px]">{h.workflowId || 'Unknown'}</span>
                          <span className="text-[10px] text-gray-500 font-label-mono uppercase mt-0.5">{(h.id || '').substring(0,8)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-400 font-label-mono text-xs">v{h.version || '1.0'}</TableCell>
                    <TableCell>
                      <StatusBadge status={h.status} />
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">
                      {h.startedAt ? format(new Date(h.startedAt), 'MMM d, yyyy HH:mm:ss') : '-'}
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">
                      {h.completedAt ? format(new Date(h.completedAt), 'MMM d, yyyy HH:mm:ss') : '-'}
                    </TableCell>
                    <TableCell className="text-gray-400 font-label-mono text-xs">
                      {formatDuration(h.durationMs)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setSelectedExecution(h)}
                          className="p-2 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setLogExecutionId(h.id)}
                          className="p-2 hover:bg-white/10 rounded-md text-gray-400 hover:text-blue-400 transition-colors"
                          title="View Logs"
                        >
                          <TerminalSquare className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleRerun(h.id)}
                          className="p-2 hover:bg-white/10 rounded-md text-gray-400 hover:text-green-400 transition-colors"
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
          <div className="relative w-full max-w-md bg-[#121212] h-full border-l border-outline-variant shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-outline-variant flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Execution Details</h2>
              <button onClick={() => setSelectedExecution(null)} className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <section>
                <h3 className="text-[11px] font-label-mono uppercase text-blue-400 tracking-widest mb-3">Workflow Information</h3>
                <div className="bg-[#18181b] p-4 rounded-lg border border-outline-variant space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Name</span>
                    <span className="text-sm font-medium text-white">{selectedExecution.workflowId || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Execution ID</span>
                    <span className="text-sm font-label-mono text-gray-300">{selectedExecution.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Status</span>
                    <StatusBadge status={selectedExecution.status} />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-[11px] font-label-mono uppercase text-blue-400 tracking-widest mb-3">Execution Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#18181b] p-4 rounded-lg border border-outline-variant">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs uppercase font-label-caps">Duration</span>
                    </div>
                    <span className="text-lg font-label-mono text-white">{formatDuration(selectedExecution.durationMs)}</span>
                  </div>
                  <div className="bg-[#18181b] p-4 rounded-lg border border-outline-variant">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <Activity className="h-4 w-4" />
                      <span className="text-xs uppercase font-label-caps">Nodes</span>
                    </div>
                    <span className="text-lg font-label-mono text-white">
                      {selectedExecLogs?.filter((l: any) => ['COMPLETED', 'FAILED', 'PAUSED'].includes(l.status)).length || 0} Executed
                    </span>
                  </div>
                </div>
              </section>
              
              <section>
                <h3 className="text-[11px] font-label-mono uppercase text-blue-400 tracking-widest mb-3">Execution Path</h3>
                <div className="space-y-4">
                  {selectedExecLogs && selectedExecLogs.length > 0 ? (
                    <div className="relative pl-6 border-l-2 border-outline-variant ml-2 space-y-6">
                      {selectedExecLogs
                        .filter((step: any) => ['COMPLETED', 'FAILED', 'PAUSED'].includes(step.status))
                        .map((step: any, idx: number) => {
                          const hasReasonSupport = true; // For history, we just show it if it exists
                          const shouldShowReason = step.reason && step.reason !== 'Skipped via Idempotency Check';

                          return (
                            <div key={idx} className="relative">
                              <div className="absolute -left-[31px] bg-[#121212] p-1 rounded-full">
                                {step.status === 'COMPLETED' ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : step.status === 'FAILED' ? (
                                  <X className="h-4 w-4 text-red-500" />
                                ) : (
                                  <Activity className="h-4 w-4 text-yellow-500" />
                                )}
                              </div>
                              <div className="bg-[#18181b] p-3 rounded-md border border-outline-variant flex flex-col">
                                <p className="text-sm font-medium text-white">{step.stepId || 'Unknown Node'}</p>
                                <p className="text-xs text-gray-500 mt-1">{step.startedAt ? format(new Date(step.startedAt), 'HH:mm:ss') : '-'}</p>
                                
                                {shouldShowReason && (
                                  <span className="text-[10px] text-gray-400 mt-2 italic max-w-sm break-words border-l border-gray-700 pl-2">
                                    {step.reason}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No execution path recorded.</p>
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
          <DialogTitle>Execution Logs</DialogTitle>
          <button onClick={() => setLogExecutionId(null)} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="bg-[#121212] border border-outline-variant rounded-md h-[400px] overflow-y-auto font-label-mono text-xs p-4 space-y-2">
          {isLoadingLogs ? (
            <div className="space-y-3 p-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 w-full bg-white/5 animate-pulse rounded" />
              ))}
            </div>
          ) : logs && logs.length > 0 ? (
            logs.map((log: any, idx: number) => (
              <div key={idx} className="flex gap-4 hover:bg-white/5 p-1 rounded transition-colors">
                <span className="text-gray-500 shrink-0 w-24">
                  {log.timestamp ? format(new Date(log.timestamp), 'HH:mm:ss.SSS') : '-'}
                </span>
                <span className={cn(
                  "shrink-0 w-20 uppercase",
                  log.level === 'ERROR' ? 'text-red-400' : 
                  log.level === 'WARN' ? 'text-yellow-400' : 
                  'text-blue-400'
                )}>
                  [{log.level || 'INFO'}]
                </span>
                <span className="text-purple-400 shrink-0 w-32 truncate" title={log.nodeId}>
                  {log.nodeId || 'System'}
                </span>
                <span className="text-gray-300 break-words flex-1">{log.message}</span>
              </div>
            ))
          ) : (
            <div className="text-gray-500 flex items-center gap-2">
              <FileText className="h-4 w-4" /> No logs found for this execution.
            </div>
          )}
        </div>
      </Dialog>

    </div>
  );
}
