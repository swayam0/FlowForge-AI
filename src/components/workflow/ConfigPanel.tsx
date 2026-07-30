import { useState } from 'react';
import { useWorkflowBuilderStore } from '../../lib/store';
import { X, Save, Settings, Shield, AlertTriangle, RefreshCcw, Info, Terminal, Cpu, Database, Network } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

export function ConfigPanel() {
  const { selectedNodeId, nodes, updateNodeConfig, setSelectedNodeId } = useWorkflowBuilderStore();
  const [activeTab, setActiveTab] = useState('properties');
  const [tempConfig, setTempConfig] = useState('');
  
  if (!selectedNodeId) return null;

  const node: any = nodes.find(n => n.id === selectedNodeId);
  if (!node) return null;

  const config = node.configuration || {};

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
    { id: 'properties', label: 'Properties', icon: Settings },
    { id: 'metadata', label: 'Metadata', icon: Database },
    { id: 'logs', label: 'Logs', icon: Terminal },
    { id: 'ai', label: 'AI Output', icon: Cpu },
  ];

  return (
    <div className="flex h-full flex-col bg-[#0a0a0a]/95 backdrop-blur-xl">
      <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex flex-col">
          <span className="font-label-mono text-[9px] text-gray-500 font-bold uppercase tracking-widest">{node.type.replace('_', ' ')}</span>
          <h3 className="text-sm font-semibold text-gray-200 tracking-tight truncate max-w-[200px]" title={node.name || node.label}>{node.name || node.label}</h3>
        </div>
        <button onClick={() => setSelectedNodeId(null)} aria-label="Close Properties" className="p-1.5 rounded hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>
      
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-white/5 px-2 custom-scrollbar shrink-0">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm",
                isActive ? "border-blue-500 text-blue-400" : "border-transparent text-gray-500 hover:text-gray-300"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'properties' && (
          <div className="space-y-4 h-full flex flex-col">
            <div>
              <label htmlFor="step-name" className="block text-[10px] font-label-caps text-gray-500 mb-1.5">Step Name</label>
              <input id="step-name" type="text" className="w-full bg-[#121212] border border-white/10 rounded-md p-2 text-xs text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" defaultValue={node.label || node.name} />
            </div>
            
            <div className="flex-1 flex flex-col min-h-[300px]">
              <label htmlFor="config-json" className="block text-[10px] font-label-caps text-gray-500 mb-1.5">Configuration (JSON)</label>
              <div className="relative group rounded-md overflow-hidden border border-white/10 focus-within:ring-2 focus-within:ring-blue-500 transition-colors flex-1">
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-[#121212] border-r border-white/5 flex flex-col items-center py-3 select-none">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <span key={i} className="text-[9px] text-gray-600 font-mono leading-[20px]">{i + 1}</span>
                  ))}
                </div>
                <textarea
                  id="config-json"
                  className="w-full h-full bg-[#050505] pl-10 pr-3 py-3 text-green-400 font-mono text-[11px] leading-[20px] focus:outline-none resize-none"
                  value={tempConfig}
                  spellCheck={false}
                  onChange={(e) => setTempConfig(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metadata' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#121212] p-3 rounded-md border border-white/5">
                <span className="block text-[10px] font-label-caps text-gray-500 mb-1">Node ID</span>
                <span className="font-mono text-xs text-gray-300">{node.id}</span>
              </div>
              <div className="bg-[#121212] p-3 rounded-md border border-white/5">
                <span className="block text-[10px] font-label-caps text-gray-500 mb-1">Duration</span>
                <span className="font-mono text-xs text-gray-300">1,245 ms</span>
              </div>
              <div className="bg-[#121212] p-3 rounded-md border border-white/5">
                <span className="block text-[10px] font-label-caps text-gray-500 mb-1">Region</span>
                <span className="font-mono text-xs text-gray-300">us-east-1</span>
              </div>
              <div className="bg-[#121212] p-3 rounded-md border border-white/5">
                <span className="block text-[10px] font-label-caps text-gray-500 mb-1">Retries</span>
                <span className="font-mono text-xs text-gray-300">0 / 3</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="h-full bg-[#121212] rounded-md border border-white/10 p-3 overflow-hidden flex flex-col font-mono text-[10px]">
            <div className="text-gray-500 mb-2 pb-2 border-b border-white/5 flex items-center justify-between">
              <span>Execution Trace</span>
              <span className="text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Completed</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 text-gray-300 custom-scrollbar">
              <p><span className="text-gray-500">14:02:11.000</span> [INFO] Initializing step execution</p>
              <p><span className="text-gray-500">14:02:11.045</span> [INFO] Fetching node configuration</p>
              <p><span className="text-gray-500">14:02:11.120</span> [INFO] Resolving input mappings</p>
              <p><span className="text-gray-500">14:02:11.350</span> [WARN] Missing optional parameter 'timeout', using default 30s</p>
              <p><span className="text-gray-500">14:02:11.400</span> [INFO] Calling external service (latency: 840ms)</p>
              <p><span className="text-gray-500">14:02:12.240</span> [INFO] Response received successfully</p>
              <p className="text-green-400"><span className="text-gray-500">14:02:12.245</span> [SUCCESS] Step completed with output payload</p>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-4 h-full flex flex-col">
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="bg-[#121212] p-3 rounded-md border border-purple-500/20">
                <span className="block text-[10px] font-label-caps text-purple-400/70 mb-1">Tokens Used</span>
                <span className="font-mono text-xs text-purple-400">3,492</span>
              </div>
              <div className="bg-[#121212] p-3 rounded-md border border-white/5">
                <span className="block text-[10px] font-label-caps text-gray-500 mb-1">Confidence Score</span>
                <span className="font-mono text-xs text-emerald-400">0.94</span>
              </div>
            </div>
            <div className="flex-1 bg-[#121212] rounded-md border border-white/5 p-3 overflow-hidden flex flex-col">
              <span className="block text-[10px] font-label-caps text-gray-500 mb-2 pb-2 border-b border-white/5">Generated Output</span>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <p className="text-xs text-gray-300 leading-relaxed font-body-sm">
                  Based on the provided documentation, the optimal approach to resolving the connectivity issue is to ensure that the VPC peering connection is actively accepting traffic on port 443. 
                  <br/><br/>
                  Additionally, verifying the IAM roles attached to the execution environment will confirm if the Lambda function has the necessary <code>sts:AssumeRole</code> permissions.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-white/5 bg-[#0a0a0a] shrink-0">
        <button 
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 py-2 bg-white text-black hover:bg-gray-200 font-label-caps font-bold tracking-widest text-[10px] rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
        >
          <Save className="h-3.5 w-3.5" /> Save Properties
        </button>
      </div>
    </div>
  );
}
