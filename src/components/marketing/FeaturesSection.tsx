'use client';

import { motion } from 'framer-motion';
import {
  ShieldCheck, Activity, GitBranch, Zap, Lock, Database,
  Users, BarChart2, RefreshCcw, Globe, CheckSquare, Eye
} from 'lucide-react';
import { cn } from '../../lib/utils';

const FEATURES = [
  {
    icon: CheckSquare,
    title: 'Human Approval Gates',
    description: 'Insert verification checkpoints anywhere in your pipeline. Review AI payloads, view confidence scores, and edit before execution proceeds to critical systems.',
    color: 'blue',
    badge: 'Core',
  },
  {
    icon: ShieldCheck,
    title: 'AI Safety Boundaries',
    description: 'All LLM interactions run in isolated boundaries with rate limiting, fallback routines, and strict JSON schema validation to prevent hallucinated actions.',
    color: 'indigo',
    badge: 'Safety',
  },
  {
    icon: Activity,
    title: 'Real-time Telemetry',
    description: 'Monitor execution traces live. Inspect input/output payloads at every node, track latency metrics, and replay any execution for debugging.',
    color: 'emerald',
    badge: 'Observability',
  },
  {
    icon: GitBranch,
    title: 'Version Control',
    description: 'Every workflow change is versioned. Roll back to any previous version, diff changes side-by-side, and promote tested versions to production safely.',
    color: 'purple',
    badge: 'DevOps',
  },
  {
    icon: Zap,
    title: 'Event-Driven Triggers',
    description: 'Fire workflows from webhooks, cron schedules, API calls, database changes, or queue messages. Supports 50+ integration sources out of the box.',
    color: 'yellow',
    badge: 'Triggers',
  },
  {
    icon: Lock,
    title: 'Secret Management',
    description: 'Built-in encrypted vault for API keys, credentials, and config. Rotate secrets without touching workflow definitions. Zero plaintext exposure.',
    color: 'rose',
    badge: 'Security',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Role-based access control with per-workflow permissions. Assign approvers, auditors, and editors independently. Full audit trail for compliance.',
    color: 'cyan',
    badge: 'Teams',
  },
  {
    icon: RefreshCcw,
    title: 'Retry & Resilience',
    description: 'Automatic retry with exponential backoff, dead letter queues for failed steps, and circuit breakers to prevent cascade failures in connected services.',
    color: 'orange',
    badge: 'Reliability',
  },
  {
    icon: Globe,
    title: 'Multi-Region Execution',
    description: 'Deploy workflows to any cloud region or your own infrastructure. Data residency controls, latency-optimized routing, and edge execution support.',
    color: 'teal',
    badge: 'Infrastructure',
  },
];

const GRID_COLS_COLOR: Record<string, { border: string; bg: string; text: string }> = {
  blue:    { border: 'group-hover:border-blue-500/30',    bg: 'bg-blue-500/10 border-blue-500/20',    text: 'text-blue-400' },
  indigo:  { border: 'group-hover:border-indigo-500/30',  bg: 'bg-indigo-500/10 border-indigo-500/20', text: 'text-indigo-400' },
  emerald: { border: 'group-hover:border-emerald-500/30', bg: 'bg-emerald-500/10 border-emerald-500/20',text: 'text-emerald-400' },
  purple:  { border: 'group-hover:border-purple-500/30',  bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-400' },
  yellow:  { border: 'group-hover:border-yellow-500/30',  bg: 'bg-yellow-500/10 border-yellow-500/20', text: 'text-yellow-400' },
  rose:    { border: 'group-hover:border-rose-500/30',    bg: 'bg-rose-500/10 border-rose-500/20',    text: 'text-rose-400' },
  cyan:    { border: 'group-hover:border-cyan-500/30',    bg: 'bg-cyan-500/10 border-cyan-500/20',    text: 'text-cyan-400' },
  orange:  { border: 'group-hover:border-orange-500/30',  bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-400' },
  teal:    { border: 'group-hover:border-teal-500/30',    bg: 'bg-teal-500/10 border-teal-500/20',    text: 'text-teal-400' },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-28 bg-[#030303] border-t border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />
      <div className="mx-auto max-w-7xl px-6 relative z-10">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-gray-400 mb-5 uppercase tracking-widest">
            Capabilities
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
            Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">control.</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Every primitive you need to build production-grade AI automation with confidence.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {FEATURES.map((feature) => {
            const c = GRID_COLS_COLOR[feature.color];
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={item}
                className={cn(
                  'relative p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-300 group overflow-hidden cursor-default',
                  c.border
                )}
              >
                {/* Subtle corner glow on hover */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/0 group-hover:bg-blue-500/5 rounded-full blur-2xl -mr-8 -mt-8 transition-all duration-500 pointer-events-none" />

                <div className="flex items-start justify-between mb-4">
                  <div className={cn('h-10 w-10 rounded-xl border flex items-center justify-center', c.bg)}>
                    <Icon className={cn('h-4.5 w-4.5', c.text)} style={{ height: 18, width: 18 }} />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                    {feature.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-100 mb-2 group-hover:text-white transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { value: '50+', label: 'Integrations' },
            { value: '99.9%', label: 'Uptime SLA' },
            { value: '<40ms', label: 'P50 Latency' },
            { value: '1M+', label: 'Daily Executions' },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-6 rounded-2xl border border-white/5 bg-white/[0.01]">
              <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-xs text-gray-500 uppercase tracking-widest font-medium">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
