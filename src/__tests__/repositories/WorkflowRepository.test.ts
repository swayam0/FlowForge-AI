import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowRepository } from '@/repositories/WorkflowRepository';
import { WorkflowModel } from '@/models/Workflow';

describe('Workflow Versioning', () => {
  let repo: WorkflowRepository;

  beforeEach(() => {
    repo = new WorkflowRepository();
  });

  it('should create workflow with version 1', async () => {
    const workflow = await repo.create({
      name: 'Initial Workflow',
      nodes: [],
      edges: []
    }, 'test-user');
    
    expect(workflow.version).toBe(1);
    expect(workflow.name).toBe('Initial Workflow');
  });

  it('should auto-increment version on update', async () => {
    const workflow = await repo.create({
      name: 'V1 Workflow',
      nodes: [],
      edges: []
    }, 'test-user');
    
    expect(workflow.version).toBe(1);

    const updated = await repo.update(workflow.id, {
      name: 'V2 Workflow'
    });

    expect(updated).not.toBeNull();
    expect(updated?.version).toBe(2);
    expect(updated?.name).toBe('V2 Workflow');
  });
});
