'use client';

import React from 'react';
import { useReplayStore } from '@/lib/replayStore';
import { InspectorStepData } from '@/types/inspector';
import { JsonViewer } from '../JsonViewer';
import { Terminal, FileJson, Server, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';

interface ReplayInspectorProps {
  steps: InspectorStepData[];
  logs: any[];
}

export function ReplayInspector({ steps, logs }: ReplayInspectorProps) {
  const { activeNodeId, currentTimeMs } = useReplayStore();
  const [activeTab, setActiveTab] = React.useState('input');

  const step = steps.find(s => s.stepId === activeNodeId);
  
  if (!activeNodeId) {
    return (
      <div className="w-[400px] h-full bg-[#0a0a0a] border-l border-white/10 shrink-0 flex flex-col items-center justify-center p-8 text-center text-gray-500">
        <Activity className="h-8 w-8 text-blue-500/20 mb-4" />
        <p>No active node</p>
        <p className="text-xs mt-2">Play the execution or click a node to view its details.</p>
      </div>
    );
  }

  // Filter logs up to current playback time for this step
  const firstStepStartTime = new Date(steps[0]?.startedAt || 0).getTime();
  const currentGlobalTime = firstStepStartTime + currentTimeMs;

  const nodeLogs = logs.filter(l => 
    l.stepId === activeNodeId && 
    new Date(l.timestamp).getTime() <= currentGlobalTime
  );

  const tabs = [
    { id: 'input', label: 'Input', icon: FileJson },
    { id: 'output', label: 'Output', icon: FileJson },
    { id: 'logs', label: 'Logs', icon: Terminal },
    { id: 'meta', label: 'Metadata', icon: Server }
  ];

  return (
    <div className="w-[400px] h-full bg-[#0a0a0a] border-l border-white/10 shrink-0 flex flex-col z-40">
      <div className="p-4 border-b border-white/5 shrink-0 bg-[#050505]">
        <div className="flex items-center justify-between mb-3">
          <span className="font-label-mono text-[10px] text-gray-500 font-bold uppercase tracking-widest">Inspector</span>
          <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded text-gray-400">
            {step?.status || 'Waiting'}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-gray-200 truncate">{activeNodeId}</h3>
      </div>

      <div className="flex overflow-x-auto border-b border-white/5 px-2 bg-[#050505] shrink-0 custom-scrollbar">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 text-xs font-medium transition-all border-b-2 whitespace-nowrap focus:outline-none",
                isActive 
                  ? "border-blue-500 text-blue-400" 
                  : "border-transparent text-gray-500 hover:text-gray-300"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto bg-[#050505] p-4">
        {activeTab === 'input' && (
          <JsonViewer data={step?.input || {}} className="h-full min-h-[400px]" />
        )}
        
        {activeTab === 'output' && (
          <JsonViewer data={step?.output || {}} className="h-full min-h-[400px]" />
        )}
        
        {activeTab === 'logs' && (
          <div className="bg-[#050505] border border-white/5 rounded-lg overflow-hidden h-full flex flex-col min-h-[400px]">
            <div className="flex-1 overflow-auto p-3 custom-scrollbar">
              {nodeLogs.length === 0 ? (
                <EmptyState icon={Terminal} title="No logs yet" description="Logs will appear as the node executes." className="border-none mt-8 scale-90" />
              ) : (
                <div className="space-y-1.5 font-mono text-[10px]">
                  {nodeLogs.map((log: any, idx: number) => {
                    const time = new Date(log.timestamp);
                    const levelColor = 
                      log.level === 'INFO' ? 'text-blue-400' :
                      log.level === 'ERROR' ? 'text-red-400' :
                      log.level === 'WARN' ? 'text-yellow-400' : 'text-green-400';
                    
                    return (
                      <div key={idx} className="flex gap-3 p-2 border-b border-white/5 last:border-0 hover:bg-white/5 rounded">
                        <span className="text-gray-600 shrink-0">{format(time, 'HH:mm:ss.SSS')}</span>
                        <span className={cn(levelColor, "font-bold w-10 shrink-0")}>{log.level}</span>
                        <span className="text-gray-300 break-words">{log.reason || log.message}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'meta' && step && (
          <div className="space-y-4">
             <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-gray-200 mb-3">Execution</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-0.5">Started</p>
                    <p className="text-xs text-gray-300 font-mono">{step.startedAt ? format(new Date(step.startedAt), 'HH:mm:ss.SSS') : '--'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-0.5">Completed</p>
                    <p className="text-xs text-gray-300 font-mono">{step.completedAt ? format(new Date(step.completedAt), 'HH:mm:ss.SSS') : '--'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-0.5">Duration</p>
                    <p className="text-xs text-gray-300 font-mono">{step.metadata?.latencyMs ? `${step.metadata.latencyMs}ms` : '--'}</p>
                  </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
