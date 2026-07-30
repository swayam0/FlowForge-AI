import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { WorkflowModel } from './Workflow';
import { WorkflowStepType } from '../types/common';

// Global setup handles DB connection

describe('WorkflowModel Configuration Default', () => {
  it('should default configuration to an empty object when an empty object is provided (not drop it to undefined)', async () => {
    const workflow = new WorkflowModel({
      name: 'Test Workflow',
      createdBy: 'test-user',
      nodes: [
        {
          id: 'node-1',
          type: WorkflowStepType.STRUCTURED_INPUT,
          label: 'Start Node',
          position: { x: 0, y: 0 },
          configuration: {} // Pass explicitly empty object
        }
      ],
      edges: []
    });

    const savedWorkflow = await workflow.save();
    
    // Fetch it back to see what actually got saved to DB
    const fetchedWorkflow = await WorkflowModel.findById(savedWorkflow._id).lean();
    
    expect(fetchedWorkflow).toBeDefined();
    expect(fetchedWorkflow!.nodes).toBeDefined();
    expect(fetchedWorkflow!.nodes.length).toBe(1);
    
    // The core assertion: it should be {}, not undefined
    expect(fetchedWorkflow!.nodes[0].configuration).toBeDefined();
    expect(fetchedWorkflow!.nodes[0].configuration).toEqual({});
  });

  it('should default configuration to an empty object when not provided at all', async () => {
    const workflow = new WorkflowModel({
      name: 'Test Workflow 2',
      createdBy: 'test-user',
      nodes: [
        {
          id: 'node-2',
          type: WorkflowStepType.STRUCTURED_INPUT,
          label: 'Start Node 2',
          position: { x: 0, y: 0 }
          // configuration intentionally omitted
        }
      ],
      edges: []
    });

    const savedWorkflow = await workflow.save();
    const fetchedWorkflow = await WorkflowModel.findById(savedWorkflow._id).lean();
    
    expect(fetchedWorkflow!.nodes[0].configuration).toBeDefined();
    expect(fetchedWorkflow!.nodes[0].configuration).toEqual({});
  });
});
