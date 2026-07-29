'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Eye, EyeOff, Loader2, Zap, Sparkles, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  
  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings,
  });

  const saveMutation = useMutation({
    mutationFn: ({ provider, key }: { provider: string, key: string }) => api.saveSetting(provider, key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (provider: string) => api.deleteSetting(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });

  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  
  const [isReplacingGemini, setIsReplacingGemini] = useState(false);

  const [showGeminiKey, setShowGeminiKey] = useState(false);

  const handleSaveGemini = () => {
    if (!geminiKeyInput.trim()) return;
    saveMutation.mutate({ provider: 'gemini', key: geminiKeyInput });
    setGeminiKeyInput('');
    setIsReplacingGemini(false);
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-8 animate-pulse">
        <div className="h-10 bg-white/5 rounded w-1/3 mb-8"></div>
        {[1,2].map(i => (
          <div key={i} className="space-y-4">
            <div className="h-6 bg-white/5 rounded w-1/4"></div>
            <div className="h-16 bg-white/5 rounded w-full"></div>
            <div className="h-16 bg-white/5 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 w-full max-w-[1440px] mx-auto pb-12 pt-6">
        <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-red-400" />
          <div className="flex flex-col">
            <span className="font-headline-md text-red-400 font-bold">Failed to load settings</span>
            <span className="text-body-sm text-red-400/80">Please check your database connection or network configuration.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-[1440px] mx-auto pb-12 pt-6 space-y-12">
      {/* Section 1: AI Provider Configuration */}
      <section>
        <div className="mb-6">
          <h2 className="font-headline-md text-primary">AI Provider Configuration</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">Manage your API keys and provider-specific parameters.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gemini Card */}
          <div className="bg-surface-container-low border border-outline-variant p-6 flex flex-col justify-between hover:border-primary/40 transition-colors rounded-lg">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-container flex items-center justify-center rounded">
                  <Sparkles className="text-on-primary-container h-5 w-5" />
                </div>
                <div>
                  <p className="text-primary font-semibold">Gemini</p>
                  <p className="font-label-mono text-on-surface-variant">google-generative-ai</p>
                </div>
              </div>
              {settings?.geminiConfigured && !isReplacingGemini ? (
                <span className="px-2 py-1 bg-green-500/10 border border-green-500/50 text-green-500 font-label-mono text-[10px] uppercase tracking-widest rounded">Configured</span>
              ) : (
                <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/50 text-amber-500 font-label-mono text-[10px] uppercase tracking-widest rounded">Not Configured</span>
              )}
            </div>
            
            <div className="space-y-4">
              {settings?.geminiConfigured && !isReplacingGemini ? (
                <>
                  <div className="bg-background border border-outline-variant px-4 py-2 flex items-center justify-between rounded">
                    <code className="font-label-mono text-body-sm text-on-surface-variant">
                      {showGeminiKey ? settings.geminiMasked : '•'.repeat(24)}
                    </code>
                    <button onClick={() => setShowGeminiKey(!showGeminiKey)} className="text-outline hover:text-primary transition-colors">
                      {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsReplacingGemini(true)}
                      className="flex-1 py-2 bg-surface-container-high border border-outline-variant text-primary font-label-caps hover:bg-surface-container-highest transition-colors rounded"
                    >
                      EDIT
                    </button>
                    <button 
                      onClick={() => deleteMutation.mutate('gemini')}
                      disabled={deleteMutation.isPending}
                      className="py-2 px-4 bg-red-500/10 border border-red-500/30 text-red-400 font-label-caps hover:bg-red-500/20 transition-colors rounded disabled:opacity-50"
                    >
                      REMOVE
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <input 
                    type="password"
                    placeholder="AIza..."
                    value={geminiKeyInput}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                    className="w-full bg-background border border-outline-variant px-4 py-2 rounded text-primary focus:border-primary outline-none transition-colors"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSaveGemini}
                      disabled={!geminiKeyInput.trim() || saveMutation.isPending}
                      className="flex-1 py-2 bg-primary text-background font-label-caps hover:bg-primary/90 transition-colors rounded disabled:opacity-50"
                    >
                      SAVE
                    </button>
                    {isReplacingGemini && (
                      <button 
                        onClick={() => { setIsReplacingGemini(false); setGeminiKeyInput(''); }}
                        className="py-2 px-4 bg-surface-container-high border border-outline-variant text-primary font-label-caps hover:bg-surface-container-highest transition-colors rounded"
                      >
                        CANCEL
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Appearance */}
      <section>
        <div className="mb-6">
          <h2 className="font-headline-md text-primary">Appearance</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">Customize your visual interface and reading experience.</p>
        </div>
        <div className="bg-surface-container-low border border-outline-variant divide-y divide-outline-variant rounded-lg">
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-primary font-medium">Theme</p>
              <p className="text-body-sm text-on-surface-variant mt-1">Set your preferred interface color scheme.</p>
            </div>
            <div className="flex bg-background border border-outline-variant p-1 rounded">
              <button className="px-4 py-1.5 font-label-caps text-on-surface-variant hover:text-primary transition-colors rounded">LIGHT</button>
              <button className="px-4 py-1.5 font-label-caps bg-surface-container-highest text-primary rounded">DARK</button>
              <button className="px-4 py-1.5 font-label-caps text-on-surface-variant hover:text-primary transition-colors rounded">SYSTEM</button>
            </div>
          </div>
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-primary font-medium">Font Scaling</p>
              <p className="text-body-sm text-on-surface-variant mt-1">Adjust the global text size for improved readability.</p>
            </div>
            <div className="w-full md:w-64 flex items-center gap-4">
              <span className="font-label-caps text-on-surface-variant">A</span>
              <input className="flex-1 h-1 bg-surface-container-highest appearance-none cursor-pointer accent-primary rounded" max="120" min="80" type="range" defaultValue="100"/>
              <span className="text-xl font-bold text-primary">A</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Notifications */}
      <section>
        <div className="mb-6">
          <h2 className="font-headline-md text-primary">Notifications</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">Control how and when you receive platform updates.</p>
        </div>
        <div className="bg-surface-container-low border border-outline-variant divide-y divide-outline-variant rounded-lg">
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-primary font-medium">Execution Alerts</p>
              <p className="text-body-sm text-on-surface-variant mt-1">Get notified immediately when a workflow fails or completes.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-outline-variant after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-background"></div>
            </label>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-primary font-medium">Approval Reminders</p>
              <p className="text-body-sm text-on-surface-variant mt-1">Daily digests for workflows waiting for human intervention.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-outline-variant after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-background"></div>
            </label>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-primary font-medium">System Status</p>
              <p className="text-body-sm text-on-surface-variant mt-1">Maintenance announcements and API health updates.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-outline-variant after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-background"></div>
            </label>
          </div>
        </div>
      </section>

      {/* Section 4: Workflow Defaults */}
      <section>
        <div className="mb-6">
          <h2 className="font-headline-md text-primary">Workflow Defaults</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">Global fallback values for all new automation nodes.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-low border border-outline-variant p-6 rounded-lg space-y-4">
            <p className="text-primary font-medium">Default Model</p>
            <select className="w-full bg-background border border-outline-variant text-primary px-4 py-2 rounded outline-none">

              <option>Claude 3.5 Sonnet</option>
              <option>Gemini 1.5 Pro</option>
            </select>
          </div>
          <div className="bg-surface-container-low border border-outline-variant p-6 rounded-lg space-y-4">
            <p className="text-primary font-medium">Timeout Duration</p>
            <div className="flex items-center gap-2">
              <input className="w-full bg-background border border-outline-variant text-primary px-4 py-2 rounded outline-none" type="number" defaultValue="30" />
              <span className="text-on-surface-variant font-label-caps">SECONDS</span>
            </div>
          </div>
          <div className="bg-surface-container-low border border-outline-variant p-6 rounded-lg space-y-4">
            <p className="text-primary font-medium">Retry Logic</p>
            <select className="w-full bg-background border border-outline-variant text-primary px-4 py-2 rounded outline-none">
              <option>Exponential Backoff</option>
              <option>Linear (3 attempts)</option>
              <option>No Retry</option>
            </select>
          </div>
        </div>
      </section>

      {/* Section 5: Danger Zone */}
      <section>
        <div className="p-8 border border-red-500/30 bg-red-500/5 rounded-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="font-headline-md text-red-500 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Danger Zone
              </h2>
              <p className="text-body-sm text-on-surface-variant mt-2 max-w-xl">
                Performing these actions will result in permanent data loss. Please be certain before proceeding. Resetting demo data will clear all current execution histories and custom nodes.
              </p>
            </div>
            <button className="px-6 py-3 border border-red-500 text-red-500 font-label-caps hover:bg-red-500/10 transition-colors whitespace-nowrap rounded">
              RESET DEMO DATA
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
