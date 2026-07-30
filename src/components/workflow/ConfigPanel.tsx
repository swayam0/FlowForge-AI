'use client';

import { useState } from 'react';
import { useWorkflowBuilderStore } from '../../lib/store';
import { X, Save, Settings, Database, Terminal, Cpu } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { WorkflowStepType } from '../../types/common';

/* ─────────────────────────────────────────────────────
   Tiny reusable field components
───────────────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      className="w-full bg-[#121212] border border-white/10 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600"
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 4 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      className="w-full bg-[#121212] border border-white/10 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600 resize-none"
      value={value}
      placeholder={placeholder}
      rows={rows}
      onChange={e => onChange(e.target.value)}
    />
  );
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
  return (
    <select
      className="w-full bg-[#121212] border border-white/10 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      <option value="">— Select —</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function NumberInput({ value, onChange, min, max, placeholder }: { value: string | number; onChange: (v: number) => void; min?: number; max?: number; placeholder?: string }) {
  return (
    <input
      type="number"
      className="w-full bg-[#121212] border border-white/10 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={value}
      min={min}
      max={max}
      placeholder={placeholder}
      onChange={e => onChange(Number(e.target.value))}
    />
  );
}

/* ─────────────────────────────────────────────────────
   Node-specific config forms
───────────────────────────────────────────────────── */
function AINodeForm({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const AI_PROVIDERS = [
    { value: 'Google', label: 'Google (Gemini)' },
    { value: 'OpenAI', label: 'OpenAI (GPT)' },
    { value: 'Anthropic', label: 'Anthropic (Claude)' },
  ];
  const MODELS: Record<string, { value: string; label: string }[]> = {
    Google: [
      { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
      { value: 'gemini-3.0-pro', label: 'Gemini 3.0 Pro' },
    ],
    OpenAI: [
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    ],
    Anthropic: [
      { value: 'claude-sonnet-4.5', label: 'Claude Sonnet 4.5' },
      { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
    ],
  };

  const update = (key: string, val: any) => onChange({ ...config, [key]: val });

  return (
    <div className="space-y-4">
      <Field label="AI Provider *">
        <SelectInput
          value={config.provider || ''}
          onChange={v => update('provider', v)}
          options={AI_PROVIDERS}
        />
      </Field>
      <Field label="AI Model *">
        <SelectInput
          value={config.model || ''}
          onChange={v => update('model', v)}
          options={MODELS[config.provider] || []}
        />
        {!config.provider && (
          <p className="text-[10px] text-yellow-500 mt-1">Select a provider first.</p>
        )}
      </Field>
      <Field label="Prompt *">
        <TextArea
          value={config.prompt || ''}
          onChange={v => update('prompt', v)}
          placeholder="Write your AI instructions here..."
          rows={6}
        />
      </Field>
      <Field label="Max Tokens">
        <NumberInput value={config.maxTokens || ''} onChange={v => update('maxTokens', v)} min={1} max={32000} placeholder="e.g. 2048" />
      </Field>
    </div>
  );
}

function ConditionNodeForm({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const update = (key: string, val: any) => onChange({ ...config, [key]: val });
  return (
    <div className="space-y-4">
      <Field label="Condition Expression *">
        <TextInput
          value={config.expression || ''}
          onChange={v => update('expression', v)}
          placeholder='e.g. input.urgency === "HIGH"'
        />
        <p className="text-[10px] text-gray-500 mt-1.5">
          Use <code className="bg-white/10 px-1 rounded">input.fieldName</code> to reference values from previous nodes.
        </p>
      </Field>
      <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-md">
        <p className="text-[10px] text-yellow-400 font-semibold mb-1">⚠ Don't forget to connect branches</p>
        <p className="text-[10px] text-gray-400">Connect both the <strong>True</strong> and <strong>False</strong> output handles to subsequent nodes.</p>
      </div>
    </div>
  );
}

function HumanApprovalForm({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const update = (key: string, val: any) => onChange({ ...config, [key]: val });
  const ROLES = [
    { value: 'Manager', label: 'Manager' },
    { value: 'Admin', label: 'Admin' },
    { value: 'Director', label: 'Director' },
    { value: 'HR', label: 'HR' },
    { value: 'Finance', label: 'Finance' },
  ];

  return (
    <div className="space-y-4">
      <Field label="Reviewer (Role or Email) *">
        <TextInput
          value={config.reviewer || ''}
          onChange={v => update('reviewer', v)}
          placeholder="e.g. Manager or admin@company.com"
        />
      </Field>
      <Field label="Allowed Roles (Permissions)">
        <div className="grid grid-cols-2 gap-2 mt-1">
          {ROLES.map(role => {
            const perms: string[] = config.permissions || [];
            const checked = perms.includes(role.value);
            return (
              <label key={role.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  className="accent-blue-500"
                  onChange={e => {
                    const next = e.target.checked
                      ? [...perms, role.value]
                      : perms.filter(p => p !== role.value);
                    update('permissions', next);
                  }}
                />
                <span className="text-xs text-gray-300">{role.label}</span>
              </label>
            );
          })}
        </div>
        <p className="text-[10px] text-gray-500 mt-2">Assigning roles removes the "Unsecured Approval" security warning.</p>
      </Field>
      <Field label="Approval Timeout (hours)">
        <NumberInput value={config.timeoutHours || ''} onChange={v => update('timeoutHours', v)} min={1} placeholder="e.g. 24" />
      </Field>
    </div>
  );
}

function ExternalActionForm({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const update = (key: string, val: any) => onChange({ ...config, [key]: val });
  const METHODS = [
    { value: 'POST', label: 'POST' },
    { value: 'GET', label: 'GET' },
    { value: 'PUT', label: 'PUT' },
    { value: 'PATCH', label: 'PATCH' },
    { value: 'DELETE', label: 'DELETE' },
  ];
  return (
    <div className="space-y-4">
      <Field label="API Endpoint URL *">
        <TextInput
          value={config.endpoint || ''}
          onChange={v => update('endpoint', v)}
          placeholder="https://api.example.com/endpoint"
        />
      </Field>
      <Field label="HTTP Method">
        <SelectInput value={config.method || 'POST'} onChange={v => update('method', v)} options={METHODS} />
      </Field>
      <Field label="Retry Policy">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[9px] text-gray-500 uppercase tracking-widest block mb-1">Max Retries</label>
            <NumberInput
              value={config.retryPolicy?.maxRetries ?? ''}
              onChange={v => update('retryPolicy', { ...(config.retryPolicy || {}), maxRetries: v })}
              min={0} max={10} placeholder="e.g. 3"
            />
          </div>
          <div>
            <label className="text-[9px] text-gray-500 uppercase tracking-widest block mb-1">Delay (ms)</label>
            <NumberInput
              value={config.retryPolicy?.delayMs ?? ''}
              onChange={v => update('retryPolicy', { ...(config.retryPolicy || {}), delayMs: v })}
              min={100} placeholder="e.g. 1000"
            />
          </div>
        </div>
        <p className="text-[10px] text-gray-500 mt-1.5">Setting retries removes the "Missing Retry Policy" warning.</p>
      </Field>
    </div>
  );
}

function DocumentRetrievalForm({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const update = (key: string, val: any) => onChange({ ...config, [key]: val });
  return (
    <div className="space-y-4">
      <Field label="Search Query *">
        <TextInput
          value={config.query || ''}
          onChange={v => update('query', v)}
          placeholder="Enter a search query or {{input.field}}"
        />
      </Field>
      <Field label="Max Results">
        <NumberInput value={config.maxResults || ''} onChange={v => update('maxResults', v)} min={1} max={50} placeholder="e.g. 5" />
      </Field>
    </div>
  );
}

function StructuredInputForm({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const update = (key: string, val: any) => onChange({ ...config, [key]: val });
  return (
    <div className="space-y-4">
      <p className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
        This is the <strong>starting trigger</strong> of your workflow. No configuration is required — but you can optionally define an input schema.
      </p>
      <Field label="Input Schema (JSON)">
        <TextArea
          value={config.schema ? JSON.stringify(config.schema, null, 2) : ''}
          onChange={v => {
            try { update('schema', JSON.parse(v)); } catch { /* Incomplete JSON while typing */ }
          }}
          placeholder={'{\n  "field": "string"\n}'}
          rows={6}
        />
      </Field>
    </div>
  );
}

function FinalReportForm({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const update = (key: string, val: any) => onChange({ ...config, [key]: val });
  const FORMATS = [
    { value: 'json', label: 'JSON' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'html', label: 'HTML' },
  ];
  return (
    <div className="space-y-4">
      <p className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 rounded-md p-3">
        This is the <strong>final output</strong> node. All workflow outputs are compiled here.
      </p>
      <Field label="Output Format">
        <SelectInput value={config.format || 'json'} onChange={v => update('format', v)} options={FORMATS} />
      </Field>
      <Field label="Report Title">
        <TextInput
          value={config.title || ''}
          onChange={v => update('title', v)}
          placeholder="e.g. Execution Summary Report"
        />
      </Field>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Main ConfigPanel
───────────────────────────────────────────────────── */
export function ConfigPanel() {
  const { selectedNodeId, nodes, updateNodeConfig, setSelectedNodeId } = useWorkflowBuilderStore();
  const [activeTab, setActiveTab] = useState('properties');

  if (!selectedNodeId) return null;
  const node: any = nodes.find(n => n.id === selectedNodeId);
  if (!node) return null;

  const config = node.configuration || {};
  const nodeType = node.type as WorkflowStepType;

  const handleConfigChange = (newConfig: any) => {
    updateNodeConfig(node.id, newConfig);
  };

  const handleSave = () => {
    toast.success('Configuration saved! Validation will update in real-time.');
  };

  const tabs = [
    { id: 'properties', label: 'Config', icon: Settings },
    { id: 'metadata', label: 'Info', icon: Database },
    { id: 'logs', label: 'Logs', icon: Terminal },
    { id: 'ai', label: 'AI Output', icon: Cpu },
  ];

  const renderForm = () => {
    switch (nodeType) {
      case WorkflowStepType.AI_EXTRACTION:
      case WorkflowStepType.AI_CLASSIFICATION:
        return <AINodeForm config={config} onChange={handleConfigChange} />;
      case WorkflowStepType.DETERMINISTIC_CONDITION:
        return <ConditionNodeForm config={config} onChange={handleConfigChange} />;
      case WorkflowStepType.HUMAN_APPROVAL:
        return <HumanApprovalForm config={config} onChange={handleConfigChange} />;
      case WorkflowStepType.MOCK_EXTERNAL_ACTION:
        return <ExternalActionForm config={config} onChange={handleConfigChange} />;
      case WorkflowStepType.DOCUMENT_RETRIEVAL:
        return <DocumentRetrievalForm config={config} onChange={handleConfigChange} />;
      case WorkflowStepType.STRUCTURED_INPUT:
        return <StructuredInputForm config={config} onChange={handleConfigChange} />;
      case WorkflowStepType.FINAL_REPORT:
        return <FinalReportForm config={config} onChange={handleConfigChange} />;
      default:
        return <p className="text-xs text-gray-500">No configuration required for this node type.</p>;
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#0a0a0a]/95 backdrop-blur-xl">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex flex-col">
          <span className="font-mono text-[9px] text-gray-500 font-bold uppercase tracking-widest">
            {nodeType?.replace(/_/g, ' ')}
          </span>
          <h3 className="text-sm font-semibold text-gray-200 tracking-tight truncate max-w-[200px]" title={node.name || node.label}>
            {node.name || node.label}
          </h3>
        </div>
        <button
          onClick={() => setSelectedNodeId(null)}
          aria-label="Close Properties"
          className="p-1.5 rounded hover:bg-white/5 transition-colors"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-white/5 px-2 shrink-0">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap',
                isActive ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'properties' && (
          <div className="space-y-4">
            <Field label="Step Name">
              <TextInput value={node.label || node.name || ''} onChange={() => {}} placeholder="Node Label" />
            </Field>
            <div className="border-t border-white/5 pt-4">
              {renderForm()}
            </div>
          </div>
        )}

        {activeTab === 'metadata' && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Node ID', value: node.id },
              { label: 'Type', value: nodeType?.replace(/_/g, ' ') },
              { label: 'Region', value: 'us-east-1' },
              { label: 'Retries', value: '0 / 3' },
            ].map(item => (
              <div key={item.label} className="bg-[#121212] p-3 rounded-md border border-white/5">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{item.label}</span>
                <span className="font-mono text-xs text-gray-300 break-all">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="h-full bg-[#121212] rounded-md border border-white/10 p-3 font-mono text-[10px]">
            <div className="text-gray-500 mb-2 pb-2 border-b border-white/5 flex items-center justify-between">
              <span>Execution Trace</span>
              <span className="text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Completed</span>
            </div>
            <div className="space-y-1.5 text-gray-300">
              <p><span className="text-gray-500">14:02:11.000</span> [INFO] Initializing step execution</p>
              <p><span className="text-gray-500">14:02:11.045</span> [INFO] Fetching node configuration</p>
              <p><span className="text-gray-500">14:02:11.350</span> [WARN] Missing optional parameter 'timeout'</p>
              <p><span className="text-gray-500">14:02:11.400</span> [INFO] Calling external service (840ms)</p>
              <p className="text-green-400"><span className="text-gray-500">14:02:12.245</span> [SUCCESS] Step completed</p>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#121212] p-3 rounded-md border border-purple-500/20">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-purple-400/70 mb-1">Tokens Used</span>
                <span className="font-mono text-xs text-purple-400">3,492</span>
              </div>
              <div className="bg-[#121212] p-3 rounded-md border border-white/5">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Confidence</span>
                <span className="font-mono text-xs text-emerald-400">0.94</span>
              </div>
            </div>
            <div className="bg-[#121212] rounded-md border border-white/5 p-3">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Generated Output</span>
              <p className="text-xs text-gray-300 leading-relaxed">Based on the provided documentation, the optimal approach is to verify IAM roles and ensure VPC peering connections accept traffic on port 443.</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/5 bg-[#0a0a0a] shrink-0">
        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 py-2 bg-white text-black hover:bg-gray-200 font-bold text-[10px] uppercase tracking-widest rounded-md transition-colors"
        >
          <Save className="h-3.5 w-3.5" /> Save Properties
        </button>
      </div>
    </div>
  );
}

