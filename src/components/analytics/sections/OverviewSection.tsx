'use client';

import React from 'react';
import { Network, Play, CheckCircle2, XCircle, Clock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

function MetricCard({ title, value, icon: Icon, color, suffix = '' }: any) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-white/10 transition-colors group relative overflow-hidden">
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none transition-colors"
        style={{
          backgroundColor: color === 'blue' ? 'rgba(59,130,246,0.15)'
            : color === 'green' ? 'rgba(34,197,94,0.15)'
            : color === 'purple' ? 'rgba(168,85,247,0.15)'
            : color === 'red' ? 'rgba(239,68,68,0.15)'
            : 'rgba(245,158,11,0.15)'
        }}
      />
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-xs font-semibold text-gray-500 tracking-wider uppercase mb-1">{title}</p>
          <h3 className="text-3xl font-bold tracking-tighter text-white">
            {value}
            <span className="text-lg text-gray-400 font-normal ml-1">{suffix}</span>
          </h3>
        </div>
        <div className={cn(
          "p-2 rounded-lg border transition-colors",
          color === 'blue' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
          color === 'green' ? "bg-green-500/10 border-green-500/20 text-green-400" :
          color === 'purple' ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
          color === 'red' ? "bg-red-500/10 border-red-500/20 text-red-400" :
          "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function OverviewSection({ data }: { data: any }) {
  if (!data) return null;
  const overview = data.overview;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      <MetricCard title="Total Workflows" value={overview.totalWorkflows} icon={Network} color="blue" />
      <MetricCard title="Total Executions" value={overview.totalExecutions} icon={Play} color="blue" />
      <MetricCard title="Success Rate" value={overview.successRate.toFixed(1)} suffix="%" icon={CheckCircle2} color="green" />
      <MetricCard title="Failed Runs" value={overview.failedRuns} icon={XCircle} color="red" />
      <MetricCard title="Avg Execution Time" value={(overview.averageExecutionTime / 1000).toFixed(2)} suffix="s" icon={Clock} color="purple" />
      <MetricCard title="Pending Approvals" value={overview.pendingApprovals} icon={Activity} color="orange" />
    </div>
  );
}
