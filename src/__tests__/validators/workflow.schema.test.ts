import { describe, it, expect } from 'vitest';
import { CreateWorkflowSchema, UpdateWorkflowSchema } from '@/validators/workflow.schema';
import { WorkflowStepType } from '@/types/common';

describe('Workflow Validation', () => {
  describe('CreateWorkflowSchema', () => {
    it('should validate a correct workflow', () => {
      const validWorkflow = {
        name: 'Test Workflow',
        description: 'A test workflow',
        nodes: [
          {
            id: 'node-1',
            type: WorkflowStepType.STRUCTURED_INPUT,
            label: 'Input Node',
            configuration: { field: 'test' },
            position: { x: 0, y: 0 }
          }
        ],
        edges: []
      };
      
      const result = CreateWorkflowSchema.safeParse(validWorkflow);
      expect(result.success).toBe(true);
    });

    it('should reject missing name', () => {
      const invalidWorkflow = {
        description: 'Missing name'
      };
      
      const result = CreateWorkflowSchema.safeParse(invalidWorkflow);
      expect(result.success).toBe(false);
    });

    it('should reject invalid node type', () => {
      const invalidWorkflow = {
        name: 'Invalid Type',
        nodes: [
          {
            id: 'node-1',
            type: 'INVALID_TYPE',
            label: 'Invalid Node',
            configuration: {},
            position: { x: 0, y: 0 }
          }
        ],
        edges: []
      };
      
      const result = CreateWorkflowSchema.safeParse(invalidWorkflow);
      expect(result.success).toBe(false);
    });
  });
});
