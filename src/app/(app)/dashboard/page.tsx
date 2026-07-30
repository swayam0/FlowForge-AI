'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { EmptyState } from '@/components/ui/EmptyState';
import { Execution } from '@/types';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { 
  Play, Network, CheckCircle2, XCircle, 
  Clock, Zap, DollarSign, Database, Activity, 
  ArrowRight, Sparkles, ChevronRight 
} from 'lucide-react';

function CSSAreaChart({ data, color }: { data: { value: number; [key: string]: unknown }[], color: string }) {
  // A simple CSS representation of a trend graph for the mockups
  const max = Math.max(...data.map((d) => d.value));
  
  return (
    <div className="flex items-end gap-1 h-full w-full pt-4 opacity-70 group-hover:opacity-100 transition-opacity">
      {data.map((d, i: number) => {
        const height = `${(d.value / max) * 100}%`;
        return (
          <div key={i} className="flex-1 flex flex-col justify-end group/bar relative h-full">
            <div 
              className={`w-full rounded-t-sm transition-all duration-500 ease-out`}
              style={{ 
                height, 
                backgroundColor: color === 'blue' ? '#3b82f6' : color === 'green' ? '#22c55e' : color === 'purple' ? '#a855f7' : '#f59e0b'
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  data?: { value: number; [key: string]: unknown }[];
  color: string;
}

function MetricCard({ title, value, icon: Icon, trend, data, color }: MetricCardProps) {
  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors group relative overflow-hidden">
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none transition-colors"
        style={{
          backgroundColor: color === 'blue' ? 'rgba(59,130,246,0.1)'
            : color === 'green' ? 'rgba(34,197,94,0.1)'
            : color === 'purple' ? 'rgba(168,85,247,0.1)'
            : 'rgba(245,158,11,0.1)'
        }}
      />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <p className="text-xs font-semibold text-gray-500 tracking-wider uppercase mb-1">{title}</p>
          <h3 className="text-3xl font-bold tracking-tighter text-white">{value}</h3>
        </div>
        <div className="p-2 bg-white/[0.02] rounded-lg border border-white/5 group-hover:border-white/10 transition-colors">
          <Icon className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
        </div>
      </div>
      
      {data && (
        <div className="h-[40px] w-full mt-4 -mx-1 relative z-10">
           <CSSAreaChart data={data} color={color} />
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const { data: workflows } = useQuery({ queryKey: ['workflows'], queryFn: () => api.getWorkflows() });
  const { data: history } = useQuery({ queryKey: ['history'], queryFn: () => api.getHistory() });

  const activeExecutions = history?.filter((h: Execution) => h.status === 'RUNNING') || [];
  const pendingApprovals = history?.filter((h: Execution) => h.status === 'PAUSED') || [];
  const successExecutions = history?.filter((h: Execution) => h.status === 'COMPLETED') || [];
  
  // Mock data for charts
  const successData = [
    { name: 'Mon', value: 4 }, { name: 'Tue', value: 3 }, { name: 'Wed', value: 7 },
    { name: 'Thu', value: 5 }, { name: 'Fri', value: 8 }, { name: 'Sat', value: 12 }, { name: 'Sun', value: successExecutions.length || 15 }
  ];

  const usageData = [
    { name: 'Mon', value: 1200 }, { name: 'Tue', value: 3000 }, { name: 'Wed', value: 2500 },
    { name: 'Thu', value: 4000 }, { name: 'Fri', value: 3200 }, { name: 'Sat', value: 5000 }, { name: 'Sun', value: 6500 }
  ];

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto w-full min-h-screen">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
        
        {/* Welcome Section */}
        <motion.section variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white flex items-center gap-3">
              Good evening, Dev.
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs font-medium">
                <Sparkles className="h-3 w-3" />
                Pro Plan
              </span>
            </h1>
            <p className="text-gray-400">Here's what's happening in your workspaces today.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/workflows/create" className="h-9 inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200 transition-colors">
              New Workflow
            </Link>
          </div>
        </motion.section>

        {/* Analytics Grid */}
        <motion.section variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Total Workflows" value={workflows?.length || 0} icon={Network} color="blue" />
          <MetricCard title="Active Runs" value={activeExecutions.length} icon={Play} color="blue" />
          <MetricCard title="Success Rate" value="98.2%" icon={CheckCircle2} color="green" data={successData} />
          <MetricCard title="Pending Approvals" value={pendingApprovals.length} icon={Activity} color="orange" />
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart / Recent Executions */}
          <motion.div variants={item} className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-white/5 bg-[#050505] overflow-hidden flex flex-col min-h-[400px]">
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black/40">
                <h3 className="font-semibold text-gray-200">Recent Executions</h3>
                <Link href="/executions" className="text-sm text-gray-500 hover:text-white transition-colors flex items-center">
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              <div className="p-0 overflow-x-auto">
                {(!history || history.length === 0) ? (
                  <div className="p-8">
                    <EmptyState
                      icon={Activity}
                      title="No executions yet"
                      description="Your recent workflow executions will appear here."
                      className="border-none py-12"
                    />
                  </div>
                ) : (
                  <>
                    {/* Desktop View */}
                    <table className="hidden md:table w-full text-sm text-left">
                      <thead className="text-xs text-gray-500 uppercase bg-[#0a0a0a]/50 border-b border-white/5">
                        <tr>
                          <th className="px-6 py-3 font-medium">Run ID</th>
                          <th className="px-6 py-3 font-medium">Status</th>
                          <th className="px-6 py-3 font-medium">Duration</th>
                          <th className="px-6 py-3 text-right font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history?.slice(0, 6).map((run: Execution) => (
                          <tr key={run.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => router.push(`/executions/${run.id}`)}>
                            <td className="px-6 py-4 font-mono text-gray-300">{(run.id || '').substring(0, 8)}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                run.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                                run.status === 'FAILED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                run.status === 'RUNNING' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                              }`}>
                                {run.status === 'RUNNING' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 animate-pulse" />}
                                {run.status === 'COMPLETED' ? 'SUCCESS' : run.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-400 font-mono">{run.durationMs || 0}ms</td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-gray-500 group-hover:text-white transition-colors"><ArrowRight className="h-4 w-4 inline-block" /></span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Mobile View */}
                    <div className="md:hidden flex flex-col divide-y divide-white/5">
                      {history?.slice(0, 6).map((run: Execution) => (
                        <div 
                          key={run.id} 
                          className="p-4 hover:bg-white/[0.02] transition-colors cursor-pointer flex flex-col gap-3" 
                          onClick={() => router.push(`/executions/${run.id}`)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-gray-300 font-medium">{(run.id || '').substring(0, 8)}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              run.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                              run.status === 'FAILED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              run.status === 'RUNNING' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            }`}>
                              {run.status === 'RUNNING' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 animate-pulse" />}
                              {run.status === 'COMPLETED' ? 'SUCCESS' : run.status}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-400">
                            <span className="font-mono">{run.durationMs || 0}ms</span>
                            <span className="text-gray-500 group-hover:text-white transition-colors"><ArrowRight className="h-4 w-4 inline-block" /></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* AI Usage & Stats */}
          <motion.div variants={item} className="space-y-6">
            <div className="rounded-xl border border-white/5 bg-[#050505] p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-purple-500/20 transition-colors" />
              <div className="flex items-center gap-2 mb-6 relative z-10">
                <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20">
                  <Zap className="h-4 w-4 text-purple-400" />
                </div>
                <h3 className="font-semibold text-gray-200">AI Usage</h3>
              </div>
              
              <div className="space-y-5 relative z-10">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400 flex items-center gap-1.5"><Database className="h-3.5 w-3.5" /> Tokens Processed</span>
                    <span className="font-mono text-gray-200">{((history?.length || 0) * 842).toLocaleString()}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 w-[65%]" />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400 flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Est. Cost</span>
                    <span className="font-mono text-gray-200">${(((history?.length || 0) * 842) * 0.0002).toFixed(2)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500/80 w-[42%]" />
                  </div>
                </div>
              </div>

              <div className="h-[80px] w-full mt-6 -mx-2 relative z-10">
                <CSSAreaChart data={usageData} color="purple" />
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="rounded-xl border border-white/5 bg-[#0a0a0a] p-5">
              <h3 className="font-semibold text-gray-200 mb-4 text-sm">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/settings" className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                  <span className="text-sm text-gray-400">Configure API Keys</span>
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                </Link>
                <Link href="https://docs.flowforge.ai" className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                  <span className="text-sm text-gray-400">Read Documentation</span>
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
