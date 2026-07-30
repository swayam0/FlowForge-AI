import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  illustration?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  title, 
  description, 
  icon: Icon, 
  illustration,
  action,
  className 
}: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center justify-center py-24 text-center w-full bg-[#0a0a0a] rounded-xl border border-white/5 shadow-sm overflow-hidden relative",
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] pointer-events-none mix-blend-overlay" />
      
      <div className="relative z-10 flex flex-col items-center max-w-sm">
        {illustration ? (
          <div className="mb-8 opacity-80 hover:opacity-100 transition-opacity">
            {illustration}
          </div>
        ) : Icon ? (
          <div className="h-20 w-20 rounded-3xl bg-white/[0.02] flex items-center justify-center mb-6 border border-white/5 shadow-inner">
            <Icon className="h-10 w-10 text-gray-500" />
          </div>
        ) : null}

        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{title}</h3>
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">{description}</p>
        
        {action && (
          <div className="mt-2">
            {action}
          </div>
        )}
      </div>
    </motion.div>
  );
}
