'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReplayStore } from '@/lib/replayStore';
import { CheckCircle, XCircle, Clock, Activity, SkipForward, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InspectorStepData } from '@/types/inspector';

interface FloatingNodeInfoProps {
  stepData?: InspectorStepData;
  nodeName: string;
  nodeType: string;
}

export function FloatingNodeInfo({ stepData, nodeName, nodeType }: FloatingNodeInfoProps) {
  const { activeNodeId } = useReplayStore();

  if (!stepData || !activeNodeId) return null;

  const isVisible = stepData.stepId === activeNodeId;
  const isAI = nodeType === 'AI_EXTRACTION' || nodeType === 'AI_CLASSIFICATION';
  
  const getStatusIcon = () => {
    switch (stepData.status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-400" />;
      case 'running': return <Activity className="h-4 w-4 text-blue-400 animate-pulse" />;
      case 'skipped': return <SkipForward className="h-4 w-4 text-gray-400" />;
      default: return <Clock className="h-4 w-4 text-yellow-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="absolute -top-4 left-1/2 -translate-x-1/2 -translate-y-full w-80 bg-[#121212]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 pointer-events-none overflow-hidden"
        >
          <div className="p-3 border-b border-white/5 bg-[#18181b]/50 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500">{nodeType.replace('_', ' ')}</span>
              <span className="font-semibold text-gray-200 text-sm">{nodeName}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-white/5">
              {getStatusIcon()}
              <span className="text-xs font-bold uppercase tracking-wider text-gray-300">{stepData.status}</span>
            </div>
          </div>

          <div className="p-3 space-y-3">
            {isAI && stepData.metadata?.reasoningSummary && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400/80 flex items-center gap-1 mb-1">
                  <BrainCircuit className="h-3 w-3" /> AI Summary
                </span>
                <p className="text-xs text-purple-200/90 leading-relaxed italic line-clamp-2">
                  {stepData.metadata.reasoningSummary}
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 rounded-md p-2">
                <span className="block text-[9px] font-mono uppercase text-gray-500 mb-0.5">Duration</span>
                <span className="text-xs text-gray-300 font-mono">
                  {stepData.metadata?.latencyMs ? `${stepData.metadata.latencyMs}ms` : '--'}
                </span>
              </div>
              <div className="bg-white/5 rounded-md p-2">
                <span className="block text-[9px] font-mono uppercase text-gray-500 mb-0.5">Attempt</span>
                <span className="text-xs text-gray-300 font-mono">
                  {stepData.metadata?.attemptNumber || 1}
                </span>
              </div>
            </div>

            {stepData.error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-md p-2 text-xs text-red-400 line-clamp-2">
                {stepData.error}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
