'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Search, Database, UserCheck, FileCheck, CheckCircle2, ArrowRight, Play, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';

const WORKFLOW_STEPS = [
  {
    id: 'trigger',
    title: 'Stripe Webhook',
    subtitle: 'Trigger',
    icon: Zap,
    color: 'blue',
    description: 'An invoice.paid event fires from Stripe. FlowForge captures the webhook and begins the orchestration sequence.',
    payload: '{ "event": "invoice.paid", "amount": 4999, "currency": "USD" }',
    duration: '0ms',
  },
  {
    id: 'retrieval',
    title: 'Fetch Customer',
    subtitle: 'Action',
    icon: Search,
    color: 'orange',
    description: 'Customer record is fetched from the database using the customer_id from the webhook payload.',
    payload: '{ "customer_id": "cus_xK2f9", "plan": "enterprise", "region": "us-east" }',
    duration: '120ms',
  },
  {
    id: 'ai',
    title: 'AI Analysis',
    subtitle: 'LLM Node',
    icon: Database,
    color: 'purple',
    description: 'Gemini 1.5 Pro analyzes the invoice, customer history, and payment patterns to generate a risk score and recommended action.',
    payload: '{ "risk_score": 0.12, "recommendation": "approve", "confidence": 0.97 }',
    duration: '840ms',
  },
  {
    id: 'approval',
    title: 'Human Review',
    subtitle: 'Approval Gate',
    icon: UserCheck,
    color: 'amber',
    description: 'High-value transactions pause for human review. The assigned reviewer sees the AI recommendation and full context before deciding.',
    payload: '{ "status": "pending", "reviewer": "ops@company.com", "timeout": "4h" }',
    duration: 'PAUSED',
  },
  {
    id: 'crm',
    title: 'Update CRM',
    subtitle: 'Action',
    icon: FileCheck,
    color: 'green',
    description: 'After approval, the CRM record is updated, an invoice receipt is dispatched, and the audit log is finalized.',
    payload: '{ "crm_updated": true, "receipt_sent": true, "audit_id": "aud_8f2a" }',
    duration: '95ms',
  },
];

const COLOR_MAP: Record<string, { border: string; bg: string; text: string; glow: string; badge: string }> = {
  blue:   { border: 'border-blue-500/40',   bg: 'bg-blue-500/10',   text: 'text-blue-400',   glow: 'shadow-blue-500/10',   badge: 'bg-blue-500/15 border-blue-500/30 text-blue-300' },
  orange: { border: 'border-orange-500/40', bg: 'bg-orange-500/10', text: 'text-orange-400', glow: 'shadow-orange-500/10', badge: 'bg-orange-500/15 border-orange-500/30 text-orange-300' },
  purple: { border: 'border-purple-500/40', bg: 'bg-purple-500/10', text: 'text-purple-400', glow: 'shadow-purple-500/10', badge: 'bg-purple-500/15 border-purple-500/30 text-purple-300' },
  amber:  { border: 'border-amber-500/40',  bg: 'bg-amber-500/10',  text: 'text-amber-400',  glow: 'shadow-amber-500/10',  badge: 'bg-amber-500/15 border-amber-500/30 text-amber-300' },
  green:  { border: 'border-green-500/40',  bg: 'bg-green-500/10',  text: 'text-green-400',  glow: 'shadow-green-500/10',  badge: 'bg-green-500/15 border-green-500/30 text-green-300' },
};

export function WorkflowSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = WORKFLOW_STEPS[activeIdx];
  const colors = COLOR_MAP[active.color];

  return (
    <section id="workflow" className="py-28 bg-black border-t border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(59,130,246,0.04),transparent)] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-gray-400 mb-5 uppercase tracking-widest">
            Interactive Demo
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
            Watch a workflow <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">execute live.</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Click each node to inspect the payload, AI reasoning, and execution metadata at every step.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Left: Step selector */}
          <div className="flex flex-col gap-3">
            {WORKFLOW_STEPS.map((step, idx) => {
              const isActive = activeIdx === idx;
              const isCompleted = idx < activeIdx;
              const c = COLOR_MAP[step.color];
              const Icon = step.icon;

              return (
                <motion.button
                  key={step.id}
                  onClick={() => setActiveIdx(idx)}
                  className={cn(
                    'w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 group',
                    isActive
                      ? `${c.border} bg-white/[0.03] shadow-xl ${c.glow}`
                      : 'border-white/5 hover:border-white/15 hover:bg-white/[0.02]'
                  )}
                  whileHover={{ x: isActive ? 0 : 4 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className={cn(
                    'h-10 w-10 rounded-lg border flex items-center justify-center shrink-0 transition-all',
                    isCompleted ? 'bg-green-500/10 border-green-500/30' : isActive ? `${c.bg} ${c.border}` : 'bg-white/5 border-white/10'
                  )}>
                    {isCompleted
                      ? <CheckCircle2 className="h-4 w-4 text-green-400" />
                      : <Icon className={cn('h-4 w-4', isActive ? c.text : 'text-gray-500')} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm font-semibold', isActive ? 'text-white' : isCompleted ? 'text-gray-300' : 'text-gray-400')}>
                        {step.title}
                      </span>
                      <span className={cn('text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border', isActive ? c.badge : 'text-gray-600 bg-white/5 border-white/10')}>
                        {step.subtitle}
                      </span>
                    </div>
                    {isActive && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-gray-500 mt-1 line-clamp-1"
                      >
                        {step.description}
                      </motion.p>
                    )}
                  </div>
                  <div className="shrink-0 text-[10px] font-mono text-gray-600">{step.duration}</div>
                </motion.button>
              );
            })}

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setActiveIdx((p) => Math.min(p + 1, WORKFLOW_STEPS.length - 1))}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white text-black text-xs font-bold hover:bg-gray-200 transition-colors"
              >
                <Play className="h-3.5 w-3.5" /> Next Step
              </button>
              <button
                onClick={() => setActiveIdx(0)}
                className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-xs font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            </div>
          </div>

          {/* Right: Detail panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className={cn('rounded-2xl border bg-[#080808] overflow-hidden shadow-2xl', colors.border)}
            >
              {/* Card Header */}
              <div className="p-5 border-b border-white/5 bg-[#0e0e0e]">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn('h-9 w-9 rounded-lg border flex items-center justify-center', colors.bg, colors.border)}>
                    <active.icon className={cn('h-4 w-4', colors.text)} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{active.title}</h3>
                    <span className={cn('text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border', colors.badge)}>
                      {active.subtitle}
                    </span>
                  </div>
                  <div className="ml-auto text-right">
                    <span className="text-[10px] text-gray-500">Duration</span>
                    <div className={cn('text-sm font-mono font-bold', colors.text)}>{active.duration}</div>
                  </div>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{active.description}</p>
              </div>

              {/* Payload section */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-gray-600">Output Payload</span>
                </div>
                <div className="bg-black/70 rounded-xl border border-white/5 p-4 font-mono text-xs text-green-400 leading-relaxed overflow-x-auto">
                  <pre>{active.payload}</pre>
                </div>
              </div>

              {/* Progress */}
              <div className="px-5 pb-5">
                <div className="flex justify-between text-[10px] text-gray-600 mb-2">
                  <span>Pipeline Progress</span>
                  <span>{activeIdx + 1} / {WORKFLOW_STEPS.length} steps</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className={cn('h-full rounded-full', activeIdx < 3 ? 'bg-blue-500' : activeIdx === 3 ? 'bg-amber-500' : 'bg-green-500')}
                    animate={{ width: `${((activeIdx + 1) / WORKFLOW_STEPS.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
