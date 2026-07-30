'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, AlertTriangle, XCircle, Info, ChevronDown, ChevronRight,
  X, Activity, Shield, GitBranch, Settings, Zap, BrainCircuit, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ValidationResult, ValidationIssue, ValidationCategory, ValidationSeverity } from '@/lib/validation/types';
import { useReactFlow } from '@xyflow/react';

interface ValidationPanelProps {
  result: ValidationResult;
  isValidating: boolean;
  onClose: () => void;
  onFocusNode: (nodeId: string) => void;
  bypassValidation?: boolean;
  onBypassChange?: (val: boolean) => void;
}

const categoryConfig: Record<ValidationCategory, { icon: React.ElementType; label: string }> = {
  Graph:         { icon: GitBranch,    label: 'Graph' },
  Configuration: { icon: Settings,     label: 'Configuration' },
  DataFlow:      { icon: ArrowRight,   label: 'Data Flow' },
  Security:      { icon: Shield,       label: 'Security' },
  AI:            { icon: BrainCircuit, label: 'AI' },
  Execution:     { icon: Zap,          label: 'Execution' },
};

const severityConfig: Record<ValidationSeverity, { icon: React.ElementType; label: string; color: string; bg: string; border: string }> = {
  ERROR:   { icon: XCircle,       label: 'Error',   color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
  WARNING: { icon: AlertTriangle, label: 'Warning', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  INFO:    { icon: Info,          label: 'Info',    color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  SUCCESS: { icon: CheckCircle2,  label: 'Success', color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
};

function ScoreRing({ score }: { score: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 90 ? '#22c55e' : score >= 70 ? '#eab308' : '#ef4444';

  return (
    <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#1f1f1f" strokeWidth="8" />
        <motion.circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white font-mono leading-none">{score}</span>
        <span className="text-[9px] text-gray-500 uppercase tracking-widest font-mono">/100</span>
      </div>
    </div>
  );
}

function IssueCard({ issue, onFocus }: { issue: ValidationIssue; onFocus: (id: string) => void }) {
  const sev = severityConfig[issue.severity];
  const Icon = sev.icon;

  return (
    <div className={cn('rounded-lg border p-3 space-y-2', sev.bg, sev.border)}>
      <div className="flex items-start gap-2">
        <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', sev.color)} />
        <div className="flex-1 min-w-0">
          <p className={cn('text-xs font-semibold', sev.color)}>{issue.title}</p>
          <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{issue.description}</p>
        </div>
      </div>
      
      {issue.suggestedFix && (
        <div className="ml-6 bg-black/30 rounded-md p-2">
          <p className="text-[10px] text-gray-500 font-mono">
            <span className="text-gray-400 font-semibold">Fix: </span>{issue.suggestedFix}
          </p>
        </div>
      )}

      {issue.nodeId && (
        <div className="ml-6">
          <button
            onClick={() => onFocus(issue.nodeId!)}
            className={cn(
              'text-[10px] font-semibold underline underline-offset-2',
              sev.color, 'hover:opacity-80 transition-opacity'
            )}
          >
            → Focus affected node
          </button>
        </div>
      )}
    </div>
  );
}

function CategorySection({
  category, issues, breakdown, onFocus
}: {
  category: ValidationCategory;
  issues: ValidationIssue[];
  breakdown: { score: number; maxScore: number };
  onFocus: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const config = categoryConfig[category];
  const Icon = config.icon;
  const hasErrors = issues.some(i => i.severity === 'ERROR');
  const hasWarnings = issues.some(i => i.severity === 'WARNING');
  const isPerfect = breakdown.score === breakdown.maxScore;

  return (
    <div className="border border-white/5 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'p-1.5 rounded-md',
            hasErrors ? 'bg-red-500/10 text-red-400' : hasWarnings ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'
          )}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold text-gray-200">{config.label}</span>
          {issues.length > 0 && (
            <span className={cn(
              'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
              hasErrors ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
            )}>
              {issues.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            'text-xs font-mono font-bold',
            isPerfect ? 'text-green-400' : hasErrors ? 'text-red-400' : 'text-yellow-400'
          )}>
            {breakdown.score}/{breakdown.maxScore}
          </span>
          {expanded ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5"
          >
            <div className="p-3 space-y-2">
              {issues.length === 0 ? (
                <div className="flex items-center gap-2 text-green-500/80 py-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="text-[11px]">All checks passed</span>
                </div>
              ) : (
                issues.map(issue => (
                  <IssueCard key={issue.id} issue={issue} onFocus={onFocus} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ValidationPanel({ 
  result, 
  isValidating, 
  onClose, 
  onFocusNode,
  bypassValidation = false,
  onBypassChange
}: ValidationPanelProps) {
  const categories = Object.keys(categoryConfig) as ValidationCategory[];
  const errorCount = result.issues.filter(i => i.severity === 'ERROR').length;
  const warnCount = result.issues.filter(i => i.severity === 'WARNING').length;

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 30 }}
      className="w-[380px] shrink-0 h-full bg-[#0a0a0a] border-l border-white/5 flex flex-col overflow-hidden z-30"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#050505] shrink-0">
        <div>
          <h2 className="text-sm font-bold text-gray-100 tracking-tight">Workflow Validation</h2>
          <div className="flex items-center gap-3 mt-1.5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
              {isValidating ? 'Validating...' : result.isValid ? 'Workflow Ready ✓' : `${errorCount} Error${errorCount !== 1 ? 's' : ''}`}
            </p>
            {onBypassChange && (
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={bypassValidation}
                  onChange={(e) => onBypassChange(e.target.checked)}
                />
                <div className="w-7 h-4 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
                <span className="ml-1.5 text-[9px] font-bold text-blue-400 uppercase tracking-wider select-none">Demo Mode</span>
              </label>
            )}
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Score */}
      <div className="flex items-center gap-4 p-4 border-b border-white/5 bg-[#050505] shrink-0">
        {isValidating ? (
          <div className="w-24 h-24 flex items-center justify-center shrink-0">
            <Activity className="h-8 w-8 text-blue-400/40 animate-pulse" />
          </div>
        ) : (
          <ScoreRing score={result.score} />
        )}
        <div className="flex-1 space-y-2">
          <div>
            <p className="text-xs text-gray-400">Workflow Health</p>
            <p className={cn(
              'text-lg font-bold',
              result.score >= 90 ? 'text-green-400' : result.score >= 70 ? 'text-yellow-400' : 'text-red-400'
            )}>
              {result.score >= 90 ? 'Excellent' : result.score >= 70 ? 'Needs Attention' : 'Critical Issues'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {errorCount > 0 && (
              <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-md px-2 py-1">
                <XCircle className="h-3 w-3 text-red-400" />
                <span className="text-[10px] font-bold text-red-400">{errorCount} Error{errorCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            {warnCount > 0 && (
              <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-md px-2 py-1">
                <AlertTriangle className="h-3 w-3 text-yellow-400" />
                <span className="text-[10px] font-bold text-yellow-400">{warnCount} Warning{warnCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            {errorCount === 0 && warnCount === 0 && !isValidating && (
              <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-md px-2 py-1 col-span-2">
                <CheckCircle2 className="h-3 w-3 text-green-400" />
                <span className="text-[10px] font-bold text-green-400">All checks passed</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
        {categories.map(category => (
          <CategorySection
            key={category}
            category={category}
            issues={result.issues.filter(i => i.categoryId === category)}
            breakdown={result.breakdown[category]}
            onFocus={onFocusNode}
          />
        ))}
      </div>
    </motion.div>
  );
}
