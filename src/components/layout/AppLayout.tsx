'use client';

import { Sidebar } from './Sidebar';
import { Search, Bell, Menu, Slash } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const getBreadcrumbs = () => {
    const paths = [];
    if (pathname === '/dashboard') {
      paths.push({ name: 'Dashboard', href: '/dashboard' });
    } else if (pathname?.startsWith('/workflows/create')) {
      paths.push({ name: 'Workflows', href: '/workflows' });
      paths.push({ name: 'Create Workflow', href: '/workflows/create' });
    } else if (pathname?.startsWith('/workflows/')) {
      paths.push({ name: 'Workflows', href: '/workflows' });
      paths.push({ name: 'Editor', href: pathname });
    } else if (pathname?.startsWith('/workflows')) {
      paths.push({ name: 'Workflows', href: '/workflows' });
    } else if (pathname?.startsWith('/executions/')) {
      paths.push({ name: 'Executions', href: '/executions' });
      paths.push({ name: 'Trace Monitor', href: pathname });
    } else if (pathname?.startsWith('/executions')) {
      paths.push({ name: 'Executions', href: '/executions' });
    } else if (pathname?.startsWith('/approvals')) {
      paths.push({ name: 'Approvals', href: '/approvals' });
    } else if (pathname?.startsWith('/history')) {
      paths.push({ name: 'History', href: '/history' });
    } else if (pathname?.startsWith('/settings')) {
      paths.push({ name: 'Settings', href: '/settings' });
    }
    return paths;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen flex bg-black text-gray-200 selection:bg-blue-500/30 font-sans">
      <Sidebar />
      <main className="md:ml-64 flex-1 flex flex-col relative bg-black min-h-screen w-full">
        {/* Header */}
        <header className="flex items-center justify-between px-6 h-14 w-full border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button aria-label="Toggle Menu" className="md:hidden text-gray-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden md:flex items-center text-sm">
              <span className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer">Acme Corp</span>
              {breadcrumbs.length > 0 && (
                <Slash className="h-3 w-3 mx-2 text-gray-700 -rotate-12" />
              )}
              {breadcrumbs.map((crumb, idx) => (
                <span key={crumb.href} className="flex items-center">
                  <Link 
                    href={crumb.href} 
                    className={`${idx === breadcrumbs.length - 1 ? 'text-gray-200 font-medium' : 'text-gray-500 hover:text-gray-300 transition-colors'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded`}
                  >
                    {crumb.name}
                  </Link>
                  {idx < breadcrumbs.length - 1 && (
                    <Slash className="h-3 w-3 mx-2 text-gray-700 -rotate-12" />
                  )}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button aria-label="Search" className="hidden md:flex items-center bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-colors rounded-md px-3 py-1.5 w-64 text-sm text-gray-500 cursor-text group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              <Search className="h-4 w-4 mr-2 text-gray-600 group-hover:text-gray-400 transition-colors" />
              <span>Search...</span>
              <div className="ml-auto flex gap-1">
                <kbd className="hidden sm:inline-flex items-center justify-center rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-gray-500">⌘</kbd>
                <kbd className="hidden sm:inline-flex items-center justify-center rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-gray-500">K</kbd>
              </div>
            </button>
            <button aria-label="Notifications" className="relative flex items-center justify-center h-8 w-8 rounded-full hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-2 h-1.5 w-1.5 rounded-full bg-blue-500 border border-black"></span>
            </button>
          </div>
        </header>
        
        {/* Main Content Area */}
        {children}
        
        <footer className="mt-auto px-6 py-6 border-t border-white/5 bg-black">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-gray-600 font-mono text-[10px] tracking-wider uppercase">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-4 w-4 rounded-full bg-green-500/10">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
              </div>
              <span>All systems normal</span>
            </div>
            <div>© 2026 FlowForge AI V2.0</div>
            <div className="flex gap-4">
              <a className="hover:text-gray-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded" href="#">API</a>
              <a className="hover:text-gray-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded" href="#">Support</a>
              <a className="hover:text-gray-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded" href="#">Terms</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
