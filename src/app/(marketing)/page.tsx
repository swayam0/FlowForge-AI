'use client';

import { Hero } from '../../components/marketing/Hero';
import { WorkflowSection } from '../../components/marketing/WorkflowSection';
import { FeaturesSection } from '../../components/marketing/FeaturesSection';
import { ExecutionTimelineSection } from '../../components/marketing/ExecutionTimelineSection';
import { ArchitectureSection } from '../../components/marketing/ArchitectureSection';
import { TestimonialsSection } from '../../components/marketing/TestimonialsSection';
import { FaqSection } from '../../components/marketing/FaqSection';
import { CtaSection } from '../../components/marketing/CtaSection';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen selection:bg-blue-500/30 bg-black">
      <Hero />
      <WorkflowSection />
      <FeaturesSection />
      <ExecutionTimelineSection />
      <ArchitectureSection />
      <TestimonialsSection />
      <FaqSection />
      <CtaSection />
    </div>
  );
}
