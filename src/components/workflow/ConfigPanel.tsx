import { useState } from 'react';
import { useWorkflowBuilderStore } from '../../lib/store';
import { X, Save, Settings, Shield, AlertTriangle, RefreshCcw, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

export function ConfigPanel() {
  const { selectedNodeId, nodes, updateNodeConfig, setSelectedNodeId } = useWorkflowBuilderStore();
  const [activeTab, setActiveTab] = useState('config');
  const [tempConfig, setTempConfig] = useState('');
  
  if (!selectedNodeId) return null;

  const node: any = nodes.find(n => n.id === selectedNodeId);
  if (!node) return null;

  const config = node.configuration || {};

  // Init temp config on node change
  if (tempConfig === '' && Object.keys(config).length > 0) {
    setTempConfig(JSON.stringify(config, null, 2));
  } else if (tempConfig === '' && Object.keys(config).length === 0) {
    setTempConfig('{\n  \n}');
  }

  const handleSave = () => {
    try {
      const parsed = JSON.parse(tempConfig);
      updateNodeConfig(node.id, parsed);
      toast.success('Configuration saved successfully');
    } catch (err) {
      toast.error('Invalid JSON configuration');
    }
  };

  const tabs = [
    { id: 'info', label: 'Info', icon: Info },
    { id: 'config', label: 'Config', icon: Settings },
    { id: 'permissions', label: 'Access', icon: Shield },
    { id: 'retry', label: 'Retry', icon: RefreshCcw },
    { id: 'validation', label: 'Rules', icon: AlertTriangle },
  ];

  return (
    <div className="flex h-full flex-col bg-[#0a0a0a]">
      <div className="p-5 border-b border-outline-variant bg-[#121212] flex items-center justify-between shrink-0">
        <div className="flex flex-col gap-1">
          <span className="font-label-mono text-[10px] text-blue-400 font-bold uppercase tracking-widest">Node Inspector</span>
          <h3 className="text-lg font-display font-semibold text-white tracking-wide truncate max-w-[200px]" title={node.name}>{node.name}</h3>
        </div>
        <button onClick={() => setSelectedNodeId(null)} className="p-1.5 rounded-md hover:bg-white/10 transition-colors">
          <X className="h-5 w-5 text-gray-400 hover:text-white" />
        </button>
      </div>
      
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-outline-variant bg-[#121212] px-2 custom-scrollbar shrink-0">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap",
                isActive ? "border-blue-500 text-blue-400" : "border-transparent text-gray-500 hover:text-gray-300"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {activeTab === 'info' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-label-caps text-gray-500 mb-1">Node Name</label>
              <input type="text" className="w-full bg-[#18181b] border border-outline-variant rounded p-2 text-sm text-white" defaultValue={node.name} />
            </div>
            <div>
              <label className="block text-xs font-label-caps text-gray-500 mb-1">Description</label>
              <textarea className="w-full bg-[#18181b] border border-outline-variant rounded p-2 text-sm text-white min-h-[100px]" placeholder="Optional description..."></textarea>
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-3 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <label className="block font-label-mono text-gray-400 text-[10px] font-bold uppercase tracking-wider">Parameters (JSON)</label>
            </div>
            <div className="relative group rounded-md overflow-hidden border border-outline-variant focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all flex-1 min-h-[300px]">
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-[#18181b] border-r border-outline-variant flex flex-col items-center py-4 select-none">
                {Array.from({ length: 30 }).map((_, i) => (
                  <span key={i} className="text-[10px] text-gray-600 font-label-mono leading-[21px]">{i + 1}</span>
                ))}
              </div>
              <textarea
                className="w-full h-full bg-[#0e0e11] pl-11 pr-4 py-4 text-green-400 font-label-mono text-[13px] leading-[21px] focus:outline-none resize-none"
                value={tempConfig}
                spellCheck={false}
                onChange={(e) => setTempConfig(e.target.value)}
              />
            </div>
          </div>
        )}

        {(activeTab === 'permissions' || activeTab === 'retry' || activeTab === 'validation') && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-4">
            <Settings className="h-12 w-12 opacity-20" />
            <p className="text-sm">This section is currently using default workspace settings.</p>
            <button className="px-4 py-2 border border-outline-variant rounded-md text-xs hover:bg-white/5 transition-colors">Override Defaults</button>
          </div>
        )}
      </div>
      
      <div className="p-5 border-t border-outline-variant bg-[#121212] shrink-0">
        <button 
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-label-caps font-bold tracking-wider text-xs rounded-md shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
        >
          <Save className="h-4 w-4" /> Save Changes
        </button>
      </div>
    </div>
  );
}
