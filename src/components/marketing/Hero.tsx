'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Zap, Search, Database, UserCheck, FileCheck, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';
import { motion, useMotionValue, useTransform, type Variants } from 'framer-motion';
import { cn } from '../../lib/utils';

const STEPS = 5;
const STEP_DURATION = 2000;

function HeroNode({
  title, icon: Icon, type, stepIndex, activeStep, x, y, children,
}: {
  title: string; icon: React.ElementType; type: string;
  stepIndex: number; activeStep: number; x: number; y: number; children?: React.ReactNode;
}) {
  const isRunning = activeStep === stepIndex;
  const isCompleted = activeStep > stepIndex;

  let borderColor = 'border-white/10';
  let pulseAnim: { borderColor?: string[] } = {};

  if (isRunning) {
    if (title === 'Approval') {
      borderColor = 'border-amber-500/50';
      pulseAnim = { borderColor: ['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.7)', 'rgba(245,158,11,0.15)'] };
    } else {
      borderColor = 'border-blue-500/50';
      pulseAnim = { borderColor: ['rgba(59,130,246,0.15)', 'rgba(59,130,246,0.7)', 'rgba(59,130,246,0.15)'] };
    }
  } else if (isCompleted) {
    borderColor = 'border-green-500/40';
  }

  const statusText = isRunning ? 'Running' : isCompleted ? 'Done' : 'Idle';
  const statusColor = isRunning
    ? title === 'Approval' ? 'text-amber-400' : 'text-blue-400'
    : isCompleted ? 'text-green-400' : 'text-gray-600';

  return (
    <motion.div
      className={cn(
        'absolute w-56 bg-[#111]/90 backdrop-blur-xl rounded-xl border shadow-2xl z-20 overflow-hidden transition-colors duration-500',
        borderColor,
        isRunning && 'shadow-blue-500/10'
      )}
      style={{ left: x, top: y }}
      animate={isRunning ? pulseAnim : { borderColor }}
      transition={isRunning ? { duration: 1.5, repeat: Infinity } : { duration: 0.5 }}
    >
      <div className="px-3 py-2 border-b border-white/5 bg-[#1a1a1a]/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded border border-white/5 bg-black/60">
            <Icon className="h-3 w-3 text-gray-300" />
          </div>
          <span className="text-[9px] uppercase font-bold tracking-widest text-gray-500">{type}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isRunning && (
            <span className="relative flex h-2 w-2">
              <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', title === 'Approval' ? 'bg-amber-400' : 'bg-blue-400')} />
              <span className={cn('relative inline-flex rounded-full h-2 w-2', title === 'Approval' ? 'bg-amber-500' : 'bg-blue-500')} />
            </span>
          )}
          {isCompleted && <CheckCircle2 className="h-3 w-3 text-green-500" />}
        </div>
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold text-gray-200 mb-2 leading-snug">{title}</p>
        {children}
        <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
          <span className="text-[9px] font-mono text-gray-600">{isCompleted ? '1.2s' : isRunning ? '0.4s' : '--'}</span>
          <span className={cn('text-[9px] font-bold uppercase tracking-widest', statusColor)}>{statusText}</span>
        </div>
      </div>
    </motion.div>
  );
}

