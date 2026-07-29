'use client';

import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import Link from 'next/link';
import { Plus, Play, History as HistoryIcon, Network, Verified, Terminal, Cloud, Activity, Wrench, MoreVertical, CheckCircle, AlertCircle, PlaySquare } from 'lucide-react';

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
    <div className="p-margin-mobile md:p-margin-desktop max-w-[1440px] mx-auto w-full space-y-gutter">
      {/* Quick Actions & Welcome */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">System Overview</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Active monitoring for FlowForge AI environments</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/workflows/create">
            <button className="bg-primary text-surface px-6 py-2 rounded-lg font-body-sm text-body-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity">
              <Plus className="h-5 w-5" />
              Create Workflow
            </button>
          </Link>
          <Link href="/workflows">
            <button className="border border-outline-variant bg-transparent text-primary px-6 py-2 rounded-lg font-body-sm text-body-sm font-bold flex items-center gap-2 hover:bg-surface-container-low transition-colors">
              <Play className="h-5 w-5" />
              Run Workflow
            </button>
          </Link>
          <Link href="/history">
            <button className="text-on-surface-variant hover:text-primary px-4 py-2 font-body-sm text-body-sm flex items-center gap-2 transition-colors">
              <HistoryIcon className="h-5 w-5" />
              View History
            </button>
          </Link>
        </div>
      </section>

      {/* Metric Cards (Bento style) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <div className="bg-[#0a0a0a] border border-[#27272a] p-6 rounded-lg group hover:border-[#3b82f6] transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-on-surface-variant font-label-caps text-label-caps uppercase tracking-widest">Total Workflows</span>
            <Network className="h-5 w-5 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary">{workflows?.length || 0}</span>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#27272a] p-6 rounded-lg group hover:border-[#3b82f6] transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-on-surface-variant font-label-caps text-label-caps uppercase tracking-widest">Running Executions</span>
            <PlaySquare className="h-5 w-5 text-[#3b82f6] opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary">{activeExecutions.length}</span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded border border-[#3b82f6]/30 bg-[#3b82f6]/10 text-[#3b82f6] text-[10px] font-label-mono">RUNNING</span>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#27272a] p-6 rounded-lg group hover:border-error transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-on-surface-variant font-label-caps text-label-caps uppercase tracking-widest">Pending Approvals</span>
            <CheckCircle className="h-5 w-5 text-on-surface-variant opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary">{pendingApprovals.length}</span>
            <span className="text-xs text-outline font-label-mono">Required</span>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#27272a] p-6 rounded-lg group hover:border-green-500 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-on-surface-variant font-label-caps text-label-caps uppercase tracking-widest">Success Rate</span>
            <CheckCircle className="h-5 w-5 text-green-500 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary">{successRate}%</span>
          </div>
        </div>
      </section>

      {/* Tables Section */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-gutter">
        {/* Recent Workflows */}
        <div className="xl:col-span-2 bg-[#0a0a0a] border border-[#27272a] rounded-lg overflow-hidden flex flex-col h-[400px]">
          <div className="p-6 border-b border-[#27272a] flex items-center justify-between shrink-0">
            <h3 className="font-headline-md text-headline-md text-primary">Recent Workflows</h3>
            <Link className="text-blue-500 text-body-sm font-body-sm hover:underline" href="/workflows">View all</Link>
          </div>
          <div className="overflow-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-surface-container-lowest z-10">
                <tr className="border-b border-[#27272a]">
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-wider">Workflow Name</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-wider">Version</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-wider">Nodes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {loadingWorkflows ? (
                  <tr><td colSpan={4} className="px-6 py-4 text-outline text-sm">Loading...</td></tr>
                ) : workflows?.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-4 text-outline text-sm">No workflows found.</td></tr>
                ) : workflows?.slice(0, 5).map((wf: any) => (
                  <tr key={wf.id} className="hover:bg-surface-container-low transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Terminal className="h-4 w-4 text-on-surface-variant" />
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            if (!wf.id || wf.id === 'undefined') {
                              toast.error("Workflow ID missing");
                              return;
                            }
                            router.push(`/workflows/${wf.id}`);
                          }} 
                          className="font-body-sm text-body-sm text-primary hover:underline bg-transparent border-none p-0 cursor-pointer text-left"
                        >
                          {wf.name}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-label-mono text-label-mono">v{wf.version}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-label-mono border uppercase ${wf.status === 'ACTIVE' ? 'border-green-500/30 text-green-500' : 'border-outline-variant text-outline'}`}>
                        {wf.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-body-sm text-body-sm text-on-surface-variant">{wf.nodes?.length || 0} nodes</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Step / Execution Mini View */}
        <div className="bg-[#0a0a0a] border border-[#27272a] rounded-lg overflow-hidden flex flex-col h-[400px]">
          <div className="p-6 border-b border-[#27272a] flex items-center justify-between shrink-0">
            <h3 className="font-headline-md text-headline-md text-primary">Live Executions</h3>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-[10px] font-label-mono text-[#3b82f6]">REAL-TIME</span>
            </span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="divide-y divide-[#27272a]">
              {loadingHistory ? (
                <div className="p-5 text-outline text-sm">Loading...</div>
              ) : activeExecutions.length === 0 ? (
                <div className="p-5 text-outline text-sm">No active executions.</div>
              ) : activeExecutions.map((exec: any) => (
                <div key={exec.id} className="p-5 hover:bg-surface-container-low transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <Link href={`/executions/${exec.id}`} className="font-body-sm text-body-sm font-semibold text-primary hover:underline">
                      {(exec.workflowVersionId || exec.workflowId || '').substring(0, 12)}...
                    </Link>
                    <span className="font-label-mono text-[11px] text-on-surface-variant">{exec.durationMs}ms</span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="text-xs text-on-surface-variant">Current: <strong className="text-primary">{exec.currentNodeId || 'Starting'}</strong></span>
                  </div>
                  <div className="w-full bg-[#1c1b1b] h-1 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full w-[65%] animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Table: Detailed Executions */}
      <section className="bg-[#0a0a0a] border border-[#27272a] rounded-lg overflow-hidden">
        <div className="p-6 border-b border-[#27272a]">
          <h3 className="font-headline-md text-headline-md text-primary">Recent Execution History</h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-lowest">
              <tr className="border-b border-[#27272a]">
                <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-wider">Execution ID</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-wider">Workflow</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-wider">Duration</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-wider">Timeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {loadingHistory ? (
                <tr><td colSpan={5} className="px-6 py-4 text-outline text-sm">Loading...</td></tr>
              ) : history?.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-4 text-outline text-sm">No execution history found.</td></tr>
              ) : history?.slice(0, 5).map((h: any) => (
                <tr key={h.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-label-mono text-label-mono text-outline hover:text-primary">
                    <Link href={`/executions/${h.id}`}>#{(h.id || '').substring(0, 8)}</Link>
                  </td>
                  <td className="px-6 py-4 font-body-sm text-body-sm text-primary">{h.workflowVersionId || h.workflowId}</td>
                  <td className="px-6 py-4">
                    {h.status === 'SUCCESS' ? (
                      <div className="flex items-center gap-2 text-green-500">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-[11px] font-label-mono">COMPLETED</span>
                      </div>
                    ) : h.status === 'FAILED' ? (
                      <div className="flex items-center gap-2 text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-[11px] font-label-mono">FAILED</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-blue-500">
                        <PlaySquare className="h-4 w-4" />
                        <span className="text-[11px] font-label-mono">{h.status}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-label-mono text-label-mono">{h.durationMs}ms</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <div className={`w-4 h-1 rounded-full ${h.status === 'SUCCESS' ? 'bg-green-500' : h.status === 'FAILED' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                      <div className={`w-4 h-1 rounded-full ${h.status === 'SUCCESS' ? 'bg-green-500' : 'bg-[#27272a]'}`}></div>
                      <div className={`w-4 h-1 rounded-full ${h.status === 'SUCCESS' ? 'bg-green-500' : 'bg-[#27272a]'}`}></div>
                      <div className={`w-4 h-1 rounded-full ${h.status === 'SUCCESS' ? 'bg-green-500' : 'bg-[#27272a]'}`}></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-[#27272a] flex justify-center">
          <Link href="/history" className="text-outline text-label-caps hover:text-primary transition-colors">Load more history</Link>
        </div>
      </section>
    </div>
  );
}
