import React, { useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Node as ReactFlowNode,
  Edge as ReactFlowEdge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { BaseNode } from '../CustomNodes';

// Custom node that wraps BaseNode with diff highlighting
function DiffNodeWrapper(props: any) {
  const diffType = props.data.diffType; // 'added' | 'removed' | 'modified' | 'unchanged'
  
  let ringClass = '';
  if (diffType === 'added') ringClass = 'ring-2 ring-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]';
  if (diffType === 'removed') ringClass = 'ring-2 ring-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] opacity-50 grayscale';
  if (diffType === 'modified') ringClass = 'ring-2 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]';
  if (diffType === 'unchanged') ringClass = 'opacity-60 grayscale';

  return (
    <div className={`rounded-xl transition-all ${ringClass}`}>
      <BaseNode {...props} />
    </div>
  );
}

const nodeTypes = {
  customNode: DiffNodeWrapper,
};

interface GraphDiffCanvasProps {
  diff: any;
  baseNodes: any[];
  baseEdges: any[];
}

export function GraphDiffCanvas({ diff, baseNodes, baseEdges }: GraphDiffCanvasProps) {
  const { nodes, edges } = useMemo(() => {
    const renderNodes: ReactFlowNode[] = [];
    const renderEdges: ReactFlowEdge[] = [];

    // Map base nodes
    const baseNodeMap = new Map(baseNodes.map(n => [n.id, n]));

    // Handle added nodes
    diff.nodes.added.forEach((n: any) => {
      renderNodes.push({
        id: n.id,
        type: 'customNode',
        position: n.position || { x: 0, y: 0 },
        data: { ...n, diffType: 'added', label: n.label || n.name },
      });
    });

    // Handle deleted nodes (show them where they were)
    diff.nodes.deleted.forEach((n: any) => {
      renderNodes.push({
        id: n.id,
        type: 'customNode',
        position: n.position || { x: 0, y: 0 },
        data: { ...n, diffType: 'removed', label: n.label || n.name },
      });
    });

    // Handle modified nodes
    const modifiedSet = new Set(diff.nodes.modified.map((m: any) => m.id));
    
    // Iterate base nodes for modified and unchanged
    baseNodes.forEach(n => {
      if (diff.nodes.deleted.some((d: any) => d.id === n.id)) return; // already handled
      
      const isModified = modifiedSet.has(n.id);
      renderNodes.push({
        id: n.id,
        type: 'customNode',
        position: n.position || { x: 0, y: 0 },
        data: { ...n, diffType: isModified ? 'modified' : 'unchanged', label: n.label || n.name },
      });
    });

    // Edges
    const addedEdgesSet = new Set(diff.edges.added.map((e: any) => e.id));
    const deletedEdgesSet = new Set(diff.edges.deleted.map((e: any) => e.id));
    const modifiedEdgesSet = new Set(diff.edges.modified.map((e: any) => e.id));

    // Combine all edges we need to show
    const allEdges = [...baseEdges, ...diff.edges.added];
    const processedEdgeIds = new Set();

    allEdges.forEach(e => {
      if (processedEdgeIds.has(e.id)) return;
      processedEdgeIds.add(e.id);

      let stroke = '#52525b'; // default zinc-600
      let animated = false;
      let opacity = 0.5;

      if (addedEdgesSet.has(e.id)) {
        stroke = '#22c55e'; // green
        animated = true;
        opacity = 1;
      } else if (deletedEdgesSet.has(e.id)) {
        stroke = '#ef4444'; // red
        opacity = 0.3;
      } else if (modifiedEdgesSet.has(e.id)) {
        stroke = '#3b82f6'; // blue
        animated = true;
        opacity = 1;
      }

      renderEdges.push({
        id: e.id,
        source: e.source || e.from,
        target: e.target || e.to,
        animated,
        style: { stroke, strokeWidth: 2, opacity },
      });
    });

    return { nodes: renderNodes, edges: renderEdges };
  }, [diff, baseNodes, baseEdges]);

  return (
    <div className="w-full h-[400px] border border-border rounded-xl overflow-hidden bg-[#050505]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        panOnScroll
        selectionOnDrag={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background gap={24} color="#18181b" variant={BackgroundVariant.Dots} size={1.5} />
        <Controls className="bg-[#121212]/80 border border-white/10 rounded-lg overflow-hidden shadow-xl fill-gray-400" />
      </ReactFlow>
    </div>
  );
}
