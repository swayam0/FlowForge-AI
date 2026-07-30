'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote: 'FlowForge gave us the ability to put humans at exactly the right point in our AI pipeline. We went from "we can\'t deploy this" to "this is our competitive advantage" in 6 weeks.',
    name: 'Sarah Chen',
    title: 'VP of Engineering',
    company: 'Meridian Financial',
    avatar: 'SC',
    avatarColor: 'bg-blue-500',
  },
  {
    quote: 'The observability is unlike anything else we\'ve tried. Seeing the exact LLM reasoning that led to each decision — with full audit trail — made our compliance team actually excited about AI automation.',
    name: 'Marcus Rodriguez',
    title: 'Head of AI & Automation',
    company: 'Apex Healthcare',
    avatar: 'MR',
    avatarColor: 'bg-purple-500',
  },
  {
    quote: 'We process 2 million documents a month through FlowForge. The reliability and the fact that we can self-host it in our own VPC were the deciding factors for us.',
    name: 'Emily Watson',
    title: 'CTO',
    company: 'Forrest Legal Tech',
    avatar: 'EW',
    avatarColor: 'bg-emerald-500',
  },
  {
    quote: 'Finally an orchestration tool built by people who understand that AI can\'t be trusted unconditionally. The approval gates and schema validation saved us from three potential incidents in the first month.',
    name: 'Daniel Park',
    title: 'Platform Architect',
    company: 'Shield Insurance',
    avatar: 'DP',
    avatarColor: 'bg-orange-500',
  },
  {
    quote: 'Our team replaced a custom-built 8,000-line workflow system with FlowForge in two sprints. The version control and rollback features alone were worth the migration.',
    name: 'Priya Nair',
    title: 'Staff Engineer',
    company: 'Lumina Commerce',
    avatar: 'PN',
    avatarColor: 'bg-pink-500',
  },
  {
    quote: 'The developer experience is exceptional. REST-first, great docs, and the SDK just works. We had our first workflow in production on day one.',
    name: 'James Okafor',
    title: 'Senior Backend Engineer',
    company: 'Clearwater SaaS',
    avatar: 'JO',
    avatarColor: 'bg-cyan-500',
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-28 bg-black border-t border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_50%,rgba(59,130,246,0.04),transparent)] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-gray-400 mb-5 uppercase tracking-widest">
            Testimonials
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
            Loved by <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">engineering teams.</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            See how teams across industries are using FlowForge to ship AI automation with confidence.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, idx) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="p-6 rounded-2xl border border-white/5 bg-white/[0.015] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300 flex flex-col gap-4"
            >
              <Quote className="h-5 w-5 text-blue-500/40" />

              <p className="text-sm text-gray-300 leading-relaxed flex-1 italic">
                "{t.quote}"
              </p>

              <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                <div className={`h-9 w-9 rounded-full ${t.avatarColor} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.title} · {t.company}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8"
        >
          <p className="text-xs text-gray-600 uppercase tracking-widest font-medium w-full text-center mb-2">Trusted by teams at</p>
          {['Meridian Financial', 'Apex Healthcare', 'Forrest Legal', 'Shield Insurance', 'Lumina Commerce', 'Clearwater SaaS'].map((company) => (
            <span key={company} className="text-sm font-semibold text-gray-600 hover:text-gray-400 transition-colors cursor-default">
              {company}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
