'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, GitBranch, History, CheckSquare, Settings, PlayCircle, ChevronDown, ChevronsUpDown, User, LogOut, Shield, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

export function Sidebar() {
  const pathname = usePathname();
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

  const links = [
    { name: 'Dashboard',  href: '/dashboard',  icon: LayoutDashboard },
    { name: 'Analytics',  href: '/dashboard',  icon: BarChart2 },
    { name: 'Workflows',  href: '/workflows',  icon: GitBranch },
    { name: 'Executions', href: '/executions', icon: PlayCircle },
    { name: 'Approvals',  href: '/approvals',  icon: CheckSquare },
    { name: 'History',    href: '/history',    icon: History },
    { name: 'Activity',   href: '/activity',   icon: Shield },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen flex-col w-64 border-r border-white/5 bg-[#0a0a0a] hidden md:flex z-50 selection:bg-blue-500/30" id="sidebar">
      {/* Workspace Switcher / Home Link */}
      <div className="p-4">
        <Link 
          href="/"
          aria-label="Switch Workspace"
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-[10px] font-bold text-white leading-none">FF</span>
            </div>
            <span className="font-semibold text-sm text-gray-200 tracking-tight">Acme Corp</span>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-gray-500" />
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-4">
        <div className="px-3 mb-2">
          <span className="text-xs font-semibold text-gray-500 tracking-wider">OVERVIEW</span>
        </div>
        
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname?.startsWith(link.href));
          
          return (
            <Link
              key={link.name}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              className={`group relative flex items-center px-3 py-2 transition-colors duration-200 ease-in-out rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isActive
                  ? 'text-white font-medium'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.02]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-white/[0.05] border border-white/10 rounded-md"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <Icon className="mr-3 h-4 w-4 relative z-10" />
              <span className="text-sm relative z-10">{link.name}</span>
            </Link>
          );
        })}
        
        <div className="px-3 mt-8 mb-2 pt-6 border-t border-white/5">
          <span className="text-xs font-semibold text-gray-500 tracking-wider">SYSTEM</span>
        </div>
        <Link
          href="/settings"
          aria-current={pathname?.startsWith('/settings') ? 'page' : undefined}
          className={`group relative flex items-center px-3 py-2 transition-colors duration-200 ease-in-out rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            pathname?.startsWith('/settings')
              ? 'text-white font-medium'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.02]'
          }`}
        >
          {pathname?.startsWith('/settings') && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute inset-0 bg-white/[0.05] border border-white/10 rounded-md"
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            />
          )}
          <Settings className="mr-3 h-4 w-4 relative z-10" />
          <span className="text-sm relative z-10">Settings</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-white/5">
        <button aria-label="User Profile" className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center border border-white/5 overflow-hidden">
              <User className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-gray-200">Dev Engineer</span>
              <span className="text-xs text-gray-500">dev@flowforge.ai</span>
            </div>
          </div>
        </button>
      </div>
    </aside>
  );
}
