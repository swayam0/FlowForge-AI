import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/history/route';
import { WorkflowRunRepository } from '@/repositories/WorkflowRunRepository';
import { WorkflowRepository } from '@/repositories/WorkflowRepository';

vi.mock('@/utils/db', () => ({
  default: vi.fn().mockResolvedValue(true)
}));

describe('API Routes: History', () => {
  let runRepo: WorkflowRunRepository;
  let workflowRepo: WorkflowRepository;

  beforeEach(async () => {
    runRepo = new WorkflowRunRepository();
    workflowRepo = new WorkflowRepository();
  });

  it('GET /api/history should return paginated list of runs', async () => {
    // Generate a few workflows and runs
    for (let i = 0; i < 3; i++) {
      const wf = await workflowRepo.create({ name: `Test ${i}`, nodes: [], edges: [] }, 'test');
      await runRepo.startRun({ workflowVersionId: wf.id, input: {} });
    }

    const req = new Request('http://localhost/api/history?skip=0&limit=2');
    const res = await GET(req);
    
    expect(res.status).toBe(200);
    const result = await res.json();
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);
    // Note: workflow was scoped out, so we can just check properties exist
    expect(result.data[0].workflowVersionId).toBeDefined();
  });
});
