'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { format } from 'date-fns';
import { RotateCcw, Eye, Search, MoreVertical, ChevronDown, TerminalSquare, Activity } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { cn } from '../../lib/utils';

function EmptyState({ icon: Icon, title, description, action }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center w-full bg-[#0a0a0a] rounded-xl border border-[#27272a] shadow-sm">
      <div className="h-20 w-20 rounded-3xl bg-[#111111] flex items-center justify-center mb-6 border border-[#27272a] shadow-inner">
        <Icon className="h-10 w-10 text-outline opacity-80" />
      </div>
      <h3 className="text-xl font-bold text-primary mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-on-surface-variant mb-6 max-w-sm leading-relaxed">{description}</p>
      {action}
    </div>
  );
}

function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-[#0a0a0a] border border-[#27272a] p-5 rounded-xl shadow-sm animate-pulse">
          <div className="flex justify-between mb-4 gap-4">
            <div className="space-y-2 w-1/4">
              <div className="h-5 bg-[#27272a]/50 rounded w-full"></div>
              <div className="h-3 bg-[#27272a]/30 rounded w-1/2"></div>
            </div>
            <div className="h-6 bg-[#27272a]/50 rounded w-20"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-[#27272a] pt-4">
            <div className="h-4 bg-[#27272a]/50 rounded w-3/4"></div>
            <div className="h-4 bg-[#27272a]/50 rounded w-1/2"></div>
            <div className="h-4 bg-[#27272a]/50 rounded w-2/3"></div>
            <div className="h-4 bg-[#27272a]/50 rounded w-1/3"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ExecutionsPage() {
  const { data: history, isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: () => api.getHistory(),
  });

  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredHistory = useMemo(() => {
    if (!history) return [];
    return history.filter((h: any) => {
      const matchesSearch = (h.workflowId || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (h.id || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const normalizedStatus = h.status === 'COMPLETED' ? 'SUCCESS' : h.status;
      const matchesStatus = statusFilter === 'ALL' || 
                           (statusFilter === 'SUCCESS' && (h.status === 'SUCCESS' || h.status === 'COMPLETED')) ||
                           (statusFilter === 'FAILED' && h.status === 'FAILED') ||
                           (statusFilter === 'RUNNING' && (h.status === 'RUNNING' || h.status === 'PAUSED'));
      
      return matchesSearch && matchesStatus;
    });
  }, [history, searchQuery, statusFilter]);

  const handleRerun = async (id: string) => {
    try {
      const result = await api.rerunExecution(id);
      toast.success(`Rerun started successfully. Execution ID: ${result.executionId}`);
    } catch (err) {
      toast.error('Failed to rerun execution');
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto w-full space-y-8 h-full flex flex-col">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#27272a] shrink-0">
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary">Execution Monitor</h1>
          <p className="text-sm md:text-base text-on-surface-variant max-w-2xl leading-relaxed">
            Monitor real-time workflow executions, debug active processes, and review detailed execution traces.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <section className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#0a0a0a] p-4 rounded-xl border border-[#27272a] shrink-0 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-outline transition-colors" />
          <input 
            className="w-full bg-[#111111] border border-[#27272a] rounded-lg py-2.5 pl-12 pr-4 text-sm font-medium text-primary placeholder:text-on-surface-variant focus:outline-none focus:border-blue-500 transition-colors" 
            placeholder="Search workflow name or ID..." 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
          {['ALL', 'SUCCESS', 'FAILED', 'RUNNING'].map(f => (
            <button 
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider",
                statusFilter === f 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "bg-[#111111] border border-[#27272a] text-on-surface-variant hover:text-primary hover:bg-[#27272a]/50"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      {/* Execution List */}
      <div className="space-y-4 flex-1">
        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : filteredHistory.length === 0 ? (
          <EmptyState 
            icon={RotateCcw} 
            title={searchQuery || statusFilter !== 'ALL' ? "No executions found" : "No executions yet"} 
            description={searchQuery || statusFilter !== 'ALL' ? "Try adjusting your filters." : "When workflows run, their real-time execution traces will appear here."} 
            action={
              <Link href="/workflows">
                <button className="bg-primary text-surface px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-all">
                  Go to Workflows
                </button>
              </Link>
            }
          />
        ) : (
          filteredHistory.map((h: any) => {
            const durationSecs = Math.floor(h.durationMs / 1000);
            const durationMins = Math.floor(durationSecs / 60);
            const durationRemSecs = durationSecs % 60;
            const formattedDuration = `${durationMins}m ${durationRemSecs}s`;

            return (
              <div key={h.id} className="bg-[#0a0a0a] border border-[#27272a] p-6 rounded-xl shadow-sm hover:border-[#3b82f6]/50 transition-colors group">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-primary mb-1 group-hover:text-blue-500 transition-colors">{h.workflowId}</h3>
                    <span className="text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-wider">v{h.version} • ID: {(h.id || '').substring(0,12)}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <StatusBadge status={h.status} />
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <button 
                        onClick={() => {
                          if (!h.workflowId || h.workflowId === 'undefined') {
                            toast.error("Workflow ID missing");
                            return;
                          }
                          router.push(`/workflows/${h.workflowId}`);
                        }}
                        className="px-3 py-1.5 border border-[#27272a] bg-[#111111] rounded-lg text-on-surface-variant hover:text-blue-500 hover:border-blue-500 transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5" /> <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">VIEW</span>
                      </button>
                      <button 
                        onClick={() => handleRerun(h.id)}
                        className="px-3 py-1.5 border border-[#27272a] bg-[#111111] rounded-lg text-on-surface-variant hover:text-green-500 hover:border-green-500 transition-colors flex items-center gap-1.5"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">RERUN</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-[#27272a] pt-4">
                  <div>
                    <p className="text-[10px] font-bold text-outline mb-1 uppercase tracking-wider">Started</p>
                    <p className="text-sm font-semibold text-primary">{format(new Date(h.startedAt), 'PP p')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-outline mb-1 uppercase tracking-wider">Duration</p>
                    <p className="text-sm font-mono font-medium text-primary">{formattedDuration}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-outline mb-1 uppercase tracking-wider">Path Length</p>
                    <p className="text-sm font-mono font-medium text-primary">{h.executionPath?.length || 0} nodes</p>
                  </div>
                  <div className="hidden md:flex flex-col items-start justify-center">
                    <p className="text-[10px] font-bold text-outline mb-1 uppercase tracking-wider">Action</p>
                    <Link href={`/executions/${h.id}`} className="text-xs font-bold text-blue-500 hover:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                      <TerminalSquare className="h-3.5 w-3.5" /> VIEW LOGS &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {filteredHistory.length > 0 && (
        <div className="mt-8 mb-4 flex justify-center">
          <button className="group relative flex items-center gap-2 px-8 py-3 bg-[#111111] border border-[#27272a] rounded-lg hover:border-blue-500 transition-all duration-300">
            <span className="text-xs font-bold uppercase tracking-wider text-primary group-hover:text-blue-500 transition-colors">Load More</span>
            <ChevronDown className="h-4 w-4 text-primary group-hover:text-blue-500 group-hover:translate-y-1 transition-all" />
          </button>
        </div>
      )}
    </div>
  );
}
