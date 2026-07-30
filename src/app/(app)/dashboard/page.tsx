'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AnalyticsProvider, useAnalytics } from '@/components/analytics/AnalyticsProvider';
import { AnalyticsHeader } from '@/components/analytics/AnalyticsHeader';
import { OverviewSection } from '@/components/analytics/sections/OverviewSection';
import { ExecutionAnalyticsSection } from '@/components/analytics/sections/ExecutionAnalyticsSection';
import { AIAnalyticsSection } from '@/components/analytics/sections/AIAnalyticsSection';
import { ApprovalAnalyticsSection } from '@/components/analytics/sections/ApprovalAnalyticsSection';
import { SystemHealthSection } from '@/components/analytics/sections/SystemHealthSection';
import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonCard } from '@/components/skeletons/SkeletonCard';
import { motion, Variants } from 'framer-motion';

function DashboardContent() {
  const { dateRange } = useAnalytics();
  
  const { data: analyticsData, isLoading } = useQuery({ 
    queryKey: ['analytics', dateRange], 
    queryFn: () => api.getAnalytics(dateRange) 
  });

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (isLoading || !analyticsData) {
    return (
      <div className="space-y-8 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        <Skeleton className="w-full h-[400px] rounded-xl bg-white/5" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="w-full">
      <AnalyticsHeader analyticsData={analyticsData} />

      <motion.div variants={item}>
        <OverviewSection data={analyticsData} />
      </motion.div>

      <motion.div variants={item}>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white tracking-tight">Execution Analytics</h2>
          <p className="text-sm text-muted-foreground">Monitor throughput, latency, and success rates.</p>
        </div>
        <ExecutionAnalyticsSection data={analyticsData} />
      </motion.div>

      <motion.div variants={item}>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white tracking-tight">AI Observability</h2>
          <p className="text-sm text-muted-foreground">Track token usage, LLM costs, and hallucination metrics.</p>
        </div>
        <AIAnalyticsSection data={analyticsData} />
      </motion.div>

      <motion.div variants={item}>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white tracking-tight">Approval Analytics</h2>
          <p className="text-sm text-muted-foreground">Identify review bottlenecks and resolution rates.</p>
        </div>
        <ApprovalAnalyticsSection data={analyticsData} />
      </motion.div>

      <motion.div variants={item}>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white tracking-tight">System Health</h2>
          <p className="text-sm text-muted-foreground">Real-time status of backend services.</p>
        </div>
        <SystemHealthSection data={analyticsData} />
      </motion.div>
    </motion.div>
  );
}

export default function DashboardPage() {
  return (
    <AnalyticsProvider>
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto w-full min-h-screen">
        <DashboardContent />
      </div>
    </AnalyticsProvider>
  );
}
