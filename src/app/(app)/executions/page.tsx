'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { RotateCcw, Eye, Search, MoreVertical, ChevronDown, TerminalSquare, Activity, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonCard } from '@/components/skeletons/SkeletonCard';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import { Execution } from '@/types';


export default function ExecutionsPage() {
  const { data: history, isLoading, isError, refetch } = useQuery({
    queryKey: ['history'],
    queryFn: () => api.getHistory(),
  });

  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredHistory = useMemo(() => {
    if (!history) return [];
    return history.filter((h: Execution) => {
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
      toast.success(`Rerun started successfully. Execution ID: ${result.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to rerun execution';
      toast.error(message, {
        action: { label: 'Retry', onClick: () => handleRerun(id) }
      });
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
            aria-label="Search workflow name or ID"
            className="w-full bg-[#111111] border border-[#27272a] rounded-lg py-2.5 pl-12 pr-4 text-sm font-medium text-primary placeholder:text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors" 
            placeholder="Search workflow name or ID..." 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar" role="group" aria-label="Status filter">
          {['ALL', 'SUCCESS', 'FAILED', 'RUNNING'].map(f => (
            <button 
              key={f}
              onClick={() => setStatusFilter(f)}
              aria-pressed={statusFilter === f}
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : isError ? (
          <EmptyState 
            icon={AlertCircle} 
            title="Failed to load executions" 
            description="There was an error communicating with the server." 
            action={
              <button onClick={() => refetch()} className="bg-muted text-foreground px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-muted/80 transition-all border border-border">
                Retry
              </button>
            }
          />
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
          filteredHistory.map((h: Execution) => {
            const durationSecs = Math.floor((h.durationMs || 0) / 1000);
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
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity ml-2">
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
                    <p className="text-sm font-semibold text-primary">{format(new Date(h.startedAt || h.createdAt || Date.now()), 'PP p')}</p>
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
                        <TerminalSquare className="h-3.5 w-3.5" /> VIEW LOGS →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>


    </div>
  );
}
