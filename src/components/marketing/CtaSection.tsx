'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';

export function CtaSection() {
  return (
    <section className="py-32 bg-black border-t border-white/5 relative overflow-hidden">
      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(59,130,246,0.1),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_30%_30%_at_50%_50%,rgba(99,102,241,0.12),transparent)] pointer-events-none" />

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#3b82f608_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="mx-auto max-w-3xl px-6 relative z-10 text-center"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-semibold text-blue-300 mb-8 uppercase tracking-widest">
          <Sparkles className="h-3 w-3" />
          Free to start, no credit card required
        </div>

        <h2 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-[1.05]">
          Ship AI workflows<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400">
            you can trust.
          </span>
        </h2>

        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed">
          Join hundreds of engineering teams who use FlowForge to automate complex processes with confidence, control, and full observability.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-white px-10 py-4 text-base font-bold text-black hover:bg-gray-100 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-white/10"
          >
            Start Building Free <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="mailto:sales@flowforge.ai"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-transparent border border-white/15 px-10 py-4 text-base font-semibold text-gray-300 hover:bg-white/5 hover:text-white transition-all"
          >
            Talk to Sales
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
          {[
            { icon: ShieldCheck, label: 'SOC 2 Type II Certified' },
            { icon: Zap, label: 'Deploy in minutes' },
            { icon: Sparkles, label: 'Free tier available' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
