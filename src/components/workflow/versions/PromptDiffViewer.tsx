import React, { useMemo } from 'react';
import * as diff from 'diff';
import { cn } from '@/lib/utils';

interface PromptDiffViewerProps {
  before: string;
  after: string;
}

export function PromptDiffViewer({ before, after }: PromptDiffViewerProps) {
  const diffResult = useMemo(() => {
    // Generate line-by-line diff
    return diff.diffLines(before || '', after || '');
  }, [before, after]);

  return (
    <div className="font-mono text-[11px] leading-relaxed bg-[#0a0a0a] border border-border rounded-md overflow-hidden">
      <div className="bg-[#121212] px-4 py-2 border-b border-border flex items-center justify-between">
        <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Prompt Diff</span>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500/50"></span><span className="text-[10px] text-gray-500">Removed</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500/50"></span><span className="text-[10px] text-gray-500">Added</span></div>
        </div>
      </div>
      <div className="p-4 overflow-x-auto whitespace-pre">
        {diffResult.map((part, index) => {
          if (part.added) {
            return (
              <div key={index} className="bg-green-500/10 text-green-400 px-2 py-0.5 -mx-2 rounded-sm mb-0.5">
                <span className="opacity-50 select-none mr-2">+</span>
                {part.value.replace(/\n$/, '')}
              </div>
            );
          }
          if (part.removed) {
            return (
              <div key={index} className="bg-red-500/10 text-red-400 px-2 py-0.5 -mx-2 rounded-sm mb-0.5 line-through decoration-red-500/30">
                <span className="opacity-50 select-none mr-2">-</span>
                {part.value.replace(/\n$/, '')}
              </div>
            );
          }
          return (
            <div key={index} className="text-gray-400 px-2 py-0.5 -mx-2 mb-0.5">
              <span className="opacity-30 select-none mr-2">&nbsp;</span>
              {part.value.replace(/\n$/, '')}
            </div>
          );
        })}
      </div>
    </div>
  );
}
