'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { format } from 'date-fns';
import { Edit2, Play, Plus, Trash2, Activity, Network } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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

function TableSkeleton({ columns, rows = 5 }: { columns: number, rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} className="border-b border-[#27272a] hover:bg-transparent border-none">
          {Array.from({ length: columns }).map((_, j) => (
            <TableCell key={j} className="py-5">
              <div className="h-4 bg-[#27272a]/50 rounded animate-pulse w-3/4"></div>
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export default function WorkflowsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: workflows, isLoading, refetch } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => api.getWorkflows(),
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      try {
        await api.deleteWorkflow(id);
        queryClient.invalidateQueries({ queryKey: ['workflows'] });
        toast.success('Workflow deleted');
      } catch (err) {
        toast.error('Failed to delete workflow');
      }
    }
  };

  const handleRun = async (id: string) => {
    try {
      await api.executeWorkflow(id);
      toast.success('Execution started');
      router.push(`/executions`);
    } catch (err) {
      toast.error('Failed to start execution');
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto w-full space-y-8 h-full flex flex-col">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#27272a] shrink-0">
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary">Workflows</h1>
          <p className="text-sm md:text-base text-on-surface-variant max-w-2xl leading-relaxed">
            Manage your AI automation library. Create new flows, edit existing ones, or trigger manual executions.
          </p>
        </div>
        <Link href="/workflows/create">
          <button className="bg-primary text-surface px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all whitespace-nowrap">
            <Plus className="h-4 w-4" />
            Create Workflow
          </button>
        </Link>
      </div>

      <div className="flex-1 bg-[#0a0a0a] rounded-xl border border-[#27272a] shadow-sm flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="overflow-auto flex-1 custom-scrollbar">
            <Table>
              <TableHeader className="bg-[#111111] sticky top-0 z-10 border-b border-[#27272a]">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-xs font-bold text-outline uppercase tracking-wider">Name</TableHead>
                  <TableHead className="text-xs font-bold text-outline uppercase tracking-wider">Version</TableHead>
                  <TableHead className="text-xs font-bold text-outline uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-xs font-bold text-outline uppercase tracking-wider">Created</TableHead>
                  <TableHead className="text-right text-xs font-bold text-outline uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableSkeleton columns={5} rows={6} />
              </TableBody>
            </Table>
          </div>
        ) : (!workflows || workflows.length === 0) ? (
          <div className="flex-1 p-0 flex items-center justify-center">
            <EmptyState 
              icon={Network} 
              title="No workflows found" 
              description="Create your first automation workflow to get started with the FlowForge AI engine."
              action={
                <Link href="/workflows/create">
                  <button className="bg-primary text-surface px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-all">
                    <Plus className="h-4 w-4" />
                    Create Workflow
                  </button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="overflow-auto flex-1 custom-scrollbar">
            <Table>
              <TableHeader className="bg-[#111111] sticky top-0 z-10 border-b border-[#27272a]">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-xs font-bold text-outline uppercase tracking-wider w-[30%]">Name</TableHead>
                  <TableHead className="text-xs font-bold text-outline uppercase tracking-wider">Version</TableHead>
                  <TableHead className="text-xs font-bold text-outline uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-xs font-bold text-outline uppercase tracking-wider">Created</TableHead>
                  <TableHead className="text-right text-xs font-bold text-outline uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflows?.map((wf: any) => (
                  <TableRow key={wf.id} className="border-b border-[#27272a] hover:bg-[#1c1b1b] transition-colors group">
                    <TableCell className="font-medium text-primary">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                          <Network className="h-4 w-4 text-blue-500" />
                        </div>
                        <span className="text-sm font-bold group-hover:text-blue-500 transition-colors">{wf.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-on-surface-variant font-mono text-xs font-medium">v{wf.version}</TableCell>
                    <TableCell>
                      <StatusBadge status={wf.status} />
                    </TableCell>
                    <TableCell className="text-on-surface-variant text-sm font-medium">
                      {format(new Date(wf.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleRun(wf.id)}
                          className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-[#111111] hover:bg-green-500 hover:text-white border border-[#27272a] hover:border-green-500 text-green-500 rounded-md transition-all"
                        >
                          <Play className="w-3.5 h-3.5" /> Run
                        </button>
                        <button 
                          onClick={() => {
                            if (!wf.id || wf.id === 'undefined') {
                              toast.error("Workflow ID missing");
                              return;
                            }
                            router.push(`/workflows/${wf.id}`);
                          }}
                          className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-[#111111] hover:bg-blue-500 hover:text-white border border-[#27272a] hover:border-blue-500 text-blue-500 rounded-md transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(wf.id)}
                          className="p-1.5 flex items-center justify-center bg-[#111111] hover:bg-red-500 hover:text-white border border-[#27272a] hover:border-red-500 text-red-500 rounded-md transition-all"
                          title="Delete Workflow"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
