'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6 selection:bg-blue-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/5 via-[#050505] to-[#050505] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] pointer-events-none mix-blend-overlay" />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6 md:p-8 flex flex-col items-center text-center">
            
            <div className="h-16 w-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center mb-6 shadow-xl">
              <SearchX className="h-8 w-8 text-gray-400" />
            </div>
            
            <h1 className="text-4xl font-bold text-white tracking-tight mb-2 font-mono">404</h1>
            <h2 className="text-xl font-semibold text-gray-200 mb-4">Page not found</h2>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-sm">
              The page you are looking for doesn't exist or has been moved. Check the URL or navigate back home.
            </p>

            <Link 
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-3 rounded-lg transition-colors shadow-lg shadow-blue-500/20 active:scale-[0.98]"
            >
              <Home className="h-4 w-4" /> Back to Dashboard
            </Link>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
