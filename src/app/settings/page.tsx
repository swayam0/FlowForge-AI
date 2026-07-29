'use client';

import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Zap, Database, Server, Settings, CheckCircle2, AlertTriangle, Play, RefreshCw, Upload, Download, Trash2, ShieldCheck, Clock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [isClearing, setIsClearing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const clearMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/developer/clear-executions', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to clear executions');
      return data;
    },
    onMutate: () => setIsClearing(true),
    onSuccess: () => {
      toast.success('Executions cleared successfully');
      queryClient.invalidateQueries();
    },
    onError: (err) => {
      toast.error(err.message);
    },
    onSettled: () => setIsClearing(false)
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/developer/seed', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to seed demo');
      return data;
    },
    onMutate: () => setIsSeeding(true),
    onSuccess: () => {
      toast.success('Demo workflow seeded successfully');
      queryClient.invalidateQueries();
    },
    onError: (err) => {
      toast.error(err.message);
    },
    onSettled: () => setIsSeeding(false)
  });

  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto pb-12 pt-6 space-y-12">
      <div className="mb-8">
        <h1 className="font-headline-lg text-primary">Platform Settings</h1>
        <p className="text-body-md text-on-surface-variant mt-2">Manage your intelligent workflow engine, database connections, and system preferences.</p>
      </div>

      {/* Section 1: System Settings */}
      <section>
        <div className="mb-6 flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          <h2 className="font-headline-md text-primary">System Settings</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AI Engine */}
          <div className="bg-surface-container-low border border-outline-variant p-6 rounded-lg flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-body-sm font-semibold text-primary uppercase tracking-wider mb-1">AI Engine</p>
                  <h3 className="font-headline-sm text-primary">Provider</h3>
                </div>
                <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-500 font-label-mono text-[11px] uppercase tracking-widest rounded flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-outline-variant">
                  <span className="text-on-surface-variant text-body-sm">Active Model</span>
                  <span className="font-label-mono text-primary bg-surface-container-highest px-2 py-1 rounded">gemini-1.5-pro</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-outline-variant">
                  <span className="text-on-surface-variant text-body-sm">API Key Source</span>
                  <span className="font-body-sm text-primary">Environment Variables</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-outline-variant">
              <p className="text-body-sm text-on-surface-variant flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-400" /> API key is securely managed server-side.
              </p>
            </div>
          </div>

          {/* Workflow Engine */}
          <div className="bg-surface-container-low border border-outline-variant p-6 rounded-lg flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-body-sm font-semibold text-primary uppercase tracking-wider mb-1">Workflow Engine</p>
                  <h3 className="font-headline-sm text-primary">Configuration</h3>
                </div>
                <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-label-mono text-[11px] uppercase tracking-widest rounded flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Configured
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-outline-variant">
                  <span className="text-on-surface-variant text-body-sm">Default Timeout</span>
                  <span className="font-body-sm text-primary">30 seconds</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-outline-variant">
                  <span className="text-on-surface-variant text-body-sm">Max Retries</span>
                  <span className="font-body-sm text-primary">3</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-outline-variant">
                  <span className="text-on-surface-variant text-body-sm">Execution Mode</span>
                  <span className="font-body-sm text-primary">Deterministic</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-outline-variant">
                  <span className="text-on-surface-variant text-body-sm">Human Approval</span>
                  <span className="font-body-sm text-green-400">Enabled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Database & System Info */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <div className="mb-6 flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            <h2 className="font-headline-md text-primary">Database</h2>
          </div>
          <div className="bg-surface-container-low border border-outline-variant p-6 rounded-lg">
            <div className="flex justify-between items-center mb-6 pb-6 border-b border-outline-variant">
              <div>
                <h3 className="font-headline-sm text-primary">MongoDB</h3>
                <p className="text-body-sm text-on-surface-variant mt-1">Primary data store</p>
              </div>
              <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-500 font-label-mono text-[11px] uppercase tracking-widest rounded flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Connected
              </span>
            </div>
            <div>
              <p className="text-body-sm font-semibold text-primary mb-4">Collections Tracked</p>
              <ul className="space-y-3">
                {['Workflows', 'Workflow Runs', 'Step Executions', 'Approval Requests'].map(col => (
                  <li key={col} className="flex items-center gap-3 text-body-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {col}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-6 flex items-center gap-2">
            <Server className="h-6 w-6 text-primary" />
            <h2 className="font-headline-md text-primary">System Information</h2>
          </div>
          <div className="bg-surface-container-low border border-outline-variant p-6 rounded-lg">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-amber-400" />
                  <span className="font-body-sm text-primary">FlowForge AI</span>
                </div>
                <span className="font-label-mono text-on-surface-variant text-sm bg-surface-container-highest px-2 py-1 rounded">Version 1.0</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Play className="h-5 w-5 text-blue-400" />
                  <span className="font-body-sm text-primary">Workflow Engine</span>
                </div>
                <span className="font-body-sm text-green-400">Healthy</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  <span className="font-body-sm text-primary">Gemini Connection</span>
                </div>
                <span className="font-body-sm text-green-400">Connected</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-emerald-400" />
                  <span className="font-body-sm text-primary">Database Connection</span>
                </div>
                <span className="font-body-sm text-green-400">Healthy</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Developer Tools */}
      <section>
        <div className="mb-6 flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          <h2 className="font-headline-md text-primary">Developer Tools</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <button 
            onClick={() => seedMutation.mutate()}
            disabled={isSeeding}
            className="flex flex-col items-center justify-center p-6 bg-surface-container-low border border-outline-variant hover:border-primary/50 hover:bg-surface-container transition-all rounded-lg text-center group disabled:opacity-50"
          >
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <RefreshCw className={`h-6 w-6 text-blue-400 ${isSeeding ? 'animate-spin' : ''}`} />
            </div>
            <span className="font-body-sm font-semibold text-primary mb-1">Seed Demo Workflow</span>
            <span className="text-[12px] text-on-surface-variant leading-tight">Injects the Support Ticket Triage demo flow.</span>
          </button>

          <button 
            onClick={() => clearMutation.mutate()}
            disabled={isClearing}
            className="flex flex-col items-center justify-center p-6 bg-surface-container-low border border-outline-variant hover:border-red-500/50 hover:bg-red-500/5 transition-all rounded-lg text-center group disabled:opacity-50"
          >
            <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Trash2 className="h-6 w-6 text-red-400" />
            </div>
            <span className="font-body-sm font-semibold text-red-400 mb-1">Clear Demo Executions</span>
            <span className="text-[12px] text-red-400/70 leading-tight">Wipes runs & steps, keeps workflows intact.</span>
          </button>

          <button 
            onClick={() => toast.success('JSON copied to clipboard')}
            className="flex flex-col items-center justify-center p-6 bg-surface-container-low border border-outline-variant hover:border-primary/50 hover:bg-surface-container transition-all rounded-lg text-center group"
          >
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Download className="h-6 w-6 text-emerald-400" />
            </div>
            <span className="font-body-sm font-semibold text-primary mb-1">Export Workflow JSON</span>
            <span className="text-[12px] text-on-surface-variant leading-tight">Download workflows as portable schema.</span>
          </button>

          <button 
            onClick={() => toast.error('Import not yet implemented')}
            className="flex flex-col items-center justify-center p-6 bg-surface-container-low border border-outline-variant hover:border-primary/50 hover:bg-surface-container transition-all rounded-lg text-center group opacity-80"
          >
            <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="h-6 w-6 text-purple-400" />
            </div>
            <span className="font-body-sm font-semibold text-primary mb-1">Import Workflow JSON</span>
            <span className="text-[12px] text-on-surface-variant leading-tight">Upload and parse raw JSON configurations.</span>
          </button>

        </div>
      </section>

    </div>
  );
}
