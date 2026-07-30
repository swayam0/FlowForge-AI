'use client';

import React from 'react';
import { AuditEventType } from '@/types/auditLog';
import {
  GitBranch, Play, CheckCircle2, XCircle, AlertTriangle, Zap, Settings,
  User, ArrowUpCircle, Upload, Trash2, RotateCcw, Clock, PauseCircle,
  ShieldCheck, ShieldOff, Bot, Plug, RefreshCw, Archive, FileText,
} from 'lucide-react';

type EventConfig = {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
};

export const EVENT_CONFIG: Record<string, EventConfig> = {
  [AuditEventType.WORKFLOW_CREATED]:       { label: 'Created',           icon: GitBranch,    color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  [AuditEventType.WORKFLOW_UPDATED]:       { label: 'Updated',           icon: FileText,     color: 'text-gray-300',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20' },
  [AuditEventType.WORKFLOW_PUBLISHED]:     { label: 'Published',         icon: Upload,       color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  [AuditEventType.WORKFLOW_ARCHIVED]:      { label: 'Archived',          icon: Archive,      color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  [AuditEventType.WORKFLOW_DELETED]:       { label: 'Deleted',           icon: Trash2,       color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
  [AuditEventType.VERSION_CREATED]:        { label: 'Version Created',   icon: GitBranch,    color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  [AuditEventType.VERSION_ROLLED_BACK]:    { label: 'Rolled Back',       icon: RotateCcw,    color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  [AuditEventType.EXECUTION_STARTED]:      { label: 'Run Started',       icon: Play,         color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  [AuditEventType.EXECUTION_COMPLETED]:    { label: 'Run Completed',     icon: CheckCircle2, color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  [AuditEventType.EXECUTION_FAILED]:       { label: 'Run Failed',        icon: XCircle,      color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
  [AuditEventType.EXECUTION_CANCELLED]:    { label: 'Run Cancelled',     icon: PauseCircle,  color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  [AuditEventType.EXECUTION_RESUMED]:      { label: 'Run Resumed',       icon: ArrowUpCircle,color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20' },
  [AuditEventType.RETRY_TRIGGERED]:        { label: 'Retry',             icon: RefreshCw,    color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  [AuditEventType.APPROVAL_REQUESTED]:     { label: 'Approval Requested',icon: Clock,        color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  [AuditEventType.APPROVAL_APPROVED]:      { label: 'Approved',          icon: ShieldCheck,  color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  [AuditEventType.APPROVAL_REJECTED]:      { label: 'Rejected',          icon: ShieldOff,    color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
  [AuditEventType.APPROVAL_EDITED]:        { label: 'Approval Edited',   icon: FileText,     color: 'text-gray-300',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20' },
  [AuditEventType.AI_CALLED]:              { label: 'AI Called',         icon: Bot,          color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  [AuditEventType.EXTERNAL_ACTION_INVOKED]:{ label: 'External Action',   icon: Plug,         color: 'text-pink-400',   bg: 'bg-pink-500/10',   border: 'border-pink-500/20' },
  [AuditEventType.USER_LOGGED_IN]:         { label: 'Login',             icon: User,         color: 'text-gray-300',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20' },
  [AuditEventType.SETTINGS_CHANGED]:       { label: 'Settings Changed',  icon: Settings,     color: 'text-gray-300',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20' },
  [AuditEventType.PERMISSION_CHANGED]:     { label: 'Permission Changed',icon: AlertTriangle, color: 'text-yellow-400',bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
};

export function getEventConfig(eventType: string): EventConfig {
  return EVENT_CONFIG[eventType] ?? { label: eventType, icon: FileText, color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' };
}

export function EventBadge({ eventType }: { eventType: string }) {
  const cfg = getEventConfig(eventType);
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}
