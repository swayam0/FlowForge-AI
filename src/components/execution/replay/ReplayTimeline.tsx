'use client';

import React from 'react';
import { useReplayStore } from '@/lib/replayStore';
import { InspectorStepData } from '@/types/inspector';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function ReplayTimeline({ steps }: { steps: InspectorStepData[] }) {
  const { currentTimeMs, seek, activeNodeId } = useReplayStore();

  if (steps.length === 0) return null;

  const firstStartTime = new Date(steps[0].startedAt!).getTime();

  return (
    <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex items-center gap-2 max-w-4xl overflow-x-auto custom-scrollbar p-4 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/5 rounded-xl">
      {steps.map((step, idx) => {
        const stepStartMs = new Date(step.startedAt!).getTime() - firstStartTime;
        const isActive = step.stepId === activeNodeId;
        const isPast = currentTimeMs >= stepStartMs;

        return (
          <React.Fragment key={step.id}>
            <div 
              className={cn(
                "flex flex-col items-center gap-2 cursor-pointer group min-w-[120px] transition-all",
                isActive ? "scale-110" : "hover:scale-105"
              )}
              onClick={() => seek(stepStartMs)}
            >
              <span className={cn(
                "text-[10px] font-mono",
                isPast ? "text-blue-400" : "text-gray-600"
              )}>
                {format(new Date(step.startedAt!), 'HH:mm:ss')}
              </span>
              
              <div className="relative flex items-center justify-center">
                <div className={cn(
                  "w-3 h-3 rounded-full transition-colors",
                  isActive ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" : 
                  isPast ? "bg-blue-500/50" : "bg-white/10"
                )} />
                {isActive && (
                  <motion.div 
                    layoutId="timeline-active-ring"
                    className="absolute inset-0 rounded-full border border-blue-400"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </div>
              
              <span className={cn(
                "text-[10px] font-semibold text-center leading-tight truncate w-full px-2",
                isPast ? "text-gray-300" : "text-gray-600"
              )}>
                {step.stepId}
              </span>
            </div>

            {idx < steps.length - 1 && (
              <div className="flex-1 min-w-[20px] h-px bg-white/10 relative">
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-blue-500/50 transition-all duration-300"
                  style={{ 
                    width: isPast && currentTimeMs >= (new Date(steps[idx + 1].startedAt!).getTime() - firstStartTime) ? '100%' : '0%' 
                  }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
