'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { GitBranch, ArrowRight, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#workflow', label: 'Workflow' },
    { href: '#architecture', label: 'Architecture' },
    { href: '#faq', label: 'FAQ' },
  ];

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled
        ? 'bg-black/80 backdrop-blur-xl border-b border-white/5 shadow-xl shadow-black/20'
        : 'bg-transparent'
    )}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
            <GitBranch className="h-4 w-4 text-blue-400" />
          </div>
          <span className="text-[17px] font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            FlowForge<span className="text-blue-400"> AI</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-4 py-2 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/dashboard" className="text-sm font-medium text-gray-400 hover:text-white transition-colors px-4 py-2">
            Log in
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 h-9 rounded-lg bg-white px-4 text-sm font-semibold text-black hover:bg-gray-200 transition-all hover:scale-[1.02] active:scale-95"
          >
            Get Started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <button
          className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/5"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/95 border-b border-white/5 px-6 pb-4"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-3 text-sm text-gray-400 hover:text-white border-b border-white/5 last:border-0"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 flex flex-col gap-3">
              <Link href="/dashboard" className="text-sm text-center text-gray-400 hover:text-white">Log in</Link>
              <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-white text-sm font-semibold text-black">
                Get Started <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function Footer() {
  const year = new Date().getFullYear();

  const footerCols = [
    {
      title: 'Product',
      links: ['Features', 'Architecture', 'Changelog', 'Roadmap'],
    },
    {
      title: 'Developers',
      links: ['Documentation', 'API Reference', 'SDK', 'Examples'],
    },
    {
      title: 'Company',
      links: ['About', 'Blog', 'Careers', 'Contact'],
    },
    {
      title: 'Legal',
      links: ['Privacy Policy', 'Terms of Service', 'Security', 'Cookies'],
    },
  ];

  return (
    <footer className="border-t border-white/5 bg-black">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <GitBranch className="h-4 w-4 text-blue-400" />
              </div>
              <span className="text-base font-bold text-white">FlowForge AI</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              The enterprise AI workflow orchestration platform with human-in-the-loop safety.
            </p>
            <div className="flex gap-3">
              {['Twitter', 'GitHub', 'Discord'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded border border-white/5 hover:border-white/20"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>

          {footerCols.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-600">© {year} FlowForge AI, Inc. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              All Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
