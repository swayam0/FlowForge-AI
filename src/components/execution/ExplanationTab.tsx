'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ExecutionExplanation, ExplanationStep } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  CheckCircle2, XCircle, Clock, ChevronDown, ChevronRight,
  Copy, BrainCircuit, ShieldCheck, Zap, Activity,
  AlertCircle, FileText, Database, GitBranch, User, Inbox,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExplanationTabProps {
  executionId: string;
}

// ---------------------------------------------------------------------------
// Helpers / sub-components
// ---------------------------------------------------------------------------

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60_000);
  const secs = ((ms % 60_000) / 1000).toFixed(0);
  return `${mins}m ${secs}s`;
}

/** Map step type → icon component */
function StepIcon({ type, className }: { type: string; className?: string }) {
  const t = type.toLowerCase();
  if (t.includes('classification') || t.includes('extraction')) {
    return <BrainCircuit className={cn('h-4 w-4', className)} />;
  }
  if (t.includes('approval')) return <ShieldCheck className={cn('h-4 w-4', className)} />;
  if (t.includes('condition')) return <GitBranch className={cn('h-4 w-4', className)} />;
  if (t.includes('retrieval') || t.includes('document')) return <Database className={cn('h-4 w-4', className)} />;
  if (t.includes('report')) return <FileText className={cn('h-4 w-4', className)} />;
  if (t.includes('action')) return <Zap className={cn('h-4 w-4', className)} />;
  if (t.includes('input')) return <Activity className={cn('h-4 w-4', className)} />;
  return <Activity className={cn('h-4 w-4', className)} />;
}

