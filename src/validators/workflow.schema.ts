import { z } from 'zod';
import { WorkflowStepType, WorkflowStatus } from '../types/common';

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const WorkflowNodeSchema = z.object({
  id: z.string().min(1),
  type: z.nativeEnum(WorkflowStepType),
  label: z.string().min(1),
  configuration: z.record(z.string(), z.any()), // Can be refined later based on step type
  position: PositionSchema,
  permissions: z.array(z.string()).optional(),
});

export const WorkflowEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  condition: z.record(z.string(), z.any()).optional(),
});

export const CreateWorkflowSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  nodes: z.array(WorkflowNodeSchema).default([]),
  edges: z.array(WorkflowEdgeSchema).default([]),
}).superRefine((data, ctx) => {
  const adj = new Map<string, string[]>();
  data.nodes.forEach(n => adj.set(n.id, []));
  data.edges.forEach(e => {
    if (adj.has(e.source)) {
      adj.get(e.source)!.push(e.target);
    }
  });

  const visited = new Set<string>();
  const recStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    if (recStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    visited.add(nodeId);
    recStack.add(nodeId);
    const neighbors = adj.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (hasCycle(neighbor)) return true;
    }
    recStack.delete(nodeId);
    return false;
  }

  for (const node of data.nodes) {
    if (hasCycle(node.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Workflow graph contains a cycle (circular dependency).',
        path: ['edges'],
      });
      break;
    }
  }
});

export const UpdateWorkflowSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  nodes: z.array(WorkflowNodeSchema).optional(),
  edges: z.array(WorkflowEdgeSchema).optional(),
  status: z.nativeEnum(WorkflowStatus).optional(),
}).superRefine((data, ctx) => {
  if (!data.nodes || !data.edges) return;
  const adj = new Map<string, string[]>();
  data.nodes.forEach(n => adj.set(n.id, []));
  data.edges.forEach(e => {
    if (adj.has(e.source)) {
      adj.get(e.source)!.push(e.target);
    }
  });

  const visited = new Set<string>();
  const recStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    if (recStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    visited.add(nodeId);
    recStack.add(nodeId);
    const neighbors = adj.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (hasCycle(neighbor)) return true;
    }
    recStack.delete(nodeId);
    return false;
  }

  for (const node of data.nodes) {
    if (hasCycle(node.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Workflow graph contains a cycle (circular dependency).',
        path: ['edges'],
      });
      break;
    }
  }
});
