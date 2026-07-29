import * as React from "react"
import { cn } from "../../lib/utils"
import { CheckCircle, AlertCircle, PlaySquare, PauseCircle, XCircle, Activity } from 'lucide-react'

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: string
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const upperStatus = (status || '').toUpperCase();
  
  let colorClass = "border-outline-variant text-outline bg-transparent";
  let Icon = Activity;

  switch (upperStatus) {
    case 'SUCCESS':
    case 'COMPLETED':
      colorClass = "border-green-500/30 text-green-500 bg-green-500/10";
      Icon = CheckCircle;
      break;
    case 'FAILED':
      colorClass = "border-red-500/30 text-red-500 bg-red-500/10";
      Icon = AlertCircle;
      break;
    case 'PAUSED':
      colorClass = "border-yellow-500/30 text-yellow-500 bg-yellow-500/10";
      Icon = PauseCircle;
      break;
    case 'RUNNING':
    case 'ACTIVE':
      colorClass = "border-blue-500/30 text-blue-500 bg-blue-500/10";
      Icon = PlaySquare;
      break;
    case 'CANCELLED':
      colorClass = "border-gray-500/30 text-gray-500 bg-gray-500/10";
      Icon = XCircle;
      break;
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-label-mono uppercase tracking-wider font-semibold transition-colors",
        colorClass,
        className
      )}
      {...props}
    >
      <Icon className="h-3 w-3" />
      {upperStatus}
    </div>
  )
}
