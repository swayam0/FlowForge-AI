import { Handle, Position } from '@xyflow/react';
import { Terminal, Search, FileText, Database, Network, UserCheck, PlaySquare, FileCheck, MoreVertical } from 'lucide-react';
import { cn } from '../../lib/utils';
import { WorkflowStepType } from '../../types/common';

const nodeConfig: Record<string, any> = {
  [WorkflowStepType.STRUCTURED_INPUT]: { icon: Terminal, color: 'text-blue-400', bg: 'bg-blue-950/40', border: 'border-blue-500/30', hover: 'hover:border-blue-400', handle: 'bg-blue-500' },
  [WorkflowStepType.DOCUMENT_RETRIEVAL]: { icon: Search, color: 'text-orange-400', bg: 'bg-orange-950/40', border: 'border-orange-500/30', hover: 'hover:border-orange-400', handle: 'bg-orange-500' },
  [WorkflowStepType.AI_EXTRACTION]: { icon: FileText, color: 'text-purple-400', bg: 'bg-purple-950/40', border: 'border-purple-500/30', hover: 'hover:border-purple-400', handle: 'bg-purple-500' },
  [WorkflowStepType.AI_CLASSIFICATION]: { icon: Database, color: 'text-pink-400', bg: 'bg-pink-950/40', border: 'border-pink-500/30', hover: 'hover:border-pink-400', handle: 'bg-pink-500' },
  [WorkflowStepType.DETERMINISTIC_CONDITION]: { icon: Network, color: 'text-yellow-400', bg: 'bg-yellow-950/40', border: 'border-yellow-500/30', hover: 'hover:border-yellow-400', handle: 'bg-yellow-500' },
  [WorkflowStepType.HUMAN_APPROVAL]: { icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-500/30', hover: 'hover:border-emerald-400', handle: 'bg-emerald-500' },
  [WorkflowStepType.MOCK_EXTERNAL_ACTION]: { icon: PlaySquare, color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-500/30', hover: 'hover:border-emerald-400', handle: 'bg-emerald-500' },
  [WorkflowStepType.FINAL_REPORT]: { icon: FileCheck, color: 'text-gray-400', bg: 'bg-gray-800/40', border: 'border-gray-500/30', hover: 'hover:border-gray-400', handle: 'bg-gray-500' },
};

export function BaseNode({ id, data, selected }: any) {
  const type = data.type as WorkflowStepType;
  // Default to structured input if config missing to avoid crash
  const config = nodeConfig[type] || nodeConfig[WorkflowStepType.STRUCTURED_INPUT];
  const Icon = config.icon;

  // State colors based on execution status
  const executionStatus = data.executionStatus || 'pending'; // 'running', 'completed', 'failed', 'pending'
  
  let statusClasses = '';
  if (executionStatus === 'running') statusClasses = 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]';
  else if (executionStatus === 'completed') statusClasses = 'border-green-500';
  else if (executionStatus === 'failed') statusClasses = 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]';
  else if (selected) statusClasses = 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] scale-[1.02]';
  else statusClasses = `border-transparent ${config.hover}`;

  return (
    <div className={cn(
      "w-64 bg-[#18181b] rounded-xl overflow-hidden shadow-xl transition-all duration-200 border-2",
      statusClasses
    )}>
      {type !== WorkflowStepType.STRUCTURED_INPUT && (
        <Handle type="target" position={Position.Top} className={cn("w-3 h-3 border-2 border-[#18181b]", config.handle)} />
      )}
      
      <div className={cn("px-4 py-3 flex items-center justify-between border-b", config.bg, config.border)}>
        <div className="flex items-center gap-3">
          <div className={cn("p-1.5 rounded-md bg-black/20", config.color)}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="font-label-caps uppercase text-xs font-bold text-white tracking-wider">{type.replace('_', ' ')}</span>
        </div>
      </div>
      
      <div className="p-4 bg-gradient-to-b from-transparent to-black/20">
        <p className="font-body-md font-medium text-gray-200 line-clamp-2">{data.label}</p>
        {id && (
          <p className="text-[10px] text-gray-500 mt-2 font-label-mono uppercase tracking-widest">{id.split('-')[1] || id}</p>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className={cn("w-3 h-3 border-2 border-[#18181b]", config.handle)} />
    </div>
  );
}
