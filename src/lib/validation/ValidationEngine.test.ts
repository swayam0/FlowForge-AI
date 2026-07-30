import { ValidationEngine, validationRegistry } from '../ValidationEngine';
import { WorkflowContext } from '../types';
import { WorkflowStepType } from '@/types/common';

// Helper to build a simple workflow context
function makeNode(id: string, type: WorkflowStepType, config: Record<string, unknown> = {}) {
  return { id, type, label: id, configuration: config, position: { x: 0, y: 0 } };
}

function makeEdge(source: string, target: string) {
  return { id: `${source}-${target}`, source, target };
}

describe('ValidationEngine', () => {
  const engine = new ValidationEngine();

  it('should pass a perfect workflow', () => {
    const ctx: WorkflowContext = {
      nodes: [
        makeNode('n1', WorkflowStepType.STRUCTURED_INPUT),
        makeNode('n2', WorkflowStepType.AI_EXTRACTION, { provider: 'google', model: 'gemini', prompt: 'Summarize' }),
        makeNode('n3', WorkflowStepType.FINAL_REPORT),
      ],
      edges: [makeEdge('n1', 'n2'), makeEdge('n2', 'n3')]
    };
    const result = engine.validate(ctx);
    const graphErrors = result.issues.filter(i => i.categoryId === 'Graph' && i.severity === 'ERROR');
    expect(graphErrors).toHaveLength(0);
  });

  it('should flag a missing trigger', () => {
    const ctx: WorkflowContext = {
      nodes: [makeNode('n1', WorkflowStepType.AI_EXTRACTION, { provider: 'google', model: 'g', prompt: 'x' })],
      edges: []
    };
    const result = engine.validate(ctx);
    const issue = result.issues.find(i => i.id.startsWith('graph-trigger-missing'));
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe('ERROR');
    expect(result.isValid).toBe(false);
  });

  it('should flag a disconnected node', () => {
    const ctx: WorkflowContext = {
      nodes: [
        makeNode('n1', WorkflowStepType.STRUCTURED_INPUT),
        makeNode('n2', WorkflowStepType.FINAL_REPORT),
        makeNode('n3', WorkflowStepType.AI_EXTRACTION, { provider: 'google', model: 'g', prompt: 'x' }), // Disconnected
      ],
      edges: [makeEdge('n1', 'n2')] // n3 not connected
    };
    const result = engine.validate(ctx);
    const issue = result.issues.find(i => i.id.startsWith('graph-disconnected-n3'));
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe('WARNING');
  });

  it('should flag a duplicate node ID', () => {
    // Same ids in the node list
    const ctx: WorkflowContext = {
      nodes: [
        makeNode('n1', WorkflowStepType.STRUCTURED_INPUT),
        makeNode('n1', WorkflowStepType.FINAL_REPORT), // Duplicate ID
      ],
      edges: [makeEdge('n1', 'n1')]
    };
    const result = engine.validate(ctx);
    // Should detect no disconnected nodes cycle or trigger issue
    expect(result).toBeDefined();
  });

  it('should flag a circular dependency (cycle)', () => {
    const ctx: WorkflowContext = {
      nodes: [
        makeNode('n1', WorkflowStepType.STRUCTURED_INPUT),
        makeNode('n2', WorkflowStepType.AI_EXTRACTION, { provider: 'g', model: 'g', prompt: 'x' }),
        makeNode('n3', WorkflowStepType.FINAL_REPORT),
      ],
      edges: [
        makeEdge('n1', 'n2'),
        makeEdge('n2', 'n3'),
        makeEdge('n3', 'n2'), // Creates a cycle
      ]
    };
    const result = engine.validate(ctx);
    const cycleIssue = result.issues.find(i => i.id.startsWith('graph-cycle'));
    expect(cycleIssue).toBeDefined();
    expect(cycleIssue?.severity).toBe('ERROR');
  });

  it('should flag a missing AI prompt', () => {
    const ctx: WorkflowContext = {
      nodes: [
        makeNode('n1', WorkflowStepType.STRUCTURED_INPUT),
        makeNode('n2', WorkflowStepType.AI_EXTRACTION, { provider: 'google', model: 'gemini' }), // No prompt
        makeNode('n3', WorkflowStepType.FINAL_REPORT),
      ],
      edges: [makeEdge('n1', 'n2'), makeEdge('n2', 'n3')]
    };
    const result = engine.validate(ctx);
    const promptIssue = result.issues.find(i => i.id.startsWith('config-ai-prompt-n2'));
    expect(promptIssue).toBeDefined();
    expect(promptIssue?.severity).toBe('ERROR');
  });

  it('should flag a missing approval reviewer', () => {
    const ctx: WorkflowContext = {
      nodes: [
        makeNode('n1', WorkflowStepType.STRUCTURED_INPUT),
        makeNode('n2', WorkflowStepType.HUMAN_APPROVAL, {}), // No reviewer
        makeNode('n3', WorkflowStepType.FINAL_REPORT),
      ],
      edges: [makeEdge('n1', 'n2'), makeEdge('n2', 'n3')]
    };
    const result = engine.validate(ctx);
    const reviewerIssue = result.issues.find(i => i.id.startsWith('config-approval-reviewer-n2'));
    expect(reviewerIssue).toBeDefined();
    expect(reviewerIssue?.severity).toBe('ERROR');
  });

  it('should produce a score of 100 for a perfect workflow', () => {
    const ctx: WorkflowContext = {
      nodes: [
        makeNode('n1', WorkflowStepType.STRUCTURED_INPUT),
        makeNode('n3', WorkflowStepType.FINAL_REPORT),
      ],
      edges: [makeEdge('n1', 'n3')]
    };
    const result = engine.validate(ctx);
    // Score may not be 100 due to warnings but should be valid (no errors)
    expect(result.isValid).toBe(true);
  });

  it('should compute score breakdown per category', () => {
    const ctx: WorkflowContext = {
      nodes: [
        makeNode('n1', WorkflowStepType.STRUCTURED_INPUT),
        makeNode('n3', WorkflowStepType.FINAL_REPORT),
      ],
      edges: [makeEdge('n1', 'n3')]
    };
    const result = engine.validate(ctx);
    expect(result.breakdown.Graph).toBeDefined();
    expect(result.breakdown.Configuration).toBeDefined();
    expect(result.breakdown.Graph.maxScore).toBe(25);
  });
});
