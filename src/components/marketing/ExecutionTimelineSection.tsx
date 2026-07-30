'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, XCircle, Clock, Pause, BrainCircuit, UserCheck, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

const TIMELINE_EVENTS = [
  {
    time: '09:41:02.003',
    event: 'WORKFLOW_STARTED',
    level: 'INFO',
    message: 'Execution initiated from webhook trigger. Input payload validated.',
    icon: Zap,
    color: 'blue',
    status: 'done',
  },
  {
    time: '09:41:02.124',
    event: 'STEP_COMPLETED',
    level: 'INFO',
    message: 'Customer record fetched successfully. 14 fields extracted.',
    icon: CheckCircle2,
    color: 'green',
    status: 'done',
  },
  {
    time: '09:41:02.964',
    event: 'LLM_INFERENCE',
    level: 'INFO',
    message: 'Gemini 1.5 Pro responded in 840ms. Tokens: 2,108. Risk score: 0.12.',
    icon: BrainCircuit,
    color: 'purple',
    status: 'done',
  },
  {
    time: '09:41:03.010',
    event: 'APPROVAL_PENDING',
    level: 'WARN',
    message: 'Workflow paused at Human Review gate. Awaiting ops@company.com. Timeout: 4h.',
    icon: Pause,
    color: 'amber',
    status: 'paused',
  },
  {
    time: '09:44:18.220',
    event: 'APPROVAL_GRANTED',
    level: 'INFO',
    message: 'Reviewed and approved by sarah@company.com. Execution resumed.',
    icon: UserCheck,
    color: 'emerald',
    status: 'done',
  },
  {
    time: '09:44:18.315',
    event: 'STEP_COMPLETED',
    level: 'INFO',
    message: 'CRM updated. Receipt dispatched. Audit log finalized. Execution complete.',
    icon: CheckCircle2,
    color: 'green',
    status: 'done',
  },
];

const LEVEL_COLOR: Record<string, string> = {
  INFO: 'text-blue-400',
  WARN: 'text-amber-400',
  ERROR: 'text-red-400',
};

const ICON_COLOR: Record<string, string> = {
  blue:    'text-blue-400 bg-blue-500/10 border-blue-500/20',
  green:   'text-green-400 bg-green-500/10 border-green-500/20',
  purple:  'text-purple-400 bg-purple-500/10 border-purple-500/20',
  amber:   'text-amber-400 bg-amber-500/10 border-amber-500/20',
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  red:     'text-red-400 bg-red-500/10 border-red-500/20',
};

export function ExecutionTimelineSection() {
  return (
    <section id="timeline" className="py-28 bg-black border-t border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_30%_50%,rgba(139,92,246,0.05),transparent)] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-16 items-center">

        {/* Left: copy */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-gray-400 mb-6 uppercase tracking-widest">
            Observability
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-6 leading-tight">
            Full execution<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">visibility.</span>
          </h2>
          <p className="text-gray-400 text-lg mb-8 leading-relaxed">
            Every execution is logged at nanosecond precision. Inspect AI reasoning, approval decisions, latency breakdowns, and full I/O payloads — in real time or historically.
          </p>

          <ul className="space-y-4">
            {[
              'Per-step input/output payload capture',
              'AI reasoning and confidence scores',
              'Approval audit trail with reviewer identity',
              'Latency heatmaps and cost attribution',
              'Export to Datadog, Grafana, or any SIEM',
            ].map((point) => (
              <li key={point} className="flex items-center gap-3 text-sm text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Right: Timeline */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          {/* Terminal header */}
          <div className="rounded-2xl border border-white/10 bg-[#070707] overflow-hidden shadow-2xl shadow-black/50">
            <div className="flex items-center gap-2 px-4 py-3 bg-[#0e0e0e] border-b border-white/5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
              <span className="ml-2 text-[10px] text-gray-600 font-mono">execution · id: 8f2a-c3b4 · COMPLETED</span>
            </div>

            <div className="p-5 space-y-0">
              {TIMELINE_EVENTS.map((ev, idx) => {
                const Icon = ev.icon;
                const iconCls = ICON_COLOR[ev.color] || ICON_COLOR.blue;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.4 }}
                    className="flex gap-4 py-3 relative"
                  >
                    {/* Connector line */}
                    {idx < TIMELINE_EVENTS.length - 1 && (
                      <div className="absolute left-[19px] top-10 bottom-0 w-px bg-white/5" />
                    )}

                    {/* Icon */}
                    <div className={cn('h-9 w-9 rounded-lg border flex items-center justify-center shrink-0 relative z-10', iconCls)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-[10px] font-mono text-gray-600">{ev.time}</span>
                        <span className={cn('text-[9px] font-bold uppercase tracking-widest', LEVEL_COLOR[ev.level])}>{ev.level}</span>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">{ev.event}</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{ev.message}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