/** Colour-coded status badge for a step */
function StepStatusBadge({ status }: { status: ExplanationStep['status'] }) {
  const map = {
    completed:        { label: 'Completed',  cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
    failed:           { label: 'Failed',     cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
    skipped:          { label: 'Skipped',    cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
    waiting_approval: { label: 'Awaiting',   cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  } as const;
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-white/5 text-gray-400 border-white/10' };
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border', cls)}>
      {status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
      {status === 'failed'    && <XCircle      className="h-3 w-3" />}
      {status === 'waiting_approval' && <Clock className="h-3 w-3" />}
      {label}
    </span>
  );
}

/** Confidence ring badge */
function ConfidenceBadge({ value }: { value: number }) {
  const colour =
    value >= 85 ? 'text-green-400 border-green-500/30 bg-green-500/10' :
    value >= 60 ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                  'text-red-400 border-red-500/30 bg-red-500/10';
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border', colour)}>
      {value}% confidence
    </span>
  );
}

// ---------------------------------------------------------------------------
// Decision Path (vertical timeline)
// ---------------------------------------------------------------------------

function DecisionPath({ steps }: { steps: ExplanationStep[] }) {
  return (
    <div className="relative" role="list" aria-label="Execution decision path">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const dotColour =
          step.status === 'completed'        ? 'bg-green-500'  :
          step.status === 'failed'           ? 'bg-red-500'    :
          step.status === 'waiting_approval' ? 'bg-amber-500'  :
                                               'bg-gray-600';
        return (
          <div key={step.stepId} className="flex items-start gap-4" role="listitem">
            {/* Line + dot */}
            <div className="flex flex-col items-center shrink-0" style={{ width: 20 }}>
              <div className={cn('h-5 w-5 rounded-full border-2 border-black shrink-0 z-10 mt-0.5', dotColour)} />
              {!isLast && (
                <div className="w-px flex-1 bg-white/10 mt-1 mb-1 min-h-[32px]" />
              )}
            </div>

            {/* Label */}
            <div className={cn('pb-5', isLast && 'pb-0')}>
              <div className="flex items-center gap-2 flex-wrap">
                <StepIcon type={step.type} className="text-gray-400" />
                <span className={cn(
                  'text-sm font-semibold',
                  step.status === 'failed' ? 'text-red-400' :
                  step.status === 'completed' ? 'text-white' : 'text-gray-400',
                )}>
                  {step.name}
                </span>
                <span className="text-[10px] font-mono text-gray-600 bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/5 hidden sm:inline">
                  {step.type}
                </span>
              </div>
              {step.durationMs !== null && (
                <p className="text-[11px] text-gray-600 mt-0.5">
                  {formatDuration(step.durationMs)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual Decision Card
// ---------------------------------------------------------------------------

function DecisionCard({ step, index }: { step: ExplanationStep; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const hasDetails = !!(
    step.reason ||
    step.confidence !== null ||
    step.approval
  );

  const borderColour =
    step.status === 'completed'        ? 'border-white/5 hover:border-white/10' :
    step.status === 'failed'           ? 'border-red-500/20 hover:border-red-500/40' :
    step.status === 'waiting_approval' ? 'border-amber-500/20 hover:border-amber-500/40' :
                                         'border-white/5';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className={cn(
        'rounded-xl border bg-[#0a0a0a] overflow-hidden transition-colors',
        borderColour,
      )}
    >
      {/* Header row */}
      <button
        onClick={() => hasDetails && setExpanded(prev => !prev)}
        disabled={!hasDetails}
        aria-expanded={expanded}
        aria-controls={`step-detail-${step.stepId}`}
        className={cn(
          'w-full flex items-center gap-3 px-5 py-4 text-left',
          hasDetails ? 'cursor-pointer' : 'cursor-default',
        )}
      >
        {/* Icon */}
        <div className={cn(
          'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border',
          step.status === 'completed'        ? 'bg-green-500/10 border-green-500/20 text-green-400' :
          step.status === 'failed'           ? 'bg-red-500/10 border-red-500/20 text-red-400' :
          step.status === 'waiting_approval' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                               'bg-white/5 border-white/5 text-gray-500',
        )}>
          <StepIcon type={step.type} />
        </div>

        {/* Name + badges */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{step.name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StepStatusBadge status={step.status} />
            {step.confidence !== null && <ConfidenceBadge value={step.confidence} />}
            {step.durationMs !== null && (
              <span className="text-[10px] text-gray-600 font-mono flex items-center gap-1">
                <Clock className="h-3 w-3" />{formatDuration(step.durationMs)}
              </span>
            )}
          </div>
        </div>

        {/* Expand chevron */}
        {hasDetails && (
          <div className="shrink-0 text-gray-500">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        )}
      </button>

      {/* Expandable detail body */}
      <AnimatePresence initial={false}>
        {expanded && hasDetails && (
          <motion.div
            key="body"
            id={`step-detail-${step.stepId}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
              {/* AI Reasoning */}
              {step.reason && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    {step.type.toLowerCase().includes('approval') ? 'Decision Reason' : 'AI Reasoning'}
                  </p>
                  <p className="text-sm text-gray-300 leading-relaxed bg-[#050505] p-4 rounded-lg border border-white/5 font-serif italic">
                    &ldquo;{step.reason}&rdquo;
                  </p>
                </div>
              )}

              {/* Approval decision */}
              {step.approval && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Human Decision
                  </p>
                  <div className={cn(
                    'flex items-start gap-3 p-4 rounded-lg border',
                    step.approval.decision === 'APPROVED'
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-red-500/5 border-red-500/20',
                  )}>
                    <div className={cn(
                      'h-6 w-6 rounded-full flex items-center justify-center shrink-0',
                      step.approval.decision === 'APPROVED' ? 'bg-green-500/20' : 'bg-red-500/20',
                    )}>
                      {step.approval.decision === 'APPROVED'
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                        : <XCircle className="h-3.5 w-3.5 text-red-400" />}
                    </div>
                    <div>
                      <p className={cn(
                        'text-sm font-semibold',
                        step.approval.decision === 'APPROVED' ? 'text-green-400' : 'text-red-400',
                      )}>
                        {step.approval.decision === 'APPROVED' ? 'Approved' : 'Rejected'}
                        {step.approval.reviewer && (
                          <span className="text-gray-500 font-normal"> by {step.approval.reviewer}</span>
                        )}
                      </p>
                      {step.approval.comment && (
                        <p className="text-xs text-gray-400 mt-1">&ldquo;{step.approval.comment}&rdquo;</p>
                      )}
                      {step.approval.resolvedAt && (
                        <p className="text-[10px] text-gray-600 mt-1 font-mono">
                          {format(new Date(step.approval.resolvedAt), 'PPpp')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function ExplanationSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse" aria-busy="true" aria-label="Loading explanation">
      {/* Summary bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5 space-y-3">
            <Skeleton className="h-3 w-20 bg-white/5" />
            <Skeleton className="h-6 w-32 bg-white/5" />
          </div>
        ))}
      </div>
      {/* Path + cards */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-5 w-5 rounded-full bg-white/5 shrink-0 mt-0.5" />
              <Skeleton className="h-4 flex-1 bg-white/5" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-16 w-full rounded-xl bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ExplanationTab
// ---------------------------------------------------------------------------

export function ExplanationTab({ executionId }: ExplanationTabProps) {
  const { data: explanation, isLoading, isError, refetch } = useQuery<ExecutionExplanation>({
    queryKey: ['explanation', executionId],
    queryFn: () => api.getExplanation(executionId),
    // Only refetch while run is not yet complete — explanation is static once done
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) return 5000; // keep polling until we get a response
      return ['RUNNING', 'PAUSED', 'PENDING'].includes(status) ? 5000 : false;
    },
  });

  const copyExplanation = () => {
    if (!explanation) return;
    const text = [
      `Execution Explanation — Run ${explanation.runId}`,
      `Status: ${explanation.status}`,
      `Duration: ${formatDuration(explanation.durationMs)}`,
      `Summary: ${explanation.summary}`,
      '',
      'Steps:',
      ...explanation.steps.map((s, i) =>
        [
          `  ${i + 1}. ${s.name} [${s.status.toUpperCase()}]`,
          s.reason    ? `     Reason: ${s.reason}` : '',
          s.confidence !== null ? `     Confidence: ${s.confidence}%` : '',
          s.approval  ? `     Approval: ${s.approval.decision} by ${s.approval.reviewer}` : '',
        ].filter(Boolean).join('\n'),
      ),
      '',
      `Outcome: ${explanation.outcome}`,
    ].join('\n');

    navigator.clipboard.writeText(text).then(
      () => toast.success('Explanation copied to clipboard'),
      () => toast.error('Failed to copy to clipboard'),
    );
  };

  // --- Loading ---
  if (isLoading) return <ExplanationSkeleton />;

  // --- Error ---
  if (isError) {
    return (
      <div className="p-6">
        <EmptyState
          icon={AlertCircle}
          title="Failed to load explanation"
          description="There was an error generating the execution explanation."
          action={
            <button
              onClick={() => refetch()}
              className="bg-white/5 text-white border border-white/10 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-white/10 transition-all"
            >
              Retry
            </button>
          }
        />
      </div>
    );
  }

  // --- Empty / no explanation yet ---
  if (!explanation || explanation.steps.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Inbox}
          title="No explanation available"
          description="The explanation will be generated once the workflow has at least one completed step."
        />
      </div>
    );
  }

  // --- Full UI ---
  const statusColour =
    explanation.status === 'COMPLETED' ? 'text-green-400' :
    explanation.status === 'FAILED'    ? 'text-red-400'   :
    explanation.status === 'PAUSED'    ? 'text-amber-400' : 'text-gray-400';

  return (
    <div className="p-4 md:p-6 space-y-6 overflow-y-auto custom-scrollbar h-full pb-20" aria-label="Execution explanation">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Execution Summary</h2>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl leading-relaxed">{explanation.summary}</p>
        </div>
        <button
          onClick={copyExplanation}
          aria-label="Copy full explanation to clipboard"
          className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white hover:bg-white/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy Explanation
        </button>
      </div>

      {/* ── Summary Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Status</p>
          <p className={cn('text-2xl font-bold tracking-tight capitalize', statusColour)}>
            {explanation.status.charAt(0) + explanation.status.slice(1).toLowerCase()}
          </p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Duration</p>
          <p className="text-2xl font-bold tracking-tight text-white font-mono">
            {formatDuration(explanation.durationMs)}
          </p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Steps Executed</p>
          <p className="text-2xl font-bold tracking-tight text-white">
            {explanation.steps.length}
          </p>
        </div>
      </div>

      {/* ── Outcome Banner ── */}
      <div className={cn(
        'rounded-xl border p-4 flex items-start gap-3',
        explanation.status === 'COMPLETED' ? 'bg-green-500/5 border-green-500/20' :
        explanation.status === 'FAILED'    ? 'bg-red-500/5 border-red-500/20' :
                                             'bg-amber-500/5 border-amber-500/20',
      )}>
        {explanation.status === 'COMPLETED' ? <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0 mt-0.5" /> :
         explanation.status === 'FAILED'    ? <XCircle      className="h-5 w-5 text-red-400 shrink-0 mt-0.5" /> :
                                              <Clock        className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-0.5">Outcome</p>
          <p className="text-sm text-gray-200 leading-relaxed">{explanation.outcome}</p>
        </div>
      </div>

      {/* ── Main layout: Decision Path + Decision Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">

        {/* Left: Decision Path timeline */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-5">Execution Path</h3>
          <DecisionPath steps={explanation.steps} />
        </div>

        {/* Right: Decision Cards */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Decision Explanation</h3>
          {explanation.steps.map((step, i) => (
            <DecisionCard key={step.stepId} step={step} index={i} />
          ))}
        </div>
      </div>

    </div>
  );
}
