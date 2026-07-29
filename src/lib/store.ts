import { create } from 'zustand';
import { WorkflowNode, WorkflowEdge } from '../types/workflow';

interface HistoryState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

interface WorkflowBuilderState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  past: HistoryState[];
  future: HistoryState[];
  selectedNodeId: string | null;
  setNodes: (nodes: WorkflowNode[] | ((old: WorkflowNode[]) => WorkflowNode[])) => void;
  setEdges: (edges: WorkflowEdge[] | ((old: WorkflowEdge[]) => WorkflowEdge[])) => void;
  setSelectedNodeId: (id: string | null) => void;
  updateNodeConfig: (id: string, config: any) => void;
  loadWorkflow: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
  takeSnapshot: () => void;
  undo: () => void;
  redo: () => void;
}

export const useWorkflowBuilderStore = create<WorkflowBuilderState>((set) => ({
  nodes: [],
  edges: [],
  past: [],
  future: [],
  selectedNodeId: null,
  setNodes: (nodesOrUpdater) => set((state) => ({
    nodes: typeof nodesOrUpdater === 'function' ? nodesOrUpdater(state.nodes) : nodesOrUpdater
  })),
  setEdges: (edgesOrUpdater) => set((state) => ({
    edges: typeof edgesOrUpdater === 'function' ? edgesOrUpdater(state.edges) : edgesOrUpdater
  })),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  updateNodeConfig: (id, config) => set((state) => {
    state.takeSnapshot();
    return {
      nodes: state.nodes.map(node => node.id === id ? { ...node, configuration: config } : node)
    };
  }),
  loadWorkflow: (nodes, edges) => set({ nodes, edges, past: [], future: [], selectedNodeId: null }),
  takeSnapshot: () => set((state) => {
    // Only push if there are nodes (prevents pushing empty initial state on load)
    if (state.nodes.length === 0) return {};
    return {
      past: [...state.past, { nodes: state.nodes, edges: state.edges }],
      future: [],
    };
  }),
  undo: () => set((state) => {
    if (state.past.length === 0) return {};
    const previous = state.past[state.past.length - 1];
    const newPast = state.past.slice(0, state.past.length - 1);
    return {
      past: newPast,
      future: [{ nodes: state.nodes, edges: state.edges }, ...state.future],
      nodes: previous.nodes,
      edges: previous.edges,
      selectedNodeId: null, // Clear selection to prevent errors
    };
  }),
  redo: () => set((state) => {
    if (state.future.length === 0) return {};
    const next = state.future[0];
    const newFuture = state.future.slice(1);
    return {
      past: [...state.past, { nodes: state.nodes, edges: state.edges }],
      future: newFuture,
      nodes: next.nodes,
      edges: next.edges,
      selectedNodeId: null,
    };
  }),
}));
