import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/runs/[id]/route';
import { POST } from '@/app/api/runs/[id]/resume/route';
import { WorkflowRunRepository } from '@/repositories/WorkflowRunRepository';
import { WorkflowRepository } from '@/repositories/WorkflowRepository';
import { WorkflowRunModel } from '@/models/WorkflowRun';
import { WorkflowVersionModel } from '@/models/WorkflowVersion';

vi.mock('@/utils/db', () => ({
  default: vi.fn().mockResolvedValue(true)
}));

describe('API Routes: Runs', () => {
  let runRepo: WorkflowRunRepository;
  let workflowRepo: WorkflowRepository;

  beforeEach(async () => {
    runRepo = new WorkflowRunRepository();
    workflowRepo = new WorkflowRepository();
  });

  it('GET /api/runs/[id] should return 404 for unknown run', async () => {
    const req = new Request('http://localhost/api/runs/60c72b2f9b1d8b0015a7f23c');
    const res = await GET(req, { params: Promise.resolve({ id: '60c72b2f9b1d8b0015a7f23c' }) });
    
    expect(res.status).toBe(404);
  });

  it('GET /api/runs/[id] should return run details', async () => {
    const workflow = await workflowRepo.create({ name: 'Test', nodes: [], edges: [] }, 'test');
    const version = await WorkflowVersionModel.findOne({ workflowId: workflow.id });
    const run = await runRepo.startRun({ workflowVersionId: version.id, input: {} });

    const req = new Request(`http://localhost/api/runs/${run._id}`);
    const res = await GET(req, { params: Promise.resolve({ id: run._id as unknown as string }) });
    
    expect(res.status).toBe(200);
    const result = await res.json();
    expect(result.data._id).toBe(run._id.toString());
  });

  it('POST /api/runs/[id]/resume should resume run', async () => {
    const workflow = await workflowRepo.create({ 
      name: 'Test', 
      nodes: [{ id: 'start', type: 'STRUCTURED_INPUT', label: 'Start', position: { x: 0, y: 0 }, configuration: {} }], 
      edges: [] 
    }, 'test');
    const version = await WorkflowVersionModel.findOne({ workflowId: workflow.id });
    const run = await runRepo.startRun({ workflowVersionId: version.id, input: {} });
    await WorkflowRunModel.findByIdAndUpdate(run._id, { status: 'PAUSED' });

    const req = new Request(`http://localhost/api/runs/${run._id}/resume`, {
      method: 'POST'
    });
    const res = await POST(req, { params: Promise.resolve({ id: run._id as unknown as string }) });
    
    expect(res.status).toBe(200);

    // Engine loop runs async, so we wait
    await new Promise(resolve => setTimeout(resolve, 200));

    const updated = await runRepo.getById(run._id as unknown as string);
    // When resumed, it becomes RUNNING or COMPLETED depending on the engine
    expect(updated?.status).not.toBe('PAUSED');
  });
});
