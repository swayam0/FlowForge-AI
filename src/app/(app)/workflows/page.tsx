'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { format } from 'date-fns';
import { SkeletonCard } from '../../../components/skeletons/SkeletonCard';
import { Edit2, Play, Plus, Trash2, Activity, Network, AlertCircle, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion, Variants } from 'framer-motion';
import { EmptyState } from '@/components/ui/EmptyState';
import { Workflow } from '@/types';



export default function WorkflowsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: workflows, isLoading, isError, refetch } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => api.getWorkflows(),
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this workflow?')) {
      try {
        await api.deleteWorkflow(id);
        queryClient.invalidateQueries({ queryKey: ['workflows'] });
        toast.success('Workflow deleted');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to delete workflow';
        toast.error(message, {
          action: { label: 'Retry', onClick: () => handleDelete(id, e) }
        });
      }
    }
  };

  const handleRun = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.executeWorkflow(id);
      toast.success('Execution started');
      router.push(`/executions`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start execution';
      toast.error(message, {
        action: { label: 'Retry', onClick: () => handleRun(id, e) }
      });
    }
  };

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 24 } }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto w-full space-y-8 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Workflows</h1>
          <p className="text-sm text-gray-400 max-w-2xl">
            Design and orchestrate your autonomous agent pipelines.
          </p>
        </div>
        <Link href="/workflows/create">
          <button className="bg-white text-black px-5 py-2.5 rounded-md text-sm font-semibold flex items-center gap-2 hover:bg-gray-200 transition-colors shadow-lg shadow-white/10">
            <Plus className="h-4 w-4" />
            Create Workflow
          </button>
        </Link>
      </div>

      <div className="flex-1 w-full relative">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : isError ? (
          <EmptyState 
            icon={AlertCircle} 
            title="Connection Error" 
            description="Failed to load your workflow configurations from the server."
            action={
              <button onClick={() => refetch()} className="bg-white/10 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-white/20 transition-all border border-white/5">
                Try Again
              </button>
            }
          />
        ) : (!workflows || workflows.length === 0) ? (
          <EmptyState 
            icon={Network} 
            title="No workflows yet" 
            description="Your workspace is empty. Create your first automated workflow to begin."
            action={
              <Link href="/workflows/create">
                <button className="bg-white text-black px-5 py-2.5 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-gray-200 transition-colors">
                  <Plus className="h-4 w-4" />
                  Create Workflow
                </button>
              </Link>
            }
          />
        ) : (
          <motion.div 
            variants={container} 
            initial="hidden" 
            animate="show" 
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {workflows?.map((wf: Workflow) => (
              <motion.div 
                key={wf.id} 
                variants={item}
                onClick={() => router.push(`/workflows/${wf.id}`)}
                className="group relative rounded-xl border border-white/5 bg-[#0a0a0a] p-5 h-[180px] flex flex-col justify-between hover:border-white/20 hover:bg-white/[0.02] transition-all cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
                
                <div>
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-colors">
                        <Network className="h-4 w-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                      </div>
                      <h3 className="font-semibold text-gray-200 truncate pr-2 group-hover:text-white transition-colors">{wf.name}</h3>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={wf.status} />
                    </div>
                  </div>
                  
                  <div className="flex gap-4 mt-4 ml-11">
                    <span className="text-xs text-gray-500 font-mono">v{wf.version}</span>
                    <span className="text-xs text-gray-500">{wf.nodes?.length || 0} nodes</span>
                  </div>
                </div>

                <div className="flex justify-between items-end relative z-10 ml-11 mt-4">
                  <span className="text-xs text-gray-500">
                    {format(new Date(wf.createdAt), 'MMM d, yyyy')}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => handleDelete(wf.id, e)}
                      aria-label={`Delete workflow ${wf.name}`}
                      className="p-2 rounded-md hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={(e) => handleRun(wf.id, e)}
                      aria-label={`Run workflow ${wf.name}`}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white text-black text-xs font-semibold hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100 shadow-lg"
                    >
                      <Play className="h-3 w-3" /> Run
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
