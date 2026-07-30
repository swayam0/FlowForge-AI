'use client';

import React, { useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { BaseNode } from '../../workflow/CustomNodes';
import { AnimatedEdge } from '../../workflow/CustomEdges';
import { useReplayStore } from '@/lib/replayStore';
import { InspectorStepData } from '@/types/inspector';
import { FloatingNodeInfo } from './FloatingNodeInfo';

const ReplayNodeWrapper = (props: any) => {
  return (
    <div className="relative">
      <BaseNode {...props} />
      <FloatingNodeInfo 
        stepData={props.data.stepData} 
        nodeName={props.data.label} 
        nodeType={props.data.type} 
      />
    </div>
  );
};

const nodeTypes = {
  customNode: ReplayNodeWrapper,
};

const edgeTypes = {
  animatedEdge: AnimatedEdge,
};

interface ReplayCanvasProps {
  initialNodes: any[];
  initialEdges: any[];
  steps: InspectorStepData[];
}

function ReplayCanvasInner({ initialNodes, initialEdges, steps }: ReplayCanvasProps) {
  const { currentTimeMs, setActiveNode, activeNodeId, isPlaying } = useReplayStore();
  const { fitView, setCenter, getNodes } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Initialize graph
  useEffect(() => {
    const formattedNodes = initialNodes.map(n => ({
      id: n.id,
      type: 'customNode',
      position: n.position || { x: 0, y: 0 },
      data: { ...n.data, stepData: null, executionStatus: 'pending' }
    }));
    
    const formattedEdges = initialEdges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'animatedEdge',
      data: { isExecuting: false }
    }));

    setNodes(formattedNodes);
    setEdges(formattedEdges);
    
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 800 });
    }, 100);
  }, [initialNodes, initialEdges, setNodes, setEdges, fitView]);

  // Update node statuses based on time
  useEffect(() => {
    if (nodes.length === 0) return;

    let currentlyActiveNodeId: string | null = null;
    let anyChanges = false;

    const newNodes = nodes.map(node => {
      const step = steps.find(s => s.stepId === node.id);
      if (!step || !step.startedAt) return node;

      const startedAtMs = new Date(step.startedAt).getTime() - new Date(steps[0].startedAt!).getTime();
      const completedAtMs = step.completedAt ? new Date(step.completedAt).getTime() - new Date(steps[0].startedAt!).getTime() : startedAtMs + 1000;

      let currentStatus = 'pending';
      if (currentTimeMs >= startedAtMs && currentTimeMs <= completedAtMs) {
        currentStatus = 'running';
        currentlyActiveNodeId = node.id;
      } else if (currentTimeMs > completedAtMs) {
        currentStatus = step.status; // completed, failed, etc.
      }

      if (node.data.executionStatus !== currentStatus || node.data.stepData !== step) {
        anyChanges = true;
        return {
          ...node,
          data: {
            ...node.data,
            executionStatus: currentStatus,
            stepData: step
          }
        };
      }
      return node;
    });

    if (anyChanges) {
      setNodes(newNodes);
    }

    if (currentlyActiveNodeId !== activeNodeId) {
      setActiveNode(currentlyActiveNodeId);
      
      // Auto-pan camera if playing
      if (currentlyActiveNodeId && isPlaying) {
        const activeNode = newNodes.find(n => n.id === currentlyActiveNodeId);
        if (activeNode) {
          setCenter(activeNode.position.x + 150, activeNode.position.y + 100, { duration: 800, zoom: 1 });
        }
      }
    }
  }, [currentTimeMs, steps, nodes, activeNodeId, setActiveNode, setNodes, isPlaying, setCenter]);

  // Update edges
  useEffect(() => {
    if (edges.length === 0) return;
    let anyChanges = false;
    const newEdges = edges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const isExecuting = sourceNode?.data?.executionStatus === 'running';
      if (edge.data?.isExecuting !== isExecuting) {
        anyChanges = true;
        return { ...edge, data: { ...edge.data, isExecuting } };
      }
      return edge;
    });
    if (anyChanges) {
      setEdges(newEdges);
    }
  }, [nodes, edges, setEdges]);

  return (
    <div className="w-full h-full bg-[#050505]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        onNodeClick={(_, node) => {
          // Manual selection pauses and focuses
          useReplayStore.getState().pause();
          setActiveNode(node.id);
          setCenter(node.position.x + 150, node.position.y + 100, { duration: 500, zoom: 1 });
        }}
        proOptions={{ hideAttribution: true }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_100%_at_50%_0%,_rgba(59,130,246,0.05)_0%,_rgba(0,0,0,0)_100%)] pointer-events-none" />
        <Background gap={24} color="#18181b" variant={BackgroundVariant.Dots} size={1.5} />
        <Controls className="bg-[#121212]/80 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden fill-gray-400" />
      </ReactFlow>
    </div>
  );
}

export function ReplayCanvas(props: ReplayCanvasProps) {
  return (
    <ReactFlowProvider>
      <ReplayCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
