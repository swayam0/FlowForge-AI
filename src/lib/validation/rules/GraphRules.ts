import { ValidationRule, ValidationIssue, WorkflowContext } from '../types';
import { WorkflowStepType } from '@/types/common';

export const missingTriggerRule: ValidationRule = {
  id: 'graph-missing-trigger',
  category: 'Graph',
  description: 'Validates that exactly one trigger node exists.',
  evaluate: (workflow: WorkflowContext): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];
    const triggerNodes = workflow.nodes.filter(n => n.type === WorkflowStepType.STRUCTURED_INPUT);
    
    if (triggerNodes.length === 0) {
      issues.push({
        id: `graph-trigger-missing-${Date.now()}`,
        categoryId: 'Graph',
        title: 'Missing Trigger Node',
        description: 'Every workflow must start with exactly one Input/Trigger node.',
        severity: 'ERROR',
        suggestedFix: 'Add a Structured Input node to the canvas.'
      });
    } else if (triggerNodes.length > 1) {
      issues.push({
        id: `graph-trigger-multiple-${Date.now()}`,
        categoryId: 'Graph',
        title: 'Multiple Trigger Nodes',
        description: 'A workflow can only have one starting Input node.',
        severity: 'ERROR',
        suggestedFix: 'Remove extra Structured Input nodes.'
      });
    }
    return issues;
  }
};

export const disconnectedNodeRule: ValidationRule = {
  id: 'graph-disconnected-nodes',
  category: 'Graph',
  description: 'Validates that all nodes are connected to the main graph.',
  evaluate: (workflow: WorkflowContext): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];
    if (workflow.nodes.length <= 1) return issues; // 0 or 1 node is fine if it's just the trigger

    const adjList = new Map<string, string[]>();
    workflow.nodes.forEach(n => adjList.set(n.id, []));
    workflow.edges.forEach(e => {
      if (adjList.has(e.source)) {
        adjList.get(e.source)!.push(e.target);
      }
    });

    const triggerNode = workflow.nodes.find(n => n.type === WorkflowStepType.STRUCTURED_INPUT);
    if (!triggerNode) return issues; // Let missingTriggerRule handle this

    const visited = new Set<string>();
    const stack = [triggerNode.id];

    while (stack.length > 0) {
      const node = stack.pop()!;
      if (!visited.has(node)) {
        visited.add(node);
        const neighbors = adjList.get(node) || [];
        neighbors.forEach(n => stack.push(n));
      }
    }

    workflow.nodes.forEach(n => {
      if (!visited.has(n.id)) {
        issues.push({
          id: `graph-disconnected-${n.id}`,
          categoryId: 'Graph',
          title: 'Disconnected Node',
          description: `The node "${n.label}" is not reachable from the trigger.`,
          nodeId: n.id,
          severity: 'WARNING',
          suggestedFix: 'Connect an incoming edge to this node so it executes.'
        });
      }
    });

    return issues;
  }
};

export const cycleDetectionRule: ValidationRule = {
  id: 'graph-cycles',
  category: 'Graph',
  description: 'Validates that there are no circular dependencies.',
  evaluate: (workflow: WorkflowContext): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];
    const adjList = new Map<string, string[]>();
    workflow.nodes.forEach(n => adjList.set(n.id, []));
    workflow.edges.forEach(e => {
      if (adjList.has(e.source)) {
        adjList.get(e.source)!.push(e.target);
      }
    });

    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (nodeId: string, path: string[]) => {
      if (!visited.has(nodeId)) {
        visited.add(nodeId);
        recStack.add(nodeId);

        const neighbors = adjList.get(nodeId) || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor) && dfs(neighbor, [...path, neighbor])) {
            return true;
          } else if (recStack.has(neighbor)) {
            // Cycle detected
            const cyclePath = [...path, neighbor];
            const nodeNames = cyclePath.map(id => workflow.nodes.find(n => n.id === id)?.label || id);
            issues.push({
              id: `graph-cycle-${nodeId}-${neighbor}`,
              categoryId: 'Graph',
              title: 'Infinite Loop Detected',
              description: `Cycle found: ${nodeNames.join(' → ')}. Standard execution does not support cycles.`,
              nodeId: neighbor,
              severity: 'ERROR',
              suggestedFix: 'Remove the edge creating the cycle.'
            });
            return true; // Stop early
          }
        }
      }
      recStack.delete(nodeId);
      return false;
    };

    for (const node of workflow.nodes) {
      if (!visited.has(node.id)) {
        if (dfs(node.id, [node.id])) break;
      }
    }

    return issues;
  }
};

export const terminalNodeRule: ValidationRule = {
  id: 'graph-terminal-node',
  category: 'Graph',
  description: 'Validates that there is at least one terminal node.',
  evaluate: (workflow: WorkflowContext): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];
    if (workflow.nodes.length === 0) return issues;

    const sourceNodes = new Set(workflow.edges.map(e => e.source));
    const terminalNodes = workflow.nodes.filter(n => !sourceNodes.has(n.id));

    if (terminalNodes.length === 0) {
      issues.push({
        id: `graph-no-terminal-${Date.now()}`,
        categoryId: 'Graph',
        title: 'No Terminal Node',
        description: 'Workflow execution requires at least one endpoint.',
        severity: 'ERROR',
        suggestedFix: 'Add a Final Report node or ensure a node has no outgoing edges.'
      });
    }

    return issues;
  }
};
