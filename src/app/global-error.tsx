'use client'; // Error components must be Client Components

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCcw, Copy, CheckCircle2 } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  const copyToClipboard = () => {
    const errorDetails = `Error: ${error.message}\nDigest: ${error.digest || 'N/A'}\nStack: ${error.stack}`;
    navigator.clipboard.writeText(errorDetails);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#050505] text-white">
        <div className="min-h-screen flex items-center justify-center p-6 selection:bg-blue-500/30">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-[#050505] to-[#050505] pointer-events-none" />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg relative z-10"
          >
            <div className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-red-500/20 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 md:p-8 flex flex-col items-center text-center">
                
                <div className="h-16 w-16 bg-red-500/10 rounded-2xl border border-red-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                
                <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Fatal System Error</h1>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-sm">
                  A critical error occurred at the root level of the application. The system could not recover.
                </p>

                <div className="w-full bg-[#121212] border border-red-500/10 rounded-xl p-4 mb-8 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-red-500/70">Error Details</span>
                    <button 
                      onClick={copyToClipboard}
                      className="text-gray-500 hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      <span className="text-[10px] font-medium">{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="font-mono text-xs text-red-400 break-all line-clamp-3">
                    {error.message || 'Unknown fatal error'}
                  </p>
                  {error.digest && (
                    <p className="font-mono text-[10px] text-gray-500 mt-2">
                      ID: {error.digest}
                    </p>
                  )}
                </div>

                <div className="w-full">
                  <button
                    onClick={() => reset()}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm py-3 rounded-lg transition-colors shadow-lg shadow-red-500/20 active:scale-[0.98]"
                  >
                    <RefreshCcw className="h-4 w-4" /> Restart Application
                  </button>
                </div>

              </div>
            </div>
          </motion.div>
        </div>
      </body>
    </html>
  );
}
