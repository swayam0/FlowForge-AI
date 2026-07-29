'use client';

import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import Link from 'next/link';
import { Plus, Play, History as HistoryIcon, Network, Verified, Terminal, Cloud, Activity, Wrench, MoreVertical, CheckCircle, AlertCircle, PlaySquare, FileText, Settings } from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';

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

function TableSkeleton({ columns, rows = 4 }: { columns: number, rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-[#27272a] last:border-0">
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

export default function DashboardPage() {
  const router = useRouter();

  const { data: workflows, isLoading: loadingWorkflows } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => api.getWorkflows(),
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['history'],
    queryFn: () => api.getHistory(),
  });

  const activeExecutions = history?.filter((h: any) => h.status === 'RUNNING') || [];
  const pendingApprovals = history?.filter((h: any) => h.status === 'PAUSED') || [];
  const failedExecutions = history?.filter((h: any) => h.status === 'FAILED') || [];
  const successExecutions = history?.filter((h: any) => h.status === 'SUCCESS') || [];
  
  const successRate = history?.length ? Math.round((successExecutions.length / history.length) * 100) : 0;

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto w-full space-y-8">
      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#27272a]">
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary">Dashboard</h1>
          <p className="text-sm md:text-base text-on-surface-variant max-w-2xl leading-relaxed">
            Monitor your AI workflows, track active executions, and manage pending approvals in real-time.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/history">
            <button className="text-on-surface-variant hover:text-primary hover:bg-[#27272a]/50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
              <HistoryIcon className="h-4 w-4" />
              History
            </button>
          </Link>
          <Link href="/workflows">
            <button className="border border-[#27272a] bg-[#0a0a0a] text-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-[#27272a]/50 transition-colors">
              <Play className="h-4 w-4" />
              Run Workflow
            </button>
          </Link>
          <Link href="/workflows/create">
            <button className="bg-primary text-surface px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">
              <Plus className="h-4 w-4" />
              Create Workflow
            </button>
          </Link>
        </div>
      </section>

      {/* Metric Cards (Bento style) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#0a0a0a] border border-[#27272a] p-6 rounded-xl shadow-sm group hover:border-blue-500/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Total Workflows</span>
            <Network className="h-5 w-5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-primary">{workflows?.length || 0}</span>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#27272a] p-6 rounded-xl shadow-sm group hover:border-blue-500/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Running Executions</span>
            <PlaySquare className="h-5 w-5 text-blue-500 opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-primary">{activeExecutions.length}</span>
            {activeExecutions.length > 0 && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-500 text-[10px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                LIVE
              </span>
            )}
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#27272a] p-6 rounded-xl shadow-sm group hover:border-yellow-500/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Pending Approvals</span>
            <CheckCircle className="h-5 w-5 text-yellow-500 opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-primary">{pendingApprovals.length}</span>
            {pendingApprovals.length > 0 && <span className="text-xs text-yellow-500 font-mono font-semibold">Action Required</span>}
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#27272a] p-6 rounded-xl shadow-sm group hover:border-green-500/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Success Rate</span>
            <Activity className="h-5 w-5 text-green-500 opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-primary">{successRate}%</span>
          </div>
        </div>
      </section>

      {/* Tables Section */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Workflows */}
        <div className="xl:col-span-2 bg-[#0a0a0a] border border-[#27272a] rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[450px]">
          <div className="p-6 border-b border-[#27272a] flex items-center justify-between bg-[#111111]/50">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <Network className="h-5 w-5 text-blue-500" />
              Recent Workflows
            </h3>
            <Link className="text-blue-500 text-sm font-semibold hover:underline" href="/workflows">View all</Link>
          </div>
          <div className="overflow-auto custom-scrollbar flex-1 relative">
            {loadingWorkflows ? (
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#111111] sticky top-0 z-10">
                  <tr className="border-b border-[#27272a]">
                    <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider">Workflow Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider">Version</th>
                    <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  <TableSkeleton columns={3} rows={5} />
                </tbody>
              </table>
            ) : workflows?.length === 0 ? (
              <EmptyState 
                icon={FileText} 
                title="No workflows yet" 
                description="Get started by creating your first automated AI workflow."
                action={
                  <Link href="/workflows/create">
                    <button className="bg-primary text-surface px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-all">
                      Create Workflow
                    </button>
                  </Link>
                }
              />
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#111111] sticky top-0 z-10">
                  <tr className="border-b border-[#27272a]">
                    <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider">Workflow Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider">Version</th>
                    <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider text-right">Nodes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  {workflows?.slice(0, 5).map((wf: any) => (
                    <tr key={wf.id} className="hover:bg-[#1c1b1b] transition-colors duration-150 group cursor-pointer" onClick={() => router.push(`/workflows/${wf.id}`)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Terminal className="h-4 w-4 text-on-surface-variant group-hover:text-blue-500 transition-colors" />
                          <span className="text-sm font-semibold text-primary group-hover:text-blue-500 transition-colors">
                            {wf.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">v{wf.version}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={wf.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant text-right">{wf.nodes?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Active Step / Execution Mini View */}
        <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[450px]">
          <div className="p-6 border-b border-[#27272a] flex items-center justify-between bg-[#111111]/50">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <PlaySquare className="h-5 w-5 text-blue-500" />
              Live Executions
            </h3>
            {activeExecutions.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                <span className="text-[10px] font-mono font-bold text-blue-500">REAL-TIME</span>
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            {loadingHistory ? (
              <div className="p-6 space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-[#27272a] rounded w-1/2 mb-3"></div>
                    <div className="h-3 bg-[#27272a]/50 rounded w-3/4 mb-4"></div>
                    <div className="h-1.5 bg-[#27272a] rounded-full w-full"></div>
                  </div>
                ))}
              </div>
            ) : activeExecutions.length === 0 ? (
              <EmptyState 
                icon={Activity} 
                title="Systems Idle" 
                description="No active workflows are currently running in the engine."
              />
            ) : (
              <div className="divide-y divide-[#27272a]">
                {activeExecutions.map((exec: any) => (
                  <div key={exec.id} className="p-6 hover:bg-[#1c1b1b] transition-colors cursor-pointer" onClick={() => router.push(`/executions/${exec.id}`)}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-bold text-primary hover:text-blue-500 transition-colors">
                        {(exec.workflowVersionId || exec.workflowId || '').substring(0, 12)}...
                      </span>
                      <span className="font-mono text-xs text-on-surface-variant font-medium">{exec.durationMs}ms</span>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.8)]"></span>
                      <span className="text-xs text-on-surface-variant">Step: <strong className="text-primary font-mono bg-[#27272a] px-1.5 py-0.5 rounded ml-1">{exec.currentNodeId || 'Init'}</strong></span>
                    </div>
                    <div className="w-full bg-[#1c1b1b] h-1.5 rounded-full overflow-hidden border border-[#27272a]">
                      <div className="bg-blue-500 h-full w-[65%] animate-pulse relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1.5s_infinite]"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bottom Table: Detailed Executions */}
      <section className="bg-[#0a0a0a] border border-[#27272a] rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-[#27272a] flex items-center justify-between bg-[#111111]/50">
          <h3 className="text-lg font-bold text-primary flex items-center gap-2">
            <HistoryIcon className="h-5 w-5 text-blue-500" />
            Recent Execution History
          </h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#111111]">
              <tr className="border-b border-[#27272a]">
                <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider">Execution ID</th>
                <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider">Workflow</th>
                <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider">Duration</th>
                <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {loadingHistory ? (
                <TableSkeleton columns={5} rows={4} />
              ) : history?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <EmptyState 
                      icon={HistoryIcon} 
                      title="No execution history" 
                      description="Workflows that are executed will appear here in the history log."
                    />
                  </td>
                </tr>
              ) : history?.slice(0, 5).map((h: any) => (
                <tr key={h.id} className="hover:bg-[#1c1b1b] transition-colors cursor-pointer group" onClick={() => router.push(`/executions/${h.id}`)}>
                  <td className="px-6 py-4 font-mono text-xs font-medium text-outline group-hover:text-primary transition-colors">
                    #{(h.id || '').substring(0, 12)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-primary">{h.workflowVersionId || h.workflowId}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={h.status} />
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-on-surface-variant font-medium">{h.durationMs}ms</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-500 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 justify-end ml-auto">
                      View Logs <MoreVertical className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-[#27272a] flex justify-center bg-[#111111]/30">
          <Link href="/history" className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">
            View all execution history
          </Link>
        </div>
      </section>
    </div>
  );
}
