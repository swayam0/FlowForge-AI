'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

const FAQS = [
  {
    q: 'What is a human-in-the-loop workflow?',
    a: 'A human-in-the-loop workflow is an automated process that pauses at designated approval gates, requiring a human reviewer to inspect, modify, or reject AI-generated outputs before execution continues. This ensures critical decisions are never made autonomously when the stakes are high.',
  },
  {
    q: 'Can I self-host FlowForge AI?',
    a: 'Yes. FlowForge AI is fully self-hostable. You can deploy it on AWS, GCP, Azure, or any Kubernetes cluster. Your data never leaves your infrastructure. We provide Docker images, Helm charts, and comprehensive deployment documentation.',
  },
  {
    q: 'Which LLM providers does FlowForge support?',
    a: 'FlowForge supports OpenAI (GPT-4o, GPT-4 Turbo), Google (Gemini 1.5 Pro, Flash), Anthropic (Claude 3.5 Sonnet), Mistral, and any OpenAI-compatible endpoint including local models via Ollama. You can mix providers within a single workflow.',
  },
  {
    q: 'How does version control work for workflows?',
    a: 'Every save creates an immutable version snapshot. You can view a diff between any two versions, restore any previous version in one click, and promote a specific version from staging to production. All changes are attributed to the user who made them.',
  },
  {
    q: 'How is execution pricing calculated?',
    a: 'FlowForge pricing is based on the number of workflow step executions per month. There are no extra charges for approvals, retries, or log storage up to 30 days. LLM API costs are passed through at cost directly to your own provider keys.',
  },
  {
    q: 'Is FlowForge SOC 2 compliant?',
    a: 'Yes. FlowForge AI is SOC 2 Type II certified. We undergo annual audits, support single-tenant deployments for data isolation, and provide full audit logs for all user actions and workflow executions for compliance reporting.',
  },
  {
    q: 'Can I integrate FlowForge into my existing CI/CD pipeline?',
    a: 'Yes. FlowForge ships a REST API and SDK (TypeScript, Python) that allow you to create, deploy, and trigger workflows programmatically. You can manage workflow definitions as code in your own repository and deploy via GitHub Actions or any CI system.',
  },
  {
    q: 'What happens if a workflow step fails?',
    a: 'Failed steps are retried automatically with configurable exponential backoff. If retries are exhausted, the execution transitions to FAILED state and an alert is dispatched. You can configure dead-letter queues, error callbacks, and automatic rollback of side effects.',
  },
];

function FaqItem({ q, a, idx }: { q: string; a: string; idx: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: idx * 0.05 }}
      className="border-b border-white/5 last:border-0"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm"
      >
        <span className={cn('text-sm font-semibold transition-colors', open ? 'text-white' : 'text-gray-300 group-hover:text-white')}>
          {q}
        </span>
        <div className={cn('h-6 w-6 rounded-md border flex items-center justify-center shrink-0 transition-all', open ? 'bg-white border-white' : 'bg-transparent border-white/10 group-hover:border-white/30')}>
          {open
            ? <Minus className="h-3 w-3 text-black" />
            : <Plus className="h-3 w-3 text-gray-400" />
          }
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-gray-400 leading-relaxed max-w-3xl">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FaqSection() {
  return (
    <section id="faq" className="py-28 bg-[#030303] border-t border-white/5 relative overflow-hidden">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-gray-400 mb-5 uppercase tracking-widest">
            FAQ
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
            Common <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">questions.</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Everything you need to know before getting started.
          </p>
        </motion.div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.01] px-6 md:px-10">
          {FAQS.map((faq, idx) => (
            <FaqItem key={idx} q={faq.q} a={faq.a} idx={idx} />
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-gray-500 mt-10"
        >
          Still have questions?{' '}
          <a href="mailto:support@flowforge.ai" className="text-blue-400 hover:text-blue-300 underline underline-offset-4 transition-colors">
            Email our team →
          </a>
        </motion.p>
      </div>
    </section>
  );
}
