'use client';

import { Sidebar } from './Sidebar';
import { Search, Bell, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard';
    if (pathname?.startsWith('/workflows/create')) return 'Workflow Builder';
    if (pathname?.startsWith('/workflows')) return 'Workflows';
    if (pathname?.startsWith('/executions')) return 'Execution Monitor';
    if (pathname?.startsWith('/approvals')) return 'Approval Queue';
    if (pathname?.startsWith('/history')) return 'Execution History';
    if (pathname?.startsWith('/settings')) return 'Settings';
    return 'FlowForge AI';
  };

  return (
    <div className="min-h-screen flex bg-black text-on-surface font-body-sm">
      <Sidebar />
      <main className="md:ml-sidebar-width flex-1 flex flex-col relative bg-black min-h-screen w-full">
        <header className="flex items-center justify-between px-margin-mobile md:px-margin-desktop h-16 w-full border-b border-outline-variant bg-surface sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-primary">
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="font-headline-md text-headline-md text-primary">{getPageTitle()}</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex bg-surface-container border border-outline-variant px-3 py-1 items-center gap-2 rounded">
              <Search className="h-4 w-4 text-outline" />
              <input className="bg-transparent border-none focus:outline-none focus:ring-0 text-body-sm w-48 placeholder:text-outline-variant text-on-surface" placeholder="Search resources..." type="text"/>
            </div>
            <button className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-all duration-150">
              <Bell className="h-5 w-5" />
              <span className="hidden md:inline font-body-sm text-body-sm">Notifications</span>
            </button>
          </div>
        </header>
        
        {/* Child pages should use the <div class="p-margin-mobile md:p-margin-desktop max-w-[1440px] mx-auto w-full space-y-gutter"> wrapper */}
        {children}
        
        <footer className="mt-auto p-margin-mobile md:p-margin-desktop border-t border-outline-variant bg-surface-container-lowest">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-outline font-label-mono text-[10px]">
            <div className="flex items-center gap-4">
              <span>STATUS: ALL SYSTEMS OPERATIONAL</span>
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
            </div>
            <div>© 2026 FLOWFORGE AI - CORE ENGINE</div>
            <div className="flex gap-4">
              <a className="hover:text-primary" href="#">API DOCS</a>
              <a className="hover:text-primary" href="#">SUPPORT</a>
              <a className="hover:text-primary" href="#">TERMS</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
