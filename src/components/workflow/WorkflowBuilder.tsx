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
import { ConfigPanel } from './ConfigPanel';
import { BaseNode } from './CustomNodes';
import { AnimatedEdge } from './CustomEdges';
import { useWorkflowBuilderStore } from '../../lib/store';
import { WorkflowStepType } from '../../types/common';
import { api } from '../../lib/api';
import { useRouter } from 'next/navigation';
import { 
  Network, Play, ChevronDown, CheckCircle, AlertCircle, ShieldCheck,
  Terminal, Search, FileText, Database, UserCheck, PlaySquare, FileCheck,
  PanelLeftClose, PanelRightClose, PanelLeft, PanelRight, Save, PlayCircle, Globe, Settings, Monitor
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import { useValidation } from './validation/useValidation';
import { ValidationPanel } from './validation/ValidationPanel';

const nodeTypes = {
  customNode: BaseNode,
};

const edgeTypes = {
  animatedEdge: AnimatedEdge,
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
  const [bypassValidation, setBypassValidation] = useState(false);
  
  const { result: validationResult, isValidating, panelOpen, setPanelOpen, forceValidate } = useValidation();
  
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  
  const [librarySearch, setLibrarySearch] = useState('');

  // Sync from store for Undo/Redo
  useEffect(() => {
    if (storeNodes.length !== nodes.length || storeNodes.some((sn, i) => !nodes[i] || sn.id !== nodes[i].id)) {
      // Re-map storeNodes to ReactFlow nodes, keeping position if known
      setNodes((currentNodes) => storeNodes.map(sn => {
        const existing = currentNodes.find(n => n.id === sn.id);
        return {
          id: sn.id,
          type: 'customNode',
          position: sn.position || existing?.position || { x: 100, y: 100 },
          data: {
            name: sn.label || (sn as any).name,
            type: sn.type,
            configuration: sn.configuration,
            permissions: (sn as any).permissions
          }
        };
      }));
    }
  }, [storeNodes, setNodes, nodes.length]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBypassValidation(localStorage.getItem('bypass_validation') === 'true');
    }
  }, []);

  const handleBypassChange = (val: boolean) => {
    setBypassValidation(val);
    localStorage.setItem('bypass_validation', val ? 'true' : 'false');
    toast.success(val ? 'Demo Mode Enabled: Validation bypassed' : 'Demo Mode Disabled');
  };

  const validateWorkflow = () => {
    const res = forceValidate();
    setPanelOpen(true);
    return bypassValidation || res.isValid;
  };

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
    } else {
      // New blank workflow: add a helpful starter template
      const starterNodes: ReactFlowNode[] = [
        {
          id: 'start-1',
          type: 'customNode',
          position: { x: 100, y: 220 },
          data: { label: 'Trigger Input', type: WorkflowStepType.STRUCTURED_INPUT, configuration: {} },
        },
        {
          id: 'ai-1',
          type: 'customNode',
          position: { x: 400, y: 220 },
          data: { label: 'Classify Request', type: WorkflowStepType.AI_CLASSIFICATION, configuration: { provider: 'Google', model: 'gemini-3.5-flash', prompt: 'Classify the incoming request.' } },
        },
        {
          id: 'report-1',
          type: 'customNode',
          position: { x: 700, y: 220 },
          data: { label: 'Final Report', type: WorkflowStepType.FINAL_REPORT, configuration: { format: 'json' } },
        },
      ];
      const starterEdges = [
        { id: 'e-start-ai', source: 'start-1', target: 'ai-1', type: 'animatedEdge' },
        { id: 'e-ai-report', source: 'ai-1', target: 'report-1', type: 'animatedEdge' },
      ];
      setNodes(starterNodes);
      setEdges(starterEdges);
      setStoreNodes(starterNodes.map(n => ({
        id: n.id,
        label: n.data.label as string,
        type: n.data.type as WorkflowStepType,
        configuration: n.data.configuration as Record<string, unknown>,
        position: n.position,
      })));
    }
  }, [initialWorkflow, setNodes, setEdges, setStoreNodes]);

  const handleSave = async () => {
    if (!validateWorkflow()) return;
    
    const workflowData = {
      name,
      description,
      nodes: nodes.map((n: any) => {
        const storeNode = storeNodes.find(sn => sn.id === n.id);
        const nodeLabel = n.data.label || n.data.name || (storeNode ? (storeNode as any).label || (storeNode as any).name : undefined) || 'Unknown Node';
        return {
          id: n.id,
          label: nodeLabel,
          data: { label: nodeLabel },
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
    } catch (err: unknown) {
      console.error('[WorkflowBuilder] Save error:', err);
      const action = initialWorkflow ? 'update' : 'create';
      const message = err instanceof Error ? err.message : `Unable to ${action} workflow. Please try again.`;
      toast.error(message);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start execution';
      toast.error(message, {
        action: { label: 'Retry', onClick: () => handleRun() }
      });
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

  const PRETTY_LABELS: Record<string, string> = {
    [WorkflowStepType.STRUCTURED_INPUT]: 'Trigger Input',
    [WorkflowStepType.AI_EXTRACTION]: 'AI Extraction',
    [WorkflowStepType.AI_CLASSIFICATION]: 'AI Classification',
    [WorkflowStepType.DETERMINISTIC_CONDITION]: 'Condition Check',
    [WorkflowStepType.HUMAN_APPROVAL]: 'Human Approval',
    [WorkflowStepType.DOCUMENT_RETRIEVAL]: 'Document Retrieval',
    [WorkflowStepType.MOCK_EXTERNAL_ACTION]: 'External Action',
    [WorkflowStepType.FINAL_REPORT]: 'Final Report',
  };

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
      const label = PRETTY_LABELS[type] || type.replace(/_/g, ' ');
      const newNode: ReactFlowNode = {
        id,
        type: 'customNode',
        position,
        data: { label, type, configuration: {} },
      };

      setNodes((nds) => {
        // Auto-connect: if only one node exists, link it to the new one
        const existingNodes = nds;
        if (existingNodes.length === 1) {
          const lastNode = existingNodes[existingNodes.length - 1];
          const autoEdge = {
            id: `e-${lastNode.id}-${id}`,
            source: lastNode.id,
            target: id,
            type: 'animatedEdge',
          };
          setEdges(eds => [...eds, autoEdge]);
        }
        return nds.concat(newNode);
      });
      setStoreNodes((prevNodes: any) => [...prevNodes, {
        id: newNode.id,
        label,
        type: newNode.data.type,
        position: newNode.position,
        configuration: newNode.data.configuration
      }]);
      
      // Auto-select new node so config panel opens immediately
      setSelectedNodeId(newNode.id);
      setRightOpen(true);
    },
    [screenToFlowPosition, setNodes, setEdges, setStoreNodes, takeSnapshot, setSelectedNodeId]
  );

  const defaultEdgeOptions: DefaultEdgeOptions = { 
    type: 'animatedEdge', 
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
    <>
      <div className="lg:hidden flex flex-col items-center justify-center flex-1 h-[calc(100vh-64px)] w-full p-6 text-center bg-[#050505]">
        <div className="bg-[#0a0a0a] border border-white/5 shadow-xl shadow-black/50 rounded-xl p-8 max-w-sm">
          <Monitor className="h-12 w-12 text-blue-500/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">Desktop Recommended</h3>
          <p className="text-gray-400 text-sm leading-relaxed">The Workflow Builder requires a larger screen for the best visual editing experience. Please use a desktop or tablet device to build and edit workflows.</p>
        </div>
      </div>
      <div className="hidden lg:flex flex-col flex-1 h-[calc(100vh-64px)] w-full overflow-hidden">
        {/* Top Toolbar */}
      <div className="w-full bg-[#0a0a0a] border-b border-outline-variant flex justify-between items-center px-6 h-16 shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-500/10 border border-blue-500/20">
            <Network className="h-5 w-5 text-blue-400" />
          </div>
          <div className="flex flex-col justify-center">
            <input 
              aria-label="Workflow Name"
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="bg-transparent border-none p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 font-display text-lg font-semibold text-white leading-tight rounded-sm" 
              placeholder="Workflow Name" 
            />
            <span className="font-label-mono text-[10px] text-gray-500 tracking-wider uppercase">
              {initialWorkflow ? `v${initialWorkflow.version} • PUBLISHED` : 'v1.0.0 • DRAFT'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Validation Score Badge */}
          <button
            onClick={() => { validateWorkflow(); setPanelOpen(true); }}
            className={cn(
              'px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-semibold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              isValidating
                ? 'text-gray-400 border-white/10 bg-white/5 animate-pulse'
                : validationResult.isValid
                ? 'text-green-400 border-green-500/20 bg-green-500/5 hover:bg-green-500/10'
                : 'text-red-400 border-red-500/20 bg-red-500/5 hover:bg-red-500/10'
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            {isValidating ? 'Validating...' : `${validationResult.score}/100`}
          </button>

          <button 
            onClick={handleSave} 
            className="px-3 py-1.5 rounded text-gray-300 text-xs font-semibold hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Save (Ctrl+S)"
          >
            <Save className="h-4 w-4" /> Save
          </button>
          
          <div className="w-px h-5 bg-outline-variant mx-1" />
          
          <button 
            onClick={() => {
              const res = forceValidate();
              if (!res.isValid && !bypassValidation) {
                setPanelOpen(true);
                toast.error('Cannot publish. Fix all errors first.');
              } else {
                toast.success('Workflow Published successfully!');
              }
            }} 
            className="px-3 py-1.5 rounded text-blue-400 text-xs font-semibold hover:bg-blue-500/10 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40"
          >
            <Globe className="h-4 w-4" /> Publish
          </button>

          <button 
            onClick={() => {
              const res = forceValidate();
              if (!res.isValid && !bypassValidation) {
                setPanelOpen(true);
                toast.error('Cannot run. Fix all errors first.');
                return;
              }
              handleRun();
            }} 
            className="ml-2 px-5 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
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
            aria-label="Toggle Node Library"
            className="absolute left-4 top-4 z-40 p-2 bg-[#121212] border border-outline-variant rounded-md shadow-lg text-gray-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <PanelLeft className="h-5 w-5" />
          </button>
        )}

        {/* Left Sidebar: Node Palette */}
        <aside 
          className={cn(
            "flex flex-col h-full bg-[#0a0a0a]/95 backdrop-blur-xl border-r border-white/5 z-20 shrink-0 transition-all duration-300",
            leftOpen ? "w-[280px]" : "w-0 overflow-hidden border-none"
          )}
        >
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <span className="font-label-caps text-gray-300 text-[10px] uppercase tracking-widest font-bold">Node Library</span>
            <button onClick={() => setLeftOpen(false)} aria-label="Close Node Library" className="text-gray-500 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
          
          <div className="p-3 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
              <input
                type="text"
                aria-label="Search nodes"
                placeholder="Search nodes..."
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                className="w-full bg-[#121212] border border-white/10 rounded-md pl-8 pr-3 py-2 text-xs text-white focus-visible:outline-none focus-visible:border-blue-500/50 focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-all"
              />
            </div>
          </div>
          
          <nav className="flex flex-col h-full overflow-y-auto p-3 gap-5 custom-scrollbar">
            {CATEGORIES.map(category => {
              const filteredItems = category.items.filter(item => 
                item.type.replace('_', ' ').toLowerCase().includes(librarySearch.toLowerCase())
              );
              
              if (filteredItems.length === 0) return null;
              
              return (
                <div key={category.title} className="flex flex-col gap-1.5">
                  <span className="font-label-mono text-[9px] text-gray-500 tracking-widest uppercase px-2 mb-1">{category.title}</span>
                  <div className="flex flex-col gap-0.5">
                    {filteredItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div 
                          key={item.type}
                          onDragStart={(e) => onDragStart(e, item.type)}
                          draggable
                          tabIndex={0}
                          aria-label={`Drag to add ${item.type.replace('_', ' ')} node`}
                          className="flex items-center gap-3 px-2.5 py-2 hover:bg-white/5 rounded-md cursor-grab active:cursor-grabbing transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <div className={cn("p-1 rounded bg-[#121212] border border-white/10 group-hover:border-white/20", item.color)}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-body-sm text-gray-400 group-hover:text-gray-200 text-xs transition-colors">{item.type.replace('_', ' ')}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
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
              edgeTypes={edgeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              selectionMode={'partial' as any}
              className="bg-[#050505]"
            >
              {/* Custom Animated Background */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_100%_at_50%_0%,_rgba(59,130,246,0.05)_0%,_rgba(0,0,0,0)_100%)] pointer-events-none" />
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] pointer-events-none mix-blend-overlay" />
              
              <Background gap={24} color="#18181b" variant={BackgroundVariant.Dots} size={1.5} />
              
              <Controls className="bg-[#121212]/80 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden shadow-xl fill-gray-400" />
              <MiniMap 
                nodeStrokeColor="#27272a"
                nodeColor="#18181b"
                maskColor="rgba(5, 5, 5, 0.7)"
                className="border border-white/10 rounded-lg shadow-2xl bg-[#0a0a0a]/80 backdrop-blur-md"
              />
            </ReactFlow>
          </div>

        </main>

        {/* Right Sidebar Toggle Button (if closed) */}
        {!rightOpen && (
          <button 
            onClick={() => setRightOpen(true)}
            aria-label="Toggle Node Inspector"
            className="absolute right-4 top-4 z-40 p-2 bg-[#121212] border border-outline-variant rounded-md shadow-lg text-gray-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <PanelRight className="h-5 w-5" />
          </button>
        )}

        {/* Right Sidebar: Config Inspector */}
        <aside 
          className={cn(
            "h-full bg-[#0a0a0a] border-l border-outline-variant z-20 shrink-0 transition-all duration-300",
            rightOpen && !panelOpen ? "w-[360px]" : "w-0 overflow-hidden border-none"
          )}
        >
          {selectedNodeId ? (
            <ConfigPanel />
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-outline-variant">
                <span className="font-label-caps text-gray-400 text-[11px] uppercase tracking-widest font-bold">Node Inspector</span>
                <button onClick={() => setRightOpen(false)} aria-label="Close Node Inspector" className="text-gray-500 hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
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

        <AnimatePresence>
          {panelOpen && (
            <ValidationPanel
              result={validationResult}
              isValidating={isValidating}
              onClose={() => setPanelOpen(false)}
              onFocusNode={(nodeId) => {
                setSelectedNodeId(nodeId);
                const node = nodes.find(n => n.id === nodeId);
                if (node) {
                  // Highlight by selecting it
                  setSelectedNodeId(nodeId);
                }
              }}
              bypassValidation={bypassValidation}
              onBypassChange={handleBypassChange}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
    </>
  );
}

export function WorkflowBuilder({ initialWorkflow }: { initialWorkflow?: any }) {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner initialWorkflow={initialWorkflow} />
    </ReactFlowProvider>
  );
}
