'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { X, Activity, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useReplayStore } from '@/lib/replayStore';
import { ReplayCanvas } from './ReplayCanvas';
import { ReplayControls } from './ReplayControls';
import { ReplayInspector } from './ReplayInspector';
import { ReplayTimeline } from './ReplayTimeline';

interface ReplayModeProps {
  executionId: string;
  workflowId: string;
}

export function ReplayMode({ executionId, workflowId }: ReplayModeProps) {
  const { isOpen, close, open, tick } = useReplayStore();
  const [isInitializing, setIsInitializing] = useState(true);

  const { data: workflow } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: () => api.getWorkflow(workflowId),
    enabled: isOpen,
  });

  const { data: steps } = useQuery({
    queryKey: ['steps', executionId],
    queryFn: () => api.getExecutionSteps(executionId),
    enabled: isOpen,
  });

  const { data: logs } = useQuery({
    queryKey: ['logs', executionId],
    queryFn: () => api.getExecutionLogs(executionId),
    enabled: isOpen,
  });

  // Animation Loop
  useEffect(() => {
    let animationFrameId: number;
    const loop = () => {
      tick();
      animationFrameId = requestAnimationFrame(loop);
    };
    if (isOpen) {
      animationFrameId = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [isOpen, tick]);

  // Initialization
  useEffect(() => {
    if (isOpen && steps && steps.length > 0) {
      const firstStart = new Date(steps[0].startedAt!).getTime();
      const lastCompleted = steps[steps.length - 1].completedAt 
        ? new Date(steps[steps.length - 1].completedAt!).getTime() 
        : new Date(steps[steps.length - 1].startedAt!).getTime() + 2000;
      
      const durationMs = lastCompleted - firstStart;
      // We don't call open() here to avoid loop, we just update duration if needed, 
      // but store open() is already called by the trigger button with an estimated duration.
      // We can update the exact duration once loaded.
      useReplayStore.setState({ totalDurationMs: durationMs });
      setIsInitializing(false);
    } else if (isOpen && steps && steps.length === 0) {
      setIsInitializing(false);
    }
  }, [isOpen, steps]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-0 z-50 bg-[#050505] flex overflow-hidden"
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 z-50 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-lg border border-blue-500/30">
                <Activity className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-200 tracking-tight">Execution Replay Mode</h2>
                <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
                  Run ID: {executionId}
                </p>
              </div>
            </div>
            <button 
              onClick={close}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 relative mt-16 flex">
            {isInitializing ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <Activity className="h-8 w-8 text-blue-500/50 animate-pulse mb-4" />
                <p className="text-sm text-gray-400 font-mono">Reconstructing execution timeline...</p>
              </div>
            ) : !steps || steps.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-red-400">
                <AlertCircle className="h-8 w-8 mb-4 opacity-50" />
                <p>Replay unavailable. History is incomplete.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 relative">
                  <ReplayCanvas 
                    initialNodes={workflow?.nodes || []} 
                    initialEdges={workflow?.edges || []} 
                    steps={steps} 
                  />
                  <ReplayTimeline steps={steps} />
                  <ReplayControls />
                </div>
                <ReplayInspector steps={steps} logs={logs || []} />
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
