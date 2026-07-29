'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { format } from 'date-fns';
import { RotateCcw, Eye, Search, MoreVertical, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
  const { data: history, isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: () => api.getHistory(),
  });

  const router = useRouter();

  const handleRerun = async (id: string) => {
    try {
      const result = await api.rerunExecution(id);
      toast.success(`Rerun started successfully. Execution ID: ${result.executionId}`);
    } catch (err) {
      toast.error('Failed to rerun execution');
    }
  };

  return (
    <div className="flex-1 w-full max-w-[1440px] mx-auto pb-12 pt-6">
      {/* Search & Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
          <input 
            className="w-full bg-surface-container-lowest border border-outline-variant px-12 py-3 rounded-lg text-primary focus:border-primary focus:ring-0 transition-colors placeholder:text-on-surface-variant" 
            placeholder="Search workflow name or ID..." 
            type="text"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          <button className="px-4 py-1.5 rounded-full bg-primary text-on-primary font-label-caps whitespace-nowrap">All</button>
          <button className="px-4 py-1.5 rounded-full border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-colors font-label-caps whitespace-nowrap">Success</button>
          <button className="px-4 py-1.5 rounded-full border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-colors font-label-caps whitespace-nowrap">Failed</button>
          <button className="px-4 py-1.5 rounded-full border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-colors font-label-caps whitespace-nowrap">Running</button>
        </div>
      </div>

      {/* Execution List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-8 max-w-[1440px] mx-auto w-full space-y-6 animate-pulse">
            <div className="flex justify-between items-center mb-6">
              <div className="h-10 bg-white/5 rounded w-1/4"></div>
            </div>
            <div className="bg-[#0a0a0a] rounded-xl border border-white/5 p-4 space-y-4">
              <div className="h-10 bg-white/5 rounded w-full"></div>
              {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-white/5 rounded w-full"></div>)}
            </div>
          </div>
        ) : history?.length === 0 ? (
          <div className="text-center py-20 border border-outline-variant rounded-xl bg-[#0a0a0a] text-gray-500 flex flex-col items-center justify-center">
             <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 border-dashed">
               <RotateCcw className="w-8 h-8 opacity-50" />
             </div>
             <p className="font-semibold text-white mb-1">No executions yet</p>
             <p className="text-sm">When workflows run, their execution traces will appear here.</p>
          </div>
        ) : (
          history?.map((h: any) => {
            const isSuccess = h.status === 'SUCCESS';
            const isFailed = h.status === 'FAILED';
            const isRunning = h.status === 'RUNNING';
            const isPaused = h.status === 'PAUSED';

            const durationSecs = Math.floor(h.durationMs / 1000);
            const durationMins = Math.floor(durationSecs / 60);
            const durationRemSecs = durationSecs % 60;
            const formattedDuration = `${durationMins}m ${durationRemSecs}s`;

            return (
              <div key={h.id} className="bg-surface-container-low border border-outline-variant p-5 rounded-lg hover:border-outline transition-colors group">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                  <div>
                    <h3 className="font-headline-md text-primary mb-0.5">{h.workflowId}</h3>
                    <span className="font-label-mono text-on-surface-variant uppercase tracking-widest">v{h.version} • ID: {(h.id || '').substring(0,8)}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full font-label-mono border flex items-center gap-1.5 ${
                      isSuccess ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                      isFailed ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                      isRunning ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
                      'border-outline-variant text-on-surface-variant bg-surface-container-high'
                    }`}>
                      {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>}
                      {h.status}
                    </span>
                    
                    <div className="flex items-center gap-2 ml-2">
                      <button 
                        onClick={() => {
                          if (!h.workflowId || h.workflowId === 'undefined') {
                            toast.error("Workflow ID missing");
                            return;
                          }
                          router.push(`/workflows/${h.workflowId}`);
                        }}
                        className="p-2 border border-outline-variant rounded text-on-surface-variant hover:text-primary hover:border-primary transition-colors flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" /> <span className="hidden md:inline font-label-caps">VIEW</span>
                      </button>
                      <button 
                        onClick={() => handleRerun(h.id)}
                        className="p-2 border border-outline-variant rounded text-on-surface-variant hover:text-primary hover:border-primary transition-colors flex items-center gap-2"
                      >
                        <RotateCcw className="h-4 w-4" /> <span className="hidden md:inline font-label-caps">RERUN</span>
                      </button>
                      <button className="p-2 text-on-surface-variant hover:text-primary transition-colors hidden md:block">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-outline-variant pt-4">
                  <div>
                    <p className="font-label-caps text-on-surface-variant mb-1 uppercase">Started</p>
                    <p className="font-body-sm text-primary">{format(new Date(h.startedAt), 'PP p')}</p>
                  </div>
                  <div>
                    <p className="font-label-caps text-on-surface-variant mb-1 uppercase">Duration</p>
                    <p className="font-label-mono text-primary">{formattedDuration}</p>
                  </div>
                  <div>
                    <p className="font-label-caps text-on-surface-variant mb-1 uppercase">Path Length</p>
                    <p className="font-label-mono text-primary">{h.executionPath?.length || 0} nodes</p>
                  </div>
                  <div className="hidden md:block">
                    <p className="font-label-caps text-on-surface-variant mb-1 uppercase">Action</p>
                    <Link href={`/executions/${h.id}`} className="font-label-caps text-blue-400 hover:underline">
                      VIEW LOGS &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {history && history.length > 0 && (
        <div className="mt-8 mb-12 flex justify-center">
          <button className="group relative flex items-center gap-2 px-8 py-3 border border-outline-variant rounded-lg hover:border-primary transition-all duration-300">
            <span className="font-label-caps uppercase tracking-widest text-primary">Load More History</span>
            <ChevronDown className="h-4 w-4 text-primary group-hover:translate-y-1 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
}
