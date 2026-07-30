'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Server, Lock, GitBranch, Database, Cpu, Globe } from 'lucide-react';
import { cn } from '../../lib/utils';

const ARCH_LAYERS = [
  {
    label: 'Your Applications',
    items: ['REST API Trigger', 'Webhook Events', 'Cron Schedules', 'SDK Client'],
    color: 'gray',
  },
  {
    label: 'FlowForge Engine',
    items: ['Orchestrator', 'Step Executor', 'State Machine', 'Approval Service'],
    color: 'blue',
    featured: true,
  },
  {
    label: 'Integrations',
    items: ['LLM APIs', 'Databases', 'HTTP Actions', 'Queues / Streams'],
    color: 'gray',
  },
];

const ARCH_FEATURES = [
  {
    icon: Server,
    title: 'Stateless Execution',
    desc: 'Scale infinitely using serverless or containerized environments. No state stored in the runner.',
  },
  {
    icon: Lock,
    title: 'Local Data Plane',
    desc: 'Keep sensitive data on-premise. Connect the engine directly inside your VPC with zero egress.',
  },
  {
    icon: GitBranch,
    title: 'API-First Design',
    desc: 'Every resource is accessible via REST. Build your own UI or integrate FlowForge into existing tooling.',
  },
  {
    icon: Globe,
    title: 'Multi-Cloud Ready',
    desc: 'Deploy to AWS, GCP, Azure, or bare metal. Bring your own infrastructure — no vendor lock-in.',
  },
];

export function ArchitectureSection() {
  return (
    <section id="architecture" className="py-28 bg-[#030303] border-t border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_50%,rgba(59,130,246,0.05),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-gray-400 mb-5 uppercase tracking-widest">
            Architecture
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
            Built for your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">infrastructure.</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            FlowForge is a standalone orchestrator. Connect it to your existing stack via standard APIs — no rewrites, no vendor lock-in.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">

          {/* Architecture diagram */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-2xl border border-white/8 bg-[#080808] p-8 overflow-hidden shadow-2xl"
          >
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] [background-size:20px_20px]" />
            <div className="relative z-10 space-y-4">
              {ARCH_LAYERS.map((layer, i) => (
                <div key={layer.label}>
                  <div className={cn(
                    'rounded-xl border p-4',
                    layer.featured
                      ? 'border-blue-500/30 bg-blue-500/5 shadow-lg shadow-blue-500/10'
                      : 'border-white/8 bg-white/[0.02]'
                  )}>
                    <div className="flex items-center gap-2 mb-3">
                      {layer.featured && <GitBranch className="h-4 w-4 text-blue-400" />}
                      <span className={cn('text-[11px] font-bold uppercase tracking-widest', layer.featured ? 'text-blue-300' : 'text-gray-500')}>
                        {layer.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {layer.items.map((item) => (
                        <div key={item} className={cn(
                          'rounded-lg px-2 py-1.5 text-[11px] font-medium text-center border',
                          layer.featured
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-200'
                            : 'bg-white/5 border-white/8 text-gray-400'
                        )}>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  {i < ARCH_LAYERS.length - 1 && (
                    <div className="flex justify-center py-2">
                      <ArrowRight className="h-4 w-4 text-gray-700 rotate-90" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Feature list */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {ARCH_FEATURES.map((f, idx) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex gap-4 group"
              >
                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-all">
                  <f.icon className="h-4 w-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-200 mb-1">{f.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
