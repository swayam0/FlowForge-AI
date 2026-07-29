'use client';

import { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node as ReactFlowNode,
  useReactFlow,
  ReactFlowProvider,
  DefaultEdgeOptions,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { BaseNode } from './CustomNodes';
import { ConfigPanel } from './ConfigPanel';
import { useWorkflowBuilderStore } from '../../lib/store';
import { WorkflowStepType } from '../../types/common';
import { api } from '../../lib/api';
import { useRouter } from 'next/navigation';
import { 
  Network, Play, ChevronDown, CheckCircle, AlertCircle, 
  Terminal, Search, FileText, Database, UserCheck, PlaySquare, FileCheck,
  PanelLeftClose, PanelRightClose, PanelLeft, PanelRight, Save, PlayCircle, Share, Globe, Settings
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

const nodeTypes = {
  customNode: BaseNode,
};

const CATEGORIES = [
  {
    title: 'Input',
    items: [
      { type: WorkflowStepType.STRUCTURED_INPUT, icon: Terminal, color: 'text-blue-400' }
    ]
  },
  {
    title: 'AI / Processing',
    items: [
      { type: WorkflowStepType.AI_EXTRACTION, icon: FileText, color: 'text-purple-400' },
      { type: WorkflowStepType.AI_CLASSIFICATION, icon: Database, color: 'text-pink-400' }
    ]
  },
  {
    title: 'Logic',
    items: [
      { type: WorkflowStepType.DETERMINISTIC_CONDITION, icon: Network, color: 'text-yellow-400' }
    ]
  },
  {
    title: 'Human',
    items: [
      { type: WorkflowStepType.HUMAN_APPROVAL, icon: UserCheck, color: 'text-emerald-400' }
    ]
  },
  {
    title: 'Actions',
    items: [
      { type: WorkflowStepType.DOCUMENT_RETRIEVAL, icon: Search, color: 'text-orange-400' },
      { type: WorkflowStepType.MOCK_EXTERNAL_ACTION, icon: PlaySquare, color: 'text-emerald-400' }
    ]
  },
  {
    title: 'Output',
    items: [
      { type: WorkflowStepType.FINAL_REPORT, icon: FileCheck, color: 'text-gray-400' }
    ]
  }
];

export function WorkflowBuilderInner({ initialWorkflow }: { initialWorkflow?: any }) {
  const router = useRouter();
  const { 
    selectedNodeId, setSelectedNodeId, 
    setNodes: setStoreNodes, nodes: storeNodes,
    undo, redo, takeSnapshot 
  } = useWorkflowBuilderStore();
  
  const { screenToFlowPosition, getNodes } = useReactFlow();
  
  const [nodes, setNodes, onNodesChange] = useNodesState<ReactFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [name, setName] = useState(initialWorkflow?.name || 'New Workflow');
  const [description, setDescription] = useState(initialWorkflow?.description || '');
  
  const [showValidation, setShowValidation] = useState(false);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  // Sync from store for Undo/Redo
  useEffect(() => {
    if (storeNodes.length !== nodes.length || storeNodes.some((sn, i) => !nodes[i] || sn.id !== nodes[i].id)) {
      // Re-map storeNodes to ReactFlow nodes, keeping position if known
      setNodes((currentNodes) => storeNodes.map(sn => {
        const existing = currentNodes.find(n => n.id === sn.id);
        return {
          id: sn.id,
          type: 'customNode',
          position: existing ? existing.position : { x: 250, y: 150 },
          data: { label: (sn as any).name, type: sn.type, configuration: sn.configuration },
        };
      }));
    }
  }, [storeNodes]); // Intentionally omitting nodes to prevent loops

  // Initialize
  useEffect(() => {
    if (initialWorkflow) {
      setName(initialWorkflow.name || 'New Workflow');
      setDescription(initialWorkflow.description || '');
      const initialNodes = (initialWorkflow.nodes || []).map((n: any, index: number) => ({
        id: n.id,
        type: 'customNode',
        position: n.position || { x: 250 + (index % 3) * 300, y: 150 + Math.floor(index / 3) * 150 },
        data: { label: n.label || n.name, type: n.type, configuration: n.configuration || {} },
      }));
      const initialEdges = (initialWorkflow.edges || []).map((e: any) => ({
        id: e.id || `${e.source || e.from}-${e.target || e.to}`,
        source: e.source || e.from,
        target: e.target || e.to,
        label: e.condition ? JSON.stringify(e.condition) : undefined
      }));
      setNodes(initialNodes);
      setEdges(initialEdges);
      setStoreNodes(initialWorkflow.nodes);
    }
  }, [initialWorkflow, setNodes, setEdges, setStoreNodes]);

  const validateWorkflow = () => {
    const issues = [];
    if (nodes.length === 0) issues.push('Workflow must contain at least one node');
    if (!name) issues.push('Workflow must have a name');
    
    // Check specific nodes
    const hasApproval = nodes.some(n => n.data.type === WorkflowStepType.HUMAN_APPROVAL);
    if (!hasApproval && nodes.length > 3) issues.push('Warning: Missing approval branch for complex workflow');
    
    nodes.forEach((n: any) => {
      if ((n.data.type === WorkflowStepType.AI_EXTRACTION || n.data.type === WorkflowStepType.AI_CLASSIFICATION) && 
          (!n.data.configuration || !n.data.configuration.prompt)) {
        issues.push(`AI node "${n.data.label}" missing prompt configuration`);
      }
    });

    setValidationIssues(issues);
    setShowValidation(true);
    return issues.length === 0;
  };

  const handleSave = async () => {
    if (!validateWorkflow()) return;
    
    const workflowData = {
      name,
      description,
      nodes: nodes.map((n: any) => {
        const storeNode = storeNodes.find(sn => sn.id === n.id);
        return {
          id: n.id,
          label: n.data.label,
          type: n.data.type,
          configuration: (storeNode ? storeNode.configuration : n.data.configuration) || {},
          position: n.position
        };
      }),
      edges: edges.map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target
      }))
    };

    try {
      if (initialWorkflow) {
        await api.updateWorkflow(initialWorkflow.id, workflowData);
        toast.success('Workflow updated successfully');
      } else {
        const result = await api.createWorkflow(workflowData);
        toast.success('Workflow created successfully');
        const newId = result.id || result._id;
        if (!newId) {
          console.error('[WorkflowBuilder] Missing ID in create response payload:', result);
          toast.error('Unable to verify workflow creation. Check logs.');
          return;
        }
        router.push(`/workflows/${newId}`);
      }
    } catch (err: any) {
      console.error('[WorkflowBuilder] Save error:', err);
      const action = initialWorkflow ? 'update' : 'create';
      toast.error(err.message || `Unable to ${action} workflow. Please try again.`);
    }
  };

  const handleRun = async () => {
    if (!initialWorkflow?.id) {
      toast.error('Please save the workflow first');
      return;
    }
    try {
      await api.executeWorkflow(initialWorkflow.id);
      toast.success('Execution started');
      router.push(`/executions`);
    } catch (err) {
      toast.error('Failed to start execution');
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          handleSave();
        } else if (e.key === 'z') {
          e.preventDefault();
          undo();
        } else if (e.key === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, undo, redo]);

  const onConnect = useCallback((params: Connection | Edge) => {
    takeSnapshot();
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges, takeSnapshot]);

  const onNodesDelete = useCallback((deleted: ReactFlowNode[]) => {
    takeSnapshot();
    const deletedIds = deleted.map(n => n.id);
    setStoreNodes((prevNodes: any) => prevNodes.filter((n: any) => !deletedIds.includes(n.id)));
    if (selectedNodeId && deletedIds.includes(selectedNodeId)) {
      setSelectedNodeId(null);
    }
  }, [setStoreNodes, selectedNodeId, setSelectedNodeId, takeSnapshot]);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow') as WorkflowStepType;

      if (typeof type === 'undefined' || !type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      takeSnapshot();
      
      const id = `node-${Date.now()}`;
      const newNode: ReactFlowNode = {
        id,
        type: 'customNode',
        position,
        data: { label: type.replace('_', ' '), type, configuration: {} },
      };

      setNodes((nds) => nds.concat(newNode));
      setStoreNodes((prevNodes: any) => [...prevNodes, {
        id: newNode.id,
        name: newNode.data.label,
        type: newNode.data.type,
        configuration: newNode.data.configuration
      }]);
      
      // Auto-select new node
      setSelectedNodeId(newNode.id);
      setRightOpen(true);
    },
    [screenToFlowPosition, setNodes, setStoreNodes, takeSnapshot, setSelectedNodeId]
  );

  const defaultEdgeOptions: DefaultEdgeOptions = { 
    type: 'smoothstep', 
    animated: true, // Always animated to simulate flowing data in this mock
    style: { stroke: '#3b82f6', strokeWidth: 2 }
  };

  const onSelectionChange = useCallback(({ nodes }: { nodes: ReactFlowNode[] }) => {
    if (nodes.length === 1) {
      setSelectedNodeId(nodes[0].id);
      setRightOpen(true);
    } else {
      setSelectedNodeId(null);
    }
  }, [setSelectedNodeId]);

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-64px)] w-full overflow-hidden">
      {/* Top Toolbar */}
      <div className="w-full bg-[#0a0a0a] border-b border-outline-variant flex justify-between items-center px-6 h-16 shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-500/10 border border-blue-500/20">
            <Network className="h-5 w-5 text-blue-400" />
          </div>
          <div className="flex flex-col justify-center">
            <input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="bg-transparent border-none p-0 focus:ring-0 font-display text-lg font-semibold text-white leading-tight" 
              placeholder="Workflow Name" 
            />
            <span className="font-label-mono text-[10px] text-gray-500 tracking-wider uppercase">
              {initialWorkflow ? `v${initialWorkflow.version} • PUBLISHED` : 'v1.0.0 • DRAFT'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={validateWorkflow} 
            className="px-3 py-1.5 rounded text-gray-300 text-xs font-semibold hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4" /> Validate
          </button>
          
          <button 
            onClick={handleSave} 
            className="px-3 py-1.5 rounded text-gray-300 text-xs font-semibold hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 flex items-center gap-2"
            title="Save (Ctrl+S)"
          >
            <Save className="h-4 w-4" /> Save
          </button>
          
          <div className="w-px h-5 bg-outline-variant mx-1" />
          
          <button 
            onClick={() => toast.success('Workflow Published successfully!')} 
            className="px-3 py-1.5 rounded text-blue-400 text-xs font-semibold hover:bg-blue-500/10 transition-colors flex items-center gap-2"
          >
            <Globe className="h-4 w-4" /> Publish
          </button>

          <button 
            onClick={handleRun} 
            className="ml-2 px-5 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <PlayCircle className="h-4 w-4" />
            RUN
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar Toggle Button (if closed) */}
        {!leftOpen && (
          <button 
            onClick={() => setLeftOpen(true)}
            className="absolute left-4 top-4 z-40 p-2 bg-[#121212] border border-outline-variant rounded-md shadow-lg text-gray-400 hover:text-white"
          >
            <PanelLeft className="h-5 w-5" />
          </button>
        )}

        {/* Left Sidebar: Node Palette */}
        <aside 
          className={cn(
            "flex flex-col h-full bg-[#0a0a0a] border-r border-outline-variant z-20 shrink-0 transition-all duration-300",
            leftOpen ? "w-[280px]" : "w-0 overflow-hidden border-none"
          )}
        >
          <div className="flex items-center justify-between p-4 border-b border-outline-variant">
            <span className="font-label-caps text-gray-400 text-[11px] uppercase tracking-widest font-bold">Node Palette</span>
            <button onClick={() => setLeftOpen(false)} className="text-gray-500 hover:text-gray-300">
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
          
          <nav className="flex flex-col h-full overflow-y-auto p-3 gap-6 custom-scrollbar">
            {CATEGORIES.map(category => (
              <div key={category.title} className="flex flex-col gap-2">
                <span className="font-label-mono text-[10px] text-gray-500 tracking-wider uppercase px-2">{category.title}</span>
                <div className="flex flex-col gap-1">
                  {category.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div 
                        key={item.type}
                        onDragStart={(e) => onDragStart(e, item.type)}
                        draggable
                        className="flex items-center gap-3 px-3 py-2.5 bg-[#121212] hover:bg-[#18181b] border border-outline-variant/50 hover:border-outline-variant rounded-lg cursor-grab active:cursor-grabbing transition-all shadow-sm hover:shadow group"
                      >
                        <div className={cn("p-1.5 rounded-md bg-white/5", item.color)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="font-body-sm text-gray-300 group-hover:text-white text-sm">{item.type.replace('_', ' ')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Center Canvas */}
        <main className="flex-1 relative flex flex-col bg-[#050505]">
          <div className="flex-1 relative h-full" onDrop={onDrop} onDragOver={onDragOver}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodesDelete={onNodesDelete}
              onSelectionChange={onSelectionChange}
              nodeTypes={nodeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              selectionMode={'partial' as any}
              className="bg-[#050505]"
            >
              <Background gap={24} color="#1f1f23" variant={BackgroundVariant.Lines} />
              <Controls className="bg-[#121212] border border-outline-variant rounded-lg overflow-hidden shadow-xl" />
              <MiniMap 
                nodeStrokeColor="#27272a"
                nodeColor="#18181b"
                maskColor="rgba(5, 5, 5, 0.8)"
                className="border border-outline-variant rounded-lg shadow-2xl bg-[#0a0a0a]"
              />
            </ReactFlow>
          </div>

          {/* Validation Console Bottom Panel */}
          {showValidation && (
            <section className="absolute bottom-0 left-0 right-0 h-48 border-t border-outline-variant bg-[#0a0a0a] flex flex-col z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center justify-between px-4 py-2 border-b border-outline-variant bg-[#121212]">
                <div className="flex items-center gap-4">
                  <span className="font-label-caps text-xs tracking-wider uppercase font-bold text-gray-400">Validation Console</span>
                  {validationIssues.length > 0 ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                      <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                      <span className="text-[10px] font-label-mono text-red-400">{validationIssues.length} Issues</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                      <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                      <span className="text-[10px] font-label-mono text-green-400">All Checks Passed</span>
                    </div>
                  )}
                </div>
                <button onClick={() => setShowValidation(false)} className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <ChevronDown className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-outline-variant/50">
                    {validationIssues.map((issue, idx) => (
                      <tr 
                        key={idx} 
                        className="hover:bg-white/5 transition-colors group cursor-pointer"
                        onClick={() => {
                           // Try to highlight node if issue mentions its label
                           const match = nodes.find((n: any) => issue.includes(n.data.label as string));
                           if (match) setSelectedNodeId(match.id);
                        }}
                      >
                        <td className="py-3 px-4 align-top w-10">
                          {issue.includes('Warning') ? (
                            <AlertCircle className="h-5 w-5 text-yellow-400" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-400" />
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-body-sm text-gray-200 leading-tight">{issue}</p>
                          <p className="text-[11px] text-gray-500 font-label-mono mt-1 uppercase">
                            {issue.includes('Warning') ? 'Structural Warning' : 'Configuration Error'}
                          </p>
                        </td>
                      </tr>
                    ))}
                    {validationIssues.length === 0 && (
                      <tr>
                        <td colSpan={2} className="py-8 text-center text-gray-500">
                          <CheckCircle className="h-8 w-8 text-green-500/50 mx-auto mb-3" />
                          <span className="font-body-sm text-gray-400">Your workflow is valid and ready to run.</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>

        {/* Right Sidebar Toggle Button (if closed) */}
        {!rightOpen && (
          <button 
            onClick={() => setRightOpen(true)}
            className="absolute right-4 top-4 z-40 p-2 bg-[#121212] border border-outline-variant rounded-md shadow-lg text-gray-400 hover:text-white"
          >
            <PanelRight className="h-5 w-5" />
          </button>
        )}

        {/* Right Sidebar: Config Inspector */}
        <aside 
          className={cn(
            "h-full bg-[#0a0a0a] border-l border-outline-variant z-20 shrink-0 transition-all duration-300",
            rightOpen ? "w-[360px]" : "w-0 overflow-hidden border-none"
          )}
        >
          {selectedNodeId ? (
            <ConfigPanel />
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-outline-variant">
                <span className="font-label-caps text-gray-400 text-[11px] uppercase tracking-widest font-bold">Node Inspector</span>
                <button onClick={() => setRightOpen(false)} className="text-gray-500 hover:text-gray-300">
                  <PanelRightClose className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 font-body-sm p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-outline-variant border-dashed flex items-center justify-center mb-4">
                  <Settings className="h-6 w-6 opacity-50" />
                </div>
                <p>Select a node on the canvas to configure its properties, rules, and permissions.</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export function WorkflowBuilder({ initialWorkflow }: { initialWorkflow?: any }) {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner initialWorkflow={initialWorkflow} />
    </ReactFlowProvider>
  );
}