function HeroEdge({ d, isActive }: { d: string; isActive: boolean }) {
  return (
    <>
      <path d={d} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
      {isActive && (
        <motion.path
          d={d}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.5"
          strokeDasharray="18 90"
          initial={{ strokeDashoffset: 108 }}
          animate={{ strokeDashoffset: -108 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </>
  );
}

export function Hero() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const translateX = useTransform(mouseX, [0, typeof window !== 'undefined' ? window.innerWidth : 1400], [-12, 12]);
  const translateY = useTransform(mouseY, [0, typeof window !== 'undefined' ? window.innerHeight : 800], [-12, 12]);

  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActiveStep((p) => (p + 1) % STEPS), STEP_DURATION);
    return () => clearInterval(id);
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
  };

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#030303]"
      onMouseMove={(e) => { mouseX.set(e.clientX); mouseY.set(e.clientY); }}
    >
      {/* Background layers */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,_rgba(59,130,246,0.12)_0%,_transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff06_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black pointer-events-none" />

      {/* Floating ambient blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 grid lg:grid-cols-12 gap-12 lg:gap-6 items-center min-h-screen py-28 lg:py-20">

        {/* Left Column */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-5 flex flex-col justify-center text-center lg:text-left z-20"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-semibold tracking-wide text-blue-300 mb-7 mx-auto lg:mx-0 w-max backdrop-blur-sm">
            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            FlowForge Engine v2.0 — Now in Beta
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl xl:text-[72px] font-black tracking-tighter mb-6 text-white leading-[1.05]">
            Automate with<br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400">
              {' '}AI & oversight.
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-base md:text-[17px] text-gray-400 mb-9 max-w-lg mx-auto lg:mx-0 leading-relaxed">
            Build, execute, and monitor AI-powered workflows with enterprise-grade human-in-the-loop safety gates. Connect any AI model to your existing infrastructure.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start mb-10">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-black hover:bg-gray-100 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/10"
            >
              Start Building Free <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#workflow"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-8 py-3.5 text-sm font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all"
            >
              See it in action
            </a>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center lg:justify-start gap-5 text-gray-500 text-xs font-medium">
            {[
              { icon: ShieldCheck, label: 'SOC2 Compliant' },
              { icon: Activity, label: '99.9% Uptime SLA' },
              { icon: Database, label: 'Self-Hostable' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" /> {label}
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right Column — Animated Canvas */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="lg:col-span-7 relative h-[520px] w-full hidden sm:block"
        >
          <motion.div style={{ x: translateX, y: translateY }} className="absolute inset-0 w-full h-full overflow-visible">

            {/* Canvas glow bg */}
            <div className="absolute inset-x-0 top-16 bottom-16 rounded-3xl bg-blue-500/[0.03] border border-white/[0.04] backdrop-blur-sm" />

            <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none" style={{ overflow: 'visible' }}>
              <HeroEdge d="M 220 135 C 260 135, 260 205, 300 205" isActive={activeStep === 0} />
              <HeroEdge d="M 500 205 C 540 205, 540 135, 580 135" isActive={activeStep === 1} />
              <HeroEdge d="M 780 135 C 820 135, 820 205, 860 205" isActive={activeStep === 2} />
              <HeroEdge d="M 1060 205 C 1100 205, 1100 135, 1140 135" isActive={activeStep === 3} />
            </svg>

            <HeroNode title="Stripe Webhook" icon={Zap} type="Trigger" stepIndex={0} activeStep={activeStep} x={60} y={90}>
              <div className="bg-black/50 rounded px-2 py-1 text-[9px] text-gray-400 font-mono border border-white/5 truncate">event: invoice.paid</div>
            </HeroNode>

            <HeroNode title="Fetch Customer" icon={Search} type="Action" stepIndex={1} activeStep={activeStep} x={300} y={162}>
              <div className="bg-black/50 rounded px-2 py-1 text-[9px] text-gray-400 font-mono border border-white/5 truncate">query: customer_id</div>
            </HeroNode>

            <HeroNode title="AI Analysis" icon={Database} type="LLM" stepIndex={2} activeStep={activeStep} x={580} y={90}>
              <div className="flex justify-between items-center bg-black/50 rounded px-2 py-1 text-[9px] border border-white/5">
                <span className="text-purple-400 font-mono">gemini-1.5-pro</span>
                <span className="text-gray-500">2.1k tkns</span>
              </div>
            </HeroNode>

            <HeroNode title="Approval" icon={UserCheck} type="Human" stepIndex={3} activeStep={activeStep} x={860} y={162}>
              <div className="flex justify-between items-center bg-black/50 rounded px-2 py-1 text-[9px] border border-white/5">
                <span className="text-gray-400">Review Required</span>
                <span className="text-amber-400 bg-amber-500/10 px-1 rounded border border-amber-500/20 text-[8px]">Hold</span>
              </div>
            </HeroNode>

            <HeroNode title="Update CRM" icon={FileCheck} type="Action" stepIndex={4} activeStep={activeStep} x={1140} y={90}>
              <div className="bg-black/50 rounded px-2 py-1 text-[9px] text-gray-400 font-mono border border-white/5 truncate">POST /api/v1/crm</div>
            </HeroNode>

            {/* Stats floating card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 w-72 bg-[#111]/90 backdrop-blur-xl rounded-2xl border border-white/10 p-4 flex items-center justify-around gap-4 shadow-2xl z-30"
            >
              {[
                { label: 'Executions Today', value: '1.2M', sub: '↑ 14%', subClass: 'text-green-400' },
                { label: 'Avg Latency', value: '42ms', sub: 'p99: 80ms', subClass: 'text-gray-500' },
                { label: 'Success Rate', value: '99.1%', sub: '↑ 0.4%', subClass: 'text-green-400' },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] uppercase tracking-widest text-gray-500">{stat.label}</span>
                  <span className="text-lg font-bold text-white">{stat.value}</span>
                  <span className={cn('text-[10px] font-medium', stat.subClass)}>{stat.sub}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </section>
  );
}
