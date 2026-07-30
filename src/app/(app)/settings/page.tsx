'use client';

import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Zap, Database, Server, Settings, CheckCircle2, AlertTriangle, Play, RefreshCw, Upload, Download, Trash2, ShieldCheck, Clock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

interface SettingCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

function SettingCard({ title, description, children, footer, className }: SettingCardProps) {
  return (
    <div className={cn("bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden flex flex-col", className)}>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-1 mb-6">{description}</p>}
        {children}
      </div>
      {footer && (
        <div className="bg-[#050505] border-t border-white/5 px-6 py-4 flex items-center justify-between text-sm">
          {footer}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const clearMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/developer/clear-executions', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to clear executions');
      return data;
    },
    onMutate: () => {},
    onSuccess: () => {
      toast.success('Executions cleared successfully');
      queryClient.invalidateQueries();
    },
    onError: (err) => {
      toast.error(err.message, {
        action: { label: 'Retry', onClick: () => clearMutation.mutate() }
      });
    },
    onSettled: () => {}
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/developer/seed', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to seed demo');
      return data;
    },
    onMutate: () => {},
    onSuccess: () => {
      toast.success('Demo workflow seeded successfully');
      queryClient.invalidateQueries();
    },
    onError: (err) => {
      toast.error(err.message, {
        action: { label: 'Retry', onClick: () => seedMutation.mutate() }
      });
    },
    onSettled: () => {}
  });

  return (
    <div className="p-8 max-w-[1200px] mx-auto w-full min-h-screen">
      
      <div className="mb-10 border-b border-white/5 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Project Settings</h1>
        <p className="text-sm text-gray-400 max-w-2xl">
          Manage your intelligent workflow engine, database connections, and system preferences.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* Sidebar Nav (mock) */}
        <div className="w-full lg:w-48 shrink-0 space-y-1 hidden md:block" role="navigation" aria-label="Settings navigation">
          {['General', 'AI Engine', 'Workflow Engine', 'Database', 'Developer'].map((navItem, i) => (
            <button 
              key={navItem} 
              aria-current={i === 0 ? 'page' : undefined}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors",
                i === 0 ? "bg-white/[0.04] text-white" : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]"
              )}
            >
              {navItem}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="flex-1 space-y-8 pb-20">
          
          {/* AI Engine */}
          <SettingCard 
            title="AI Engine Configuration" 
            description="Configure the primary LLM provider used for natural language processing and reasoning steps."
            footer={
              <>
                <p className="text-gray-500 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-500" /> API key is securely managed server-side.
                </p>
                <button className="px-4 py-2 bg-white text-black font-medium rounded-md hover:bg-gray-200 transition-colors">
                  Save Changes
                </button>
              </>
            }
          >
            <div className="max-w-md space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="active-model" className="text-sm font-medium text-gray-300">Active Model</label>
                <select id="active-model" className="w-full bg-[#121212] border border-white/10 rounded-md py-2 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                  <option>gemini-1.5-pro</option>
                  <option>gemini-1.5-flash</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="api-key-source" className="text-sm font-medium text-gray-300">API Key Source</label>
                <input 
                  id="api-key-source"
                  type="text" 
                  disabled 
                  value="Database (Secure)" 
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-md py-2 px-3 text-sm text-gray-500 cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>
            </div>
          </SettingCard>

          {/* Workflow Engine */}
          <SettingCard 
            title="Workflow Engine" 
            description="Configure the limits and default behaviors for workflow executions."
            footer={
              <>
                <p className="text-gray-500 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" /> Changes apply to new executions only.
                </p>
                <button className="px-4 py-2 bg-white text-black font-medium rounded-md hover:bg-gray-200 transition-colors">
                  Save Changes
                </button>
              </>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
              <div className="space-y-1.5">
                <label htmlFor="default-timeout" className="text-sm font-medium text-gray-300">Default Timeout (seconds)</label>
                <input 
                  id="default-timeout"
                  type="number" 
                  defaultValue={30} 
                  className="w-full bg-[#121212] border border-white/10 rounded-md py-2 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="max-retries" className="text-sm font-medium text-gray-300">Max Retries per Step</label>
                <input 
                  id="max-retries"
                  type="number" 
                  defaultValue={3} 
                  className="w-full bg-[#121212] border border-white/10 rounded-md py-2 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="exec-mode" className="text-sm font-medium text-gray-300">Execution Mode</label>
                <select id="exec-mode" className="w-full bg-[#121212] border border-white/10 rounded-md py-2 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                  <option>Deterministic</option>
                  <option>Probabilistic</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="human-gate" className="text-sm font-medium text-gray-300">Human Approval Gate</label>
                <select id="human-gate" className="w-full bg-[#121212] border border-white/10 rounded-md py-2 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                  <option>Enabled (Recommended)</option>
                  <option>Disabled</option>
                </select>
              </div>
            </div>
          </SettingCard>

          {/* System Information */}
          <SettingCard 
            title="System Information" 
            description="Status of connected external services and databases."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: Database, label: 'MongoDB', status: 'Connected', statusColor: 'text-green-400' },
                { icon: Play, label: 'Workflow Engine', status: 'Healthy', statusColor: 'text-green-400' },
                { icon: Sparkles, label: 'Gemini API', status: 'Connected', statusColor: 'text-green-400' },
                { icon: Zap, label: 'FlowForge Core', status: 'v1.0.0', statusColor: 'text-gray-400' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-white">{item.label}</span>
                  </div>
                  <span className={cn("text-xs font-mono font-bold uppercase tracking-wider", item.statusColor)}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </SettingCard>

          {/* Developer Tools */}
          <SettingCard 
            title="Developer Tools" 
            description="Tools for testing, seeding, and resetting your workspace."
            className="border-red-500/20"
            footer={
              <p className="text-red-500 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Use these tools with caution in a production environment.
              </p>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <button 
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
                className="flex flex-col items-start p-5 bg-[#050505] border border-white/5 hover:border-white/20 transition-all rounded-lg group disabled:opacity-50 text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-md bg-blue-500/10 text-blue-400">
                    {seedMutation.isPending ? <Skeleton className="h-5 w-5 rounded-full" /> : <RefreshCw className="h-5 w-5" />}
                  </div>
                  <span className="font-semibold text-white">Seed Demo</span>
                </div>
                <p className="text-sm text-gray-500">Injects a sample Support Ticket Triage workflow and some mock executions.</p>
              </button>

              <button 
                onClick={() => clearMutation.mutate()}
                disabled={clearMutation.isPending}
                className="flex flex-col items-start p-5 bg-[#050505] border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/5 transition-all rounded-lg group disabled:opacity-50 text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-md bg-red-500/10 text-red-400">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <span className="font-semibold text-red-500">Clear Executions</span>
                </div>
                <p className="text-sm text-red-500/70">Wipes all execution runs and step logs. Workflows remain intact.</p>
              </button>

              <button 
                onClick={() => toast.info('Export feature coming soon')}
                className="flex flex-col items-start p-5 bg-[#050505] border border-white/5 hover:border-white/20 transition-all rounded-lg group text-left opacity-70 cursor-not-allowed"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-md bg-green-500/10 text-green-400">
                    <Download className="h-5 w-5" />
                  </div>
                  <span className="font-semibold text-white">Export Workflows</span>
                </div>
                <p className="text-sm text-gray-500">Download your workflows as portable JSON schema files.</p>
              </button>

              <button 
                onClick={() => toast.error('Import not yet implemented')}
                className="flex flex-col items-start p-5 bg-[#050505] border border-white/5 hover:border-white/20 transition-all rounded-lg group text-left opacity-70"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-md bg-purple-500/10 text-purple-400">
                    <Upload className="h-5 w-5" />
                  </div>
                  <span className="font-semibold text-white">Import Workflows</span>
                </div>
                <p className="text-sm text-gray-500">Upload and parse raw JSON configurations to create workflows.</p>
              </button>

            </div>
          </SettingCard>

        </div>
      </div>
    </div>
  );
}
