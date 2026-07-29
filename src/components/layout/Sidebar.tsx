'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, GitBranch, History, CheckSquare, Settings, PlayCircle, User } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Workflows', href: '/workflows', icon: GitBranch },
    { name: 'Executions', href: '/executions', icon: PlayCircle },
    { name: 'Approvals', href: '/approvals', icon: CheckSquare },
    { name: 'History', href: '/history', icon: History },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen flex-col w-sidebar-width border-r border-outline-variant bg-surface hidden md:flex z-50" id="sidebar">
      <div className="p-8">
        <span className="font-headline-md text-headline-md font-bold text-primary">FlowForge AI</span>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
          
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center px-4 py-3 transition-colors duration-200 ease-in-out ${
                isActive
                  ? 'text-primary font-bold border-l-2 border-primary bg-surface-container-high'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <Icon className="mr-3 h-5 w-5" />
              <span className="font-body-sm text-body-sm">{link.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-6 border-t border-outline-variant">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center">
            <User className="h-4 w-4 text-on-surface-variant" />
          </div>
          <div className="flex flex-col">
            <span className="font-body-sm text-body-sm font-semibold text-primary">Dev_Engineer</span>
            <span className="text-[10px] text-outline">Pro Plan</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
