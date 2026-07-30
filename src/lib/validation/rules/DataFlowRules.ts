import { ValidationRule, ValidationIssue, WorkflowContext } from '../types';

export const variableReferenceRule: ValidationRule = {
  id: 'data-flow-variables',
  category: 'DataFlow',
  description: 'Validates that variables referenced in nodes actually exist or come from upstream nodes.',
  evaluate: (workflow: WorkflowContext): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];
    const variableRegex = /\{\{\s*([^}]+)\s*\}\}/g;

    // Helper to get all referenced variables in a node's config
    const getReferencedVars = (config: Record<string, unknown>): string[] => {
      const vars: string[] = [];
      const extract = (obj: any) => {
        if (typeof obj === 'string') {
          let match;
          while ((match = variableRegex.exec(obj)) !== null) {
            vars.push(match[1].trim());
          }
        } else if (typeof obj === 'object' && obj !== null) {
          Object.values(obj).forEach(extract);
        }
      };
      extract(config);
      return vars;
    };

    // Calculate topological order (basic implementation)
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();
    
    workflow.nodes.forEach(n => {
      inDegree.set(n.id, 0);
      adjList.set(n.id, []);
    });

    workflow.edges.forEach(e => {
      if (adjList.has(e.source)) {
        adjList.get(e.source)!.push(e.target);
        inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
      }
    });

    const queue: string[] = [];
    inDegree.forEach((degree, id) => {
      if (degree === 0) queue.push(id);
    });

    const topoOrder: string[] = [];
    while (queue.length > 0) {
      const u = queue.shift()!;
      topoOrder.push(u);
      (adjList.get(u) || []).forEach(v => {
        inDegree.set(v, inDegree.get(v)! - 1);
        if (inDegree.get(v) === 0) queue.push(v);
      });
    }

    for (const node of workflow.nodes) {
      const refs = getReferencedVars(node.configuration || {});
      if (refs.length > 0) {
        // Find position of this node in topological sort
        const nodeIdx = topoOrder.indexOf(node.id);
        
        // If not in topo order, it's part of a cycle (handled by graph rules)
        if (nodeIdx === -1) continue;

        // Valid sources are anything before this node in topo sort, plus built-ins
        const validSources = new Set([
          ...topoOrder.slice(0, nodeIdx),
          'input', 'env', 'context'
        ]);

        refs.forEach(ref => {
          const source = ref.split('.')[0]; // e.g. "node1" from "node1.output"
          if (!validSources.has(source)) {
            issues.push({
              id: `data-flow-ref-${node.id}-${ref}`,
              categoryId: 'DataFlow',
              title: 'Invalid Variable Reference',
              description: `Node "${node.label}" references "${ref}", but "${source}" is not a valid upstream node.`,
              nodeId: node.id,
              severity: 'ERROR',
              suggestedFix: 'Ensure you are referencing a variable from a node that executes before this one.'
            });
          }
        });
      }
    }

    return issues;
  }
};
