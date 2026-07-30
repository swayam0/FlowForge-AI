import { Handle, Position } from '@xyflow/react';
import { Terminal, Search, FileText, Database, Network, UserCheck, PlaySquare, FileCheck, Loader2, CheckCircle2, XCircle, Clock, Cpu } from 'lucide-react';
import { cn } from '../../lib/utils';
import { WorkflowStepType } from '../../types/common';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const nodeConfig: Record<string, any> = {
  [WorkflowStepType.STRUCTURED_INPUT]: { icon: Terminal, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', handle: 'bg-blue-500' },
  [WorkflowStepType.DOCUMENT_RETRIEVAL]: { icon: Search, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', handle: 'bg-orange-500' },
  [WorkflowStepType.AI_EXTRACTION]: { icon: FileText, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', handle: 'bg-purple-500' },
  [WorkflowStepType.AI_CLASSIFICATION]: { icon: Database, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30', handle: 'bg-pink-500' },
  [WorkflowStepType.DETERMINISTIC_CONDITION]: { icon: Network, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', handle: 'bg-yellow-500' },
  [WorkflowStepType.HUMAN_APPROVAL]: { icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', handle: 'bg-emerald-500' },
  [WorkflowStepType.MOCK_EXTERNAL_ACTION]: { icon: PlaySquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', handle: 'bg-emerald-500' },
  [WorkflowStepType.FINAL_REPORT]: { icon: FileCheck, color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30', handle: 'bg-gray-500' },
};

export function BaseNode({ id, data, selected }: any) {
  const type = data.type as WorkflowStepType;
  const config = nodeConfig[type] || nodeConfig[WorkflowStepType.STRUCTURED_INPUT];
  const Icon = config.icon;

  const executionStatus = data.executionStatus || 'pending'; // 'running', 'completed', 'failed', 'pending'
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    if (executionStatus === 'completed') {
      setJustCompleted(true);
      const t = setTimeout(() => setJustCompleted(false), 800);
      return () => clearTimeout(t);
    }
  }, [executionStatus]);

  const isRunning = executionStatus === 'running';
  const isFailed = executionStatus === 'failed';
  const isCompleted = executionStatus === 'completed';
  const isAI = type === WorkflowStepType.AI_EXTRACTION || type === WorkflowStepType.AI_CLASSIFICATION;
  const isApproval = type === WorkflowStepType.HUMAN_APPROVAL;
  
  // Simulated metadata based on node
  const displayId = id.split('-')[1] || id;
  const duration = isCompleted ? '1.2s' : isRunning ? '0.4s' : '--';

  let borderColor = 'border-white/10';
  let animationProps = {};

  if (isFailed) {
    borderColor = 'border-red-500/50';
    animationProps = {
      animate: { x: [-2, 2, -2, 2, 0] },
      transition: { duration: 0.3 }
    };
  } else if (justCompleted) {
    borderColor = 'border-green-500/50';
    animationProps = {
      animate: { scale: [1, 1.02, 1] },
      transition: { duration: 0.3 }
    };
  } else if (isRunning) {
    if (isApproval) {
      borderColor = 'border-amber-500/50';
      animationProps = {
        animate: { borderColor: ['rgba(245,158,11,0.2)', 'rgba(245,158,11,0.8)', 'rgba(245,158,11,0.2)'] },
        transition: { duration: 2, repeat: Infinity }
      };
    } else {
      borderColor = 'border-blue-500/50';
      animationProps = {
        animate: { borderColor: ['rgba(59,130,246,0.2)', 'rgba(59,130,246,0.8)', 'rgba(59,130,246,0.2)'] },
        transition: { duration: 1.5, repeat: Infinity }
      };
    }
  } else if (selected) {
    borderColor = 'border-white/30';
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: selected && !justCompleted ? 1.01 : 1, y: 0 }}
      {...animationProps}
      className={cn(
        "w-80 bg-[#121212]/90 backdrop-blur-xl rounded-xl overflow-hidden transition-all duration-300 border shadow-2xl relative group",
        borderColor,
        selected ? "shadow-[0_0_20px_rgba(255,255,255,0.05)]" : "shadow-black/50"
      )}
    >
      {/* Node Header */}
      <div className={cn("px-4 py-3 flex items-center justify-between border-b border-white/5 bg-[#18181b]/50")}>
        <div className="flex items-center gap-3">
          <div className={cn("p-1.5 rounded-md border border-white/5 bg-[#0a0a0a]", config.color)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-label-caps uppercase text-[10px] font-bold text-gray-400 tracking-wider">
              {type.replace('_', ' ')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono text-gray-500 uppercase tracking-widest">
            {displayId}
          </span>
          {isRunning && (
            <Loader2 className={cn("h-4 w-4 animate-spin", isApproval ? "text-amber-500" : "text-blue-400")} />
          )}
          {isCompleted && !justCompleted && <CheckCircle2 className="h-4 w-4 text-green-500/80" />}
          {isFailed && <XCircle className="h-4 w-4 text-red-500/80" />}
        </div>
      </div>
      
      {/* Node Body */}
      <div className="p-4 flex flex-col gap-3">
        <p className="font-body-md font-medium text-gray-200 line-clamp-2 leading-snug">
          {data.label || 'Unnamed Step'}
        </p>
        
        {/* Metadata Footer */}
        <div className="flex items-center gap-4 mt-1 border-t border-white/5 pt-3">
          <div className="flex items-center gap-1.5" title="Execution Time">
            <Clock className="h-3 w-3 text-gray-500" />
            <span className="text-[10px] font-mono text-gray-400">{duration}</span>
          </div>
          
          {isAI && (
            <div className="flex items-center gap-1.5" title="Token Usage">
              <Cpu className="h-3 w-3 text-gray-500" />
              <span className="text-[10px] font-mono text-gray-400">
                {isRunning ? '---' : (data.tokens || '3.2k')}
              </span>
            </div>
          )}
          
          <div className="ml-auto">
             <span className={cn(
               "text-[10px] font-label-caps uppercase tracking-wider font-semibold",
               isRunning ? (isApproval ? "text-amber-400" : "text-blue-400") :
               isCompleted ? "text-green-500" :
               isFailed ? "text-red-500" : "text-gray-600"
             )}>
               {executionStatus}
             </span>
          </div>
        </div>
      </div>

      {type !== WorkflowStepType.STRUCTURED_INPUT && (
        <Handle type="target" position={Position.Top} className={cn("w-3 h-3 border-2 border-[#121212]", config.handle)} />
      )}
      <Handle type="source" position={Position.Bottom} className={cn("w-3 h-3 border-2 border-[#121212]", config.handle)} />
    </motion.div>
  );
}
